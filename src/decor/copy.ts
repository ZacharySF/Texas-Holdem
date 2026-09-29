import { deck } from '../engine/cards';
import { nCr } from '../engine/math';
import { chartClasses } from '../content/handChartFacts';
/** Actual combinatorial metadata; no invented probability claims. */
export const microCopy = [
  `${deck().length} cards / ${chartClasses.length} starting classes`,
  `${nCr(deck().length, 2)} two-card combinations`,
  `${nCr(deck().length, 5)} five-card combinations`,
];
