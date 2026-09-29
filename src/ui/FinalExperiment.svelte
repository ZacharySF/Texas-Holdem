<script lang="ts">
  import CfrChart from './CfrChart.svelte';
  import MeanChart from './MeanChart.svelte';
  import { type MeanPoint } from './MeanChart';
  import type {
    FinalRequest,
    FinalResponse,
    FinalResult,
  } from '../workers/final.worker';
  import Histogram from './Histogram.svelte';
  import { finalFacts, learningFacts } from '../content/facts';
  import { percent } from './Probability';
  import { untrack } from 'svelte';
  function meanPoint(data: FinalResult): MeanPoint[] {
    switch (data.kind) {
      case 'scalar':
        return [data.result];
      case 'runouts':
        return [
          {
            samples: data.result.samples,
            mean: data.result.twice,
            interval: data.result.twiceInterval,
            exact: data.result.exact.mean,
          },
        ];
      case 'icm':
        return [{ samples: data.result.samples, ...data.result.rows[0] }];
      case 'shuffle':
        return [
          {
            samples: data.result.samples,
            mean: data.result.rows[0].estimate,
            interval: data.result.rows[0].interval,
            exact: data.result.rows[0].exact,
          },
        ];
      default:
        return [];
    }
  }
  let { request }: { request: FinalRequest } = $props();
  let data = $state.raw<FinalResult | null>(null);
  let points = $state.raw<MeanPoint[]>([]);
  let trace = $state.raw<{ x: number; y: number }[]>([]);
  let running = $state.raw(false);
  let error = $state.raw('');
  let cancelled = $state.raw(false);
  let worker: Worker | null | null = null;
  let key = $derived(JSON.stringify(request));
  $effect(() => {
    const dependencies = { d0: key };
    void dependencies;
    return untrack(() => {
      worker?.terminate();
      worker = null;
      setData(null);
      setCancelled(false);
      setError('');
      setTrace([]);
      setPoints([]);
      setRunning(false);
      return () => worker?.terminate();
    });
  });
  function run() {
    setError('');
    setData(null);
    setCancelled(false);
    setError('');
    setTrace([]);
    setPoints([]);
    setRunning(true);
    const w = new Worker(
      new URL('../workers/final.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = w;
    w.onmessage = (e: MessageEvent<FinalResponse>) => {
      if (worker !== w) return;
      const m = e.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        w.terminate();
        return;
      }
      setData(m.data);
      setPoints((p) => [...p, ...m.trace.flatMap(meanPoint)]);
      setTrace((t) => [
        ...t,
        ...m.trace.flatMap((d) =>
          d.kind === 'cfr'
            ? [{ x: d.result.iterations, y: d.result.exploitability }]
            : [],
        ),
      ]);
      if (m.type === 'result') {
        setRunning(false);
        w.terminate();
      }
    };
    w.onerror = () => {
      setError('Worker stopped. Retry this experiment.');
      setRunning(false);
      w.terminate();
    };
    w.postMessage(request);
  }
  function setData(
    value: typeof data | ((previous: typeof data) => typeof data),
  ) {
    data = typeof value === 'function' ? value(data) : value;
  }
  function setPoints(
    value: typeof points | ((previous: typeof points) => typeof points),
  ) {
    points = typeof value === 'function' ? value(points) : value;
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
  function setCancelled(
    value:
      typeof cancelled | ((previous: typeof cancelled) => typeof cancelled),
  ) {
    cancelled = typeof value === 'function' ? value(cancelled) : value;
  }
</script>

<div class="final-experiment">
  <div class="tool-actions">
    <button disabled={running} onclick={run}>Run experiment</button
    >{#if running}<button
        onclick={() => {
          worker?.terminate();
          worker = null;
          setRunning(false);
          setCancelled(true);
        }}>Cancel experiment</button
      >{/if}
  </div>
  {#if points.length > 0}<p>
      Chart target: {data?.kind === 'shuffle'
        ? `frequency of ordering ${data.result.rows[0].order}`
        : data?.kind === 'icm'
          ? 'seat 1 prize'
          : data?.kind === 'runouts'
            ? 'average pot share from two rivers'
            : 'the stated trial outcome'}.
    </p>
    <MeanChart {points}></MeanChart>{/if}
  <p role="status">
    {running
      ? 'Running…'
      : cancelled
        ? 'Cancelled. Completed trials remain visible.'
        : error
          ? 'Experiment stopped.'
          : data
            ? 'Experiment complete.'
            : 'Ready.'}
  </p>
  {#if error}<p role="alert">{error}</p>{/if}{#if data?.kind === 'shuffle'}<p>
      {data.result.samples.toLocaleString()} shuffles. Uniformity chi-square statistic
      {data.result.statistic.toFixed(3)}; five degrees of freedom; approximate
      p-value {data.result.pValue.toPrecision(4)}. Expected counts must be
      sufficiently large for this approximation. It tests uniformity, not
      whether a particular seed is fair.
    </p>
    <Histogram
      label="Observed ordering counts"
      items={data.result.rows.map((r, i) => ({
        value: i,
        count: r.observed,
      }))}
    ></Histogram>{#each data.result.rows as r (r.order)}<p>
        {r.order}: exact {percent(r.exact)}, observed {percent(r.estimate)}, {learningFacts
          .confidence()
          .display().percent} Wilson interval {r.interval
          .map(percent)
          .join(' to ')}; gap {percent(r.estimate - r.exact)}.
      </p>{/each}{/if}{#if data?.kind === 'icm'}<p>
      {data.result.samples.toLocaleString()} independent finishing orders.
    </p>
    {#each data.result.rows as r, i (i)}<p>
        Seat {i + 1}: expected prize {r.exact.toFixed(4)}, observed {r.mean.toFixed(
          4,
        )}, gap {(r.mean - r.exact).toFixed(4)}, {learningFacts
          .confidence()
          .display().percent}interval {r.interval
          .map((n) => n.toFixed(4))
          .join(' to ')}.
      </p>{/each}{/if}{#if data?.kind === 'scalar'}<p>
      {data.result.samples.toLocaleString()} trials · estimate {data.result.mean.toFixed(
        6,
      )} · {learningFacts.confidence().display().percent} interval {data.result.interval
        .map((n) => n.toFixed(6))
        .join(' to ')} · exact/model value {data.result.exact.toFixed(6)} · gap {(
        data.result.mean - data.result.exact
      ).toFixed(6)}. Interval is pointwise; it excludes model error.
    </p>{/if}{#if data?.kind === 'runouts'}<p>
      {data.result.samples.toLocaleString()} paired trials, drawing two distinct rivers.
      Awards are fractional pot shares before integer-chip rounding.
    </p>
    <table>
      <caption>Mean share and variance</caption><thead
        ><tr><th>Quantity</th><th>Sampled</th><th>Exact</th><th>Gap</th></tr
        ></thead
      ><tbody
        >{#each ['single', 'twice', 'singleVariance', 'twiceVariance', 'covariance'] as const as k, entryIndex (entryIndex)}{@const exact =
            k === 'single' || k === 'twice'
              ? data.result.exact.mean
              : k === 'singleVariance'
                ? data.result.exact.variance
                : data.result.exact[k]}{#key k}<tr
              ><th>{k}</th><td>{data.result[k].toFixed(6)}</td><td
                >{exact.toFixed(6)}</td
              ><td>{(data.result[k] - exact).toFixed(6)}</td></tr
            >{/key}{/each}</tbody
      >
    </table>
    <p>
      Mean-share {learningFacts.confidence().display().percent} intervals: once {data.result.singleInterval
        .map(percent)
        .join(' to ')}; twice {data.result.twiceInterval
        .map(percent)
        .join(' to ')}. Variance and covariance are descriptive estimates; the
      intervals apply to the means.
    </p>{/if}{#if data?.kind === 'cfr'}<p>
      {data.result.iterations.toLocaleString()} deterministic full-tree training iterations;
      no Monte Carlo sampling interval applies. Mean-strategy value {data.result.value.toFixed(
        6,
      )} chips; exact equilibrium {finalFacts.kuhnExactValue().toString()}; gap {(
        data.result.value - finalFacts.kuhnExactValue().toNumber()
      ).toFixed(6)}. Exploitability {data.result.exploitability.toFixed(6)} chips
      per hand, computed by enumerating every pure best response.
    </p>
    <CfrChart points={trace}></CfrChart>
    <table>
      <caption
        >Average action frequencies: Q=0, K=1, A=2; p=check/fold, b=bet/call</caption
      ><thead><tr><th>Own rank: history</th><th>Bet or call</th></tr></thead
      ><tbody
        >{#each Object.entries(data.result.strategy) as [k, p] (k)}<tr
            ><th>{k || 'start'}</th><td>{percent(p)}</td></tr
          >{/each}</tbody
      >
    </table>{/if}
</div>
