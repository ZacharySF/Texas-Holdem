<script lang="ts">
  import { gridClass, gridRange, type RangeWeights } from '../engine/rangeGrid';
  import styles from './RangeGrid.module.css';

  let {
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
  } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable content must be keyboard accessible.) -->
<div
  class={styles.scroll}
  tabindex="0"
  role="region"
  aria-label="Starting hand range grid; scroll horizontally on a phone"
>
  <div class={styles.grid}>
    {#each Array.from({ length: 169 }, (_, index) => index) as i (i)}{@const row =
        Math.floor(i / 13)}{@const col = i % 13}{@const label = gridClass(
        row,
        col,
      )}{@const weight = weights[label] ?? 0}{@const count = gridRange(
        { [label]: 100 },
        known,
      ).combos.length}{#key label}<button
          aria-label={`${label}, ${count} available combos, weight ${weight}${equities[label] !== undefined ? `, equity ${(equities[label] * 100).toFixed(2)} percent` : ''}`}
          aria-pressed={weight > 0}
          disabled={count === 0}
          class={weight > 0 ? styles.selected : ''}
          onclick={() =>
            onChange({ ...weights, [label]: weight === paint ? 0 : paint })}
          style={equities[label] === undefined
            ? undefined
            : `background: color-mix(in srgb, var(--accent) ${Math.round(equities[label] * 65)}%, var(--panel))`}
          ><strong>{label}</strong><small
            >{equities[label] === undefined
              ? `${count} · ${weight}`
              : `${(equities[label] * 100).toFixed(1)}%`}</small
          ></button
        >{/key}{/each}
  </div>
</div>
