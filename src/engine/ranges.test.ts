import { expect, it } from 'vitest';
import { equity, planEquity, equitySteps, type EquityInput } from './equity';
import { parseCards, type Hand } from './cards';
const hand = (s: string): Hand => {
  const c = parseCards(s);
  return [c[0], c[1]];
};
const base: EquityInput = {
  players: [
    hand('As Ah'),
    {
      combos: [
        { hand: hand('Ks Kh'), weight: 3 },
        { hand: hand('Qs Qh'), weight: 1 },
      ],
    },
  ],
  board: parseCards('2c 3d 7h 9s Kc'),
  seed: '0123456789abcdef0123456789abcdef',
  samples: 20000,
  method: 'exact',
};
it('computes exact weighted equity rather than equal combo frequency', () => {
  const result = equity(base);
  expect(result.samples).toBe(2);
  expect(result.players[0].equity.numerator).toBe('1');
  expect(result.players[0].equity.denominator).toBe('4');
  expect(result.players[0].win.value).toBe(0.25);
  const mc = equity({ ...base, method: 'monteCarlo' });
  expect(mc.players[0].equity.value).toBeCloseTo(0.25, 1);
  expect(mc).toEqual(equity({ ...base, method: 'monteCarlo' }));
  expect(planEquity({ ...base, method: 'auto' }).method).toBe('exact');
});
it('conditions joint ranges on disjoint cards and respects blockers', () => {
  const input = {
    ...base,
    players: [
      {
        combos: [
          { hand: hand('As Ah'), weight: 1 },
          { hand: hand('Qs Qh'), weight: 1 },
        ],
      },
      { combos: [{ hand: hand('As Ah'), weight: 1 }] },
    ],
  };
  const result = equity(input);
  expect(result.samples).toBe(1);
  expect(result.players[1].equity.value).toBe(1);
  expect(
    equity({ ...input, method: 'monteCarlo', samples: 100 }).players[1].equity
      .value,
  ).toBe(1);
  expect(
    equity({ ...base, dead: parseCards('Qs') }).players[0].equity.value,
  ).toBe(0);
});
it('handles random opponents, missing board cards, ties and streamed ranges', () => {
  const royal = {
    ...base,
    players: [
      hand('2c 3d'),
      { combos: [{ hand: hand('4c 5d'), weight: 2 }] },
      'random' as const,
    ],
    board: parseCards('As Ks Qs Js Ts'),
  };
  expect(equity(royal).players[0].equity.denominator).toBe('3');
  const turn = { ...base, board: base.board.slice(0, 4) };
  expect(equity(turn).samples).toBe(88);
  expect(equity({ ...turn, method: 'monteCarlo', samples: 100 }).complete).toBe(
    true,
  );
  expect(equitySteps(base, 1).next().value.complete).toBe(false);
  expect(planEquity({ ...base, board: [], method: 'auto' }).method).toBe(
    'monteCarlo',
  );
});
it('rejects empty, duplicate, conflicting, and invalid-weight ranges', () => {
  for (const combos of [
    [],
    [{ hand: hand('As Ah'), weight: 1 }],
    [{ hand: hand('Ks Kh'), weight: 0 }],
    [{ hand: hand('Ks Kh'), weight: 1.5 }],
    [
      { hand: hand('Ks Kh'), weight: 1 },
      { hand: hand('Kh Ks'), weight: 1 },
    ],
  ])
    expect(() =>
      equity({ ...base, players: [hand('As Ah'), { combos }] }),
    ).toThrow();
  expect(() =>
    equity({
      ...base,
      players: [
        { combos: [{ hand: hand('As Ah'), weight: 1 }] },
        { combos: [{ hand: hand('As Ah'), weight: 1 }] },
      ],
    }),
  ).toThrow();
  expect(() => equitySteps(base, 0).next()).toThrow();
});
