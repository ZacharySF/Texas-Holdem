<script lang="ts">
  import { finalFacts } from '../../content/facts';
  import FinalExperiment from '../../ui/FinalExperiment.svelte';
  import { newSeed } from './state';
  import type { ShuffleMethod } from '../../engine/shuffleLab';
  import { navigation, setParams } from '../../navigation.svelte';
  import { untrack } from 'svelte';

  let params = $derived(new URLSearchParams(navigation.search));
  let fallback = $state.raw(newSeed());
  let seed = $derived(params.get('seed') ?? fallback);
  let method: ShuffleMethod = $derived(
    params.get('method') === 'fisherYates' ? 'fisherYates' : 'naive',
  );
  let counts = $derived(finalFacts.shufflePaths(method));
  let total = $derived(counts.reduce((a, b) => a + b.count, 0));
  let modulo = $derived(finalFacts.moduloCounts());
  $effect(() => {
    const dependencies = { d0: params, d1: seed, d2: setParams };
    void dependencies;
    return untrack(() => {
      const params = dependencies.d0;
      const seed = dependencies.d1;
      const setParams = dependencies.d2;
      if (!params.has('seed')) {
        const next = new URLSearchParams(params);
        next.set('seed', seed);
        setParams(next, { replace: true });
      }
    });
  });
</script>

<main class="tool-page">
  <h2>Shuffle Lab</h2>
  <p>
    Three labeled cards, 0, 1, and 2. Each random index has equally likely
    choices. Exhaustive enumeration visits every possible index sequence.
  </p>
  <label
    >Shuffle method<select
      aria-label="Shuffle method"
      value={method}
      onchange={(e) => setParams({ method: e.currentTarget.value, seed })}
      ><option value="naive">Swap each position with any position</option
      ><option value="fisherYates">Fisher–Yates shrinking choices</option
      ></select
    ></label
  >
  <p>Seed: <code>{seed}</code></p>
  <button onclick={() => setParams({ method, seed: newSeed() })}
    >New seed</button
  >
  <table>
    <caption>{total} equally likely paths</caption><thead
      ><tr><th>Final ordering</th><th>Paths</th><th>Exact chance</th></tr
      ></thead
    ><tbody
      >{#each counts as r (r.order)}<tr
          ><th>{r.order}</th><td>{r.count}</td><td>{r.count}/{total}</td></tr
        >{/each}</tbody
    >
  </table>
  <FinalExperiment request={{ type: 'shuffle', method, seed, samples: 10000 }}
  ></FinalExperiment>
  <details>
    <summary>Why rejection sampling?</summary>
    <p>
      An eight-outcome source reduced modulo three produces counts {modulo.biased.join(
        ', ',
      )}. Reject the incomplete final block ({modulo.discarded} source outcomes) and
      the remaining counts are {modulo.rejected.join(', ')}. Our generator uses
      the same construction with its full integer output space.
    </p>
  </details>
  <p>
    A small p-value is evidence against the uniform-ordering model for this
    fixed-size test, not a diagnosis of a gambling site. Avoid selecting only
    surprising seeds.
  </p>
  <a href="#/learn/20-1">Derive the shuffle counts and the test</a>
</main>
