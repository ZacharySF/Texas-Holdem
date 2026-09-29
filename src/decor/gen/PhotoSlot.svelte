<script lang="ts">
  import Generator from './Generator.svelte';
  import type { GeneratorKind } from './types';
  let {
    n,
    seed = 'photo',
    width = 600,
    height = 400,
    accent = '#aef7fc',
  }: {
    n: number;
    seed?: string;
    width?: number;
    height?: number;
    accent?: string;
  } = $props();
  const kinds: GeneratorKind[] = [
    'Halftone',
    'Dither',
    'SlitScan',
    'SlitScan',
    'Ascii',
    'Halftone',
  ];
</script>

<div
  class="photo-slot decor"
  class:photo-motion={n === 4}
  class:photo-duotone={n === 6}
  aria-hidden="true"
>
  <Generator
    kind={kinds[n - 1]}
    photo={n}
    variant={n === 4 ? 'motion-blur' : n === 6 ? 'duotone' : ''}
    {seed}
    {width}
    {height}
    {accent}
  />
</div>
