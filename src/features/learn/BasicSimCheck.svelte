<script lang="ts">
  import {
    courseLabel,
    formatPercent,
    lessonDerivation,
    experimentProbability,
    learningFacts,
  } from '../../content/facts';
  import { Rational } from '../../engine/math';
  import type { ExperimentSnapshot } from '../../engine/experiments';
  import type { LearnResponse } from '../../workers/learnProtocol';
  import ExperimentChart from '../../ui/ExperimentChart.svelte';
  import { percent } from '../../ui/Probability';
  import { getLesson } from './context';
  import ExactValue from './ExactValue.svelte';
  import NotebookBlock from './NotebookBlock.svelte';
  import { untrack } from 'svelte';

  const { lesson, seed } = getLesson();
  let selected = $state.raw(0);
  let choices = $derived([lesson.experiment, ...(lesson.experiments ?? [])]);
  let experiment = $derived(choices[selected]);
  let exact = $derived(experimentProbability(experiment));
  let points = $state.raw<ExperimentSnapshot[]>([]);
  let running = $state.raw(false);
  let status = $state.raw('');
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
    setPoints([]);
    setRunning(true);
    setStatus('Running the experiment…');
    setError('');
    const current = new Worker(
      new URL('../../workers/learn.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker = current;
    current.onmessage = (event: MessageEvent<LearnResponse>) => {
      if (worker !== current) return;
      const message = event.data;
      if (message.type === 'error') {
        setError(message.message);
        setRunning(false);
        current.terminate();
        return;
      }
      setPoints((p) => [...p, ...message.trace]);
      if (message.type === 'result') {
        setRunning(false);
        setStatus('Experiment complete.');
        current.terminate();
      }
    };
    current.onerror = () => {
      if (worker === current) {
        setError('The experiment worker stopped. You can retry the same seed.');
        setRunning(false);
        current.terminate();
      }
    };
    current.postMessage({ event: experiment, seed, samples });
  }
  let last = $derived(points[points.length - 1]);
  function setSelected(
    value: typeof selected | ((previous: typeof selected) => typeof selected),
  ) {
    selected = typeof value === 'function' ? value(selected) : value;
  }
  function setPoints(
    value: typeof points | ((previous: typeof points) => typeof points),
  ) {
    points = typeof value === 'function' ? value(points) : value;
  }
  function setRunning(
    value: typeof running | ((previous: typeof running) => typeof running),
  ) {
    running = typeof value === 'function' ? value(running) : value;
  }
  function setStatus(
    value: typeof status | ((previous: typeof status) => typeof status),
  ) {
    status = typeof value === 'function' ? value(status) : value;
  }
  function setError(
    value: typeof error | ((previous: typeof error) => typeof error),
  ) {
    error = typeof value === 'function' ? value(error) : value;
  }
</script>

<section data-part="simulation" class="lesson-section sim-check">
  <h2>Run the experiment</h2>
  {#if lesson.experiments}<label for="lesson-experiment"
      >Experiment to check</label
    ><select
      id="lesson-experiment"
      value={selected}
      onchange={(e) => {
        worker?.terminate();
        worker = null;
        setRunning(false);
        setPoints([]);
        setStatus('');
        setError('');
        setSelected(Number(e.currentTarget.value));
      }}
      >{#each choices as event, i (i)}<option value={i}
          >{event.kind === 'courseDraw'
            ? courseLabel(event)
            : lesson.experimentLabel}</option
        >{/each}</select
    >{/if}
  <p>
    {experiment.kind === 'courseDraw'
      ? courseLabel(experiment)
      : lesson.experimentLabel}.
  </p>
  {#if experiment.kind === 'courseDraw'}<p>
      N counts favorable sets by the event definition. Each unordered set is
      visited once; divide that count by all possible sets.
    </p>
    <NotebookBlock lines={lessonDerivation(experiment)}></NotebookBlock>{/if}
  <p>
    A trial means one fresh attempt at this experiment. Between trials the deck
    is restored; within a trial, drawn cards stay out. The seed above reproduces
    the same sequence.
  </p>
  <ExactValue value={exact}></ExactValue>
  <div class="lesson-actions">
    {#each [1000, 10000, 100000, 1000000] as n (n)}<button
        disabled={running}
        onclick={() => run(n)}>Run {n.toLocaleString()} trials</button
      >{/each}{#if running}<button
        onclick={() => {
          worker?.terminate();
          worker = null;
          setRunning(false);
          setStatus('Cancelled. Completed trials remain visible.');
        }}>Cancel experiment</button
      >{/if}
  </div>
  <p role="status">
    {status}{running && last
      ? ` ${last.samples.toLocaleString()} trials so far.`
      : ''}
  </p>
  {#if error}<p role="alert" class="error">{error}</p>{/if}{#if last}<ExactValue
      value={new Rational(last.successes, last.samples)}
      label={`Observed frequency · ${last.successes.toLocaleString()} successes / ${last.samples.toLocaleString()} trials`}
    ></ExactValue>
    <p class="experiment-result">
      {learningFacts.confidence().display().percent} Wilson confidence interval:
      <strong>{percent(last.interval[0])}–{percent(last.interval[1])}</strong>.
      Gap from exact:
      <strong
        >{formatPercent(last.estimate - exact.toNumber(), 3).slice(0, -1)} percentage
        points</strong
      >.
    </p>{/if}<ExperimentChart {points} exact={exact.toNumber()}
  ></ExperimentChart>
  <details>
    <summary>What does the shaded interval mean?</summary>
    <p>
      The observed frequency is successes divided by trials. A short run can
      miss the exact probability because the dealt cards vary. A confidence
      interval is a rule for drawing a range around that estimate.
    </p>
    <p>
      Imagine repeating many whole experiments, each with a fresh seed and the
      same number of trials. A method with the stated coverage aims for its
      intervals to include the fixed true probability in that proportion of
      those experiments. This is a repeated-experiment claim, not the chance
      that this particular fixed probability moves inside today’s interval.
    </p>
    <p>
      We use the Wilson score method, which also gives a nonzero upper limit
      when a sample contains no successes. Its coverage is approximate for
      discrete counts. As trials accumulate, the interval tends to narrow, but
      not at every step. Looking at many chart points does not make them one
      guaranteed band. Chapter 16 will derive the interval; here it keeps the
      experiment honest about sampling noise.
    </p>
  </details>
</section>
