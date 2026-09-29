<script lang="ts">
  import Masthead from './Masthead.svelte';
  import MotionPhoto from './MotionPhoto.svelte';
  import Swoosh from './Swoosh.svelte';
  import Hairlines from './Hairlines.svelte';
  import ThumbStack from './ThumbStack.svelte';
  import MicroBlock from './MicroBlock.svelte';
  import Chevrons from './Chevrons.svelte';
  import IssueNumber from './IssueNumber.svelte';
  import { assetUrl } from '../visual/config';
  const photo = assetUrl('art/club-overpass.png');
</script>

<div class="decor-home-backdrop decor" aria-hidden="true">
  <MotionPhoto src={photo} /><Swoosh />
</div>
<div class="decor-home-masthead decor" aria-hidden="true">
  <Masthead word="contemporary" />
</div>
<div class="decor-home-grid decor" aria-hidden="true">
  <Hairlines horizontal={['22%', '88%']} vertical={['3%', '72%']} />
</div>
<div class="decor-home-edition decor decor-micro" aria-hidden="true">
  <b>an independent study of chance</b><span
    >issue 01 / probability &amp; play</span
  ><span>52 cards · infinite decisions</span>
</div>
<div class="decor-home-notes decor" aria-hidden="true">
  <MicroBlock /><Chevrons />
</div>
<div class="decor-home-thumbs decor" aria-hidden="true">
  <div class="decor-soft">heads-up<br />six-max<br />outs<br />equity</div>
  <ThumbStack srcs={[photo, photo, photo]} />
</div>
<div class="decor-home-caption decor decor-micro" aria-hidden="true">
  <b>field study 001</b> / light, velocity, repetition<span
    >observation precedes understanding &gt;&gt;&gt;</span
  >
</div>
<div class="decor-home-issue decor" aria-hidden="true">
  <IssueNumber n="01" />
</div>
