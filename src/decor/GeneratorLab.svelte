<script lang="ts">
  import { COMBINATIONS, CLASSES } from './gen/mathGraphics';
  import Generator from './gen/Generator.svelte';
  import PhotoSlot from './gen/PhotoSlot.svelte';
  import { generatorKinds, variants } from './gen/types';
  import { photoTreatments } from './gen/photos';
  import TypeDevice from './TypeDevice.svelte';
  import type { TypeTreatment } from './TypeDevice.svelte';
  import Ruler from './Ruler.svelte';
  import Sticker from './Sticker.svelte';
  import CropMarks from './CropMarks.svelte';
  import Caution from './Caution.svelte';
  import RingGauge from './RingGauge.svelte';
  import Callout from './Callout.svelte';
  import ModularGrid from './ModularGrid.svelte';
  import { SITE_NAME } from './site';
  let seed = $state('field-017');
  let selected = $state(
    Object.fromEntries(generatorKinds.map((k) => [k, variants[k][0]])),
  );
  const treatments: TypeTreatment[] = [
    'knockout',
    'image',
    'outline',
    'overprint',
    'split',
    'vertical',
    'path',
    'echo',
    'ticker',
  ];
</script>

<section class="generator-lab">
  <h2>Seeded image system</h2>
  <p>
    These development controls change only the preview. Frequency maps show
    combination counts, not equity.
  </p>
  <label class="lab-seed">Graphic seed <input bind:value={seed} /></label>
  <div class="generator-lab-grid">
    <ModularGrid show />
    {#each generatorKinds as kind (kind)}<section class="generator-specimen">
        <header>
          <h3>{kind}</h3>
          <label
            >Variant <select bind:value={selected[kind]}
              >{#each variants[kind] as v (v)}<option value={v}>{v}</option
                >{/each}</select
            ></label
          >
        </header>
        <Generator
          {kind}
          {seed}
          variant={selected[kind]}
          width={480}
          height={300}
          text={kind === 'Barcode' ? SITE_NAME : undefined}
          known={[48, 45, 32]}
        /><code>seed={seed} / cached / DPR ≤ 2</code>
      </section>{/each}
  </div>
  <h2>Six independent photo slots</h2>
  <div class="generator-lab-grid">
    {#each photoTreatments as treatment, i (treatment)}<section>
        <h3>0{i + 1}.jpg / {treatment}</h3>
        <PhotoSlot n={i + 1} {seed} width={480} height={240} />
      </section>{/each}
  </div>
  <h2>Type devices</h2>
  <div class="generator-lab-grid">
    {#each treatments as treatment (treatment)}<section class="type-specimen">
        <h3>{treatment}</h3>
        {#if treatment === 'knockout'}
          <Generator
            kind="NoiseField"
            seed={treatment}
            width={480}
            height={200}
          />{/if}<TypeDevice
          word={treatment === 'ticker'
            ? `${COMBINATIONS} combinations + ${CLASSES} classes`
            : SITE_NAME}
          {treatment}
          {seed}
          small
        />
      </section>{/each}
  </div>
  <h2>Graphic objects</h2>
  <div class="graphic-objects">
    <ModularGrid show /><Ruler /><Ruler vertical /><CropMarks /><Sticker
      text="LIVE HAND"
    /><Sticker text="ISSUE 02" tilt={4} /><RingGauge
      value={7}
      max={52}
      label="visible cards"
    /><Caution />
    <div class="lab-callout-target">
      <strong>{COMBINATIONS}</strong> combinations
    </div>
    <Callout selector=".lab-callout-target strong" label="combinations" />
  </div>
</section>
