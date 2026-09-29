<script lang="ts">
  import { learningFacts } from '../../content/facts';
  import type { BankrollResult } from '../../engine/bankroll';
  import type { AnalysisResponse } from '../../workers/analysisProtocol';
  import { newSeed } from './state';
  import Histogram from '../../ui/Histogram.svelte';
  import SeriesChart from '../../ui/SeriesChart.svelte';
  import { percent } from '../../ui/Probability';
  import { navigation, setParams } from '../../navigation.svelte';
  import { untrack } from 'svelte';

  let params = $derived(new URLSearchParams(navigation.search));
  let seed = $state.raw((() => params.get('seed') ?? newSeed())());
  let result = $state.raw<BankrollResult | null>(null);
  let running = $state.raw(false);
  let error = $state.raw('');
  let worker: Worker | null | null = null;
  let values = $derived({
    rate: Number(params.get('rate') ?? 5),
    sd: Number(params.get('sd') ?? 80),
    hands: Number(params.get('hands') ?? 10000),
    bankroll: Number(params.get('bankroll') ?? 1000),
    runs: Number(params.get('runs') ?? 1000),
  });
  let key = $derived(JSON.stringify(values));
  $effect(() => {
    const dependencies = { d0: key };
    void dependencies;
    return untrack(() => {
      worker?.terminate();
      worker = null;
      setResult(null);
      setRunning(false);
      return () => worker?.terminate();
    });
  });
  function run() {
    setRunning(true);
    setError('');
    const next = new URLSearchParams(params);
    next.set('seed', seed);
    setParams(next, { replace: true });
    const w = new Worker(
      new URL('../../workers/analysis.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = w;
    w.onmessage = (e: MessageEvent<AnalysisResponse>) => {
      if (worker !== w) return;
      const m = e.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        w.terminate();
      } else if (m.kind === 'bankroll') {
        setResult(m.value);
        if (m.type === 'result') {
          setRunning(false);
          w.terminate();
        }
      }
    };
    w.onerror = () => {
      setError('Worker stopped. Retry this seed.');
      setRunning(false);
    };
    w.postMessage({ kind: 'bankroll', input: { ...values, seed } });
  }
  function setResult(
    value: typeof result | ((previous: typeof result) => typeof result),
  ) {
    result = typeof value === 'function' ? value(result) : value;
  }
  function setRunning(
    value: typeof running | ((previous: typeof running) => typeof running),
  ) {
    running = typeof value === 'function' ? value(running) : value;
  }
  function setError(
    value: typeof error | ((previous: typeof error) => typeof error),
  ) {
    error = typeof value === 'function' ? value(error) : value;
  }
</script>

<main class="tool-page">
  <h1>The spread around a win rate</h1>
  <section class="panel tool-fields">
    {#each Object.keys(values) as (keyof typeof values)[] as k (k)}<label
        >{{
          rate: 'Win rate (bb/100)',
          sd: 'Standard deviation (bb per 100-hand block)',
          hands: 'Hands per path',
          bankroll: 'Starting bankroll (bb)',
          runs: 'Independent paths',
        }[k]}<input
          type="number"
          value={values[k]}
          oninput={(e) => {
            const p = new URLSearchParams(params);
            p.set(k, e.currentTarget.value);
            setParams(p, { replace: true });
          }}
        /></label
      >{/each}
  </section>
  <p>Seed: <code>{seed}</code></p>
  <p>
    Independent normal increments per 100-hand block; a shorter final block
    scales its mean and variance. Ruin means the bankroll touches zero at a
    block endpoint. Paths continue to measure unconstrained results after ruin.
    Within-block losses, serial dependence, changing stakes, and uncertain win
    rates are not modeled.
  </p>
  <button disabled={running} onclick={run}>Simulate bankroll paths</button
  >{#if running}<button
      onclick={() => {
        worker?.terminate();
        worker = null;
        setRunning(false);
      }}>Cancel paths</button
    >{/if}{#if error}<p role="alert">{error}</p>{/if}{#if result}<p
      role="status"
    >
      {result.runs.toLocaleString()} paths · mean {result.mean.toFixed(2)} bb · {learningFacts
        .confidence()
        .display().percent} mean interval [{result.meanInterval
        .map((x) => x.toFixed(2))
        .join(', ')}].
    </p>
    <p>
      Model mean {result.expected.toFixed(2)} bb; gap {(
        result.mean - result.expected
      ).toFixed(2)} bb. Model standard deviation {result.theoreticalSD.toFixed(
        2,
      )} bb. This spread of outcomes is different from the uncertainty in their estimated
      mean.
    </p>
    <p>
      Ruin frequency {percent(result.ruin)} · {learningFacts
        .confidence()
        .display().percent} Wilson interval [{result.ruinInterval
        .map((x) => percent(x))
        .join(', ')}].
    </p>
    <SeriesChart
      label="First eight simulated cumulative results in big blinds"
      series={result.paths.map((values, i) => ({
        name: `Path ${i + 1}`,
        values,
      }))}
    ></SeriesChart><Histogram
      label="Final results in big blinds"
      items={result.endings.map((value) => ({ value, count: 1 }))}
    ></Histogram><Histogram
      label="Maximum peak-to-trough drawdown in big blinds"
      items={result.drawdowns.map((value) => ({ value, count: 1 }))}
    ></Histogram><Histogram
      label="Longest time below a previous peak, in hands"
      items={result.longestDownswings.map((value) => ({
        value,
        count: 1,
      }))}
    ></Histogram>{/if}
  <details>
    <summary>Why these scales?</summary>
    <p>
      Mean grows with the number of independent blocks. Variance adds across
      blocks, so standard deviation grows with the square root of that count.
      Ruin is counted separately by inspecting the entire sampled path, not only
      the ending balance.
    </p>
    <a href="#/learn/14-1">Variance</a> ·
    <a href="#/learn/15-2">Sample means and the central limit theorem</a>
  </details>
  <a href="#/lab">Back to Equity Lab</a>
</main>
