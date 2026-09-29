<script lang="ts">
  import DataStripe from '../../decor/DataStripe.svelte';
  import { advancedFacts } from '../../content/facts';
  import {
    decisionProblems,
    callSolution,
    calibration,
    type DrillMode,
    type Forecast,
  } from '../../engine/decisionDrills';
  import { brier } from '../../engine/stats';
  import { gridRange } from '../../engine/rangeGrid';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  import Probability from '../../ui/Probability.svelte';
  import { exactValue, percent } from '../../ui/Probability';
  import SeriesChart from '../../ui/SeriesChart.svelte';
  import { readForecasts, saveForecasts } from './forecastStorage';
  import type { GuessResponse } from '../../workers/drill.worker';
  import { untrack } from 'svelte';

  let { mode, seed }: { mode: DrillMode; seed: string } = $props();
  let questions = $state.raw((() => decisionProblems(seed))());
  let index = $state.raw(0);
  let guess = $state.raw('50');
  let answer = $state.raw('');
  let result = $state.raw<GuessResponse | null>(null);
  let pending = $state.raw(false);
  let records = $state.raw<Forecast[]>([]);
  let all = $state.raw(readForecasts());
  let error = $state.raw('');
  let timed = $state.raw(false);
  let paused = $state.raw(false);
  let elapsed = $state.raw(0);
  let worker: Worker | null | null = null;
  let start = performance.now();
  let base = 0;
  let locked = false;
  let q = $derived(questions[index]);
  let done = $derived(records.length === 5);
  let graded = $derived(records.length > index);
  let solution = $derived(callSolution(q));
  $effect(() => {
    const dependencies = {};
    void dependencies;
    return untrack(() => {
      return () => worker?.terminate();
    });
  });
  let expire = () => {};
  $effect(() => {
    const dependencies = {
      d0: timed,
      d1: paused,
      d2: graded,
      d3: pending,
      d4: index,
    };
    void dependencies;
    return untrack(() => {
      const timed = dependencies.d0;
      const paused = dependencies.d1;
      const graded = dependencies.d2;
      const pending = dependencies.d3;
      if (!timed || paused || graded || pending) return;
      const timer = setInterval(() => {
        const ms = base + performance.now() - start;
        setElapsed(ms);
        if (ms >= 20000) expire();
      }, 100);
      return () => clearInterval(timer);
    });
  });
  function record(
    prediction: number,
    truth: number,
    outcome: number,
    correct: boolean,
  ) {
    const next = [
      ...records,
      {
        id: `${mode}:${seed}:${index}`,
        mode,
        date: new Date().toISOString(),
        prediction,
        truth,
        outcome,
        correct,
      },
    ];
    setRecords(next);
    if (next.length === 5)
      try {
        setAll(saveForecasts(all, next));
      } catch {
        setError(
          'Completed results could not be saved; this visit still shows them.',
        );
      }
  }
  function submit(choice?: boolean, expired = false) {
    if (locked || paused) return;
    locked = true;
    const late =
      expired || (timed && base + performance.now() - start >= 20000);
    if (mode === 'call') {
      record(
        choice ? 1 : 0,
        Number(solution.call),
        Number(solution.call),
        !late && (solution.ev.numerator === 0n || choice === solution.call),
      );
      return;
    }
    if (mode === 'combo') {
      record(
        0,
        0,
        0,
        !late && Number(answer) === q.combos && /^\d+$/.test(answer),
      );
      return;
    }
    setPending(true);
    const w = new Worker(
      new URL('../../workers/drill.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = w;
    w.onmessage = (e: MessageEvent<GuessResponse>) => {
      if (worker !== w) return;
      setResult(e.data);
      setPending(false);
      if (e.data.type === 'result') {
        const truth = e.data.equity.players[0].equity.value;
        record(
          Number(guess) / 100,
          truth,
          e.data.outcome,
          !late &&
            Math.abs(Number(guess) / 100 - truth) <=
              advancedFacts.forecastTolerance().toNumber(),
        );
      } else {
        setError(e.data.message);
        locked = false;
      }
      w.terminate();
    };
    w.onerror = () => {
      setPending(false);
      setError('Worker failed. Retry this question.');
      locked = false;
    };
    w.postMessage({ hand: q.hand, opponent: q.opponent, board: q.board, seed });
  }
  expire = () => submit(undefined, true);
  function next() {
    locked = false;
    setIndex(index + 1);
    setResult(null);
    setAnswer('');
    setGuess('50');
    base = 0;
    start = performance.now();
    setElapsed(0);
    setPaused(false);
  }
  let forecasts = $derived(
    [...all, ...records.filter((r) => !all.some((a) => a.id === r.id))].filter(
      (r) => r.mode === 'guess',
    ),
  );
  let bins = $derived(calibration(forecasts));
  function setIndex(
    value: typeof index | ((previous: typeof index) => typeof index),
  ) {
    index = typeof value === 'function' ? value(index) : value;
  }
  function setGuess(
    value: typeof guess | ((previous: typeof guess) => typeof guess),
  ) {
    guess = typeof value === 'function' ? value(guess) : value;
  }
  function setAnswer(
    value: typeof answer | ((previous: typeof answer) => typeof answer),
  ) {
    answer = typeof value === 'function' ? value(answer) : value;
  }
  function setResult(
    value: typeof result | ((previous: typeof result) => typeof result),
  ) {
    result = typeof value === 'function' ? value(result) : value;
  }
  function setPending(
    value: typeof pending | ((previous: typeof pending) => typeof pending),
  ) {
    pending = typeof value === 'function' ? value(pending) : value;
  }
  function setRecords(
    value: typeof records | ((previous: typeof records) => typeof records),
  ) {
    records = typeof value === 'function' ? value(records) : value;
  }
  function setAll(value: typeof all | ((previous: typeof all) => typeof all)) {
    all = typeof value === 'function' ? value(all) : value;
  }
  function setError(
    value: typeof error | ((previous: typeof error) => typeof error),
  ) {
    error = typeof value === 'function' ? value(error) : value;
  }
  function setTimed(
    value: typeof timed | ((previous: typeof timed) => typeof timed),
  ) {
    timed = typeof value === 'function' ? value(timed) : value;
  }
  function setPaused(
    value: typeof paused | ((previous: typeof paused) => typeof paused),
  ) {
    paused = typeof value === 'function' ? value(paused) : value;
  }
  function setElapsed(
    value: typeof elapsed | ((previous: typeof elapsed) => typeof elapsed),
  ) {
    elapsed = typeof value === 'function' ? value(elapsed) : value;
  }
</script>

<section class="panel">
  <label
    ><input
      type="checkbox"
      checked={timed}
      disabled={graded || pending}
      onchange={(e) => {
        setTimed(e.currentTarget.checked);
        base = 0;
        start = performance.now();
        setElapsed(0);
        setPaused(false);
      }}
    /> 20-second speed drill (optional)</label
  >{#if timed && !graded}<p aria-live="off">
      {Math.max(0, 20 - Math.floor(elapsed / 1000))} seconds remaining{paused
        ? ' · paused'
        : ''}
    </p>
    <button
      onclick={() => {
        if (paused) start = performance.now();
        else base += performance.now() - start;
        setPaused(!paused);
      }}>{paused ? 'Resume' : 'Pause'}</button
    >{/if}
  <DataStripe value={index + 1} total={5} />
  <h2>Question {index + 1} of 5</h2>
  {#if mode === 'call'}<p>
      Pot including the bet: {q.pot} chips. Call: {q.call}. Rake deducted from
      the final pot: {q.rake}. Treat the supplied equity as exact and assume no
      future betting.
    </p>
    <Probability
      label="SUPPLIED EQUITY"
      value={exactValue(q.equity)}
      sampled={false}
    ></Probability>
    <div class="tool-actions">
      <button disabled={graded || paused} onclick={() => submit(true)}
        >Call</button
      ><button disabled={graded || paused} onclick={() => submit(false)}
        >Fold</button
      >
    </div>{:else}<p>Your cards</p>
    <PlayingCards cards={q.hand}></PlayingCards>
    <p>Board</p>
    <PlayingCards cards={q.board}></PlayingCards>{#if mode === 'guess'}<p>
        Exposed opponent
      </p>
      <PlayingCards cards={q.opponent}></PlayingCards><label
        >Estimated equity: {guess}%<input
          aria-label="Estimated equity"
          type="range"
          min="0"
          max="100"
          value={guess}
          disabled={graded || pending || paused}
          oninput={(e) => setGuess(e.currentTarget.value)}
        /></label
      >{:else}<p>
        How many physical {q.className} combos remain after removing your cards and
        the board? The opponent's cards are unknown.
      </p>
      <label
        >Combo count<input
          inputmode="numeric"
          value={answer}
          disabled={graded || paused}
          oninput={(e) => setAnswer(e.currentTarget.value)}
        /></label
      >{/if}<button
      disabled={graded ||
        pending ||
        paused ||
        (mode === 'combo' && !/^\d+$/.test(answer))}
      onclick={() => submit()}>Check answer</button
    >{/if}{#if pending}<p role="status">
      Enumerating every river…
    </p>{/if}{#if error}<p role="alert">{error}</p>{/if}{#if graded}<div>
      <h3 aria-live="polite">
        {records[index].correct ? 'Correct' : 'Review the calculation'}
      </h3>
      {#if mode === 'call'}<p>
          EV(call) = equity × (pot + call − rake) − call = {q.equity.toString()}
          × ({q.pot} + {q.call} − {q.rake}) − {q.call} = {solution.ev.toString()}
          chips. EV(fold) = 0. {solution.ev.numerator === 0n
            ? 'Both choices break even.'
            : solution.call
              ? 'Call has the higher direct EV.'
              : 'Fold has the higher direct EV.'}
        </p>
        <Probability
          label="RAKE-ADJUSTED BREAK-EVEN"
          value={exactValue(solution.threshold)}
          sampled={false}
        ></Probability>{:else}{#if mode === 'combo'}<p>
            {q.className}: {q.combos} remaining combos. List each pair of physical
            cards once, then remove every pair containing a shown card.
          </p>
          {#each gridRange( { [q.className]: 100 }, [...q.hand, ...q.board] ).combos as c (c.hand.join('-'))}<PlayingCards
              cards={c.hand}
            ></PlayingCards>{/each}{:else}{#if result?.type === 'result'}<p>
              Exact enumeration · {result.equity.samples} river cards.
            </p>
            <Probability
              label="TRUE EQUITY"
              value={result.equity.players[0].equity}
              sampled={false}
            ></Probability>
            <p>
              Your estimate {percent(Number(guess) / 100)}. Squared error
              against exact equity: {(
                (Number(guess) / 100 - result.equity.players[0].equity.value) **
                2
              ).toFixed(5)}. Brier score against the sampled pot-unit outcome: {brier(
                [Number(guess) / 100],
                [result.outcome],
              ).toFixed(5)}.
            </p>
            <PlayingCards cards={[result.river]}></PlayingCards>
            <p>
              The sampled outcome is {result.outcome}. On a tie, a seeded coin
              assigns one randomly selected pot unit, making its win chance
              equal to equity. This keeps the Brier outcome binary. One outcome
              is noisy; calibration needs many forecasts.
            </p>{/if}{/if}{/if}<a
        href={'#' +
          (mode === 'call'
            ? '/learn/12-2'
            : mode === 'guess'
              ? '/learn/16-2'
              : '/learn/18-1')}>Read the worked lesson</a
      >{#if !done}<button onclick={next}>Next question</button>{/if}
    </div>{/if}{#if done}<p role="status">
      Set complete: {records.filter((r) => r.correct).length} / 5. Results saved once
      per seed; replay does not duplicate XP or calibration records.
    </p>{/if}
</section>
{#if mode === 'guess'}<section class="panel">
    <h2>Forecast calibration over time</h2>
    <p>
      {forecasts.length} forecasts. Mean Brier score: {forecasts.length
        ? brier(
            forecasts.map((f) => f.prediction),
            forecasts.map((f) => f.outcome),
          ).toFixed(5)
        : '—'}. Smaller is better. A forecast within five percentage points of
      exact equity earns drill XP.
    </p>
    <SeriesChart
      label="Prediction bins versus realized pot-unit outcomes"
      series={[
        {
          name: 'Mean prediction',
          values: bins.filter((b) => b.count).map((b) => b.predicted),
        },
        {
          name: 'Observed frequency',
          values: bins.filter((b) => b.count).map((b) => b.observed),
        },
      ]}
    ></SeriesChart>{#each bins as b (b.low)}<p>
        {percent(b.low)}–{percent(b.high)}: {b.count} predictions; observed {b.count
          ? percent(b.observed)
          : '—'}.
      </p>{/each}<SeriesChart
      label="Brier score in chronological forecast order"
      series={[
        {
          name: 'Brier',
          values: forecasts.map((f) => (f.prediction - f.outcome) ** 2),
        },
      ]}
    ></SeriesChart>
  </section>{/if}
