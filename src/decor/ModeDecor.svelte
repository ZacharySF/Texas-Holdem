<!-- Tools: L0 void; L1 independent showdown scatter + exact oscilloscope curve;
 L2 baseline grid (screen); L3 outline title; L4 crop marks; L5 existing tools;
 L6 sample metadata; L7 grain. Accent: signal.
 Drills: L0 void; L1 slot 02 dither + slot 05 ASCII with diagonal masks;
 L2 scanlines; L3 glow/violet misregistration; L4 ruler; L5 existing drill;
 L6 one sodium caution strip + actual seed; L7 grain. Accents: glow/sodium. -->
<script lang="ts">
  import { navigation } from '../navigation.svelte';
  import TypeDevice from './TypeDevice.svelte';
  import Generator from './gen/Generator.svelte';
  import Ruler from './Ruler.svelte';
  import Caution from './Caution.svelte';
  import CropMarks from './CropMarks.svelte';
  let tools = $derived(navigation.path.startsWith('/lab'));
  let seed = $derived(
    new URLSearchParams(navigation.search).get('seed') ?? navigation.path,
  );
</script>

{#if tools || navigation.path.startsWith('/arcade')}
  <div
    class="spread-mode decor"
    aria-hidden="true"
    class:spread-tools={tools}
    class:spread-drills={!tools}
  >
    <div class="mode-header-art decor" aria-hidden="true">
      {#if tools}<Generator
          kind="MonteCarloScatter"
          {seed}
          width={650}
          height={280}
          accent="#1ed3f0"
        /><Generator
          kind="Distribution"
          variant="scope"
          {seed}
          width={360}
          height={170}
          accent="#1ed3f0"
        />{:else}<Generator
          kind="Dither"
          photo={2}
          {seed}
          width={450}
          height={280}
          accent="#d4526d"
        /><Generator
          kind="Ascii"
          photo={5}
          {seed}
          width={400}
          height={200}
          accent="#d4526d"
        />{/if}
    </div>
    <div class="mode-type decor" aria-hidden="true">
      <span class="decor-micro"
        >{tools
          ? '04 / compare possible outcomes'
          : '03 / learn through repetition'}</span
      ><TypeDevice
        word={tools ? 'tools' : 'drills'}
        treatment={tools ? 'outline' : 'overprint'}
      /><span class="decor-micro"
        >{tools
          ? 'independent showdown sample / n=2400'
          : `seed / ${seed.slice(0, 24)}`}</span
      >
    </div>
    <div class="mode-ruler decor" aria-hidden="true">
      <Ruler /><CropMarks n={tools ? '04' : '03'} />
    </div>
    {#if !tools}<Caution text="PRACTICE / CHECK / REPEAT" />{/if}
  </div>
{/if}
