<!-- L0 void; L1 visible-card DeckGrid in the header gutter; L2 fine ruled field;
 L3 existing Poker title; L4 ruler; L5 table/controls unchanged;
 L6 live-hand sticker + public-card metadata; L7 global grain. Accent: signal. -->
<script lang="ts">
  import Generator from './gen/Generator.svelte';
  import Ruler from './Ruler.svelte';
  import Sticker from './Sticker.svelte';
  import Callout from './Callout.svelte';
  import { formatCard } from '../engine/cards';
  let {
    hand,
    board,
    seed,
    street,
  }: {
    hand: readonly number[];
    board: readonly number[];
    seed?: string;
    street: string;
  } = $props();
  let known = $derived([...hand, ...board]);
  let label = $derived(hand.map(formatCard).join(''));
</script>

<div class="spread-play-header decor" aria-hidden="true">
  <div class="spread-play-deck">
    <Generator
      kind="DeckGrid"
      {seed}
      {known}
      width={520}
      height={100}
      accent="#1ed3f0"
    />
  </div>
  <div class="spread-play-note decor-micro">
    <Sticker text="LIVE HAND" /><span
      >{street} / {known.length} visible cards</span
    ><span>{label} / seed {seed ? seed.slice(0, 8) : 'unrevealed'}</span>
  </div>
  <Ruler />
</div>
<Callout selector=".coach-analysis > .probability strong" label="equity" />
<Callout
  selector=".pot-odds-walkthrough ol > li:last-child strong"
  label="price / call"
/>
