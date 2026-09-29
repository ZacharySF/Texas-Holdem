<script lang="ts">
  import { Rng } from '../../engine/rng';
  import { newSeed } from '../lab/state';
  import FinalExperiment from '../../ui/FinalExperiment.svelte';
  import { finalFacts } from '../../content/facts';
  import Hand from './Hand.svelte';
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
  <h1>AKQ</h1>
  <p>
    Q &lt; K &lt; A. Each player antes one chip and receives one distinct card.
    Check or bet one; facing a bet, fold or call. No raises. Payoffs include the
    ante.
  </p>
  <button onclick={() => setParams({ seed: newSeed() })}>New deal</button
  >{#key seed}<Hand {seed}></Hand>{/key}
  <h2>Train a small solver</h2>
  <p>
    CFR visits every deal and information set, accumulates regret, and averages
    the strategies. Compare the resulting policy with a complete best-response
    enumeration. This does not solve full Hold’em.
  </p>
  <FinalExperiment request={{ type: 'cfr', iterations: 10000 }}
  ></FinalExperiment>
  <p>
    Exact first-player equilibrium value: {finalFacts
      .kuhnExactValue()
      .toString()} chips per hand. The bot uses an equilibrium policy and only its
    own card and public history.
  </p>
  <a href="#/learn/25-1">Work through counterfactual regrets</a>
</main>
