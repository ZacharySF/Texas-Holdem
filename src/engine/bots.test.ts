import { expect, it } from 'vitest';
import { botActionValues, chooseBot, PERSONAS } from './bots';
import { act, newGame, playerView, type PlayerView } from './game';
import { parseCards, type Hand } from './cards';

const seed = '0123456789abcdef0123456789abcdef';
const hand = (text: string) => parseCards(text) as unknown as Hand;
function river(cards = 'As Ad'): PlayerView {
  const view = playerView(
    newGame({
      seed,
      stacks: [150, 150],
      button: 0,
      smallBlind: 5,
      bigBlind: 10,
    }),
    0,
  );
  return {
    ...view,
    hand: hand(cards),
    board: parseCards('Ac 7d 4h 2s 9c'),
    street: 'river',
    pot: 110,
    players: [
      { stack: 100, round: 0, contributed: 50, folded: false },
      { stack: 90, round: 10, contributed: 60, folded: false },
    ],
    legal: {
      ...view.legal,
      toCall: 10,
      canCheck: false,
      canRaise: true,
      minRaiseTo: 20,
      maxRaiseTo: 100,
    },
  };
}
const best = (values: ReturnType<typeof botActionValues>) =>
  values.reduce((a, b) => (b.mean > a.mean ? b : a));

it('bets for value instead of requiring a random permission to raise', () => {
  const view = river();
  const values = botActionValues(view, 'equity-driven', seed, 100, [
    view.hand,
    hand('Kc Kd'),
  ]);
  expect(best(values).action.type).toBe('raise');
  expect(values.find((v) => v.action.type === 'call')!.mean).toBe(110);
  const decision = chooseBot(view, 'equity-driven', seed, 200);
  expect(decision.action.type).toBe('raise');
  expect(decision.reason).toContain('highest estimated net chip return');
});
it('folds a losing paid call, calls a winning hand, and takes a free check', () => {
  const view = river('3h 8d');
  view.legal.canRaise = false;
  const options = botActionValues(view, 'calling-station', seed, 20, [
    view.hand,
    hand('As Ad'),
  ]);
  expect(best(options).action.type).toBe('fold');
  expect(options.find((v) => v.action.type === 'call')!.mean).toBe(-10);
  const winning = river();
  winning.legal.canRaise = false;
  expect(
    best(
      botActionValues(winning, 'equity-driven', seed, 20, [
        winning.hand,
        hand('Kc Kd'),
      ]),
    ).action.type,
  ).toBe('call');
  view.legal.canCheck = true;
  view.legal.toCall = 0;
  view.players[0].round = 10;
  view.players[0].contributed = 60;
  view.pot = 120;
  expect(
    best(
      botActionValues(view, 'tight-passive', seed, 20, [
        view.hand,
        hand('As Ad'),
      ]),
    ),
  ).toMatchObject({ action: { type: 'check' }, mean: 0 });
});
it('caps short all-in raises, returns unmatched chips, and preserves side-pot eligibility', () => {
  const view = river();
  view.players[0].stack = 15;
  view.legal.maxRaiseTo = 15;
  const values = botActionValues(view, 'loose-aggressive', seed, 20, [
    view.hand,
    hand('Kc Kd'),
  ]);
  expect(
    values.filter((v) => v.action.type === 'raise').map((v) => v.action),
  ).toEqual([{ type: 'raise', to: 15 }]);
  expect(values.every((v) => v.mean >= 0 && v.mean <= 115)).toBe(true);
  view.players.push({ stack: 0, round: 5, contributed: 55, folded: false });
  view.pot += 55;
  const multi = botActionValues(view, 'equity-driven', seed, 20, [
    view.hand,
    hand('Kc Kd'),
    hand('7c 7h'),
  ]);
  expect(multi.find((v) => v.action.type === 'call')!.mean).toBe(165);
  view.players[2].folded = true;
  expect(
    botActionValues(view, 'equity-driven', seed, 20).every((v) =>
      Number.isFinite(v.mean),
    ),
  ).toBe(true);
});
it('plays reproducible legal full six-seat hands with raises and folds', () => {
  const counts = { fold: 0, call: 0, check: 0, raise: 0 };
  for (const persona of PERSONAS) {
    let game = newGame({
      seed,
      stacks: [100, 100, 100, 100, 100, 100],
      button: 0,
      smallBlind: 5,
      bigBlind: 10,
    });
    for (let turn = 0; !game.complete && turn < 100; turn++) {
      const view = playerView(game, game.actor);
      const decision = chooseBot(view, persona, seed, 30);
      expect(decision).toEqual(chooseBot(view, persona, seed, 30));
      counts[decision.action.type]++;
      game = act(game, decision.action);
    }
    expect(game.complete).toBe(true);
    expect(game.players.reduce((sum, p) => sum + p.stack, 0)).toBe(600);
  }
  expect(counts.raise).toBeGreaterThan(0);
  expect(counts.fold).toBeGreaterThan(0);
  expect(counts.call).toBeGreaterThan(0);
});
