<script lang="ts">
  import { onMount } from 'svelte';
  import { parallax } from '../../visual/parallax';
  import { sceneFor, scenePresets, type Scene } from './scenes';
  let scene = $state<Scene>(
    sceneFor(typeof location === 'undefined' ? '' : location.hash),
  );
  let paused = $state(false);
  let preset = $derived(scenePresets[scene]);
  onMount(() => {
    const sync = () => {
      scene = sceneFor(location.hash);
    };
    const visibility = () => {
      paused = document.hidden;
    };
    sync();
    visibility();
    window.addEventListener('hashchange', sync);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('hashchange', sync);
      document.removeEventListener('visibilitychange', visibility);
    };
  });
</script>

<div
  class="sc-atmosphere"
  data-scene={scene}
  data-paused={paused}
  style:--sc-light-origin={preset.light}
  aria-hidden="true"
>
  <div class="sc-atmosphere-base" aria-hidden="true"></div>
  <div class="sc-atmosphere-light" aria-hidden="true"></div>
  <div class="sc-atmosphere-haze" aria-hidden="true">
    <i class="sc-haze-band" aria-hidden="true"></i>
    {#each preset.streaks as streak, i (i)}<i
        class="sc-streak"
        style:left={`${streak[0]}vw`}
        style:top={`${streak[1]}vh`}
        style:width={`${streak[2]}vw`}
        aria-hidden="true"
      ></i>{/each}
  </div>
  <div
    class="lounge-figure-depth"
    aria-hidden="true"
    use:parallax={{ speed: 0.015, pointer: 5, fixed: true }}
  >
    <div class="sc-atmosphere-mesh lg-figure" aria-hidden="true"></div>
  </div>
</div>
