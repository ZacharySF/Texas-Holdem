<script lang="ts">
  import { RANKS, type Card } from '../engine/cards';
  import { suitNames, suitSymbols } from './Card';
  import styles from './Cards.module.css';
  import { untrack } from 'svelte';

  let {
    used,
    onPick,
    onClose,
    label,
  }: {
    used: readonly Card[];
    onPick: (card: Card | undefined) => void;
    onClose: () => void;
    label: string;
  } = $props();
  let rank = $state.raw<number | null>(null);
  let dialog: HTMLDialogElement | null = $state(null);
  $effect(() => {
    const dependencies = {};
    void dependencies;
    return untrack(() => {
      dialog?.showModal();
    });
  });
  function setRank(
    value: typeof rank | ((previous: typeof rank) => typeof rank),
  ) {
    rank = typeof value === 'function' ? value(rank) : value;
  }
</script>

<dialog
  bind:this={dialog}
  class={styles.picker}
  oncancel={onClose}
  aria-labelledby="picker-title"
>
  <div class={styles.pickerHead}>
    <h2 id="picker-title">{label}</h2>
    <button onclick={onClose} aria-label="Close card picker">×</button>
  </div>
  <p>Choose a rank, then a suit. Cards in use are unavailable.</p>
  <div class={styles.ranks}>
    {#each [...RANKS].reverse() as r, i (i)}{@const value =
        12 - i}{#key r}<button
          aria-pressed={rank === value}
          disabled={[0, 1, 2, 3].every((s) => used.includes(value * 4 + s))}
          onclick={() => setRank(value)}>{r}</button
        >{/key}{/each}
  </div>
  <div class={styles.suits}>
    {#each suitSymbols as symbol, s (symbol)}<button
        data-suit={s}
        aria-label={suitNames[s]}
        disabled={rank === null || used.includes(rank * 4 + s)}
        onclick={() => {
          if (rank !== null) onPick(rank * 4 + s);
        }}>{symbol}<small>{suitNames[s]}</small></button
      >{/each}
  </div>
  <button class="secondary" onclick={() => onPick(undefined)}
    >Clear this card</button
  >
</dialog>
