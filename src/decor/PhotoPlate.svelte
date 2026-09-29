<script lang="ts">
  import Plate from '../lib/softclub/Plate.svelte';
  let { compact = false }: { compact?: boolean } = $props();
</script>

<span class:compact class="photo-plate" aria-hidden="true">
  <Plate scene={compact ? 'study' : 'terminal'} {compact} />
  {#if !compact}<span class="plate-caption">plate 01 / violet study</span>{/if}
</span>
