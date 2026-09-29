<script lang="ts">
  import { onMount } from 'svelte';
  import { assetUrl } from '../../visual/config';
  import entries from './plates.json';
  import type { Scene } from './scenes';
  import TerminalLight from './TerminalLight.svelte';
  type Photo = {
    id: string;
    src: string;
    fallback: string;
    scene: Scene;
    focal: string;
    caption: string;
  };
  let {
    scene = 'terminal',
    compact = false,
    header = false,
  }: { scene?: Scene; compact?: boolean; header?: boolean } = $props();
  const uid = $props.id();
  let root: HTMLSpanElement;
  let paused = $state(true);
  let failed = $state(false);
  let photo = $derived(
    (entries as Photo[]).find((entry) => entry.scene === scene),
  );
  const url = (path: string) => assetUrl(path.replace(/^\//, ''));
  const towers = [41, 63, 52, 83, 47, 70, 95, 58, 76, 45];
  const bokeh = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 37 + 9) % 100,
    y: (i * 29 + 13) % 100,
    size: 4 + (i % 5) * 2,
  }));
  onMount(() => {
    let visible = false;
    const sync = () => {
      paused = !visible || document.hidden;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(root);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  });
</script>

<span
  bind:this={root}
  class="sc-plate"
  class:sc-plate--compact={compact}
  class:sc-plate--header={header}
  data-scene={scene}
  data-paused={paused}
  aria-hidden="true"
>
  {#if photo && !failed}
    <picture class="sc-plate-photo" aria-hidden="true">
      <source srcset={url(photo.src)} type="image/avif" aria-hidden="true" />
      <img
        src={url(photo.fallback)}
        alt=""
        width="1600"
        height="1067"
        loading={scene === 'terminal' && !compact ? 'eager' : 'lazy'}
        fetchpriority={scene === 'terminal' && !compact ? 'high' : 'auto'}
        style:object-position={photo.focal}
        onerror={() => {
          failed = true;
        }}
        aria-hidden="true"
      />
    </picture>
    <svg class="sc-filter-defs" aria-hidden="true"
      ><defs aria-hidden="true"
        ><filter id={`${uid}-ghost`} aria-hidden="true"
          ><feGaussianBlur stdDeviation="10 0" aria-hidden="true" /></filter
        ></defs
      ></svg
    >
    <img
      class="sc-photo-ghost sc-plate-overlay"
      src={url(photo.fallback)}
      width="1600"
      height="1067"
      alt=""
      loading="lazy"
      style:filter={`url(#${uid}-ghost)`}
      style:object-position={photo.focal}
      aria-hidden="true"
    />
    <span class="sc-photo-tint sc-plate-overlay" aria-hidden="true"></span>
    <span class="sc-photo-highlight sc-plate-overlay" aria-hidden="true"></span>
  {:else if scene === 'terminal'}
    <span class="sc-terminal-original" aria-hidden="true"
      ><TerminalLight /></span
    >
    <span class="sc-terminal-reflection" aria-hidden="true"
      ><TerminalLight reflection /></span
    >
  {:else if scene === 'tunnel'}
    <span class="sc-tunnel-haze" aria-hidden="true"></span>
    <span class="sc-tunnel-perspective" aria-hidden="true"
      ><span class="sc-tunnel-plane" aria-hidden="true"></span></span
    >
  {:else if scene === 'study' || scene === 'study-quiet'}
    {#if !compact}
      <svg
        class="sc-study-field"
        viewBox="0 0 800 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs aria-hidden="true"
          ><filter
            id={`${uid}-study`}
            x="-20%"
            y="-30%"
            width="140%"
            height="160%"
            color-interpolation-filters="sRGB"
            aria-hidden="true"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.002 0.09"
              numOctaves="3"
              seed="12"
              aria-hidden="true"
            />
            <feColorMatrix type="saturate" values="0" aria-hidden="true" />
            <feGaussianBlur stdDeviation="12 0" aria-hidden="true" />
          </filter></defs
        >
        <rect
          width="800"
          height="300"
          filter={`url(#${uid}-study)`}
          aria-hidden="true"
        />
      </svg>
    {/if}
    <span class="sc-study-tint sc-plate-overlay" aria-hidden="true"></span>
    <span class="sc-study-cross sc-plate-overlay" aria-hidden="true"></span>
  {:else if scene === 'skyline'}
    <span class="sc-skyline-towers" aria-hidden="true"
      >{#each towers as height, i (i)}<i
          style:height={`${height}%`}
          aria-hidden="true"
        ></i>{/each}</span
    >
    <span class="sc-skyline-horizon" aria-hidden="true"></span>
    <span class="sc-skyline-flare sc-plate-overlay" aria-hidden="true"></span>
  {:else}
    <span class="sc-bokeh-field" aria-hidden="true"
      >{#each bokeh as dot, i (i)}<i
          style:left={`${dot.x}%`}
          style:top={`${dot.y}%`}
          style:width={`${dot.size}%`}
          aria-hidden="true"
        ></i>{/each}</span
    >
    <span class="sc-window-flutes sc-plate-overlay" aria-hidden="true"></span>
  {/if}
  <span class="sc-jewel-highlight sc-plate-overlay" aria-hidden="true"></span>
</span>
