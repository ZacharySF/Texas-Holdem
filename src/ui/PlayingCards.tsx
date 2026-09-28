import './PlayingCards.css';
import { formatCard, rank, suit, type Card } from '../engine/cards';
import { suitSymbols, suitNames } from './Card';
export function PlayingCards({
  cards,
  hidden = 0,
  highlight = [],
}: {
  cards: readonly Card[];
  hidden?: number;
  highlight?: readonly Card[];
}) {
  return (
    <div className="playing-cards">
      {cards.map((c) => (
        <span
          key={c}
          className={`playing-card ${highlight.includes(c) ? 'out-card' : ''}`}
          data-suit={suit(c)}
          aria-label={`${formatCard(c)}, ${suitNames[suit(c)]}`}
        >
          <b>{'23456789TJQKA'[rank(c) - 2]}</b>
          <span>{suitSymbols[suit(c)]}</span>
        </span>
      ))}
      {Array.from({ length: hidden }, (_, i) => (
        <span
          key={`hidden${i}`}
          className="playing-card card-back"
          aria-label="Hidden opponent card"
        >
          ♠
        </span>
      ))}
    </div>
  );
}
