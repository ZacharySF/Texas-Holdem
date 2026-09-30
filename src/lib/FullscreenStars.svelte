<script lang="ts">
  import { onMount } from 'svelte';
  import { parallax } from '../visual/parallax';
  import '../styles/fullscreen-terminal.css';

  let paused = $state(false);
  // Fixed decorative positions: no game RNG, canvas or per-frame DOM creation.
  const layers = [
    { depth: 6, count: 46 },
    { depth: 16, count: 28 },
  ];
  onMount(() => {
    const sync = () => (paused = document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  });
</script>

<div class="fullscreen-stars" class:stars-paused={paused} aria-hidden="true">
  {#each layers as layer, index (layer.depth)}
    <div class="star-depth" use:parallax={{ speed: 1, pointer: layer.depth }}>
      <div class="star-drift" class:star-drift--near={index === 1}>
        {#each Array.from({ length: layer.count }, (_, i) => i) as star (star)}
          <i
            style:left={`${(star * 61 + index * 17 + 3) % 101}%`}
            style:top={`${(star * star * 7 + star * 13 + index * 23) % 103}%`}
          ></i>
        {/each}
      </div>
    </div>
  {/each}
</div>
