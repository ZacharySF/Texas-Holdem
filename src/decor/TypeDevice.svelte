<script lang="ts">
  import { onMount } from 'svelte';
  import { renderGraphic } from './gen/render';
  import { visibleMotion } from './motion';
  export type TypeTreatment =
    | 'knockout'
    | 'image'
    | 'outline'
    | 'overprint'
    | 'split'
    | 'vertical'
    | 'path'
    | 'echo'
    | 'ticker';
  let {
    word,
    treatment = 'outline',
    seed = 'type',
    small = false,
  }: {
    word: string;
    treatment?: TypeTreatment;
    seed?: string;
    small?: boolean;
  } = $props();
  const id = $props.id();
  let ready = $state(false),
    url = $state('');
  onMount(() => {
    ready = true;
  });
  $effect(() => {
    if (ready && treatment === 'image') {
      let active = true;
      void renderGraphic({
        kind: 'NoiseField',
        seed,
        variant: 'contours',
        width: 900,
        height: 240,
        accent: '#aef7fc',
        dpr: Math.min(devicePixelRatio, 2),
      }).then((g) => {
        if (active) url = g.url;
      });
      return () => {
        active = false;
      };
    }
  });
</script>

<div
  class={`type-device decor type-${treatment}${small ? ' type-small' : ''}`}
  aria-hidden="true"
  use:visibleMotion
>
  {#if treatment === 'knockout'}<svg
      viewBox="0 0 1400 250"
      preserveAspectRatio="none"
      ><defs
        ><mask {id}
          ><rect width="1400" height="250" fill="white" /><text
            x="-12"
            y="225"
            font-size="245"
            textLength="1420"
            lengthAdjust="spacingAndGlyphs"
            fill="black">{word}</text
          ></mask
        ></defs
      ><rect
        width="1400"
        height="250"
        fill="var(--night)"
        mask={`url(#${id})`}
      /></svg
    >
  {:else if treatment === 'path'}<svg viewBox="0 0 700 70"
      ><defs><path {id} d="M 12,60 Q 350,-28 688,60" /></defs><text
        ><textPath href={`#${id}`} startOffset="50%" text-anchor="middle"
          >{word}</textPath
        ></text
      ></svg
    >
  {:else if treatment === 'echo'}<span>{word}</span
    >{#each [1, 2, 3, 4] as n (n)}<span
        class="type-echo-copy"
        style:opacity={0.3 / n}
        style:transform={`translate(${n * 3}px,${n * 8}px)`}
        style:filter={`blur(${n * 0.25}px)`}>{word}</span
      >{/each}
  {:else if treatment === 'overprint'}<span>{word}</span><span
      class="type-overprint-a">{word}</span
    ><span class="type-overprint-b">{word}</span>
  {:else if treatment === 'ticker'}<span class="type-ticker-track"
      >{word} + {word}</span
    >
  {:else}<span
      style:background-image={treatment === 'image'
        ? `linear-gradient(#b1b7d0b3, #b1b7d0b3), url('${url}')`
        : undefined}>{word}</span
    >{/if}
</div>
