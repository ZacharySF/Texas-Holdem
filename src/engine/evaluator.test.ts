import { fiveCardCounts } from '../content/facts';
import { expect, it } from 'vitest';
import fc from 'fast-check';
import { deck, parseCards } from './cards';
import {
  categoryOf,
  evaluateFast,
  evaluateReference,
  referenceFive,
  strengthName,
} from './evaluator';
import { Rng, shuffle } from './rng';
it('exhausts 2,598,960 five-card hands with both implementations and 7,462 strengths', () => {
  const counts = Array<number>(9).fill(0),
    distinct = Array.from({ length: 9 }, () => new Set<number>()),
    hand = Array<number>(5).fill(0);
  let royals = 0;
  for (let a = 0; a < 48; a++) {
    hand[0] = a;
    for (let b = a + 1; b < 49; b++) {
      hand[1] = b;
      for (let c = b + 1; c < 50; c++) {
        hand[2] = c;
        for (let d = c + 1; d < 51; d++) {
          hand[3] = d;
          for (let e = d + 1; e < 52; e++) {
            hand[4] = e;
            const fast = evaluateFast(hand),
              reference = referenceFive(hand);
            if (fast !== reference)
              throw new Error(`Evaluator mismatch: ${hand}`);
            const category = categoryOf(fast);
            counts[category]++;
            distinct[category].add(fast);
            if (category === 8 && strengthName(fast) === 'Royal flush')
              royals++;
          }
        }
      }
    }
  }
  expect(counts.map(BigInt)).toEqual(fiveCardCounts());
  expect(counts).toEqual([
    1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40,
  ]);
  expect(distinct.map((s) => s.size)).toEqual([
    1277, 2860, 858, 858, 10, 1277, 156, 156, 10,
  ]);
  expect(royals).toBe(4);
  expect(counts.reduce((a, b) => a + b, 0)).toBe(2598960);
  expect(distinct.reduce((n, s) => n + s.size, 0)).toBe(7462);
});
it('agrees on 100,000 seeded seven-card hands', () => {
  const rng = new Rng('0123456789abcdef0123456789abcdef');
  for (let i = 0; i < 100000; i++) {
    const cards = shuffle(deck(), rng).slice(0, 7);
    const fast = evaluateFast(cards),
      reference = evaluateReference(cards);
    if (fast !== reference.strength) throw new Error(`Mismatch ${cards}`);
  }
});
it('is invariant to card order', () =>
  fc.assert(
    fc.property(
      fc.uniqueArray(fc.integer({ min: 0, max: 51 }), {
        minLength: 7,
        maxLength: 7,
      }),
      (cards) => {
        expect(evaluateFast(cards)).toBe(evaluateFast([...cards].reverse()));
        expect(evaluateReference(cards)).toEqual(
          evaluateReference([...cards].reverse()),
        );
      },
    ),
    { numRuns: 300, seed: 2026 },
  ));
it('handles wheels, kickers, full houses, counterfeits, board plays and names', () => {
  const cases: [string, string][] = [
    ['As 2d 3c 4h 5s Kd Qc', 'Five-high straight'],
    ['As 2s 3s 4s 5s Kd Qc', 'Five-high straight flush'],
    ['Qs Qd Qc 4h 4s 2d 3c', 'Queens full of fours'],
    ['As Js 8s 5s 3s Kd Qc', 'Ace-high flush'],
    ['As Ah Ad Ac 3s Kd Qc', 'Four aces'],
    ['As Ah Ad 2c 3s Kd Qc', 'Three aces'],
    ['As Ah Kd Kc 3s 2d Qc', 'Aces and kings'],
    ['Qs Qh Ad 2c 3s 8d 9c', 'Pair of queens'],
    ['As Kh Qd Js 9c 4d 2c', 'Ace high'],
    ['As Ks Qs Js Ts 4d 2c', 'Royal flush'],
  ];
  for (const [cards, name] of cases) {
    const result = evaluateReference(parseCards(cards));
    expect(result.name).toBe(name);
    expect(result.bestFive).toHaveLength(5);
    expect(result.strength).toBe(evaluateFast(parseCards(cards)));
  }
  expect(evaluateFast(parseCards('As Ah Kd Qc Js 9d 2c'))).toBeGreaterThan(
    evaluateFast(parseCards('Ad Ac Qd Jc Ts 9h 2d')),
  );
  expect(evaluateReference(parseCards('2c 2d Ah Ad Ks Kd Qs')).name).toBe(
    'Aces and kings',
  );
  const board = parseCards('As Ks Qs Js Ts');
  expect(evaluateFast([...parseCards('2c 3d'), ...board])).toBe(
    evaluateFast([...parseCards('4c 5d'), ...board]),
  );
  expect(() => evaluateReference(parseCards('As Ks'))).toThrow();
  expect(() => evaluateReference([...deck().slice(0, 8)])).toThrow();
});
