import { expect, it } from 'vitest';
import fc from 'fast-check';
import {
  act,
  newGame,
  legalActions,
  nextButton,
  playerView,
  potSize,
  replay,
  settlePots,
  type Action,
  type GameConfig,
} from './game';
import { Rng } from './rng';
import { PERSONAS, chooseBot, estimatedRange } from './bots';
import {
  breakEven,
  callEV,
  raiseEV,
  improvementOuts,
  directOptions,
} from './coach';
import { Rational } from './math';
import { parseCards, type Hand } from './cards';
const seed = '0123456789abcdef0123456789abcdef';
const config: GameConfig = {
  seed,
  stacks: [1000, 1000],
  button: 0,
  smallBlind: 5,
  bigBlind: 10,
};
it('uses heads-up blinds and the correct order on every street', () => {
  let g = newGame(config);
  expect(g.players.map((p) => p.round)).toEqual([5, 10]);
  expect(g.players[1].hand).toEqual([g.deck[0], g.deck[2]]);
  expect(g.players[0].hand).toEqual([g.deck[1], g.deck[3]]);
  expect(g.actor).toBe(0);
  g = act(g, { type: 'call' });
  expect(g.actor).toBe(1);
  g = act(g, { type: 'check' });
  expect(g.street).toBe('flop');
  expect(g.actor).toBe(1);
  for (const street of ['turn', 'river']) {
    g = act(g, { type: 'check' });
    g = act(g, { type: 'check' });
    expect(g.street).toBe(street);
    expect(g.actor).toBe(1);
  }
  g = act(g, { type: 'check' });
  g = act(g, { type: 'check' });
  expect(g.complete).toBe(true);
  expect(replay(config, g.history)).toEqual(g);
  expect(nextButton(g)).toBe(1);
  expect(newGame({ ...config, button: 1 }).actor).toBe(1);
});
it('tracks the previous full raise increment and denies illegal actions', () => {
  let g = newGame(config);
  expect(() => act(g, { type: 'check' })).toThrow();
  expect(() => act(g, { type: 'raise', to: 15 })).toThrow();
  g = act(g, { type: 'raise', to: 30 });
  expect(g.minRaise).toBe(20);
  expect(legalActions(g).minRaiseTo).toBe(50);
  g = act(g, { type: 'raise', to: 50 });
  expect(() => act(g, { type: 'raise', to: 69 })).toThrow();
  expect(() => act(g, { type: 'raise', to: 1001 })).toThrow();
  g = act(g, { type: 'raise', to: 70 });
  expect(g.minRaise).toBe(20);
});
it('a short all-in does not reopen betting for players who already acted', () => {
  let g = newGame({ ...config, stacks: [1000, 35, 1000], button: 2 });
  expect(g.actor).toBe(2);
  g = act(g, { type: 'raise', to: 30 });
  g = act(g, { type: 'call' });
  g = act(g, { type: 'raise', to: 35 });
  expect(g.actor).toBe(2);
  expect(legalActions(g).canRaise).toBe(false);
  expect(() => act(g, { type: 'raise', to: 55 })).toThrow();
  g = act(g, { type: 'call' });
  expect(legalActions(g).canRaise).toBe(false);
  g = act(g, { type: 'call' });
  expect(g.street).toBe('flop');
  expect(g.minRaise).toBe(10);
});
it('returns unmatched bets and settles all-in runouts and folds', () => {
  let g = newGame({ ...config, stacks: [1000, 100] });
  g = act(g, { type: 'raise', to: 1000 });
  g = act(g, { type: 'call' });
  expect(g.complete).toBe(true);
  expect(g.finalContributions).toEqual([100, 100]);
  expect(g.returns).toContainEqual({ seat: 0, amount: 900 });
  expect(g.players.reduce((s, p) => s + p.stack, 0)).toBe(1100);
  const fold = act(newGame(config), { type: 'fold' });
  expect(fold.players.map((p) => p.stack)).toEqual([995, 1005]);
  expect(fold.awards).toEqual([0, 10]);
  expect(() => act(fold, { type: 'check' })).toThrow();
  expect(legalActions(fold).canRaise).toBe(false);
  expect(newGame({ ...config, stacks: [3, 2] }).complete).toBe(true);
});
it('awards side pots separately and sends odd chips left of the button', () => {
  expect(
    settlePots([50, 100, 100], [false, false, false], [3, 2, 1], 0).awards,
  ).toEqual([150, 100, 0]);
  expect(
    settlePots([5, 5, 5], [false, false, true], [2, 2, 1], 0).awards,
  ).toEqual([7, 8, 0]);
  expect(
    settlePots([5, 5, 5], [false, false, true], [2, 2, 1], 1).awards,
  ).toEqual([8, 7, 0]);
  expect(() => settlePots([5, 5], [true, true], [1, 1], 0)).toThrow();
});
it('conserves chips and contributions through random legal action sequences', () =>
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 1, max: 1000 }), {
        minLength: 2,
        maxLength: 6,
      }),
      fc.integer({ min: 1, max: 1000000 }),
      (stacks, n) => {
        const initial = stacks.reduce((a, b) => a + b, 0),
          rng = new Rng(n.toString(16).padStart(32, '0'));
        let g = newGame({
          ...config,
          stacks,
          seed: n.toString(16).padStart(32, '0'),
          button: n % stacks.length,
        });
        let steps = 0;
        while (!g.complete) {
          const legal = legalActions(g),
            choices: Action[] = [
              { type: legal.canCheck ? 'check' : 'call' },
              { type: 'fold' },
            ];
          if (legal.canRaise)
            choices.push({
              type: 'raise',
              to: Math.min(legal.maxRaiseTo, legal.minRaiseTo + rng.int(30)),
            });
          const before = JSON.stringify(g);
          const next = act(g, choices[rng.int(choices.length)]);
          expect(JSON.stringify(g)).toBe(before);
          g = next;
          expect(
            g.players.every((p) => p.stack >= 0 && Number.isInteger(p.stack)),
          ).toBe(true);
          expect(potSize(g)).toBe(
            g.players.reduce((s, p) => s + p.contributed, 0),
          );
          expect(g.players.reduce((s, p) => s + p.stack, 0) + potSize(g)).toBe(
            initial,
          );
          if (++steps > 300) throw new Error('Hand failed to terminate');
        }
        expect(replay(g.config, g.history)).toEqual(g);
      },
    ),
    { numRuns: 1000, seed: 3003 },
  ));
