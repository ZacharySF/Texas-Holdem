import { expect, it } from 'vitest';
import { equity, equitySteps, planEquity, type EquityInput } from './equity';
import { parseCards, type Hand } from './cards';
const hand = (s: string): Hand => {
  const c = parseCards(s);
  return [c[0], c[1]];
};
const base: EquityInput = {
  players: [hand('As Ah'), hand('Ks Kh')],
  board: [],
  method: 'monteCarlo',
  samples: 200000,
  seed: '0123456789abcdef0123456789abcdef',
};
it('enumerates AA vs KK and agrees with 200,000 Monte Carlo trials within four SE', () => {
  const exact = equity({ ...base, method: 'exact' }),
    mc = equity(base);
  expect(exact.samples).toBe(1712304);
  expect(exact.method).toBe('exact');
  expect(mc.method).toBe('monteCarlo');
  expect(mc.samples).toBe(200000);
  expect(exact.players[0].equity.value).toBeGreaterThan(0.8);
  expect(exact.players[0].equity.value).toBeLessThan(0.84);
  expect(
    Math.abs(mc.players[0].equity.value - exact.players[0].equity.value),
  ).toBeLessThan(4 * mc.players[0].standardError);
  expect(exact.players[0].equity.interval[0]).toBeCloseTo(
    exact.players[0].equity.value,
  );
  expect(exact.players[0].standardError).toBe(0);
});
it('splits multiway pots as exact fractions and reports ties separately', () => {
  const result = equity({
    ...base,
    players: [hand('2c 3d'), hand('4c 5d'), 'random'],
    board: parseCards('As Ks Qs Js Ts'),
    method: 'exact',
  });
  for (const p of result.players) {
    expect(p.equity.numerator).toBe('1');
    expect(p.equity.denominator).toBe('3');
    expect(p.tie.value).toBe(1);
    expect(p.win.value).toBe(0);
    expect(p.loss.value).toBe(0);
  }
  expect(result.samples).toBe(903);
});
it('respects card removal, handles multiple random hands and auto method', () => {
  const river = {
    ...base,
    board: parseCards('2c 3c 4c 5c 7d'),
    players: [hand('As Ah'), 'random'] as const,
    method: 'auto' as const,
    samples: 1000,
  };
  expect(planEquity(river).method).toBe('exact');
  expect(equity(river).samples).toBe(990);
  expect(equity({ ...river, dead: parseCards('8c 9c') }).samples).toBe(903);
  expect(planEquity({ ...base, method: 'auto' }).method).toBe('monteCarlo');
  const removed = parseCards('2c 3c 4c 5c 7d As Ah 8c 9c Tc Jc Qc Kc');
  const dead = Array.from({ length: 52 }, (_, i) => i).filter(
    (c) => !removed.includes(c),
  );
  const small = equity({
    ...river,
    players: [hand('As Ah'), 'random', 'random'],
    dead,
  });
  expect(small.samples).toBe(90);
  expect(equity({ ...river, method: 'monteCarlo', samples: 1000 })).toEqual(
    equity({ ...river, method: 'monteCarlo', samples: 1000 }),
  );
});
it('streams progress and conserves total pot share', () => {
  const input = {
    ...base,
    players: [hand('As Ah'), 'random', 'random'] as const,
    samples: 1000,
  };
  const steps = equitySteps(input, 100);
  const first = steps.next();
  expect(first.done).toBe(false);
  expect(first.value.samples).toBe(100);
  expect(first.value.complete).toBe(false);
  steps.return(first.value);
  const result = equity(input);
  expect(result.players.reduce((s, p) => s + p.equity.value, 0)).toBeCloseTo(1);
  for (const p of result.players) {
    expect(p.win.value + p.tie.value + p.loss.value).toBeCloseTo(1);
    expect(p.equity.interval[0]).toBeLessThanOrEqual(p.equity.value);
    expect(p.equity.interval[1]).toBeGreaterThanOrEqual(p.equity.value);
  }
  const exactProgress = equitySteps(
    { ...base, board: parseCards('2c 3c 4c 5c'), method: 'exact' },
    1,
  );
  expect(exactProgress.next().value.complete).toBe(false);
});
it('rejects malformed configurations', () => {
  const invalid: EquityInput[] = [
    { ...base, players: [] },
    { ...base, players: Array(10).fill('random') as 'random'[] },
    { ...base, board: parseCards('2c 3c 4c 5c 6c 7c') },
    { ...base, samples: 0 },
    { ...base, samples: 1.5 },
    { ...base, dead: parseCards('As') },
    { ...base, players: [[1] as unknown as Hand, 'random'] },
    {
      ...base,
      players: ['random', 'random'],
      dead: Array.from({ length: 50 }, (_, i) => i),
    },
    {
      ...base,
      players: Array(9).fill('random') as 'random'[],
      method: 'exact',
    },
  ];
  for (const input of invalid) expect(() => equity(input)).toThrow();
  expect(() => equitySteps(base, 0).next()).toThrow();
});
