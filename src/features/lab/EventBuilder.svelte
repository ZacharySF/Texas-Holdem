<script lang="ts">
  import { parseCards, type Hand } from '../../engine/cards';
  import { Rng } from '../../engine/rng';
  import type { Experiment } from '../../engine/experiments';
  import { modelTruth, type ModelSpec } from '../../engine/models';
  import ModelCheck from '../learn/ModelCheck.svelte';
  import { newSeed } from './state';
  import SeedInput from '../../ui/SeedInput.svelte';
  import { navigation, setParams } from '../../navigation.svelte';
  import { untrack } from 'svelte';

  let params = $derived(new URLSearchParams(navigation.search));
  let fallback = $state.raw(newSeed());
  let kind = $derived(params.get('event') ?? 'pair');
  let cards = $derived(params.get('cards') ?? 'Ah Kh');
  let repetitions = $derived(Number(params.get('n') ?? 2));
  let hits = $derived(Number(params.get('k') ?? 2));
  let atLeast = $derived(params.get('atLeast') === 'true');
  let seed = $derived(params.get('seed') ?? fallback);
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    next.set('seed', seed);
    setParams(next, { replace: true });
  };
  $effect(() => {
    const dependencies = { d0: params, d1: fallback, d2: setParams };
    void dependencies;
    return untrack(() => {
      const params = dependencies.d0;
      const fallback = dependencies.d1;
      const setParams = dependencies.d2;
      if (!params.has('seed')) {
        const next = new URLSearchParams(params);
        next.set('seed', fallback);
        setParams(next, { replace: true });
      }
    });
  });
  let computed4 = $derived.by(() => {
    let model: ModelSpec | undefined,
      error = '';
    try {
      new Rng(seed);
      if (
        ![
          'pair',
          'suited',
          'ace',
          'flushDraw',
          'flush',
          'pairHole',
          'set',
        ].includes(kind)
      )
        throw new Error('Choose a supported event.');
      if (
        !Number.isInteger(repetitions) ||
        repetitions < 1 ||
        repetitions > 20 ||
        !Number.isInteger(hits) ||
        hits < 0 ||
        hits > repetitions
      )
        throw new Error(
          'Use 1–20 repeated hands and a hit count within that range.',
        );
      const parsed = parseCards(cards);
      let event: Experiment;
      if (kind === 'pair' || kind === 'suited') event = { kind };
      else if (kind === 'ace') event = { kind: 'atLeastRank', rank: 14 };
      else {
        if (parsed.length !== 2) throw new Error('Specify two hole cards.');
        event = {
          kind: 'courseDraw',
          topic: 'flop',
          hand: parsed as unknown as Hand,
          event: kind as 'flushDraw' | 'flush' | 'pairHole' | 'set',
        };
      }
      model = { type: 'repeat', event, repetitions, hits, atLeast };
      modelTruth(model);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Invalid event.';
    }
    return { model, error };
  });
  let model = $derived(computed4.model);
  let error = $derived(computed4.error);
</script>

<main class="tool-page">
  <h2>How often does it happen?</h2>
  <p>
    Choose one card event, then repeat complete independent hands. Within a hand
    cards stay out; between hands the full setup is restored.
  </p>
  <section class="panel tool-fields">
    <label
      >Event<select
        value={kind}
        onchange={(e) => change('event', e.currentTarget.value)}
        ><option value="pair">Pocket pair</option><option value="suited"
          >Suited hole cards</option
        ><option value="ace">At least one ace in hole cards</option><option
          value="flushDraw">Suited hand flops exactly a flush draw</option
        ><option value="flush">Suited hand flops a flush</option><option
          value="pairHole">Unpaired hand pairs a hole rank</option
        ><option value="set">Pocket pair hits its rank on the flop</option
        ></select
      ></label
    ><label
      >Fixed hole cards for flop events<input
        value={cards}
        oninput={(e) => change('cards', e.currentTarget.value)}
      /></label
    ><label
      >Number of hands<input
        type="number"
        min="1"
        max="20"
        value={repetitions}
        oninput={(e) => change('n', e.currentTarget.value)}
      /></label
    ><label
      >Successful hands<input
        type="number"
        min="0"
        max={repetitions}
        value={hits}
        oninput={(e) => change('k', e.currentTarget.value)}
      /></label
    ><label
      >Count condition<select
        value={String(atLeast)}
        onchange={(e) => change('atLeast', e.currentTarget.value)}
        ><option value="false">Exactly this many</option><option value="true"
          >At least this many</option
        ></select
      ></label
    >
  </section>
  <label for="seed">Experiment seed</label>{#key seed}<SeedInput
      {seed}
      onCommit={(v) => change('seed', v)}
    ></SeedInput>{/key}{#if error}<p role="alert">
      {error}
    </p>{:else}{#if model}{#key JSON.stringify(model) + seed}<ModelCheck
          {model}
          {seed}
        ></ModelCheck>{/key}{/if}{/if}
  <details>
    <summary>Why this answer?</summary>
    <p>
      A single hand's chance comes from physical card counting. For exactly k
      successes in n independent hands, choose their positions, multiply the k
      success probabilities and n−k failure probabilities. “At least” adds the
      disjoint exact counts. The simulator deals the card event afresh in every
      hand, rather than flipping a coin with a precomputed chance.
    </p>
    <a href="#/learn/10-1">Work through the binomial derivation</a>
  </details>
  <a href="#/lab">Back to Equity Lab</a>
</main>
