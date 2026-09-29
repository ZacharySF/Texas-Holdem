<script lang="ts">
  import Chevrons from './Chevrons.svelte';
  import Hairlines from './Hairlines.svelte';
  import MicroBlock from './MicroBlock.svelte';
</script>

<div class="decor-play-rail decor" aria-hidden="true">
  <Hairlines horizontal={[]} vertical={['1%', '99%']} />
</div>
<div class="decor-play-heading decor" aria-hidden="true">
  <span class="decor-micro">live session / a study in decisions</span><Chevrons
  /><MicroBlock
    lines={[
      'OBSERVE THE PRICE',
      'COUNT THE POSSIBILITIES',
      'DECIDE WITH WHAT YOU KNOW',
    ]}
  />
</div>
