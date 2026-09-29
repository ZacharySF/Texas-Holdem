<script lang="ts">
  import { learningFacts } from '../../content/facts';
  import './learn.css';
  import {
    modelTruth,
    binaryModel,
    type ModelSpec,
    type ModelResult,
  } from '../../engine/models';
  import type { AnalysisResponse } from '../../workers/analysisProtocol';
  import SeriesChart from '../../ui/SeriesChart.svelte';
  import Histogram from '../../ui/Histogram.svelte';
  import ExactValue from './ExactValue.svelte';
  import { untrack } from 'svelte';

  let {
    model,
    seed,
  }: {
    model: ModelSpec;
    seed: string;
  } = $props();
  let result = $state.raw<ModelResult | null>(null);
  let trace = $state.raw<ModelResult[]>([]);
  let running = $state.raw(false);
  let error = $state.raw('');
  let worker: Worker | null | null = null;
  $effect(() => {
    const dependencies = {};
    void dependencies;
    return untrack(() => {
      return () => worker?.terminate();
    });
  });
  function run(samples: number) {
    worker?.terminate();
    setResult(null);
    setTrace([]);
    setRunning(true);
    setError('');
    const w = new Worker(
      new URL('../../workers/analysis.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = w;
    w.onmessage = (event: MessageEvent<AnalysisResponse>) => {
      if (worker !== w) return;
      const m = event.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        w.terminate();
      } else if (m.kind === 'model') {
        setResult(m.value);
        setTrace((t) => [...t, ...m.trace]);
        if (m.type === 'result') {
          setRunning(false);
          w.terminate();
        }
      }
    };
    w.onerror = () => {
      setError('The worker stopped. Retry the same seed.');
      setRunning(false);
      w.terminate();
    };
    w.postMessage({ kind: 'model', model, seed, samples });
  }
  let truth = $derived(modelTruth(model));
  let probability = $derived(binaryModel(model) || model.type === 'means');
  function setResult(
    value: typeof result | ((previous: typeof result) => typeof result),
  ) {
    result = typeof value === 'function' ? value(result) : value;
  }
  function setTrace(
    value: typeof trace | ((previous: typeof trace) => typeof trace),
  ) {
    trace = typeof value === 'function' ? value(trace) : value;
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

<section data-part="simulation" class="lesson-section">
  <h2>Run the experiment</h2>
  <p>
    Each trial resets this model. The seed reproduces the same draws. A sample
    mean averages the numerical result of each whole trial.
  </p>
  {#if probability}<ExactValue
      value={truth}
      label={model.type === 'means'
        ? 'Exact expected sample mean'
        : 'Exact event probability'}
    ></ExactValue>{:else}<p>
      Exact expected value: {truth.toString()} = {truth.toNumber().toFixed(4)}
      {model.type === 'waiting' ? 'hands' : 'chips'}.
    </p>{/if}
  <div class="lesson-actions">
    {#each [1000, 10000, 100000] as n (n)}<button
        disabled={running}
        onclick={() => run(n)}>Run {n.toLocaleString()} trials</button
      >{/each}{#if running}<button
        onclick={() => {
          worker?.terminate();
          worker = null;
          setRunning(false);
        }}>Cancel experiment</button
      >{/if}
  </div>
  <p role="status">
    {running ? 'Running…' : result ? 'Experiment complete.' : 'Ready.'}
  </p>
  {#if error}<p role="alert">{error}</p>{/if}{#if result}<p>
      {result.samples.toLocaleString()} trials · estimate {result.mean.toFixed(
        5,
      )} · {learningFacts.confidence().display().percent}
      {binaryModel(model) ? 'Wilson' : 'normal mean'} interval [{result.interval
        .map((n) => n.toFixed(5))
        .join(', ')}] · gap {(result.mean - result.truth).toFixed(5)}.
    </p>
    <p>
      Sample variance across trial results: {result.variance.toFixed(5)}. Normal
      intervals are approximate, pointwise, and need enough nondegenerate
      trials; a single constant run does not establish a general law.
    </p>
    <SeriesChart
      label="Running average and uncertainty versus completed trials"
      series={[
        { name: 'Estimate', values: trace.map((p) => p.mean) },
        { name: 'Exact', values: trace.map(() => truth.toNumber()) },
        { name: 'Lower band', values: trace.map((p) => p.interval[0]) },
        { name: 'Upper band', values: trace.map((p) => p.interval[1]) },
      ]}
    ></SeriesChart><Histogram
      label="Distribution of trial results"
      items={result.histogram}
    ></Histogram>{/if}
  <p>
    Four times as many independent trials approximately halves standard error.
    The histogram shows individual trial results; the interval describes
    uncertainty in their average. Waiting-time bars group ten hands, with a
    final overflow bin.
  </p>
</section>
