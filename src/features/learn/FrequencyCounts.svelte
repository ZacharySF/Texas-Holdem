<script lang="ts">
  import { courseProbability, type CourseDraw } from '../../engine/courseDraws';
  import { nCr } from '../../engine/math';
  import {
    CATEGORY_NAMES,
    fiveCardCounts,
    sevenCardCounts,
    drawingDerivation,
  } from '../../content/facts';
  import ExactValue from './ExactValue.svelte';
  import NotebookBlock from './NotebookBlock.svelte';

  let { selected }: { selected?: number[] } = $props();
  let five = $derived(fiveCardCounts());
  let seven = $derived(sevenCardCounts());
</script>

<div class="frequency-counts">
  <p>
    All five-card sets: {String(nCr(52, 5))}. All seven-card sets: {String(
      nCr(52, 7),
    )}. Categories below are mutually exclusive; straight flush includes royal
    flush.
  </p>
  {#each CATEGORY_NAMES as name, c (c)}{#if !selected || selected.includes(c)}{#key name}<details
        >
          <summary
            >{name} · five cards {five[c].toLocaleString()} · seven cards {seven[
              c
            ].toLocaleString()}</summary
          >{#each [5, 7] as const as size, entryIndex (entryIndex)}{@const event: CourseDraw = {
                kind: 'courseDraw',
                topic: 'category',
                size,
                category: c,
              }}{#key size}<div
              >
                <h3>{size} cards · {name}</h3>
                <NotebookBlock lines={drawingDerivation(event)}
                ></NotebookBlock><ExactValue value={courseProbability(event)}
                ></ExactValue>
              </div>{/key}{/each}
        </details>{/key}{:else}{/if}{/each}
</div>
