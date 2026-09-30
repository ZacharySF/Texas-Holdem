<script lang="ts">
  import Plate from '../lib/softclub/Plate.svelte';
  import entries from '../lib/softclub/plates.json';
  const photo = (entries as { scene: string; caption: string }[]).find(
    (entry) => entry.scene === 'terminal',
  );
  let { compact = false }: { compact?: boolean } = $props();
</script>

<span class:compact class="photo-plate" aria-hidden="true">
  <Plate scene={compact ? 'study' : 'terminal'} {compact} />
  {#if !compact}<span class="plate-caption"
      >{photo?.caption ?? 'plate 01 / violet study'}</span
    >{/if}
</span>
