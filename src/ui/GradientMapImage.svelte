<script lang="ts">
  import { paletteForTheme } from '../visual/config';
  import { theme } from '../visual/display';
  const palette = $derived(paletteForTheme($theme));
  let {
    src,
    alt = '',
    class: className = '',
  }: { src: string; alt?: string; class?: string } = $props();
  const id = $props.id();
  const values = (channel: number) =>
    [palette.void, palette.violet, palette.ice]
      .map((c) => parseInt(c.slice(1 + channel * 2, 3 + channel * 2), 16) / 255)
      .join(' ');
</script>

<svg class="filter-definitions" aria-hidden="true">
  <defs
    ><filter {id} color-interpolation-filters="sRGB">
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={values(0)} /><feFuncG
          type="table"
          tableValues={values(1)}
        /><feFuncB type="table" tableValues={values(2)} />
      </feComponentTransfer>
    </filter></defs
  >
</svg>
<img {src} {alt} class={className} style:filter={`url(#${id})`} />
