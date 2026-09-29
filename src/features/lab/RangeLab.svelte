<script lang="ts">
  import { learningFacts } from '../../content/facts';
  import { parseCards, type Hand } from '../../engine/cards';
  import {
    gridRange,
    presetRange,
    rangeCounts,
    type RangeWeights,
  } from '../../engine/rangeGrid';
  import { Rng } from '../../engine/rng';
  import Histogram from '../../ui/Histogram.svelte';
  import RangeGrid from '../../ui/RangeGrid.svelte';
  import EquityExperiment from '../../ui/EquityExperiment.svelte';
  import Probability from '../../ui/Probability.svelte';
  import { percent } from '../../ui/Probability';
  import type { HeatCell, HeatResponse } from '../../workers/heatmap.worker';
  import { newSeed } from './state';
  import { navigation, setParams } from '../../navigation.svelte';
  import { untrack } from 'svelte';
  const initial = {
    weights: presetRange('tight'),
    hero: 'As Ah',
    board: '',
    dead: '',
    seed: '',
    versus: 'random' as 'random' | 'range',
  };

  let params = $derived(new URLSearchParams(navigation.search));
  let fallback = $state.raw(newSeed());
  let paint = $state.raw(100);
  let cells = $state.raw<Record<string, HeatCell>>({});
  let skipped = $state.raw<string[]>([]);
  let running = $state.raw(false);
  let error = $state.raw('');
  let inspect = $state.raw('AA');
  let worker: Worker | null | null = null;
  let raw = $derived(params.get('range'));
  let computed3 = $derived.by(() => {
    let labState = { ...initial, seed: fallback };
    try {
      if (raw) {
        const v: unknown = JSON.parse(raw);
        if (v && typeof v === 'object') {
          const a = v as Record<string, unknown>;
          if (
            typeof a.hero === 'string' &&
            typeof a.board === 'string' &&
            typeof a.dead === 'string' &&
            typeof a.seed === 'string' &&
            a.weights &&
            typeof a.weights === 'object' &&
            (a.versus === 'range' || a.versus === 'random')
          ) {
            const weights = a.weights as RangeWeights;
            gridRange(weights);
            new Rng(a.seed);
            labState = {
              hero: a.hero,
              board: a.board,
              dead: a.dead,
              seed: a.seed,
              weights,
              versus: a.versus,
            };
          }
        }
      }
    } catch {
      /* Invalid shared labState falls back to a valid editable setup. */
    }
    return { labState };
  });
  let labState = $derived(computed3.labState);
  let key = $derived(JSON.stringify(labState));
  $effect(() => {
    const dependencies = { d0: key, d1: raw, d2: setParams };
    void dependencies;
    return untrack(() => {
      const key = dependencies.d0;
      const raw = dependencies.d1;
      const setParams = dependencies.d2;
      if (!raw) setParams({ range: key }, { replace: true });
      worker?.terminate();
      worker = null;
      setCells({});
      setSkipped([]);
      setRunning(false);
      return () => worker?.terminate();
    });
  });
  const update = (patch: Partial<typeof labState>) =>
    setParams(
      { range: JSON.stringify({ ...labState, ...patch }) },
      { replace: true },
    );
  let computed8 = $derived.by(() => {
    let board: number[] = [],
      dead: number[] = [],
      hero: Hand = [0, 1],
      validation = '';
    try {
      board = parseCards(labState.board);
      dead = parseCards(labState.dead);
      const h = parseCards(labState.hero);
      if (h.length !== 2) throw new Error('Choose two hero cards.');
      hero = h as unknown as Hand;
      if (board.length > 5) throw new Error('At most five board cards.');
      gridRange(labState.weights, [...hero, ...board, ...dead]);
      if (
        !gridRange(labState.weights, [...hero, ...board, ...dead]).combos.length
      )
        throw new Error('No opponent combos remain after removal.');
    } catch (e) {
      validation = e instanceof Error ? e.message : 'Invalid cards.';
    }
    return { board, dead, hero, validation };
  });
  let board = $derived(computed8.board);
  let dead = $derived(computed8.dead);
  let hero = $derived(computed8.hero);
  let validation = $derived(computed8.validation);
  let counts = $derived(
    !validation
      ? rangeCounts(labState.weights, [...hero, ...board, ...dead])
      : null,
  );
  function heatmap() {
    if (validation) return;
    setRunning(true);
    setCells({});
    setSkipped([]);
    setError('');
    const w = new Worker(
      new URL('../../workers/heatmap.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = w;
    w.onmessage = (e: MessageEvent<HeatResponse>) => {
      if (worker !== w) return;
      const m = e.data;
      if (m.type === 'cell')
        setCells((c) => ({ ...c, [m.cell.label]: m.cell }));
      else if (m.type === 'skipped')
        setSkipped((s) => [...s, `${m.label}: ${m.message}`]);
      else {
        setRunning(false);
        w.terminate();
        if (m.type === 'error') setError(m.message);
      }
    };
    w.onerror = () => {
      setError('Heatmap worker stopped.');
      setRunning(false);
    };
    w.postMessage({
      weights: labState.weights,
      versus: labState.versus,
      board,
      dead,
      seed: labState.seed,
      samples: 1000,
    });
  }
  let selected = $derived(cells[inspect]);
  function setPaint(
    value: typeof paint | ((previous: typeof paint) => typeof paint),
  ) {
    paint = typeof value === 'function' ? value(paint) : value;
  }
  function setCells(
    value: typeof cells | ((previous: typeof cells) => typeof cells),
  ) {
    cells = typeof value === 'function' ? value(cells) : value;
  }
  function setSkipped(
    value: typeof skipped | ((previous: typeof skipped) => typeof skipped),
  ) {
    skipped = typeof value === 'function' ? value(skipped) : value;
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
  function setInspect(
    value: typeof inspect | ((previous: typeof inspect) => typeof inspect),
  ) {
    inspect = typeof value === 'function' ? value(inspect) : value;
  }
</script>

<main class="tool-page">
  <h1>Range editor</h1>
  <p><a href="#/lab/charts">Starting-hand charts & reference →</a></p>
  <p>
    Pairs lie on the diagonal, suited hands above it, offsuit below it. Each
    cell is a hand class, not one equally likely outcome. The numbers show
    available physical combos and relative weight. Tap with the chosen weight to
    add or remove a class.
  </p>
  <section class="panel">
    <div class="tool-fields">
      <label
        >Hero cards<input
          value={labState.hero}
          oninput={(e) => update({ hero: e.currentTarget.value })}
        /></label
      ><label
        >Board cards<input
          value={labState.board}
          oninput={(e) => update({ board: e.currentTarget.value })}
        /></label
      ><label
        >Dead cards<input
          value={labState.dead}
          oninput={(e) => update({ dead: e.currentTarget.value })}
        /></label
      ><label
        >Paint weight<input
          type="number"
          min="1"
          max="100"
          value={paint}
          oninput={(e) =>
            setPaint(
              Math.max(1, Math.min(100, Number(e.currentTarget.value) || 1)),
            )}
        /></label
      >
    </div>
    <div class="tool-actions">
      {#each ['all', 'pairs', 'tight', 'polarized'] as const as p (p)}<button
          onclick={() => update({ weights: presetRange(p) })}>{p} preset</button
        >{/each}<button onclick={() => update({ weights: {} })}
        >Clear range</button
      >
    </div>
    <RangeGrid
      weights={labState.weights}
      {paint}
      onChange={(weights) => update({ weights })}
      known={validation ? [] : [...board, ...dead]}
      equities={Object.fromEntries(
        Object.entries(cells).map(([k, c]) => [
          k,
          c.result.players[0].equity.value,
        ]),
      )}
    ></RangeGrid>{#if counts}<p>
        {counts.after} opponent combos remain from {counts.before}; {counts.removed}
        removed by hero, board, and dead cards. Remaining relative weight: {counts.weight}.
      </p>{/if}{#if validation}<p role="alert">{validation}</p>{/if}
  </section>
  <section class="panel">
    <h2>Specific hand versus this range</h2>
    <p>
      Seed: <code>{labState.seed}</code>. Copy this address to reproduce cards,
      weights, and seed.
    </p>
    {#if !validation}<EquityExperiment
        input={{
          players: [hero, gridRange(labState.weights)],
          board,
          dead,
          seed: labState.seed,
          samples: 10000,
          method: 'auto',
        }}
      ></EquityExperiment>{/if}
  </section>
  <section class="panel">
    <h2>Equity heatmap and distribution across hand classes</h2>
    <p>
      Here each grid cell is the hero range for that class, with the board and
      dead cards removed. The specific hero cards above do not restrict this
      experiment. Each cell reports 1,000 samples; individual intervals are not
      a simultaneous guarantee over the whole grid.
    </p>
    <label
      >Heatmap opponent<select
        value={labState.versus}
        onchange={(e) =>
          update({ versus: e.currentTarget.value as 'random' | 'range' })}
        ><option value="random">Random available hand</option><option
          value="range">Selected weighted range</option
        ></select
      ></label
    ><button disabled={running || !!validation} onclick={heatmap}
      >Simulate 13 × 13 heatmap</button
    >{#if running}<button
        onclick={() => {
          worker?.terminate();
          worker = null;
          setRunning(false);
        }}>Cancel heatmap</button
      >{/if}
    <p role="status">
      {Object.keys(cells).length} classes evaluated{running
        ? ' · running'
        : ''}.
    </p>
    {#if error}<p role="alert">{error}</p>{/if}<label
      >Inspect a computed cell<select
        value={inspect}
        onchange={(e) => setInspect(e.currentTarget.value)}
        >{#each [...new Set([inspect, ...Object.keys(cells)])] as k (k)}<option
            >{k}</option
          >{/each}</select
      ></label
    >{#if selected}<p>{inspect} · {selected.result.samples} samples</p>
      <Probability
        label="CELL EQUITY"
        value={selected.result.players[0].equity}
        sampled
      ></Probability>{#if selected.reference}<p>
          Exact reference {percent(selected.reference.players[0].equity.value)} ·
          gap {percent(
            selected.result.players[0].equity.value -
              selected.reference.players[0].equity.value,
          )}.
        </p>{/if}{/if}<Histogram
      label="Distribution of class-average equities (one count per class)"
      items={Object.values(cells).map((c) => ({
        value: Math.round(100 * c.result.players[0].equity.value),
        count: 1,
      }))}
    ></Histogram>
    <p>
      This histogram weights classes equally to show their spread. It is not a
      range-equity average: that requires the physical-combo weights, with
      incompatible joint hands removed. Suit-specific variation inside a class
      is averaged within its cell.
    </p>
    {#if skipped.length > 0}<details>
        <summary>Classes that could not be sampled</summary
        >{#each skipped as s (s)}<p>{s}</p>{/each}
      </details>{/if}
    <details>
      <summary>Every computed class and its uncertainty</summary
      >{#each Object.values(cells) as c (c.label)}<p>
          {c.label}: {percent(c.result.players[0].equity.value)} · {c.result
            .samples} samples · {learningFacts.confidence().display().percent} CI
          [{c.result.players[0].equity.interval
            .map((x) => percent(x))
            .join(', ')}]
        </p>{/each}
    </details>
  </section>
  <details>
    <summary>Why weights, range advantage, and nut advantage differ</summary>
    <p>
      Weights are relative frequencies per physical combo. Card removal happens
      before normalizing. Jointly sampled overlapping ranges reject the entire
      colliding assignment. The distribution across cells shows variation in
      hand strength; a larger average equity is range advantage, while more of
      the very strongest hands is nut advantage. One does not imply the other. A
      polarized range combines strong value hands and weak bluffs; a merged
      range includes many medium-strength hands.
    </p>
    <a href="#/learn/18-1">Combos and blockers</a> ·
    <a href="#/learn/18-2">Range and nut advantage</a>
  </details>
  <a href="#/lab">Back to Equity Lab</a>
</main>
