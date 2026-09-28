import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  assertCards,
  deck,
  formatCard,
  parseCard,
  parseCards,
  rank,
  suit,
} from './cards';
import { factorial, gcd, nCr, Rational, combinations } from './math';
import { Rng, shuffle } from './rng';
import {
  brier,
  chiSquare,
  normalInterval,
  shareInterval,
  Welford,
  wilson,
  Z95,
} from './stats';
import { facts } from '../content/facts';
const seed = '0123456789abcdef0123456789abcdef';
describe('cards and counting', () => {
  it('round-trips all cards', () => {
    for (const c of deck()) {
      expect(parseCard(formatCard(c))).toBe(c);
      expect(rank(c)).toBeGreaterThanOrEqual(2);
      expect(suit(c)).toBeLessThan(4);
    }
    expect(parseCard('aS')).toBe(51);
    expect(parseCards('')).toEqual([]);
  });
  it('rejects invalid and duplicate cards', () => {
    for (const s of ['10d', 'Bs', 'Acx', ''])
      expect(() => parseCard(s)).toThrow();
    for (const c of [-1, 52, 0.5, NaN]) expect(() => formatCard(c)).toThrow();
    expect(() => assertCards([1, 1])).toThrow();
  });
  it('implements exact arithmetic and all displays', () => {
    expect(factorial(0)).toBe(1n);
    expect(factorial(10)).toBe(3628800n);
    expect(nCr(52, 2)).toBe(1326n);
    expect(nCr(2, 3)).toBe(0n);
    expect(nCr(10, 9)).toBe(10n);
    expect(nCr(60, 30)).toBe(118264581564861424n);
    for (const n of [-1, 0.5, Infinity]) {
      expect(() => factorial(n)).toThrow();
      expect(() => nCr(2, n)).toThrow();
    }
    expect(gcd(-12n, -8n)).toBe(4n);
    expect(new Rational(2, -4).toString()).toBe('-1/2');
    expect(() => new Rational(1, 0)).toThrow();
    const half = new Rational(1, 2);
    expect(half.add(half).toString()).toBe('1/1');
    expect(half.multiply(half).toString()).toBe('1/4');
    expect(half.compare(new Rational(2, 3))).toBe(-1);
    expect(half.compare(new Rational(1, 3))).toBe(1);
    expect(half.compare(half)).toBe(0);
    expect(half.display()).toEqual({
      fraction: '1/2',
      percent: '50.00%',
      oneIn: '1 in 2.00',
      against: '1.00 : 1 against',
    });
    expect(new Rational(0).display().oneIn).toBe('1 in ∞');
    expect(new Rational(0).display().against).toBe('∞ : 1 against');
    expect(new Rational(1).display().against).toBe('0.00 : 1 against');
    expect([...combinations([1, 2, 3], 2)]).toEqual([
      [1, 2],
      [1, 3],
      [2, 3],
    ]);
    expect([...combinations([], 0)]).toEqual([[]]);
    expect([...combinations([], 1)]).toEqual([]);
    expect(() => [...combinations([], -1)]).toThrow();
  });
  it('satisfies combinatorial identities', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        fc.integer({ min: 1, max: 49 }),
        (n, k) => {
          if (k >= n) return;
          expect(nCr(n, k)).toBe(nCr(n - 1, k) + nCr(n - 1, k - 1));
        },
      ),
      { seed: 17 },
    ));
  it('proves every Phase 1 facts-registry entry', () => {
    expect(facts.startingCombos()).toBe(1326n);
    expect(facts.handClasses()).toEqual({
      pairs: 13,
      suited: 78,
      offsuit: 78,
      total: 169,
    });
    expect(facts.combosPerClass()).toEqual({
      pair: 6n,
      suited: 4n,
      offsuit: 12n,
    });
    expect(facts.pocketPair().toString()).toBe('1/17');
    expect(facts.pocketAces().toString()).toBe('1/221');
    expect(facts.suited().toString()).toBe('4/17');
    expect(facts.atLeastOneAce().toString()).toBe('33/221');
    expect(facts.errorScale(4)).toBe(0.5);
    expect(() => facts.errorScale(0)).toThrow();
  });
});
describe('documented randomness', () => {
  it('matches known xoshiro128** output and replays', () => {
    const rng = new Rng('00000001000000020000000300000004');
    expect(Array.from({ length: 4 }, () => rng.nextUint32())).toEqual([
      11520, 0, 5927040, 70819200,
    ]);
    const a = new Rng(seed),
      b = new Rng(seed);
    expect(Array.from({ length: 100 }, () => a.nextUint32())).toEqual(
      Array.from({ length: 100 }, () => b.nextUint32()),
    );
  });
  it('rejects bad seeds and bounds and handles rejection sampling', () => {
    for (const s of ['', '0'.repeat(32), 'z'.repeat(32)])
      expect(() => new Rng(s)).toThrow();
    const rng = new Rng(seed);
    for (const n of [0, -1, 1.2, 2 ** 32 + 1])
      expect(() => rng.int(n)).toThrow();
    for (const n of [1, 3, 52, 2 ** 31 + 1, 2 ** 32])
      for (let i = 0; i < 1000; i++) {
        const v = rng.int(n);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(n);
      }
  });
  it('preserves a deck and is uniform over all 24 four-card permutations', () => {
    const rng = new Rng(seed),
      counts = new Map<string, number>();
    const runs = 240000;
    for (let i = 0; i < runs; i++) {
      const key = shuffle([0, 1, 2, 3], rng).join('');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(24); // df=23, upper critical value at alpha=0.001
    expect(
      chiSquare([...counts.values()], Array<number>(24).fill(runs / 24)),
    ).toBeLessThan(49.7282324664);
    expect([...shuffle(deck(), rng)].sort((a, b) => a - b)).toEqual(deck());
    expect(shuffle([], rng)).toEqual([]);
  });
});
describe('statistics', () => {
  it('matches hand-computed moments and normal interval', () => {
    const s = new Welford();
    expect(s.variance).toBe(0);
    expect(s.standardError).toBe(0);
    expect(shareInterval(s)).toEqual([0, 1]);
    [1, 2, 3, 4, 5].forEach((x) => s.add(x));
    expect(s.mean).toBe(3);
    expect(s.variance).toBe(2.5);
    expect(s.standardError).toBeCloseTo(Math.sqrt(0.5));
    expect(normalInterval(0.5, 0.1)).toEqual([
      0.5 - Z95 * 0.1,
      0.5 + Z95 * 0.1,
    ]);
  });
  it('handles Wilson boundaries and fractional pot-share uncertainty', () => {
    expect(wilson(0, 0)).toEqual([0, 1]);
    expect(wilson(0, 100)[1]).toBeGreaterThan(0);
    expect(wilson(100, 100)[0]).toBeLessThan(1);
    expect(wilson(50, 100)[0]).toBeCloseTo(0.4038315);
    for (const [a, b] of [
      [-1, 1],
      [2, 1],
      [0, -1],
      [0, 1.5],
    ])
      expect(() => wilson(a, b)).toThrow();
    const s = new Welford();
    for (let i = 0; i < 100; i++) s.add(1 / 3);
    expect(shareInterval(s)[0]).toBeLessThan(1 / 3);
    expect(shareInterval(s)[1]).toBeGreaterThan(1 / 3);
  });
  it('scores calibration and count fit', () => {
    expect(chiSquare([10, 20], [15, 15])).toBeCloseTo(10 / 3);
    expect(() => chiSquare([1], [])).toThrow();
    expect(() => chiSquare([1], [0])).toThrow();
    expect(brier([0, 0.5, 1], [0, 1, 1])).toBeCloseTo(1 / 12);
    for (const [a, b] of [
      [[], []],
      [[1], []],
      [[2], [1]],
      [[0], [NaN]],
    ])
      expect(() => brier(a, b)).toThrow();
  });
});
