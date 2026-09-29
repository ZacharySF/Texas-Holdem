<script lang="ts">
  import { makeOutsRush, scoreOuts, outsSolution } from '../../engine/outsRush';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  import Probability from '../../ui/Probability.svelte';
  import { exactValue } from '../../ui/Probability';
  import styles from './OutsRush.module.css';
  import { untrack } from 'svelte';

  let {
    seed,
    limit,
    onComplete,
  }: {
    seed: string;
    limit: number | null;
    onComplete: (correct: number) => void;
  } = $props();
  let questions = $state.raw((() => makeOutsRush(seed))());
  let index = $state.raw(0);
  let answer = $state.raw('');
  let results = $state.raw<boolean[]>([]);
  let remaining = $state.raw(untrack(() => limit ?? 0));
  let paused = $state.raw(false);
  let submitted = $state.raw(false);
  let started = performance.now();
  let elapsed = 0;
  let locked = false;
  let input: HTMLInputElement | null = $state(null);
  let question = $derived(questions[index]);
  let finished = $derived(results.length === questions.length);
  let solution = $derived(outsSolution(question));
  function submit(expired = false) {
    if (locked || paused || finished) return;
    locked = true;
    const time = elapsed + performance.now() - started;
    const correct = !expired && scoreOuts(question, answer, time, limit);
    const next = [...results, correct];
    setResults(next);
    setSubmitted(true);
    if (next.length === questions.length)
      onComplete(next.filter(Boolean).length);
  }
  let expire = () => {};
  expire = () => submit(true);
  $effect(() => {
    const dependencies = { d0: limit, d1: paused, d2: submitted, d3: index };
    void dependencies;
    return untrack(() => {
      const limit = dependencies.d0;
      const paused = dependencies.d1;
      const submitted = dependencies.d2;
      if (limit === null || paused || submitted) return;
      const timer = window.setInterval(() => {
        const left = Math.max(
          0,
          limit - elapsed - (performance.now() - started),
        );
        setRemaining(left);
        if (left === 0) expire();
      }, 100);
      return () => clearInterval(timer);
    });
  });
  function pause() {
    if (paused) started = performance.now();
    else elapsed += performance.now() - started;
    setPaused(!paused);
  }
  function next() {
    locked = false;
    elapsed = 0;
    started = performance.now();
    setIndex(index + 1);
    setAnswer('');
    setSubmitted(false);
    setRemaining(limit ?? 0);
    setPaused(false);
    setTimeout(() => input?.focus(), 0);
  }
  function setIndex(
    value: typeof index | ((previous: typeof index) => typeof index),
  ) {
    index = typeof value === 'function' ? value(index) : value;
  }
  function setAnswer(
    value: typeof answer | ((previous: typeof answer) => typeof answer),
  ) {
    answer = typeof value === 'function' ? value(answer) : value;
  }
  function setResults(
    value: typeof results | ((previous: typeof results) => typeof results),
  ) {
    results = typeof value === 'function' ? value(results) : value;
  }
  function setRemaining(
    value:
      typeof remaining | ((previous: typeof remaining) => typeof remaining),
  ) {
    remaining = typeof value === 'function' ? value(remaining) : value;
  }
  function setPaused(
    value: typeof paused | ((previous: typeof paused) => typeof paused),
  ) {
    paused = typeof value === 'function' ? value(paused) : value;
  }
  function setSubmitted(
    value:
      typeof submitted | ((previous: typeof submitted) => typeof submitted),
  ) {
    submitted = typeof value === 'function' ? value(submitted) : value;
  }
</script>

<section class={`panel ${styles.round}`}>
  <p class="field-label">QUESTION {index + 1} OF {questions.length}</p>
  <p aria-live="off">
    {limit === null
      ? 'Untimed practice'
      : `Time left: ${Math.ceil(remaining / 1000)} seconds`}{paused
      ? ' · paused'
      : ''}
  </p>
  {#if !submitted && limit !== null}<button onclick={pause}
      >{paused ? 'Resume timer' : 'Pause timer'}</button
    >{/if}
  <h2>{question.label}</h2>
  <p>Your hand</p>
  <PlayingCards cards={question.hand}></PlayingCards>
  <p>Board</p>
  <PlayingCards cards={question.board}></PlayingCards>{#if question.opponent}<p>
      Exposed opponent
    </p>
    <PlayingCards cards={question.opponent}></PlayingCards>{/if}
  <form
    onsubmit={(e) => {
      e.preventDefault();
      submit();
    }}
  >
    <label for="outs-answer">Number of distinct outs</label><input
      bind:this={input}
      id="outs-answer"
      inputmode="numeric"
      autocomplete="off"
      value={answer}
      disabled={submitted || paused}
      oninput={(e) => setAnswer(e.currentTarget.value)}
    /><button disabled={submitted || paused || !/^\d+$/.test(answer.trim())}
      >Check outs</button
    >
  </form>
  <p class="hint">
    Count only the named next-card target. A backdoor requiring two cards is not
    a next-card out. Known opponent cards are removed only when shown.
  </p>
  {#if submitted}<div class={styles.solution}>
      <h3 aria-live="polite">
        {results[index] ? 'Correct' : 'Review the count'} · {solution.count} outs
      </h3>
      <p>
        {question.unseen} cards remain unseen. Test each remaining physical card against
        the target and count it once, even if it completes two draws.
      </p>
      <PlayingCards cards={question.outs} highlight={question.outs}
      ></PlayingCards>{#if solution.count === 0}<p>
          No single remaining card meets this target.
        </p>{/if}<Probability
        label="EXACT NEXT-CARD CHANCE"
        value={exactValue(solution.chance)}
        sampled={false}
      ></Probability>
      <p>
        Next-card probability = {solution.count} / {question.unseen}. A
        completed draw can still lose; “ahead” questions compare both shown
        hands after one card and exclude ties.
      </p>
      <a href="#/learn/8-2">Review overlap, dirty outs, and backdoors</a
      >{#if !finished}<button onclick={next}>Next question</button>{/if}
    </div>{/if}{#if finished}<div role="status">
      <h2>
        Set complete · {results.filter(Boolean).length} / {questions.length}
      </h2>
      <p>
        Your best score for this seed is saved. Replaying it improves the same
        record; it does not award the same correct answers twice.
      </p>
    </div>{/if}
</section>
