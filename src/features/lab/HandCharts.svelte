<script lang="ts">
  import { onMount } from 'svelte';
  import {
    chartClasses,
    handClassFacts,
    shoveScenario,
    type HandChartCell,
    type HandChartSettings,
    type CallingRange,
  } from '../../content/handChartFacts';
  import { formatPercent } from '../../engine/math';
  import type { HandChartResponse } from '../../workers/handCharts.worker';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  let mode = $state<'equity' | 'shove'>(
    new URLSearchParams(location.hash.split('?')[1]).get('mode') === 'shove'
      ? 'shove'
      : 'equity',
  );
  let opponents = $state(1),
    stackBB = $state(10),
    callingRange = $state<CallingRange>('broad'),
    samples = $state(1000);
  let seed = $state('0123456789abcdef0123456789abcdef');
  let cells = $state<Record<string, HandChartCell>>({});
  let selected = $state('AA'),
    running = $state(false),
    error = $state('');
  let worker: Worker | undefined;
  const detail = $derived(handClassFacts(selected));
  const cell = $derived(cells[selected]);
  const scenario = $derived(shoveScenario(selected, stackBB, callingRange));
  const finished = $derived(Object.keys(cells).length);
  const resources = [
    [
      'Rules, hand rankings & position',
      '/learn/0-2',
      'Compare hands and understand the button.',
    ],
    [
      'Probability & odds',
      '/learn/1-2',
      'Read percentages, fractions, and odds.',
    ],
    [
      'Starting-hand combinations',
      '/learn/3-1',
      'Understand pairs, suited hands, and offsuit hands.',
    ],
    ['Equity calculator', '/lab', 'Compare specific cards and boards.'],
    ['Range editor', '/lab/ranges', 'Build a range and inspect blockers.'],
    ['Outs & draws', '/learn/8-1', 'Count cards that complete a draw.'],
    [
      'Pot odds & expected value',
      '/learn/12-2',
      'Work out the price of a call.',
    ],
    [
      'Fold equity & bluffing',
      '/learn/22-1',
      'See how folds change a bet’s value.',
    ],
    [
      'Push/fold calculator',
      '/lab/tools/push',
      'Change the pot, risk, and response assumptions.',
    ],
    [
      'Tournament stacks & ICM',
      '/lab/tools/icm',
      'Separate chip value from prize value.',
    ],
    [
      'Bankroll & variance',
      '/lab/bankroll',
      'Explore swings across repeated games.',
    ],
    ['Full course', '/learn', 'Follow the chapters in order.'],
  ];
  function stop() {
    worker?.terminate();
    worker = undefined;
    running = false;
  }
  function run() {
    stop();
    cells = {};
    error = '';
    running = true;
    const current = new Worker(
      new URL('../../workers/handCharts.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = current;
    current.onmessage = (event: MessageEvent<HandChartResponse>) => {
      if (worker !== current) return;
      const message = event.data;
      if (message.type === 'cell')
        cells = { ...cells, [message.cell.label]: message.cell };
      else {
        if (message.type === 'error') error = message.message;
        stop();
      }
    };
    current.onerror = () => {
      error = 'The chart worker stopped. Try rebuilding the chart.';
      stop();
    };
    current.postMessage({
      mode,
      opponents,
      stackBB,
      callingRange,
      samples,
      seed,
    } satisfies HandChartSettings);
  }
  function invalidate() {
    stop();
    cells = {};
    error = '';
  }
  onMount(() => {
    run();
    return stop;
  });
</script>

<main class="tool-page hand-charts">
  <h2>Hand charts</h2>
  <p>Find your two cards. Read the numbers. Check the assumptions.</p>
  <div class="chart-mode" role="group" aria-label="Chart type">
    <button
      aria-pressed={mode === 'equity'}
      onclick={() => {
        mode = 'equity';
        run();
      }}>Starting-hand equity</button
    >
    <button
      aria-pressed={mode === 'shove'}
      onclick={() => {
        mode = 'shove';
        run();
      }}>Shove / fold</button
    >
  </div>
  <div class="hand-chart-layout">
    <section aria-label="Starting hand chart">
      <h2>
        {mode === 'equity' ? 'Every starting hand' : 'Small blind open shoves'}
      </h2>
      <p>
        {mode === 'equity'
          ? 'Average share of the pot against random hands, with everyone reaching showdown. This measures hand strength; it is not an instruction to call or raise.'
          : 'Heads-up, small blind first to act. Nobody has raised. Equal starting stacks, no antes or rake. The big blind starts with equally likely physical hands, then folds or calls with the selected range. These are model results, not an EP1 or tournament equilibrium chart.'}
      </p>
      <div class="tool-fields">
        {#if mode === 'equity'}
          <label
            >Opponents<select bind:value={opponents} onchange={invalidate}
              >{#each [1, 2, 3, 4, 5] as n (n)}<option value={n}>{n}</option
                >{/each}</select
            ></label
          >
        {:else}
          <label
            >Effective stack (BB)<select
              bind:value={stackBB}
              onchange={invalidate}
              >{#each [2, 5, 8, 10, 15, 20, 30, 40] as n (n)}<option value={n}
                  >{n}</option
                >{/each}</select
            ></label
          >
          <label
            >Big blind calls with<select
              bind:value={callingRange}
              onchange={invalidate}
              ><option value="broad"
                >Pairs, aces, suited kings & broadways</option
              ><option value="tight">Pairs + two cards J or higher</option
              ><option value="pairs">Pocket pairs only</option><option
                value="all">Every hand</option
              ></select
            ></label
          >
        {/if}
        <label
          >Samples per hand<select bind:value={samples} onchange={invalidate}
            ><option value={1000}>1,000</option><option value={5000}
              >5,000</option
            ></select
          ></label
        >
      </div>
      <div class="chart-actions">
        <button onclick={run} disabled={running}>Build chart</button
        >{#if running}<button onclick={stop}>Cancel chart</button>{/if}
        <p role="status">
          {running
            ? `Calculating ${finished} / ${chartClasses.length} hands`
            : finished === chartClasses.length
              ? 'Chart ready'
              : finished
                ? 'Stopped · partial chart'
                : 'Settings changed · build to refresh'}
        </p>
      </div>
      {#if error}<p role="alert">{error}</p>{/if}
      <p>
        Pairs run down the diagonal. Above it: <strong>s</strong> = same suit.
        Below it: <strong>o</strong> = different suits. <strong>T</strong> means ten.
        Tap a hand for details. On a phone, scroll the grid sideways.
      </p>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to focus and scroll the wide chart.) -->
      <div
        class="hand-matrix-scroll"
        tabindex="0"
        role="region"
        aria-label="Hand matrix; scroll horizontally on a phone"
      >
        <div class="hand-matrix">
          {#each chartClasses as label (label)}
            {@const value = cells[label]}
            <button
              class:chart-shove={mode === 'shove' &&
                value?.decision === 'shove'}
              class:chart-fold={mode === 'shove' && value?.decision === 'fold'}
              class:chart-close={mode === 'shove' &&
                value?.decision === 'close'}
              aria-label={`${label}${value ? (mode === 'equity' ? `, equity ${formatPercent(value.equity)}` : `, ${value.decision}, ${value.ev.toFixed(2)} big blinds`) : ', waiting for calculation'}`}
              aria-pressed={selected === label}
              onclick={() => (selected = label)}
              style:background={mode === 'equity' && value
                ? `color-mix(in srgb, var(--dusk) ${Math.round(value.equity * 100)}%, var(--void))`
                : undefined}
            >
              <span>{label}</span><small
                >{value
                  ? mode === 'equity'
                    ? formatPercent(value.equity, 0)
                    : value.decision
                  : '—'}</small
              >
            </button>
          {/each}
        </div>
      </div>
      {#if mode === 'equity'}<p class="chart-legend">
          Darker → less equity. Lighter → more equity. Ties count toward your
          share.
        </p>
      {:else}<ul class="chart-legend">
          <li class="chart-shove">Shove: estimated gain</li>
          <li class="chart-fold">Fold: estimated loss</li>
          <li class="chart-close">Close: sampling interval crosses zero</li>
        </ul>{/if}
      <details>
        <summary>Reproduce this chart</summary><label
          >Chart seed<input
            bind:value={seed}
            onchange={invalidate}
            spellcheck="false"
          /></label
        >
        <p>
          Use the same mode, settings, sample count, and seed. Each cell uses
          its own deterministic sample. Changing settings clears old results.
        </p>
      </details>
    </section>
    <aside class="hand-chart-detail" aria-label="Selected starting hand">
      <h2>{selected}</h2>
      <PlayingCards cards={[...detail.hand]} />
      <p>{detail.kind} · {detail.combos} physical combinations</p>
      {#if cell}
        {#if mode === 'equity'}
          <h3>Estimated equity</h3>
          <p class="chart-number">{formatPercent(cell.equity)}</p>
          <p>
            Sampling interval: {cell.equityInterval
              .map((v) => formatPercent(v))
              .join(' to ')}.
          </p>
          <p>
            This is your average pot share at showdown against {opponents} random
            {opponents === 1 ? 'opponent' : 'opponents'}. Position, bet sizes,
            folds, and later decisions are not included.
          </p>
        {:else}
          <h3>
            {cell.decision === 'close'
              ? 'Too close for a clear model choice'
              : cell.decision === 'shove'
                ? 'Shove in this model'
                : 'Fold in this model'}
          </h3>
          <p class="chart-number">
            {cell.ev > 0 ? '+' : ''}{cell.ev.toFixed(2)} BB
          </p>
          <p>
            Estimated net chips relative to folding. Sampling interval: {cell.evInterval
              .map((v) => v.toFixed(2))
              .join(' to ')} BB.
          </p>
          <ol>
            <li>Blinds already in: {scenario.pot / scenario.unitsPerBB} BB.</li>
            <li>
              You risk {scenario.risk / scenario.unitsPerBB} more BB. A call adds
              {scenario.call / scenario.unitsPerBB} BB from the opponent.
            </li>
            <li>
              Your cards leave {cell.callingCombos} calling combinations among {scenario.available}
              possible opponent hands.
            </li>
            <li>
              Opponent folds: {formatPercent(cell.foldChance)}. Your equity when
              called: {formatPercent(cell.equity)}.
            </li>
          </ol>
          <p>
            Shove EV = fold chance × pot + call chance × (equity × final pot −
            chips risked).
          </p>
          <p>
            The calling range is an assumption, not a measured opponent
            tendency. Chip EV does not include tournament prizes.
          </p>
        {/if}
      {:else}<p>
          Select a hand, then build the chart to see its calculation.
        </p>{/if}
      <a href="#/learn/7-1">Walk through a starting-hand chart →</a>
      <a href="#/learn/18-1">Understand range-grid colors →</a>
      <a href="#/lab/ranges">Edit a range →</a>
      <a href="#/learn/23-1">Learn the push/fold model →</a>
    </aside>
  </div>
  <section class="chart-resources" aria-label="Poker resource index">
    <h2>Keep these nearby</h2>
    <p>Rules, charts, calculations, and practice in one place.</p>
    {#each resources as [title, href, description] (href)}<a href={`#${href}`}
        ><strong>{title}</strong><span>{description}</span></a
      >{/each}
  </section>
</main>
