<script lang="ts">
  import { microCopy } from './copy';
  let { lines = microCopy }: { lines?: readonly string[] } = $props();
</script>

<div class="decor-microblock decor decor-micro" aria-hidden="true">
  {#each lines as line (line)}<span>{line}</span>{/each}
</div>
