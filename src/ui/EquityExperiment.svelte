<script lang="ts">
  import {
    planEquity,
    type EquityInput,
    type EquityResult,
  } from '../engine/equity';
  import type { WorkerResponse } from '../workers/protocol';
  import Probability from './Probability.svelte';
  import { percent } from './Probability';
  import { untrack } from 'svelte';

  let {
    input,
    onResult,
  }: {
    input: EquityInput;
    onResult?: (r: EquityResult) => void;
  } = $props();
  let result = $state.raw<EquityResult | null>(null);
  let reference = $state.raw<EquityResult | null>(null);
  let running = $state.raw(false);
  let error = $state.raw('');
  let worker: Worker | null | null = null;
  let key = $derived(JSON.stringify(input));
  $effect(() => {
    const dependencies = { d0: key };
    void dependencies;
    return untrack(() => {
      worker?.terminate();
      worker = null;
      setResult(null);
      setReference(null);
      setRunning(false);
      setError('');
      return () => worker?.terminate();
    });
  });
  let computed3 = $derived.by(() => {
    let feasible = false;
    try {
      feasible = planEquity(input).exactFeasible;
    } catch {
      /* The worker returns a readable input error on run. */
    }
    return { feasible };
  });
  let feasible = $derived(computed3.feasible);
  function run(exact: boolean) {
    worker?.terminate();
    setResult(null);
    setReference(null);
    setError('');
    setRunning(true);
    const w = new Worker(
      new URL('../workers/equity.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = w;
    w.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (worker !== w) return;
      const m = e.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        w.terminate();
      } else if (m.type === 'reference') setReference(m.result);
      else {
        setResult(m.result);
        if (m.type === 'result') {
          setRunning(false);
          onResult?.(m.result);
          w.terminate();
        }
      }
    };
    w.onerror = () => {
      setError('Worker failed; retry the same seed.');
      setRunning(false);
      w.terminate();
    };
    w.postMessage({
      type: 'run',
      input: { ...input, method: exact ? 'exact' : 'monteCarlo' },
    });
  }
  function setResult(
    value: typeof result | ((previous: typeof result) => typeof result),
  ) {
    result = typeof value === 'function' ? value(result) : value;
  }
  function setReference(
    value:
      typeof reference | ((previous: typeof reference) => typeof reference),
  ) {
    reference = typeof value === 'function' ? value(reference) : value;
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

<div>
  <div class="tool-actions">
    <button disabled={running} onclick={() => run(false)}
      >Simulate equity · {input.samples.toLocaleString()}</button
    ><button disabled={running || !feasible} onclick={() => run(true)}
      >Count exact equity</button
    >{#if running}<button
        onclick={() => {
          worker?.terminate();
          worker = null;
          setRunning(false);
        }}>Cancel equity</button
      >{/if}
  </div>
  {#if !feasible}<p class="hint">
      Exact enumeration exceeds the interactive budget. Monte Carlo reports its
      sampling error; adding board cards can make exact counting feasible.
    </p>{/if}
  <p role="status">
    {running
      ? 'Calculating…'
      : result?.complete
        ? 'Equity complete.'
        : 'Ready.'}
  </p>
  {#if error}<p role="alert">
      {error}
    </p>{/if}{#if result && (result.method === 'monteCarlo' || result.complete)}<p
    >
      {result.method === 'exact' ? 'Exact enumeration' : 'Monte Carlo'} · {result.samples.toLocaleString()}
      deals.
    </p>
    <div class="tool-fields">
      {#each ['equity', 'win', 'tie', 'loss'] as const as k (k)}<Probability
          label={k}
          value={result.players[0][k]}
          sampled={result.method === 'monteCarlo'}
        ></Probability>{/each}
    </div>
    {#if reference}<Probability
        label="EXACT REFERENCE EQUITY"
        value={reference.players[0].equity}
        sampled={false}
      ></Probability>
      <p>
        Gap: {percent(
          result.players[0].equity.value - reference.players[0].equity.value,
        )}.
      </p>{/if}{/if}
  <p class="hint">
    Equity is average pot share. The estimate treats each tied winner as an
    equal share, and removes every specified board and dead card.
  </p>
</div>
