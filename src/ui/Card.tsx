import {
  formatCard,
  rank,
  suit,
  type Card as CardValue,
} from '../engine/cards';
import styles from './Cards.module.css';
export const suitSymbols = ['♣', '♦', '♥', '♠'];
export const suitNames = ['clubs', 'diamonds', 'hearts', 'spades'];
export function Card({
  card,
  onClick,
  label,
}: {
  card?: CardValue;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className={`${styles.card} ${card === undefined ? styles.empty : ''}`}
      data-suit={card === undefined ? '' : suit(card)}
      onClick={onClick}
      aria-label={`${label}: ${card === undefined ? 'choose a card' : formatCard(card)}`}
    >
      {card === undefined ? (
        <span>+</span>
      ) : (
        <>
          <span>{'23456789TJQKA'[rank(card) - 2]}</span>
          <span>{suitSymbols[suit(card)]}</span>
        </>
      )}
    </button>
  );
}
