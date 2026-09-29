<script lang="ts">
  import { type DrillMode } from '../../engine/decisionDrills';
  import { Rng } from '../../engine/rng';
  import { newSeed } from '../lab/state';
  import DrillSet from './DrillSet.svelte';
  import { navigation, setParams } from '../../navigation.svelte';
  import { untrack } from 'svelte';

  let { drill } = $derived(navigation.params);
  let mode: DrillMode = $derived(
    drill === 'guess' ? 'guess' : drill === 'combo' ? 'combo' : 'call',
  );
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
  <h1>
    {mode === 'call'
      ? 'Call or Fold'
      : mode === 'guess'
        ? 'Guess the Equity'
        : 'Combo Counter'}
  </h1>
  <p>
    Seed: <code>{seed}</code>. Share this address to repeat all five questions.
    Solutions appear only after answering.
  </p>
  <button onclick={() => setParams({ seed: newSeed() })}>New seeded set</button
  >{#key mode + seed}<DrillSet {mode} {seed}></DrillSet>{/key}<a href="#/arcade"
    >All Arcade drills</a
  >
</main>
