<script lang="ts">
  import { Rng } from '../../engine/rng';
  import { newSeed } from '../lab/state';
  import Set from './Set.svelte';
  import { navigation, setParams } from '../../navigation.svelte';
  import { untrack } from 'svelte';

  let params = $derived(new URLSearchParams(navigation.search));
  let fallback = $state.raw(newSeed());
  let computed1 = $derived.by(() => {
    let seed = params.get('seed') ?? fallback;
    try {
      new Rng(seed);
    } catch {
      seed = fallback;
    }
    return { seed };
  });
  let seed = $derived(computed1.seed);
  $effect(() => {
    const dependencies = { d0: params, d1: seed, d2: setParams };
    void dependencies;
    return untrack(() => {
      const params = dependencies.d0;
      const seed = dependencies.d1;
      const setParams = dependencies.d2;
      if (params.get('seed') !== seed) setParams({ seed }, { replace: true });
    });
  });
</script>

<main class="tool-page">
  <h1>Streak Trap</h1>
  <p>
    Predict the next independent result, before seeing an explanation. No clock
    is needed for this drill.
  </p>
  <p>Seed: <code>{seed}</code></p>
  <button onclick={() => setParams({ seed: newSeed() })}>New seeded set</button
  >{#key seed}<Set {seed}></Set>{/key}<a href="#/learn/20-2"
    >Streaks, selection, and confirmation bias</a
  >
</main>
