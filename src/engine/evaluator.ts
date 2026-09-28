import { assertCards, rank, suit, type Card } from './cards';
import { combinations } from './math';
export const CATEGORIES = [
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
const BASE = 15 ** 5;
export const categoryOf = (strength: number): number =>
  Math.floor(strength / BASE);
function encode(category: number, ranks: readonly number[]): number {
  let result = category;
  for (let i = 0; i < 5; i++) result = result * 15 + (ranks[i] ?? 0);
  return result;
}
function straightHigh(mask: number): number {
  for (let high = 14; high >= 6; high--)
    if ((mask & (31 << (high - 4))) === 31 << (high - 4)) return high;
  return (mask & 16444) === 16444 ? 5 : 0; // A,2,3,4,5
}
/** Trusted hot path: caller validates distinct cards once at the boundary. */
export function evaluateFast(cards: readonly Card[]): number {
  const counts = new Uint8Array(15),
    suits = new Uint8Array(4),
    masks = new Uint16Array(4);
  let mask = 0;
  for (const card of cards) {
    const r = rank(card),
      s = suit(card);
    counts[r]++;
    suits[s]++;
    masks[s] |= 1 << r;
    mask |= 1 << r;
  }
  let flushSuit = -1;
  for (let s = 0; s < 4; s++)
    if (suits[s] >= 5) {
      flushSuit = s;
      const high = straightHigh(masks[s]);
      if (high) return encode(8, [high]);
    }
  const fours: number[] = [],
    trips: number[] = [],
    pairs: number[] = [],
    ranks: number[] = [];
  for (let r = 14; r >= 2; r--) {
    if (counts[r]) ranks.push(r);
    if (counts[r] === 4) fours.push(r);
    if (counts[r] === 3) trips.push(r);
    if (counts[r] >= 2) pairs.push(r);
  }
  if (fours.length)
    return encode(7, [fours[0], ranks.find((r) => r !== fours[0])!]);
  if (trips.length && pairs.some((r) => r !== trips[0]))
    return encode(6, [trips[0], pairs.find((r) => r !== trips[0])!]);
  if (flushSuit >= 0)
    return encode(
      5,
      ranks.filter((r) => (masks[flushSuit] & (1 << r)) !== 0).slice(0, 5),
    );
  const straight = straightHigh(mask);
  if (straight) return encode(4, [straight]);
  if (trips.length)
    return encode(3, [
      trips[0],
      ...ranks.filter((r) => r !== trips[0]).slice(0, 2),
    ]);
  if (pairs.length >= 2)
    return encode(2, [
      pairs[0],
      pairs[1],
      ranks.find((r) => r !== pairs[0] && r !== pairs[1])!,
    ]);
  if (pairs.length)
    return encode(1, [
      pairs[0],
      ...ranks.filter((r) => r !== pairs[0]).slice(0, 3),
    ]);
  return encode(0, ranks.slice(0, 5));
}
/** Independent readable five-card classification: sorted rank groups, no bit masks. */
export function referenceFive(cards: readonly Card[]): number {
  const ranks = cards.map(rank).sort((a, b) => b - a);
  const unique = [...new Set(ranks)];
  const groups = unique
    .map((r) => ({ rank: r, count: ranks.filter((x) => x === r).length }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
  const flush = cards.every((c) => suit(c) === suit(cards[0]));
  const wheel = unique.join(',') === '14,5,4,3,2';
  const straight =
    unique.length === 5 && (unique[0] - unique[4] === 4 || wheel);
  const high = wheel ? 5 : ranks[0];
  if (straight && flush) return encode(8, [high]);
  if (groups[0].count === 4)
    return encode(
      7,
      groups.map((g) => g.rank),
    );
  if (groups[0].count === 3 && groups[1].count === 2)
    return encode(
      6,
      groups.map((g) => g.rank),
    );
  if (flush) return encode(5, ranks);
  if (straight) return encode(4, [high]);
  const category =
    groups[0].count === 3
      ? 3
      : groups[0].count === 2
        ? groups[1].count === 2
          ? 2
          : 1
        : 0;
  return encode(
    category,
    groups.map((g) => g.rank),
  );
}
const singular = [
  '',
  '',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Jack',
  'Queen',
  'King',
  'Ace',
];
const plural = [
  '',
  '',
  'Twos',
  'Threes',
  'Fours',
  'Fives',
  'Sixes',
  'Sevens',
  'Eights',
  'Nines',
  'Tens',
  'Jacks',
  'Queens',
  'Kings',
  'Aces',
];
export function strengthName(strength: number): string {
  const category = categoryOf(strength),
    top = Math.floor(strength / 15 ** 4) % 15,
    second = Math.floor(strength / 15 ** 3) % 15;
  switch (category) {
    case 8:
      return top === 14
        ? 'Royal flush'
        : `${singular[top]}-high straight flush`;
    case 7:
      return `Four ${plural[top].toLowerCase()}`;
    case 6:
      return `${plural[top]} full of ${plural[second].toLowerCase()}`;
    case 5:
      return `${singular[top]}-high flush`;
    case 4:
      return `${singular[top]}-high straight`;
    case 3:
      return `Three ${plural[top].toLowerCase()}`;
    case 2:
      return `${plural[top]} and ${plural[second].toLowerCase()}`;
    case 1:
      return `Pair of ${plural[top].toLowerCase()}`;
    default:
      return `${singular[top]} high`;
  }
}
export function evaluateReference(cards: readonly Card[]): {
  strength: number;
  category: string;
  bestFive: Card[];
  name: string;
} {
  assertCards(cards);
  if (cards.length < 5 || cards.length > 7)
    throw new Error('Evaluate five through seven cards.');
  let strength = -1,
    bestFive: Card[] = [];
  for (const hand of combinations(
    [...cards].sort((a, b) => a - b),
    5,
  )) {
    const current = referenceFive(hand);
    if (current > strength) {
      strength = current;
      bestFive = hand;
    }
  }
  return {
    strength,
    category: CATEGORIES[categoryOf(strength)],
    bestFive,
    name: strengthName(strength),
  };
}
