<script lang="ts">
  import GradientMapImage from '../ui/GradientMapImage.svelte';
  let { srcs }: { srcs: readonly string[] } = $props();
</script>

<div class="decor-thumb-stack decor" aria-hidden="true">
  {#each srcs.slice(0, 3) as src, i (i)}<div>
      <GradientMapImage {src} /><span class="decor-micro"
        >0{i + 1} / signal</span
      >
    </div>{/each}
</div>
