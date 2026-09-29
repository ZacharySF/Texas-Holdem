<!-- A dedicated outer strip; no graphics are placed beneath table controls. -->
<script lang="ts">
  import TypeDevice from './TypeDevice.svelte';
  import Generator from './gen/Generator.svelte';
  import { formatCard } from '../engine/cards';
  let { hand, board }: { hand: readonly number[]; board: readonly number[] } =
    $props();
  let label = $derived(hand.map(formatCard).join(''));
</script>

<div class="spread-table-edge decor" aria-hidden="true">
  <TypeDevice
    word={`${label} / ${board.length} board cards / read the price / count the possibilities`}
    treatment="path"
  />
  <div>
    <Generator
      kind="Barcode"
      text={label}
      seed={label}
      width={190}
      height={50}
      accent="#1ed3f0"
    />
  </div>
</div>
