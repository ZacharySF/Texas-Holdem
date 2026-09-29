<script lang="ts">
  import GradientMapImage from '../ui/GradientMapImage.svelte';
  import Stripes from './Stripes.svelte';
  import { parallax } from '../visual/parallax';
  import { visualConfig } from '../visual/config';
  let {
    src,
    ghost = true,
    blur = 3,
  }: { src: string; ghost?: boolean; blur?: number } = $props();
  const id = $props.id();
</script>

<div class="decor-motion-photo decor" aria-hidden="true">
  <svg class="decor-filter"
    ><defs
      ><filter {id} x="-20%" width="140%"
        ><feGaussianBlur stdDeviation={`${blur} 0`} /></filter
      ></defs
    ></svg
  >
  <div
    class="decor-photo-parallax"
    use:parallax={visualConfig.motion.heroPhoto}
  >
    <div class="decor-photo-image" style:filter={`url(#${id})`}>
      <GradientMapImage {src} />
    </div>
    {#if ghost}<div class="decor-photo-ghost">
        <GradientMapImage {src} />
      </div>{/if}
  </div>
  <Stripes />
</div>
