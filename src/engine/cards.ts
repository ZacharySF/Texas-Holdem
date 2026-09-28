/** rank-major: 4 * (rank - 2) + suit; c,d,h,s = 0,1,2,3. */
export type Card = number;
export type Hand = readonly [Card, Card];
export const RANKS = '23456789TJQKA';
export const SUITS = 'cdhs';
export const deck = (): Card[] => Array.from({ length: 52 }, (_, i) => i);
export const rank = (card: Card): number => Math.floor(card / 4) + 2;
export const suit = (card: Card): number => card % 4;
export function assertCards(cards: readonly Card[]): void {
  if (cards.some((c) => !Number.isInteger(c) || c < 0 || c > 51))
    throw new Error('Cards must be integers from 0 to 51.');
  if (new Set(cards).size !== cards.length)
    throw new Error('A card cannot appear twice.');
}
export function parseCard(value: string): Card {
  if (!/^[2-9TJQKA][cdhs]$/i.test(value))
    throw new Error(`Invalid card: ${value}`);
  return (
    RANKS.indexOf(value[0].toUpperCase()) * 4 +
    SUITS.indexOf(value[1].toLowerCase())
  );
}
export function formatCard(card: Card): string {
  assertCards([card]);
  return RANKS[rank(card) - 2] + SUITS[suit(card)];
}
export const parseCards = (text: string): Card[] =>
  text.trim() ? text.trim().split(/\s+/).map(parseCard) : [];
