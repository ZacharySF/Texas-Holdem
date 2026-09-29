<script lang="ts">
  import { coordinates } from './motion';
  let {
    horizontal = ['18%', '82%'],
    vertical = ['3%', '97%'],
  }: { horizontal?: string[]; vertical?: string[] } = $props();
</script>

<div class="decor-hairlines decor" aria-hidden="true">
  {#each horizontal as y (y)}<i class="decor-line-h" style:top={y}></i>{/each}
  {#each vertical as x (x)}<i class="decor-line-v" style:left={x}></i>
    {#each horizontal as y (y)}<span
        class="decor-registration"
        style:left={x}
        style:top={y}>+</span
      >{/each}{/each}
  <span class="decor-coordinates decor-micro" use:coordinates
    >x:0041 y:0000</span
  >
</div>
