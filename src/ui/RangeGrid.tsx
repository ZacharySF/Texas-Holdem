import { gridClass, gridRange, type RangeWeights } from '../engine/rangeGrid';
import styles from './RangeGrid.module.css';
export function RangeGrid({
  weights,
  onChange,
  paint = 100,
  known = [],
  equities = {},
}: {
  weights: RangeWeights;
  onChange: (w: RangeWeights) => void;
  paint?: number;
  known?: number[];
  equities?: Record<string, number>;
}) {
  return (
    <div
      className={styles.scroll}
      tabIndex={0}
      role="region"
      aria-label="Starting hand range grid; scroll horizontally on a phone"
    >
      <div className={styles.grid}>
        {Array.from({ length: 169 }, (_, i) => {
          const row = Math.floor(i / 13),
            col = i % 13,
            label = gridClass(row, col),
            weight = weights[label] ?? 0,
            count = gridRange({ [label]: 100 }, known).combos.length;
          return (
            <button
              key={label}
              aria-label={`${label}, ${count} available combos, weight ${weight}${equities[label] !== undefined ? `, equity ${(equities[label] * 100).toFixed(2)} percent` : ''}`}
              aria-pressed={weight > 0}
              disabled={count === 0}
              className={weight > 0 ? styles.selected : ''}
              onClick={() =>
                onChange({ ...weights, [label]: weight === paint ? 0 : paint })
              }
              style={
                equities[label] === undefined
                  ? undefined
                  : {
                      background: `color-mix(in srgb, var(--accent) ${Math.round(equities[label] * 65)}%, var(--panel))`,
                    }
              }
            >
              <strong>{label}</strong>
              <small>
                {equities[label] === undefined
                  ? `${count} · ${weight}`
                  : `${(equities[label] * 100).toFixed(1)}%`}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
