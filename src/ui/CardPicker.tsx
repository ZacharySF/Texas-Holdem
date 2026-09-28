import { useEffect, useRef, useState } from 'react';
import { RANKS, type Card } from '../engine/cards';
import { suitNames, suitSymbols } from './Card';
import styles from './Cards.module.css';
export function CardPicker({
  used,
  onPick,
  onClose,
  label,
}: {
  used: readonly Card[];
  onPick: (card: Card | undefined) => void;
  onClose: () => void;
  label: string;
}) {
  const [rank, setRank] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.picker}
      onCancel={onClose}
      aria-labelledby="picker-title"
    >
      <div className={styles.pickerHead}>
        <h2 id="picker-title">{label}</h2>
        <button onClick={onClose} aria-label="Close card picker">
          ×
        </button>
      </div>
      <p>Choose a rank, then a suit. Cards in use are unavailable.</p>
      <div className={styles.ranks}>
        {[...RANKS].reverse().map((r, i) => {
          const value = 12 - i;
          return (
            <button
              key={r}
              aria-pressed={rank === value}
              disabled={[0, 1, 2, 3].every((s) => used.includes(value * 4 + s))}
              onClick={() => setRank(value)}
            >
              {r}
            </button>
          );
        })}
      </div>
      <div className={styles.suits}>
        {suitSymbols.map((symbol, s) => (
          <button
            key={symbol}
            data-suit={s}
            aria-label={suitNames[s]}
            disabled={rank === null || used.includes(rank * 4 + s)}
            onClick={() => {
              if (rank !== null) onPick(rank * 4 + s);
            }}
          >
            {symbol}
            <small>{suitNames[s]}</small>
          </button>
        ))}
      </div>
      <button className="secondary" onClick={() => onPick(undefined)}>
        Clear this card
      </button>
    </dialog>
  );
}
