<script lang="ts">
  import { Rng } from '../../engine/rng';
  import { newSeed } from '../lab/state';
  import SeedInput from '../../ui/SeedInput.svelte';
  import {
    readDrill,
    recordDrill,
    drillXp,
    OUTS_PROGRESS_KEY,
  } from './progress';
  import styles from './OutsRush.module.css';
  import Round from './Round.svelte';
  import { navigation, setParams } from '../../navigation.svelte';
  import { untrack } from 'svelte';

  let params = $derived(new URLSearchParams(navigation.search));
  let fallback = $state.raw(newSeed());
  let active = $state.raw(false);
  let limit = $state.raw('20');
  let attempt = $state.raw(0);
  let progress = $state.raw(readDrill());
  let error = $state.raw('');
  let computed1 = $derived.by(() => {
    let seed = (params.get('seed') ?? fallback).toLowerCase();
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
  function changeSeed(next: string) {
    setActive(false);
    setParams({ seed: next }, { replace: true });
  }
  function complete(correct: number) {
    const next = recordDrill(progress, seed, correct);
    setProgress(next);
    try {
      localStorage.setItem(OUTS_PROGRESS_KEY, JSON.stringify(next));
    } catch {
      setError(
        'Progress works for this visit, but browser storage could not save it.',
      );
    }
  }
  function setActive(
    value: typeof active | ((previous: typeof active) => typeof active),
  ) {
    active = typeof value === 'function' ? value(active) : value;
  }
  function setLimit(
    value: typeof limit | ((previous: typeof limit) => typeof limit),
  ) {
    limit = typeof value === 'function' ? value(limit) : value;
  }
  function setAttempt(
    value: typeof attempt | ((previous: typeof attempt) => typeof attempt),
  ) {
    attempt = typeof value === 'function' ? value(attempt) : value;
  }
  function setProgress(
    value: typeof progress | ((previous: typeof progress) => typeof progress),
  ) {
    progress = typeof value === 'function' ? value(progress) : value;
  }
  function setError(
    value: typeof error | ((previous: typeof error) => typeof error),
  ) {
    error = typeof value === 'function' ? value(error) : value;
  }
</script>

<main class={styles.arcade}>
  <header>
    <h1>Outs Rush</h1>
    <p>
      Five seeded card spots. Name the target, remove known cards, and count
      each out once.
    </p>
  </header>
  <section class="panel">
    <label for="seed">Drill seed · copy the address to share this set</label
    >{#key seed}<SeedInput {seed} onCommit={changeSeed}></SeedInput>{/key}<label
      for="time-limit">Time per question</label
    ><select
      id="time-limit"
      value={limit}
      disabled={active}
      onchange={(e) => setLimit(e.currentTarget.value)}
      ><option value="20">20 seconds</option><option value="40"
        >40 seconds</option
      ><option value="0">Untimed practice</option></select
    >
    <p>
      Pause at any time. Expired questions reveal the full solution and wait for
      you; no automatic advance. Timer settings do not change the card sequence.
    </p>
    <div class={styles.actions}>
      <button
        onclick={() => {
          setAttempt((n) => n + 1);
          setActive(true);
        }}>{active ? 'Replay this seed' : 'Start Outs Rush'}</button
      ><button onclick={() => changeSeed(newSeed())}>New seed</button
      >{#if active}<button onclick={() => setActive(false)}
          >End set and change timing</button
        >{/if}
    </div>
    <p>
      Best on this seed: {progress.best[seed] ?? 0} / 5 · Drill XP: {drillXp(
        progress,
      )}. Each new correct answer in a seed’s best completed set earns 5 XP,
      including untimed practice.
    </p>
    {#if error}<p role="alert">{error}</p>{/if}
  </section>
  {#if active}{#key `${seed}-${attempt}`}<Round
        {seed}
        limit={limit === '0' ? null : Number(limit) * 1000}
        onComplete={complete}
      ></Round>{/key}{/if}
  <section class="panel">
    <h2>Build the count before racing it</h2>
    <p><a href="#/learn/8-1">One-card and two-card drawing odds</a></p>
    <p><a href="#/learn/8-2">Overlapping outs, dirty outs, and backdoors</a></p>
    <p>
      Call or Fold and Guess the Equity arrive in Phase 5; Combo Counter in
      Phase 7; Streak Trap in Phase 8.
    </p>
  </section>
</main>
