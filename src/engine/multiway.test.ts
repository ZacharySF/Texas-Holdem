import { expect, it } from 'vitest';
import fc from 'fast-check';
import { parseCards, deck, type Hand } from './cards';
import { combinations } from './math';
import {
  gridClass,
  gridRange,
  handClass,
  presetRange,
  rangeCounts,
} from './rangeGrid';
import {
  showdownSampler,
  payouts,
  callScenario,
  tableOptions,
  type PayoutInput,
} from './payouts';
import { Rng } from './rng';
import {
  newGame,
  act,
  legalActions,
  potSize,
  replay,
  playerView,
} from './game';
import {
  handResult,
  summarizeResults,
  conceptGrades,
  type LedgerHand,
} from './ledger';
import {
  decisionProblems,
  callSolution,
  calibration,
  type Forecast,
} from './decisionDrills';
import { evaluateFast } from './evaluator';
const seed = '0123456789abcdef0123456789abcdef',
  hand = (s: string) => parseCards(s) as unknown as Hand;
it('maps all physical combos into 169 classes and removes blockers before weighting', () => {
  const all = gridRange(presetRange('all'));
  expect(all.combos).toHaveLength(1326);
  const groups = new Map<string, number>();
  for (const c of combinations(deck(), 2)) {
    const label = handClass(c as unknown as Hand);
    groups.set(label, (groups.get(label) ?? 0) + 1);
  }
  expect(groups.size).toBe(169);
  for (const [label, count] of groups)
    expect(gridRange({ [label]: 30 }).combos).toHaveLength(count);
  expect(rangeCounts({ AA: 20, AKs: 50, AKo: 0 }, parseCards('As'))).toEqual({
    before: 10,
    after: 6,
    removed: 4,
    weight: 210,
  });
  expect(gridRange(presetRange('pairs')).combos).toHaveLength(78);
  expect(gridRange(presetRange('tight')).combos.length).toBeGreaterThan(78);
  expect(gridRange(presetRange('polarized')).combos.length).toBeLessThan(78);
  for (const weights of [
    { XX: 1 },
    { AA: -1 },
    { AA: 101 },
    { AA: 1.2 },
  ] as Record<string, number>[])
    expect(() => gridRange(weights)).toThrow();
  expect(() => gridRange({ AA: 1 }, [0, 0])).toThrow();
  for (const c of [-1, 13, 0.5]) expect(() => gridClass(c, 0)).toThrow();
  expect(() => gridClass(0, -1)).toThrow();
});
it('samples weighted joint ranges with fixed-card removal and detects impossible collisions', () => {
  const p = [
      hand('As Ad'),
      {
        combos: [
          { hand: hand('Ks Kd'), weight: 3 },
          { hand: hand('Qs Qd'), weight: 1 },
          { hand: hand('As Ah'), weight: 100 },
        ],
      },
    ],
    sample = showdownSampler(p, [], parseCards('2c'), new Rng(seed));
  let kings = 0;
  for (let i = 0; i < 5000; i++) {
    const d = sample();
    expect(new Set([...d.hands.flat(), ...d.board, 0]).size).toBe(10);
    kings += Number(d.hands[1][0] === hand('Ks Kd')[0]);
  }
  expect(kings / 5000).toBeCloseTo(0.75, 1);
  const random = showdownSampler(
    [hand('As Ad'), 'random', 'random'],
    parseCards('2c 3d 4h'),
    [],
    new Rng(seed),
  );
  for (let i = 0; i < 100; i++) {
    const d = random();
    expect(new Set([...d.hands.flat(), ...d.board]).size).toBe(11);
  }
  const colliding = { combos: [{ hand: hand('Ks Kd'), weight: 1 }] };
  expect(() =>
    showdownSampler([colliding, colliding], [], [], new Rng(seed))(),
  ).toThrow();
});
it('settles side pots per eligible seat, returns excess, and compares exact with sampled awards', () => {
  const base: PayoutInput = {
    players: [hand('As Ad'), hand('Ks Kd'), hand('Qs Qd')],
    board: parseCards('2c 3d 7h 9s Tc'),
    contributions: [50, 100, 100],
    folded: [false, false, false],
    button: 0,
    seed,
    samples: 1000,
  };
  const r = payouts(base);
  expect(r.meanAwards).toEqual([150, 100, 0]);
  expect(r.pots.map((p) => p.eligible)).toEqual([
    [0, 1, 2],
    [1, 2],
  ]);
  expect(r.heroOutcomes).toEqual([{ award: 150, count: 1 }]);
  expect(payouts({ ...base, folded: [true, false, false] }).meanAwards).toEqual(
    [0, 250, 0],
  );
  expect(
    payouts({ ...base, contributions: [50, 100, 150] }).meanAwards,
  ).toEqual([150, 100, 50]);
  const tie = payouts({
    ...base,
    players: [hand('2c 3c'), hand('4c 5c'), hand('6c 7c')],
    board: parseCards('Ts Js Qs Ks As'),
    contributions: [1, 1, 1],
    folded: [true, false, false],
    hero: 1,
  });
  expect(tie.meanAwards).toEqual([0, 2, 1]);
  const turn = { ...base, board: base.board.slice(0, 4) },
    exact = payouts(turn),
    mc = payouts({ ...turn, method: 'monteCarlo', samples: 20000 });
  expect(exact.samples).toBe(42);
  expect(Math.abs(mc.meanAwards[0] - exact.meanAwards[0])).toBeLessThan(2);
  expect(mc.meanAwards.reduce((a, b) => a + b, 0)).toBeCloseTo(250, 8);
  expect(payouts({ ...turn, method: 'monteCarlo', samples: 20000 })).toEqual(
    mc,
  );
  expect(payouts({ ...base, board: base.board.slice(0, 3) }).samples).toBe(903);
  expect(payouts({ ...base, board: [], samples: 2 }).method).toBe('monteCarlo');
  expect(payouts({ ...base, contributions: [0, 0, 0] }).meanAwards).toEqual([
    0, 0, 0,
  ]);
  for (const patch of [
    { contributions: [1] },
    { folded: [false] },
    { button: 3 },
    { hero: -1 },
    { samples: 0 },
    { contributions: [-1, 1, 1] },
    {
      players: ['random', 'random', 'random'] as const,
      method: 'exact' as const,
    },
  ]) {
    expect(() =>
      payouts({
        ...base,
        ...patch,
        players: patch.players ? [...patch.players] : base.players,
      }),
    ).toThrow();
  }
});
it('six seats obey action order and conserve chips through seeded legal action sequences', () => {
  const config = {
    seed,
    stacks: [200, 200, 3, 200, 200, 200],
    button: 0,
    smallBlind: 5,
    bigBlind: 10,
  };
  let short = newGame(config);
  expect(short.actor).toBe(3);
  expect(short.bet).toBe(10);
  expect(legalActions(short).toCall).toBe(10);
  expect(callScenario(playerView(short, 3)).risk).toBe(10);
  short = act(short, { type: 'call' });
  expect(short.actor).toBe(4);
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 20, max: 300 }), {
        minLength: 6,
        maxLength: 6,
      }),
      fc.integer({ min: 1, max: 10000 }),
      (stacks, n) => {
        let g = newGame({
          ...config,
          stacks,
          seed: n.toString(16).padStart(32, '0'),
        });
        const rng = new Rng(seed);
        for (let i = 0; !g.complete && i < 300; i++) {
          const l = legalActions(g),
            roll = rng.int(8);
          g = act(
            g,
            l.canRaise && roll === 0
              ? { type: 'raise', to: Math.min(l.maxRaiseTo, l.minRaiseTo) }
              : roll === 1
                ? { type: 'fold' }
                : l.canCheck
                  ? { type: 'check' }
                  : { type: 'call' },
          );
          expect(g.players.every((p) => p.stack >= 0)).toBe(true);
          expect(g.players.reduce((s, p) => s + p.stack, 0) + potSize(g)).toBe(
            stacks.reduce((a, b) => a + b, 0),
          );
        }
        expect(g.complete).toBe(true);
        expect(replay(g.config, g.history)).toEqual(g);
        const v = playerView(newGame(g.config), 0);
        expect(JSON.stringify(v)).not.toContain('seed');
        expect(v.players.every((p) => !('hand' in p))).toBe(true);
      },
    ),
    { numRuns: 100 },
  );
});
it('multiway call model uses pot-specific awards instead of overall winning share', () => {
  const game = newGame({
      seed,
      stacks: [50, 100, 100],
      button: 0,
      smallBlind: 5,
      bigBlind: 10,
    }),
    view = playerView(game, 0);
  view.hand = hand('As Ad');
  view.board = parseCards('2c 3d 7h 9s Tc');
  view.players = [
    { stack: 40, round: 10, contributed: 10, folded: false },
    { stack: 0, round: 100, contributed: 100, folded: false },
    { stack: 0, round: 100, contributed: 100, folded: false },
  ];
  view.legal = {
    toCall: 40,
    canCheck: false,
    canFold: true,
    canRaise: false,
    minRaiseTo: 200,
    maxRaiseTo: 50,
  };
  const options = tableOptions(
    view,
    [view.hand, hand('Ks Kd'), hand('Qs Qd')],
    seed,
    50,
    10,
  );
  expect(options.call).toBe(110);
  expect(options.callPots[1].heroMean).toBe(0);
  expect(options.raise).toBe(options.call);
  view.players[1].stack = 100;
  view.legal.canRaise = true;
  expect(
    tableOptions(view, [view.hand, hand('Ks Kd'), hand('Qs Qd')], seed, 50, 10)
      .raise,
  ).toBe(110);
});
it('ledger adjusts locked all-in pots and leaves folds and river commitments actual', () => {
  const config = {
    seed,
    stacks: [50, 100, 100],
    button: 0,
    smallBlind: 5,
    bigBlind: 10,
  };
  let g = newGame(config);
  while (!g.complete) {
    const l = legalActions(g);
    g = act(
      g,
      l.canRaise
        ? { type: 'raise', to: l.maxRaiseTo }
        : l.canCheck
          ? { type: 'check' }
          : { type: 'call' },
    );
  }
  const h: LedgerHand = {
      id: seed,
      date: '2026-09-27',
      config,
      actions: g.history,
      notes: [
        { seat: 0, index: 0, gap: 0 },
        { seat: 1, index: 1, gap: 9 },
        { seat: 0, index: 999, gap: 1 },
      ],
    },
    r = handResult(h, 1000);
  expect(r.actual).toBe((g.players[0].stack - 50) / 10);
  expect(r.adjustedPots).toBe(1);
  expect(r.adjusted).toBeGreaterThanOrEqual(-5);
  expect(r.adjusted).toBeLessThanOrEqual(10);
  expect(r.samples).toBe(1000);
  expect(handResult(h, 1000)).toEqual(r);
  expect(summarizeResults([r]).actual).toEqual([r.actual]);
  expect(conceptGrades([h])[0].count).toBe(1);
  let fold = newGame({ ...config, stacks: [100, 100] });
  fold = act(fold, { type: 'fold' });
  const f = handResult({ ...h, config: fold.config, actions: fold.history });
  expect(f.adjusted).toBe(f.actual);
  expect(f.adjustedPots).toBe(0);
  let river = newGame({ ...config, stacks: [100, 100] });
  while (river.street !== 'river') {
    const l = legalActions(river);
    river = act(river, l.canCheck ? { type: 'check' } : { type: 'call' });
  }
  while (!river.complete) {
    const l = legalActions(river);
    river = act(
      river,
      l.canRaise ? { type: 'raise', to: l.maxRaiseTo } : { type: 'call' },
    );
  }
  const rh = {
      ...h,
      config: river.config,
      actions: river.history,
      notes: river.history.map((_, index) => ({ seat: 0, index, gap: index })),
    },
    rr = handResult(rh);
  expect(rr.adjustedPots).toBe(0);
  expect(conceptGrades([rh]).length).toBe(3);
  expect(() => handResult({ ...h, actions: [] })).toThrow();
  expect(() =>
    handResult({ ...h, actions: [{ ...h.actions[0], seat: 99 }] }),
  ).toThrow();
  const blind = newGame({ ...config, stacks: [1, 1], button: 0 });
  expect(
    handResult({ ...h, config: blind.config, actions: [] }, 10).adjustedPots,
  ).toBe(1);
});
it('seeded drills match independent counts, exact call equations and calibration bins', () => {
  const q = decisionProblems(seed);
  expect(q).toEqual(decisionProblems(seed));
  expect(decisionProblems('00000000000000000000000000000001')).not.toEqual(q);
  for (const problem of q) {
    const available = deck().filter(
        (c) => ![...problem.hand, ...problem.board].includes(c),
      ),
      count = [...combinations(available, 2)].filter(
        (c) => handClass(c as unknown as Hand) === problem.className,
      ).length;
    expect(problem.combos).toBe(count);
    const s = callSolution(problem);
    expect(s.ev.toNumber()).toBeCloseTo(
      problem.equity.toNumber() * (problem.pot + problem.call - problem.rake) -
        problem.call,
      9,
    );
    expect(s.call).toBe(s.ev.toNumber() >= 0);
    expect(s.threshold.toNumber()).toBe(
      problem.call / (problem.pot + problem.call - problem.rake),
    );
    expect(evaluateFast([...problem.hand, ...problem.board])).toBeGreaterThan(
      0,
    );
  }
  const forecasts = [0, 0.1, 0.3, 0.5, 0.7, 1].map(
      (prediction, i): Forecast => ({
        id: String(i),
        mode: 'guess',
        date: '',
        prediction,
        truth: 0.5,
        outcome: i % 2,
        correct: true,
      }),
    ),
    bins = calibration(forecasts);
  expect(bins.reduce((n, b) => n + b.count, 0)).toBe(6);
  expect(bins[0].predicted).toBe(0.05);
  expect(bins[0].observed).toBe(0.5);
  expect(
    calibration([]).every((b) => b.observed === 0 && b.predicted === 0),
  ).toBe(true);
});
