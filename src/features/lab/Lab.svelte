<script lang="ts">
  import {
    deck,
    parseCards,
    type Card as CardValue,
    type Hand,
  } from '../../engine/cards';
  import {
    planEquity,
    type EquityInput,
    type EquityResult,
    type Method,
  } from '../../engine/equity';
  import { Rng, shuffle } from '../../engine/rng';
  import { evaluateReference } from '../../engine/evaluator';
  import Card from '../../ui/Card.svelte';
  import SeedInput from '../../ui/SeedInput.svelte';
  import CardPicker from '../../ui/CardPicker.svelte';
  import ConvergenceChart from '../../ui/ConvergenceChart.svelte';
  import Probability from '../../ui/Probability.svelte';
  import { percent } from '../../ui/Probability';
  import type { WorkerResponse } from '../../workers/protocol';
  import { decodeState, newSeed, type LabState } from './state';
  import styles from './Lab.module.css';
  import { navigation, setParams } from '../../navigation.svelte';
  import { untrack } from 'svelte';
  type Target = {
    group: 'player' | 'board' | 'dead';
    player: number;
    index: number;
    label: string;
  };

  let params = $derived(new URLSearchParams(navigation.search));
  let fallback = $state.raw<LabState>(
    (() => ({
      players: [parseCards('As Ah'), parseCards('Ks Kh')],
      board: [],
      dead: [],
      seed: newSeed(),
      samples: 10000,
      method: 'monteCarlo',
    }))(),
  );
  $effect(() => {
    const dependencies = { d0: params, d1: setParams, d2: fallback };
    void dependencies;
    return untrack(() => {
      const params = dependencies.d0;
      const setParams = dependencies.d1;
      const fallback = dependencies.d2;
      if (!params.has('state')) {
        setParams({ state: JSON.stringify(fallback) }, { replace: true });
      }
    });
  });
  let decoded = $derived.by(() => decodeState(params.get('state'), fallback));
  let labState = $derived(decoded.state);
  let target = $state.raw<Target | null>(null);
  let result = $state.raw<EquityResult | null>(null);
  let reference = $state.raw<EquityResult | null>(null);
  let history = $state.raw<EquityResult[]>([]);
  let running = $state.raw(false);
  let error = $state.raw('');
  let notice = $state.raw('');
  let worker: Worker | null | null = null;
  const start = (input: EquityInput) => {
    worker?.terminate();
    setRunning(true);
    setError('');
    setNotice('');
    setHistory([]);
    setResult(null);
    setReference(null);
    const current = new Worker(
      new URL('../../workers/equity.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = current;
    current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (worker !== current) return;
      const message = event.data;
      if (message.type === 'error') {
        setError(message.message);
        setRunning(false);
        current.terminate();
        return;
      }
      if (message.type === 'reference') {
        setReference(message.result);
        return;
      }
      setResult(message.result);
      if (message.result.method === 'monteCarlo')
        setHistory((h) => [...h, ...(message.trace ?? [message.result])]);
      if (message.type === 'result') {
        setRunning(false);
        current.terminate();
      }
    };
    current.onerror = () => {
      if (worker === current) {
        setError('The worker stopped unexpectedly. Try a smaller run.');
        setRunning(false);
        current.terminate();
      }
    };
    current.postMessage({ type: 'run', input });
  };
  let configKey = $derived(JSON.stringify(labState));
  $effect(() => {
    const dependencies = { d0: configKey };
    void dependencies;
    return untrack(() => {
      setResult(null);
      setReference(null);
      setHistory([]);
      setError('');
      setNotice('');
      setRunning(false);
      worker?.terminate();
      worker = null;
    });
  });
  $effect(() => {
    const dependencies = {};
    void dependencies;
    return untrack(() => {
      return () => worker?.terminate();
    });
  });
  function update(next: LabState) {
    worker?.terminate();
    worker = null;
    setRunning(false);
    setParams({ state: JSON.stringify(next) }, { replace: true });
  }
  let prepared = $derived.by(() => {
    try {
      if (labState.players.some((p) => p !== 'random' && p.length !== 2))
        throw new Error('Choose two cards for each specific hand.');
      const input: EquityInput = {
        ...labState,
        players: labState.players.map((p) =>
          p === 'random' ? 'random' : ([p[0], p[1]] as Hand),
        ),
      };
      return { input, plan: planEquity(input), error: '' };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid setup.' };
    }
  });
  let used = $derived([
    ...labState.players.flatMap((p) => (p === 'random' ? [] : p)),
    ...labState.board,
    ...labState.dead,
  ]);
  function pick(card: CardValue | undefined) {
    if (!target) return;
    const next = structuredClone(labState);
    const cards =
      target.group === 'player'
        ? next.players[target.player]
        : next[target.group];
    if (cards === 'random') return;
    if (card === undefined) cards.splice(target.index, 1);
    else cards[target.index] = card;
    update(next);
    setTarget(null);
  }
  function run(method: Method, samples = labState.samples) {
    if (!prepared.input) return;
    // Save the chosen run before starting; the URL effect clears only the previous worker.
    const next = { ...labState, method, samples };
    if (JSON.stringify(next) !== configKey) {
      setParams({ state: JSON.stringify(next) }, { replace: true });
      pending = { ...prepared.input, method, samples };
      return;
    }
    start({ ...prepared.input, method, samples });
  }
  let pending: EquityInput | null | null = null;
  $effect(() => {
    const dependencies = { d0: configKey, d1: start };
    void dependencies;
    return untrack(() => {
      const start = dependencies.d1;
      if (pending) {
        const input = pending;
        pending = null;
        start(input);
      }
    });
  });
  function cancel() {
    worker?.terminate();
    worker = null;
    setRunning(false);
    setNotice('Run cancelled. The last completed batch is shown.');
  }
  function deal() {
    const seed = newSeed(),
      cards = shuffle(
        deck().filter((c) => !labState.dead.includes(c)),
        new Rng(seed),
      );
    let cursor = 0;
    const needed =
      labState.players.filter((p) => p !== 'random').length * 2 +
      labState.board.length;
    if (cards.length < needed) {
      setError('Clear some dead cards before dealing.');
      return;
    }
    update({
      ...labState,
      seed,
      players: labState.players.map((p) =>
        p === 'random' ? 'random' : [cards[cursor++], cards[cursor++]],
      ),
      board: labState.board.map(() => cards[cursor++]),
    });
  }
  async function share() {
    const url = new URL(window.location.href);
    url.hash = `/lab?${new URLSearchParams({ state: JSON.stringify(labState) })}`;
    try {
      await navigator.clipboard.writeText(url.href);
      setNotice(
        'Link copied. It includes cards, seed, method, and sample count.',
      );
    } catch {
      setNotice('Copy the address from your browser to share this setup.');
      setParams({ state: JSON.stringify(labState) }, { replace: true });
    }
  }
  let exact = $derived(
    reference ??
      (result?.method === 'exact' && result.complete ? result : null),
  );
  function setTarget(
    value: typeof target | ((previous: typeof target) => typeof target),
  ) {
    target = typeof value === 'function' ? value(target) : value;
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
  function setHistory(
    value: typeof history | ((previous: typeof history) => typeof history),
  ) {
    history = typeof value === 'function' ? value(history) : value;
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
  function setNotice(
    value: typeof notice | ((previous: typeof notice) => typeof notice),
  ) {
    notice = typeof value === 'function' ? value(notice) : value;
  }
</script>

<main class={styles.lab}>
  <header class={styles.intro}>
    <div>
      <h2>Equity</h2>
      <p>
        Choose the cards. Count every possible finish, or deal thousands of
        boards and watch the answer take shape.
      </p>
    </div>
  </header>
  <div class={styles.workspace}>
    <section class={`panel ${styles.setup}`} aria-labelledby="setup-title">
      <div class="section-head">
        <h2 id="setup-title">The setup</h2>
        <button class="text-button" onclick={deal}>Deal random</button>
      </div>
      <div class={styles.hands}>
        {#each labState.players as hand, p (p)}<div class={styles.hand}>
            <div class="section-head">
              <label class="field-label" for={`player-${p}`}
                >{p === 0 ? 'YOUR HAND' : `OPPONENT ${p}`}</label
              >{#if p > 0}<select
                  id={`player-${p}`}
                  aria-label={`Opponent ${p} hand type`}
                  value={hand === 'random' ? 'random' : 'specific'}
                  onchange={(e) => {
                    const players = [...labState.players];
                    players[p] =
                      e.currentTarget.value === 'random' ? 'random' : [];
                    update({ ...labState, players });
                  }}
                  ><option value="specific">Specific</option><option
                    value="random">Random</option
                  ></select
                >{/if}
            </div>
            <div class={styles.cardRow}>
              {#if hand === 'random'}<div class={styles.randomHand}>
                  <span>?</span>
                  <p>Any available<br />two cards</p>
                </div>{:else}{#each [0, 1] as i (`${i}-${hand[i]}`)}<Card
                    card={hand[i]}
                    label={`${p === 0 ? 'Your hand' : `Opponent ${p}`} card ${i + 1}`}
                    onClick={() =>
                      setTarget({
                        group: 'player',
                        player: p,
                        index: Math.min(i, hand.length),
                        label: p === 0 ? 'Your hand' : `Opponent ${p}`,
                      })}
                  ></Card>{/each}{/if}
            </div>
            {#if p > 1}<button
                class="text-button"
                onclick={() =>
                  update({
                    ...labState,
                    players: labState.players.filter((_, i) => i !== p),
                  })}>Remove opponent {p}</button
              >{/if}
          </div>{/each}
      </div>
      <button
        class="secondary"
        disabled={labState.players.length >= 9}
        onclick={() =>
          update({ ...labState, players: [...labState.players, 'random'] })}
        >+ Add opponent</button
      >
      <div class={styles.board}>
        <div class="section-head">
          <h3>Community cards</h3>
          <span class="muted">{labState.board.length} / 5</span>
        </div>
        <div class={styles.cardRow}>
          {#each Array.from({ length: 5 }, (_, index) => index) as i (`${i}-${labState.board[i]}`)}<Card
              card={labState.board[i]}
              label={`Board card ${i + 1}`}
              onClick={() =>
                setTarget({
                  group: 'board',
                  player: 0,
                  index: Math.min(i, labState.board.length),
                  label: 'Community card',
                })}
            ></Card>{/each}
        </div>
        <p class="hint">Leave cards open to explore possible runouts.</p>
      </div>
      <details>
        <summary
          >Dead cards <span class="muted">({labState.dead.length})</span
          ></summary
        >
        <p class="hint">Known cards that cannot be dealt.</p>
        <div class={`${styles.cardRow} ${styles.deadCards}`}>
          {#each labState.dead as c, i (c)}<Card
              card={c}
              label={`Dead card ${i + 1}`}
              onClick={() =>
                setTarget({
                  group: 'dead',
                  player: 0,
                  index: i,
                  label: 'Dead card',
                })}
            ></Card>{/each}<button
            class="secondary"
            onclick={() =>
              setTarget({
                group: 'dead',
                player: 0,
                index: labState.dead.length,
                label: 'Add dead card',
              })}>+ Add</button
          >
        </div>
      </details>
      <div class={styles.seed}>
        <label for="seed">Deal seed</label>{#key labState.seed}<SeedInput
            seed={labState.seed}
            onCommit={(seed) => update({ ...labState, seed })}
          ></SeedInput>{/key}<button
          class="text-button"
          onclick={() => update({ ...labState, seed: newSeed() })}
          >New seed</button
        >
      </div>
      <div class={styles.controls}>
        <button
          class="primary"
          disabled={running || !prepared.plan?.exactFeasible}
          onclick={() => run('exact')}>Count exact</button
        ><button
          class="secondary"
          disabled={running || !prepared.input}
          onclick={() => run('auto')}>Auto</button
        >
      </div>
      <p class="hint">
        {prepared.error ||
          (prepared.plan?.exactFeasible
            ? `${prepared.plan.assignments.toLocaleString()} possible deals. Exact counting is available.`
            : `${prepared.plan?.assignments.toLocaleString()} possible deals. Exact is disabled above the interactive work budget; use simulation.`)}
      </p>
      <div class={styles.simButtons}>
        {#each [1000, 10000, 100000, 1000000] as n (n)}<button
            disabled={running || !prepared.input}
            onclick={() => run('monteCarlo', n)}
            >{n === 1000000 ? '1M' : `${n / 1000}k`}</button
          >{/each}
      </div>
      {#if running}<button class="cancel" onclick={cancel}>Cancel run</button
        >{/if}<button class="text-button" onclick={share}
        >Copy reproducible link ↗</button
      >
    </section>
    <section class={styles.results} aria-labelledby="results-title">
      <div class={`panel ${styles.resultPanel}`}>
        <div class="section-head">
          <h2 id="results-title">Your share of the pot</h2>
          <span class={styles.liveDot}
            >{running
              ? 'RUNNING'
              : result?.complete
                ? 'COMPLETE'
                : result
                  ? 'STOPPED'
                  : 'READY'}</span
          >
        </div>
        {#if error || decoded.error}<p role="alert" class="error">
            {error || decoded.error}
          </p>{/if}
        <div role="status" aria-live="polite">
          {#if notice}<p class="hint">{notice}</p>{/if}{#if running}<p
              class="hint"
            >
              {result
                ? `${result.samples.toLocaleString()} / ${result.total.toLocaleString()} deals evaluated`
                : 'Preparing the experiment…'}
            </p>{/if}
        </div>
        {#if result && (result.method === 'monteCarlo' || result.complete)}<p
            class="method"
          >
            {result.method === 'exact'
              ? result.complete
                ? 'Exact enumeration'
                : 'Exact enumeration in progress'
              : 'Monte Carlo estimate'} · {result.samples.toLocaleString()}
            {result.method === 'exact' ? 'deals' : 'samples'}
          </p>
          {#if !result.complete && !running}<p class="hint">
              Partial result. Start a new run to finish.
            </p>{/if}
          <div class={styles.heroEquity}>
            <Probability
              label="EQUITY"
              value={result.players[0].equity}
              sampled={result.method === 'monteCarlo' || !result.complete}
            ></Probability>
          </div>
          <div class={styles.outcomes}>
            {#each ['win', 'tie', 'loss'] as const as key (key)}<Probability
                label={key === 'loss' ? 'LOSE' : key.toUpperCase()}
                value={result.players[0][key]}
                sampled={result.method === 'monteCarlo' || !result.complete}
              ></Probability>{/each}
          </div>
          {#if result.method === 'monteCarlo'}<p class="hint">
              Fractions describe this sample. Intervals estimate uncertainty in
              the underlying probabilities. Equity uses an approximate normal
              mean-share interval with a boundary safeguard; win/tie/lose use
              Wilson intervals.
            </p>{/if}{#if exact && result.method === 'monteCarlo'}<p
              class={styles.comparison}
            >
              Exact equity <strong
                >{percent(exact.players[0].equity.value)}</strong
              >
              · gap
              <strong
                >{(
                  (result.players[0].equity.value -
                    exact.players[0].equity.value) *
                  100
                ).toFixed(3)} percentage points</strong
              >
            </p>{/if}{#if result.method === 'monteCarlo' && !exact}<p
              class="hint"
            >
              An exact reference is not computed for this setup because
              enumeration exceeds the interactive budget. Add board cards to
              reduce the work.
            </p>{/if}{#if result.players.length > 1}<details>
              <summary>All players</summary>
              <div class={styles.allPlayers}>
                {#each result.players.slice(1) as p, i (i)}<div>
                    <h3>Opponent {i + 1}</h3>
                    <div class={styles.opponentValues}>
                      {#each ['equity', 'win', 'tie', 'loss'] as const as key (key)}<Probability
                          label={key}
                          value={p[key]}
                          sampled={result.method === 'monteCarlo' ||
                            !result.complete}
                        ></Probability>{/each}
                    </div>
                  </div>{/each}
              </div>
            </details>{/if}{:else}<div class={styles.emptyResult}>
            <div class={styles.emptyNumber}>—<span>%</span></div>
            <h3>How much of the pot is yours?</h3>
            <p>
              Equity counts wins and your share of ties. Pick a run size to find
              out.
            </p>
            <div class={styles.emptyMetrics}>
              <span>WIN <b>—</b></span><span>TIE <b>—</b></span><span
                >LOSE <b>—</b></span
              >
            </div>
          </div>{/if}
        <details class={styles.why}>
          <summary>Why is this the equity?</summary>
          <p>
            For each deal, compare every player's best five cards. A sole winner
            receives the whole pot. Tied winners split it equally. Add your
            shares and divide by the number of deals.
          </p>
          <p>
            Exact counting visits every legal assignment once. Simulation
            samples legal assignments with a seeded Fisher–Yates draw. Known
            hole cards, community cards, and dead cards are removed first. The
            engine keeps fractional pot shares exactly, including multiway ties.
          </p>
          <a href="#/learn">Equity and expected value · chapter 12, Phase 5</a>
        </details>
      </div>
      <div class={`panel ${styles.chartPanel}`}>
        <div class="section-head"><h2>Watch it converge</h2></div>
        <ConvergenceChart {history} exact={exact?.players[0].equity.value}
        ></ConvergenceChart>
      </div>
      {#if labState.board.length >= 3 && labState.players[0] !== 'random' && labState.players[0].length === 2}<div
          class="panel"
        >
          <h3>
            {evaluateReference([...labState.players[0], ...labState.board])
              .name}
          </h3>
          <p class="hint">
            The strongest five-card hand you can make with the cards currently
            shown.
          </p>
        </div>{/if}
      <p class={styles.footnote}>
        A probability is a statement about possible outcomes. A single deal can
        still go either way.
      </p>
    </section>
  </div>
  {#if target}<CardPicker
      {used}
      label={target.label}
      onPick={pick}
      onClose={() => setTarget(null)}
    ></CardPicker>{/if}
</main>
