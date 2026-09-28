import { assertCards, deck, rank, suit, type Hand } from './cards';
import { categoryOf, evaluateFast } from './evaluator';
import { combinations, nCr, Rational } from './math';

export const CATEGORY_NAMES = [
  'High card',
  'One pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
] as const;
export type FlopEvent =
  | 'pairHole'
  | 'set'
  | 'twoPair'
  | 'flushDraw'
  | 'flush'
  | 'straightDraw'
  | 'straight'
  | 'overcard'
  | 'pairedBoard'
  | 'monotone'
  | 'twoTone'
  | 'rainbow';
export type CourseDraw = { kind: 'courseDraw' } & (
  | {
      topic: 'removal';
      known: readonly number[];
      target: 'rank' | 'suit';
      value: number;
      draws: 1 | 2;
      all: boolean;
    }
  | { topic: 'category'; size: 5 | 7; category: number }
  | { topic: 'royal'; size: 5 | 7 }
  | { topic: 'flop'; hand: Hand; event: FlopEvent }
  | { topic: 'boardRank'; hand: Hand }
  | { topic: 'outs'; unseen: number; outs: number; draws: 1 | 2 }
  | { topic: 'showdown'; hero: Hand; opponent: Hand; board: readonly number[] }
);
function whole(n: number, min: number, max: number) {
  if (!Number.isInteger(n) || n < min || n > max)
    throw new Error('Invalid card experiment parameter.');
}
export function validateCourseDraw(e: CourseDraw): void {
  switch (e.topic) {
    case 'removal':
      assertCards(e.known);
      whole(e.known.length, 0, 50);
      whole(e.draws, 1, 2);
      whole(e.value, e.target === 'rank' ? 2 : 0, e.target === 'rank' ? 14 : 3);
      break;
    case 'category':
      whole(e.category, 0, 8);
      if (e.size !== 5 && e.size !== 7)
        throw new Error('Use five or seven cards.');
      break;
    case 'royal':
      if (e.size !== 5 && e.size !== 7)
        throw new Error('Use five or seven cards.');
      break;
    case 'flop':
    case 'boardRank':
      assertCards(e.hand);
      if (e.hand.length !== 2) throw new Error('Use two hole cards.');
      if (
        (e.topic === 'boardRank' ||
          e.event === 'set' ||
          e.event === 'overcard') &&
        rank(e.hand[0]) !== rank(e.hand[1])
      )
        throw new Error('This event needs a pocket pair.');
      if (
        e.topic === 'flop' &&
        (e.event === 'pairHole' || e.event === 'twoPair') &&
        rank(e.hand[0]) === rank(e.hand[1])
      )
        throw new Error('This event needs unpaired hole cards.');
      if (
        e.topic === 'flop' &&
        (e.event === 'flushDraw' || e.event === 'flush') &&
        suit(e.hand[0]) !== suit(e.hand[1])
      )
        throw new Error('This event needs suited hole cards.');
      break;
    case 'outs':
      whole(e.unseen, 2, 52);
      whole(e.outs, 0, e.unseen);
      whole(e.draws, 1, 2);
      break;
    case 'showdown':
      assertCards([...e.hero, ...e.opponent, ...e.board]);
      whole(e.board.length, 3, 4);
      break;
  }
}
export function courseDeck(e: CourseDraw): number[] {
  validateCourseDraw(e);
  if (e.topic === 'outs') return Array.from({ length: e.unseen }, (_, i) => i);
  const known =
    e.topic === 'removal'
      ? e.known
      : e.topic === 'flop' || e.topic === 'boardRank'
        ? e.hand
        : e.topic === 'showdown'
          ? [...e.hero, ...e.opponent, ...e.board]
          : [];
  return deck().filter((c) => !known.includes(c));
}
export function courseDrawCount(e: CourseDraw): number {
  switch (e.topic) {
    case 'outs':
    case 'removal':
      return e.draws;
    case 'category':
    case 'royal':
      return e.size;
    case 'flop':
      return 3;
    case 'boardRank':
      return 5;
    case 'showdown':
      return 5 - e.board.length;
  }
}
/** Five-rank runs include the ace-low wheel, with no wrap above an ace. */
export function hasStraight(cards: readonly number[]): boolean {
  let mask = 0;
  for (const card of cards) mask |= 1 << rank(card);
  if (mask & (1 << 14)) mask |= 1 << 1;
  for (let low = 1; low <= 10; low++)
    if ((mask & (31 << low)) === 31 << low) return true;
  return false;
}
export type OutGoal = 'flush' | 'straight' | 'either' | 'ahead';
function completes(
  cards: readonly number[],
  goal: Exclude<OutGoal, 'ahead'>,
): boolean {
  const flush = [0, 1, 2, 3].some(
    (s) => cards.filter((c) => suit(c) === s).length >= 5,
  );
  return goal === 'flush'
    ? flush
    : goal === 'straight'
      ? hasStraight(cards)
      : flush || hasStraight(cards);
}
export function targetOuts(
  hand: Hand,
  board: readonly number[],
  goal: OutGoal,
  opponent?: Hand,
): number[] {
  assertCards([...hand, ...board, ...(opponent ?? [])]);
  whole(board.length, 3, 4);
  if (goal === 'ahead' && !opponent)
    throw new Error('An ahead-card question needs the opposing hand.');
  const known = [...hand, ...board, ...(opponent ?? [])];
  return deck().filter(
    (c) =>
      !known.includes(c) &&
      (goal === 'ahead'
        ? evaluateFast([...hand, ...board, c]) >
          evaluateFast([...opponent!, ...board, c])
        : completes([...hand, ...board, c], goal)),
  );
}
export function courseMatches(
  e: CourseDraw,
  cards: readonly number[],
): boolean {
  switch (e.topic) {
    case 'removal': {
      const matches = (c: number) =>
        (e.target === 'rank' ? rank(c) : suit(c)) === e.value;
      return e.all ? cards.every(matches) : cards.some(matches);
    }
    case 'outs':
      return cards.some((c) => c < e.outs);
    case 'category':
      return categoryOf(evaluateFast(cards)) === e.category;
    case 'royal':
      return [0, 1, 2, 3].some((s) =>
        [10, 11, 12, 13, 14].every((r) => cards.includes(4 * (r - 2) + s)),
      );
    case 'boardRank':
      return cards.some((c) => rank(c) === rank(e.hand[0]));
    case 'showdown':
      return (
        evaluateFast([...e.hero, ...e.board, ...cards]) >
        evaluateFast([...e.opponent, ...e.board, ...cards])
      );
    case 'flop': {
      const combined = [...e.hand, ...cards],
        ranks = cards.map(rank),
        suits = cards.map(suit);
      switch (e.event) {
        case 'pairHole':
          return ranks.some((r) => e.hand.some((c) => rank(c) === r));
        case 'set':
          return ranks.includes(rank(e.hand[0]));
        case 'twoPair':
          return (
            ranks.includes(rank(e.hand[0])) &&
            ranks.includes(rank(e.hand[1])) &&
            new Set(ranks).size === 3
          );
        case 'flushDraw':
          return suits.filter((s) => s === suit(e.hand[0])).length === 2;
        case 'flush':
          return suits.every((s) => s === suit(e.hand[0]));
        case 'straight':
          return hasStraight(combined);
        case 'straightDraw':
          return (
            !hasStraight(combined) &&
            Array.from({ length: 13 }, (_, i) => 4 * i).some((c) =>
              hasStraight([...combined, c]),
            )
          );
        case 'overcard':
          return ranks.some((r) => r > rank(e.hand[0]));
        case 'pairedBoard':
          return new Set(ranks).size < 3;
        case 'monotone':
          return new Set(suits).size === 1;
        case 'twoTone':
          return new Set(suits).size === 2;
        case 'rainbow':
          return new Set(suits).size === 3;
      }
    }
  }
}
/** Computed disjoint five-card counts, in ascending strength order. */
export function fiveCardCounts(): bigint[] {
  return [
    (nCr(13, 5) - 10n) * (4n ** 5n - 4n),
    13n * nCr(4, 2) * nCr(12, 3) * 4n ** 3n,
    nCr(13, 2) * nCr(4, 2) ** 2n * 11n * 4n,
    13n * nCr(4, 3) * nCr(12, 2) * 4n ** 2n,
    10n * (4n ** 5n - 4n),
    4n * (nCr(13, 5) - 10n),
    13n * nCr(4, 3) * 12n * nCr(4, 2),
    13n * 48n,
    4n * 10n,
  ];
}
/** Cached exhaustive classification, checked by verify:7card, not 21 overlapping five-card counts. */
export function sevenCardCounts(): bigint[] {
  return [
    23294460n,
    58627800n,
    31433400n,
    6461620n,
    6180020n,
    4047644n,
    3473184n,
    224848n,
    41584n,
  ];
}
export function outChance(
  unseen: number,
  outs: number,
  draws: 1 | 2,
): Rational {
  validateCourseDraw({
    kind: 'courseDraw',
    topic: 'outs',
    unseen,
    outs,
    draws,
  });
  return new Rational(
    nCr(unseen, draws) - nCr(unseen - outs, draws),
    nCr(unseen, draws),
  );
}
export function outShortcut(
  outs: number,
  draws: 1 | 2,
  adjusted = false,
): Rational {
  whole(outs, 0, 25);
  whole(draws, 1, 2);
  return new Rational(
    Math.min(
      100,
      2 * draws * outs - (adjusted && draws === 2 ? Math.max(0, outs - 8) : 0),
    ),
    100,
  );
}
const exactCache = new Map<string, Rational>();
export function courseProbability(e: CourseDraw): Rational {
  validateCourseDraw(e);
  const draws = courseDrawCount(e);
  switch (e.topic) {
    case 'outs':
      return outChance(e.unseen, e.outs, e.draws);
    case 'category':
      return new Rational(
        (e.size === 5 ? fiveCardCounts() : sevenCardCounts())[e.category],
        nCr(52, e.size),
      );
    case 'royal':
      return new Rational(4n * nCr(47, e.size - 5), nCr(52, e.size));
    case 'removal': {
      const pool = courseDeck(e),
        favorable = pool.filter(
          (c) => (e.target === 'rank' ? rank(c) : suit(c)) === e.value,
        ).length;
      return e.all
        ? new Rational(nCr(favorable, draws), nCr(pool.length, draws))
        : new Rational(
            nCr(pool.length, draws) - nCr(pool.length - favorable, draws),
            nCr(pool.length, draws),
          );
    }
    case 'boardRank':
      return new Rational(nCr(50, 5) - nCr(48, 5), nCr(50, 5));
    case 'flop':
      switch (e.event) {
        case 'pairHole':
          return new Rational(nCr(50, 3) - nCr(44, 3), nCr(50, 3));
        case 'set':
          return new Rational(nCr(50, 3) - nCr(48, 3), nCr(50, 3));
        case 'twoPair':
          return new Rational(3n * 3n * 44n, nCr(50, 3));
        case 'flushDraw':
          return new Rational(nCr(11, 2) * 39n, nCr(50, 3));
        case 'flush':
          return new Rational(nCr(11, 3), nCr(50, 3));
        case 'overcard':
          return new Rational(
            nCr(50, 3) - nCr(50 - 4 * (14 - rank(e.hand[0])), 3),
            nCr(50, 3),
          );
      }
  }
  const key = JSON.stringify(e),
    cached = exactCache.get(key);
  if (cached) return cached;
  const pool = courseDeck(e);
  let hits = 0n;
  for (const cards of combinations(pool, draws))
    if (courseMatches(e, cards)) hits++;
  const result = new Rational(hits, nCr(pool.length, draws));
  if (exactCache.size >= 100) exactCache.clear();
  exactCache.set(key, result);
  return result;
}
