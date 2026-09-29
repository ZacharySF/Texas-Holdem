<script lang="ts">
  let { show = false }: { show?: boolean } = $props();
</script>

<div class="graphic-modular-grid decor" class:show aria-hidden="true">
  {#each Array.from({ length: 12 }, (_, i) => i) as n (n)}<i
      ><span>{String(n + 1).padStart(2, '0')}</span></i
    >{/each}
</div>
