import { rank, suit, type Card } from '../engine/cards';
import { assetUrl } from '../visual/config';
export function cardAsset(card?: Card, fourColor = false) {
  if (card === undefined) return assetUrl('cards/back.svg');
  const value = rank(card),
    name =
      value > 10 ? ['jack', 'queen', 'king', 'ace'][value - 11] : String(value);
  return assetUrl(
    `cards/${name}_of_${['clubs', 'diamonds', 'hearts', 'spades'][suit(card)]}${fourColor ? '-four' : ''}.svg`,
  );
}
