<script lang="ts">
  let {
    items,
  }: { items: readonly { category: string; entries: readonly string[] }[] } =
    $props();
</script>

<p class="decor-run-in decor" aria-hidden="true">
  {#each items as item, i (item.category)}<span class:lime={i % 2 === 1}
      ><b>{item.category}</b>
      {item.entries.join(' + ')}<span class="decor-index-stop"> / </span></span
    >{/each}
</p>