it('excludes hidden information and produces deterministic legal persona choices', () => {
  const g = newGame(config),
    view = playerView(g, 0);
  const altered = {
    ...g,
    deck: [...g.deck].reverse(),
    config: { ...g.config, seed: '00000001000000020000000300000004' },
    players: g.players.map((p, i) =>
      i === 1 ? { ...p, hand: [0, 1] as Hand } : p,
    ),
  };
  expect(playerView(altered, 0)).toEqual(view);
  expect(JSON.stringify(view)).not.toContain('seed');
  for (const persona of PERSONAS) {
    const range = estimatedRange(view, persona);
    expect(
      range.combos.every((c) =>
        c.hand.every((card) => !view.hand.includes(card)),
      ),
    ).toBe(true);
    for (let i = 1; i < 6; i++) {
      const s = i.toString(16).padStart(32, '0');
      const decision = chooseBot(view, persona, s, 30);
      expect(decision).toEqual(chooseBot(view, persona, s, 30));
      expect(() => act(g, decision.action)).not.toThrow();
    }
    const raised = act(g, { type: 'raise', to: 30 });
    expect(
      estimatedRange(playerView(raised, 1), persona).combos.length,
    ).toBeGreaterThan(0);
  }
  expect(() => chooseBot(view, 'equity-driven', seed, 1)).toThrow();
  const checked = act(g, { type: 'call' });
  const decision = chooseBot(playerView(checked, 1), 'tight-passive', seed, 30);
  expect(['check', 'raise']).toContain(decision.action.type);
  expect(() => act(checked, decision.action)).not.toThrow();
});
it('proves the Phase 3 pot-odds anchor and bounds the coach claims', () => {
  expect(breakEven(150, 50).toString()).toBe('1/4');
  expect(breakEven(150, 50).display().percent).toBe('25.00%');
  expect(callEV(new Rational(1, 4), 150, 50).toString()).toBe('0/1');
  expect(callEV(new Rational(1, 2), 150, 50).toString()).toBe('50/1');
  expect(breakEven(0, 0).toString()).toBe('0/1');
  expect(
    raiseEV(new Rational(1, 2), new Rational(0), 100, 50, 50).toString(),
  ).toBe('50/1');
  expect(
    raiseEV(new Rational(0), new Rational(1), 100, 50, 50).toString(),
  ).toBe('100/1');
  expect(() => breakEven(-1, 2)).toThrow();
  expect(() => raiseEV(new Rational(1), new Rational(2), 1, 1, 1)).toThrow();
  const out = improvementOuts(
    parseCards('Ah Kh') as unknown as Hand,
    parseCards('2h 7h Qc'),
  );
  expect(out?.cards).toContain(parseCards('3h')[0]);
  expect(out?.next.denominator).toBe(47n);
  expect(improvementOuts([0, 1], [])).toBeNull();
  expect(
    improvementOuts(
      parseCards('Ah Kh') as unknown as Hand,
      parseCards('2h 7h Qc Js'),
    )?.byRiver,
  ).toEqual(
    improvementOuts(
      parseCards('Ah Kh') as unknown as Hand,
      parseCards('2h 7h Qc Js'),
    )?.next,
  );
  expect(
    directOptions(playerView(newGame(config), 0), new Rational(1, 2), 20).call,
  ).toBe(5);
});
it('rejects bad tables, wrong replay order, and empty calls', () => {
  for (const value of [
    { ...config, stacks: [1] },
    { ...config, stacks: [0, 1] },
    { ...config, button: 2 },
    { ...config, smallBlind: 0 },
    { ...config, bigBlind: 1 },
  ])
    expect(() => newGame(value)).toThrow();
  const g = act(newGame(config), { type: 'call' });
  expect(() => act(g, { type: 'call' })).toThrow();
  expect(() =>
    replay(config, [
      {
        seat: 1,
        street: 'preflop',
        action: { type: 'call' },
        board: [],
        pot: 15,
      },
    ]),
  ).toThrow();
  expect(legalActions(newGame(config), 1).canCheck).toBe(false);
});

it('prices a short-stack call after excluding the opponent’s uncallable overbet', () => {
  let game = newGame({ ...config, stacks: [1000, 100] });
  game = act(game, { type: 'raise', to: 1000 });
  const view = playerView(game, 1),
    options = directOptions(view, new Rational(1, 2), 100);
  expect(options.contestablePot).toBe(110);
  expect(options.uncallable).toBe(900);
  expect(options.breakEven.toString()).toBe('9/20');
  expect(options.call).toBe(10);
});

it('reopens raising only when cumulative short all-ins amount to a full increment', () => {
  let g = newGame({ ...config, stacks: [1000, 35, 50, 1000], button: 1 });
  expect(g.actor).toBe(0);
  g = act(g, { type: 'raise', to: 30 });
  g = act(g, { type: 'raise', to: 35 });
  g = act(g, { type: 'raise', to: 50 });
  g = act(g, { type: 'call' });
  expect(g.actor).toBe(0);
  expect(legalActions(g).canRaise).toBe(true);
  expect(legalActions(g).minRaiseTo).toBe(70);
  expect(() => act(g, { type: 'raise', to: 70 })).not.toThrow();
});
