<script lang="ts">
  let { n }: { n: string | number } = $props();
</script>

<div class="decor-issue decor" aria-hidden="true">
  <span class="decor-micro">contemporary / vol.</span><b
    >{String(n).padStart(2, '0')}</b
  >
</div>
