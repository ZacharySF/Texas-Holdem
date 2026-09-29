<script lang="ts">
  let { vertical = false, count = 12 }: { vertical?: boolean; count?: number } =
    $props();
</script>

<div class="graphic-ruler decor decor-micro" class:vertical aria-hidden="true">
  {#each Array.from({ length: count + 1 }, (_, i) => i) as n (n)}<span
      ><b>{String(n).padStart(2, '0')}</b></span
    >{/each}
</div>
