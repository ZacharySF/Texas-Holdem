<script lang="ts">
  import { SITE_NAME } from '../../decor/site';
  import HomeDecor from '../../decor/HomeDecor.svelte';
  import GhostWord from '../../decor/GhostWord.svelte';
  import CourseRunIn from '../../decor/CourseRunIn.svelte';
  import GradientMapImage from '../../ui/GradientMapImage.svelte';
  import AmbientCards from './AmbientCards.svelte';
  import { parallax } from '../../visual/parallax';
  import { assetUrl, visualConfig } from '../../visual/config';
  let {
    seats,
    dealing,
    bankroll,
    onplay,
  }: {
    seats: number;
    dealing: boolean;
    bankroll: number;
    onplay: (tableSeats: number) => void;
  } = $props();
</script>

<section class="home-hero">
  <HomeDecor />
  <div class="hero-art" aria-hidden="true">
    <div class="hero-photo" use:parallax={visualConfig.motion.heroPhoto}>
      <!-- Replace public/art/hero.jpg with your photo; this URL also works on project Pages. -->
      <GradientMapImage src={assetUrl('art/hero.jpg')} />
    </div>
    <div class="hero-blooms" use:parallax={visualConfig.motion.heroLights}>
      <AmbientCards />
    </div>
  </div>
  <div class="home-title" use:parallax={visualConfig.motion.heroTitle}>
    <h1>{SITE_NAME}</h1>
    <p>heads-up or six-max. the math is on screen.</p>
    <div class="decor-home-play"><GhostWord word="play" blur /></div>
    <div class="home-actions">
      <button
        class="primary start-game"
        disabled={dealing || bankroll < 1}
        onclick={() => onplay(seats)}
        >{dealing ? 'Shuffling…' : 'Take a seat & play'}</button
      >
      <button disabled={dealing || bankroll < 1} onclick={() => onplay(6)}
        >Six-player table</button
      >
    </div>
  </div>
</section>
<CourseRunIn />
