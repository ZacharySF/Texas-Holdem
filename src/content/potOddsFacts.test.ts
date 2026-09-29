import { expect, it } from 'vitest';
import { potOddsFacts, potOddsExamples } from './potOddsFacts';
import { newGame, playerView } from '../engine/game';
const view = () =>
  playerView(
    newGame({
      seed: '0123456789abcdef0123456789abcdef',
      stacks: [1000, 1000],
      button: 0,
      smallBlind: 5,
      bigBlind: 10,
    }),
    0,
  );
it('derives the displayed pot, total, break-even share and chip return from the live price', () => {
  const v = view();
  v.players[0].contributed = 50;
  v.players[1].contributed = 100;
  v.pot = 150;
  v.legal.toCall = 50;
  expect(potOddsFacts(v, 0.25)).toMatchObject({
    call: 50,
    pot: 150,
    total: 200,
    threshold: 0.25,
    expectedAward: 50,
    net: 0,
    multiway: false,
  });
  expect(potOddsFacts(v, 0.5).net).toBe(50);
  v.legal.toCall = 0;
  expect(potOddsFacts(v, 0.5).threshold).toBe(0);
});
it('excludes uncallable overbets and sums eligible pot awards for multiway hands', () => {
  const v = view();
  v.players[0].contributed = 10;
  v.players[0].stack = 45;
  v.players[1].contributed = 1000;
  v.pot = 1010;
  v.legal.toCall = 45;
  expect(potOddsFacts(v, 0.5)).toMatchObject({
    pot: 65,
    excluded: 945,
    total: 110,
    threshold: 45 / 110,
    net: 10,
  });
  const table = {
    call: 5,
    raise: 0,
    callInterval: [0, 10] as const,
    raiseInterval: [0, 0] as const,
    samples: 100,
    callPots: [
      { amount: 100, eligible: [0, 1], heroMean: 50 },
      { amount: 200, eligible: [1, 2], heroMean: 0 },
    ],
  };
  expect(potOddsFacts(v, 0.9, table)).toMatchObject({
    multiway: true,
    expectedAward: 50,
    net: 5,
  });
});

it('derives the shared course examples from awards and contribution layers', () => {
  const e = potOddsExamples();
  expect(e.wins + e.ties + e.losses).toBe(e.trials);
  expect(e.equity).toBe(0.35);
  expect(e.award).toBe(70);
  expect(e.net).toBe(20);
  expect(
    (e.wins * e.winNet + e.ties * e.tieNet + e.losses * e.lossNet) / e.trials,
  ).toBe(e.net);
  expect(e.layers.map((p) => [p.amount, p.eligible])).toEqual([
    [150, [0, 1, 2]],
    [100, [1, 2]],
  ]);
  expect(e.awards).toEqual([30, 60]);
  expect(e.sideNet).toBe(40);
  expect(e.threshold).toBe(0.25);
});
