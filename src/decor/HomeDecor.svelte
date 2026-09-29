<!-- Spread layers: L0 void; L1 masked halftone slot 01 (normal); L2 scanline screen;
 L3 night slab with knocked-out title; L4 12-column registration grid + ruler;
 L5 existing play controls; L6 actual combination data + issue sticker; L7 global grain. -->
<script lang="ts">
  import TypeDevice from './TypeDevice.svelte';
  import PhotoSlot from './gen/PhotoSlot.svelte';
  import Ruler from './Ruler.svelte';
  import Sticker from './Sticker.svelte';
  import CropMarks from './CropMarks.svelte';
  import ModularGrid from './ModularGrid.svelte';
  import { SITE_NAME } from './site';
  import { COMBINATIONS, CLASSES } from './gen/mathGraphics';
  import { parallax } from '../visual/parallax';
  import { visualConfig } from '../visual/config';
</script>

<div class="spread-home-scene decor" aria-hidden="true">
  <div use:parallax={visualConfig.motion.heroPhoto}>
    <PhotoSlot
      n={1}
      seed="home-01"
      width={1400}
      height={700}
      accent="#b1b7d0"
    />
  </div>
</div>
<div class="spread-home-screen decor" aria-hidden="true"></div>
<div
  class="spread-home-masthead decor"
  aria-hidden="true"
  use:parallax={visualConfig.motion.heroTitle}
>
  <TypeDevice word={SITE_NAME} treatment="knockout" />
</div>
<div class="spread-home-structure decor" aria-hidden="true">
  <ModularGrid /><Ruler /><CropMarks n="01" />
</div>
<div class="spread-home-data decor decor-micro" aria-hidden="true">
  <span>01 / probability through poker</span><span
    >{COMBINATIONS} combinations / {CLASSES} classes</span
  >
</div>
<div class="spread-home-issue decor" aria-hidden="true">
  <Sticker text="ISSUE 01" tilt={3} /><span class="decor-micro"
    >one deck<br />many possible futures</span
  >
</div>
