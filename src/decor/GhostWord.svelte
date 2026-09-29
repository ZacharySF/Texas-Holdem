<script lang="ts">
  let { word, blur = false }: { word: string; blur?: boolean } = $props();
  const id = $props.id();
</script>

<div class="decor-ghost-word decor" aria-hidden="true">
  <span>{word}</span>
  <span class="decor-ghost-echo" style:filter={blur ? `url(#${id})` : undefined}
    >{word}</span
  >
  {#if blur}<svg class="decor-filter"
      ><defs
        ><filter {id} x="-25%" width="150%"
          ><feGaussianBlur stdDeviation="3 0" /></filter
        ></defs
      ></svg
    >{/if}
</div>
