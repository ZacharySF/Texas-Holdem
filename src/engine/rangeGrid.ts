import { assertCards, rank, suit, type Hand } from './cards';
import type { WeightedRange } from './ranges';
export const RANK_LABELS = 'AKQJT98765432';
export function gridClass(row: number, col: number): string {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    col < 0 ||
    row > 12 ||
    col > 12
  )
    throw new Error('Invalid grid coordinate.');
  return row === col
    ? RANK_LABELS[row] + RANK_LABELS[col]
    : RANK_LABELS[Math.min(row, col)] +
        RANK_LABELS[Math.max(row, col)] +
        (row < col ? 's' : 'o');
}
export function handClass(hand: Hand): string {
  const a = 14 - rank(hand[0]),
    b = 14 - rank(hand[1]);
  return gridClass(
    suit(hand[0]) === suit(hand[1]) ? Math.min(a, b) : Math.max(a, b),
    suit(hand[0]) === suit(hand[1]) ? Math.max(a, b) : Math.min(a, b),
  );
}
export type RangeWeights = Record<string, number>;
export function gridRange(
  weights: RangeWeights,
  known: readonly number[] = [],
): WeightedRange {
  assertCards(known);
  const valid = new Set(
    Array.from({ length: 169 }, (_, i) =>
      gridClass(Math.floor(i / 13), i % 13),
    ),
  );
  for (const [key, weight] of Object.entries(weights))
    if (
      !valid.has(key) ||
      !Number.isInteger(weight) ||
      weight < 0 ||
      weight > 100
    )
      throw new Error(
        'Use valid classes with integer weights from zero to 100.',
      );
  const combos: { hand: Hand; weight: number }[] = [];
  for (const [label, weight] of Object.entries(weights)) {
    if (!weight) continue;
    const a = 14 - RANK_LABELS.indexOf(label[0]),
      b = 14 - RANK_LABELS.indexOf(label[1]);
    for (let s = 0; s < 4; s++)
      for (let t = 0; t < 4; t++) {
        if (
          (a === b && s >= t) ||
          (a !== b && (label[2] === 's' ? s !== t : s === t))
        )
          continue;
        const hand: Hand = [4 * (a - 2) + s, 4 * (b - 2) + t];
        if (hand.every((c) => !known.includes(c)))
          combos.push({ hand, weight });
      }
  }
  return { combos };
}
export function rangeCounts(
  weights: RangeWeights,
  known: readonly number[] = [],
) {
  const raw = gridRange(weights),
    remaining = gridRange(weights, known);
  return {
    before: raw.combos.length,
    after: remaining.combos.length,
    removed: raw.combos.length - remaining.combos.length,
    weight: remaining.combos.reduce((a, c) => a + c.weight, 0),
  };
}
export function presetRange(
  preset: 'all' | 'pairs' | 'tight' | 'polarized',
): RangeWeights {
  return Object.fromEntries(
    Array.from({ length: 169 }, (_, i) => {
      const row = Math.floor(i / 13),
        col = i % 13,
        key = gridClass(row, col);
      return [
        key,
        preset === 'all' ||
        (preset === 'pairs' && row === col) ||
        (preset === 'tight' && (row === col || Math.max(row, col) <= 3)) ||
        (preset === 'polarized' &&
          ((row === col && row <= 2) || (row === 0 && col >= 8)))
          ? 100
          : 0,
      ];
    }),
  );
}
