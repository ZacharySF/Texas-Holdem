<script lang="ts">
  import { onMount } from 'svelte';
  import { renderGraphic } from './render';
  import type { Graphic, GraphicOptions } from './types';
  let {
    kind,
    seed = 'contemporary-01',
    variant = '',
    width = 480,
    height = 320,
    accent = '#aef7fc',
    known,
    text,
    photo,
    values,
  }: GraphicOptions = $props();
  let host: HTMLDivElement,
    visible = $state(false),
    dpr = $state(1),
    graphic = $state<Graphic>();
  onMount(() => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) visible = true;
      },
      { rootMargin: '100px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  });
  $effect(() => {
    if (!visible) return;
    let active = true;
    void renderGraphic({
      kind,
      seed,
      variant,
      width,
      height,
      accent,
      known,
      text,
      photo,
      values,
      dpr,
    }).then((result) => {
      if (active) graphic = result;
    });
    return () => {
      active = false;
    };
  });
</script>

<div
  bind:this={host}
  class="gen-art decor"
  aria-hidden="true"
  data-generator={kind}
  data-seed={seed}
  data-source={graphic?.source}
  style:aspect-ratio={`${width} / ${height}`}
>
  {#if graphic}<img src={graphic.url} alt="" draggable="false" />{/if}
</div>
