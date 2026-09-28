import {
  courseDeck,
  courseDrawCount,
  courseMatches,
  courseProbability,
  validateCourseDraw,
  type CourseDraw,
} from './courseDraws';
import { deck, parseCards, rank, suit } from './cards';
import { evaluateFast } from './evaluator';
import { factorial, nCr, Rational } from './math';
import { Rng } from './rng';
import { wilson, type Interval } from './stats';

export type Experiment =
  | CourseDraw
  | { kind: 'rank' | 'pocketRank' | 'atLeastRank'; rank: number }
  | { kind: 'suit'; suit: number }
  | { kind: 'orderedRanks'; first: number; second: number }
  | { kind: 'rankOrSuit'; rank: number; suit: number }
  | { kind: 'eitherSuit'; first: number; second: number }
  | { kind: 'permutation'; size: number }
  | { kind: 'subset'; size: number; take: number }
  | { kind: 'pair' | 'suited' | 'riverWin' };
export const RIVER_SPOT = {
  hero: parseCards('As Ad'),
  opponent: parseCards('Ks Kh'),
  board: parseCards('2c 3d 7h 9s'),
};
function integer(value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new Error('Invalid experiment parameter.');
}
export function validateExperiment(event: Experiment): void {
  if ('rank' in event) integer(event.rank, 2, 14);
  if ('suit' in event) integer(event.suit, 0, 3);
  switch (event.kind) {
    case 'courseDraw':
      validateCourseDraw(event);
      break;
    case 'orderedRanks':
      integer(event.first, 2, 14);
      integer(event.second, 2, 14);
      break;
    case 'eitherSuit':
      integer(event.first, 0, 3);
      integer(event.second, 0, 3);
      if (event.first === event.second)
        throw new Error('Choose distinct suits.');
      break;
    case 'permutation':
      integer(event.size, 2, 6);
      break;
    case 'subset':
      integer(event.size, 2, 10);
      integer(event.take, 1, event.size);
      break;
    case 'rank':
    case 'pocketRank':
    case 'atLeastRank':
    case 'suit':
    case 'rankOrSuit':
    case 'pair':
    case 'suited':
    case 'riverWin':
      break;
    default:
      throw new Error('Unknown experiment.');
  }
}
export function experimentDeck(event: Experiment): number[] {
  validateExperiment(event);
  if (event.kind === 'courseDraw') return courseDeck(event);
  if ('size' in event) return Array.from({ length: event.size }, (_, i) => i);
  if (event.kind === 'riverWin') {
    const known = [
      ...RIVER_SPOT.hero,
      ...RIVER_SPOT.opponent,
      ...RIVER_SPOT.board,
    ];
    return deck().filter((c) => !known.includes(c));
  }
  return deck();
}
export function experimentDraws(event: Experiment): number {
  if (event.kind === 'courseDraw') return courseDrawCount(event);
  switch (event.kind) {
    case 'permutation':
      return event.size;
    case 'subset':
      return event.take;
    case 'rank':
    case 'suit':
    case 'rankOrSuit':
    case 'eitherSuit':
    case 'riverWin':
      return 1;
    default:
      return 2;
  }
}
/** The event predicate is separate from the counting formula, so tests can enumerate it independently. */
export function eventMatches(
  event: Experiment,
  cards: readonly number[],
): boolean {
  if (event.kind === 'courseDraw') return courseMatches(event, cards);
  switch (event.kind) {
    case 'rank':
      return rank(cards[0]) === event.rank;
    case 'suit':
      return suit(cards[0]) === event.suit;
    case 'pair':
      return rank(cards[0]) === rank(cards[1]);
    case 'suited':
      return suit(cards[0]) === suit(cards[1]);
    case 'pocketRank':
      return cards.every((c) => rank(c) === event.rank);
    case 'atLeastRank':
      return cards.some((c) => rank(c) === event.rank);
    case 'orderedRanks':
      return rank(cards[0]) === event.first && rank(cards[1]) === event.second;
    case 'rankOrSuit':
      return rank(cards[0]) === event.rank || suit(cards[0]) === event.suit;
    case 'eitherSuit':
      return suit(cards[0]) === event.first || suit(cards[0]) === event.second;
    case 'permutation':
      return cards.every((c, i) => c === i);
    case 'subset':
      return cards.every((c) => c < event.take);
    case 'riverWin':
      return (
        evaluateFast([...RIVER_SPOT.hero, ...RIVER_SPOT.board, cards[0]]) >
        evaluateFast([...RIVER_SPOT.opponent, ...RIVER_SPOT.board, cards[0]])
      );
  }
}
export function experimentProbability(event: Experiment): Rational {
  if (event.kind === 'courseDraw') return courseProbability(event);
  validateExperiment(event);
  switch (event.kind) {
    case 'rank':
      return new Rational(4, 52);
    case 'suit':
      return new Rational(13, 52);
    case 'pair':
      return new Rational(13n * nCr(4, 2), nCr(52, 2));
    case 'suited':
      return new Rational(4n * nCr(13, 2), nCr(52, 2));
    case 'pocketRank':
      return new Rational(nCr(4, 2), nCr(52, 2));
    case 'atLeastRank':
      return new Rational(nCr(52, 2) - nCr(48, 2), nCr(52, 2));
    case 'orderedRanks':
      return new Rational(4 * (event.first === event.second ? 3 : 4), 52 * 51);
    case 'rankOrSuit':
      return new Rational(4 + 13 - 1, 52);
    case 'eitherSuit':
      return new Rational(13 + 13, 52);
    case 'permutation':
      return new Rational(1, factorial(event.size));
    case 'subset':
      return new Rational(1, nCr(event.size, event.take));
    case 'riverWin': {
      const cards = experimentDeck(event);
      return new Rational(
        cards.filter((c) => eventMatches(event, [c])).length,
        cards.length,
      );
    }
  }
}
export interface ExperimentSnapshot {
  samples: number;
  successes: number;
  estimate: number;
  interval: Interval;
}
export function* simulateExperiment(
  event: Experiment,
  seed: string,
  samples: number,
  checkpoints = 200,
): Generator<ExperimentSnapshot, ExperimentSnapshot> {
  const population = experimentDeck(event),
    draws = experimentDraws(event),
    rng = new Rng(seed);
  integer(samples, 1, 1000000);
  integer(checkpoints, 1, 1000);
  const every = Math.max(1, Math.ceil(samples / checkpoints));
  let successes = 0;
  const snapshot = (n: number): ExperimentSnapshot => ({
    samples: n,
    successes,
    estimate: successes / n,
    interval: wilson(successes, n),
  });
  for (let n = 1; n <= samples; n++) {
    const pool = [...population];
    for (let i = 0; i < draws; i++) {
      const j = i + rng.int(pool.length - i);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    if (eventMatches(event, pool.slice(0, draws))) successes++;
    if (n === samples) return snapshot(n);
    if (n % every === 0) yield snapshot(n);
  }
  throw new Error('Unreachable sample count.');
}
