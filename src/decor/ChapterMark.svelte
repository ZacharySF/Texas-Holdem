<script lang="ts">
  import GhostWord from './GhostWord.svelte';
  let { n }: { n: number } = $props();
</script>

<div class="decor-chapter-mark decor" aria-hidden="true">
  <GhostWord word={String(n).padStart(2, '0')} /><span class="decor-micro"
    >chapter / field notes</span
  >
</div>
