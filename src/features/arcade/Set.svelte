<script lang="ts">
  import { Rng } from '../../engine/rng';
  import { finalFacts } from '../../content/facts';
  import ExactValue from '../learn/ExactValue.svelte';
  import NotebookBlock from '../learn/NotebookBlock.svelte';
  import FinalExperiment from '../../ui/FinalExperiment.svelte';

  let { seed }: { seed: string } = $props();
  let questions = $state.raw(
    (() => {
      const rng = new Rng(seed);
      return Array.from({ length: 5 }, (_, i) => ({
        wins: i % 2 ? 4 : 1,
        total: i % 2 ? 5 : 2,
        streak: 3 + rng.int(8),
        lost: rng.int(2) === 0,
      }));
    })(),
  );
  let index = $state.raw(0);
  let answer = $state.raw('');
  let storageMessage = $state.raw('');
  let scores = $state.raw<boolean[]>([]);
  let q = $derived(questions[index]);
  let truth = $derived(finalFacts.streakNext(q.wins, q.total));
  let answered = $derived(scores.length > index);
  function grade() {
    const correct = answer === 'same';
    const next = [...scores, correct];
    setScores(next);
    if (next.length === 5)
      try {
        const raw: unknown = JSON.parse(
            localStorage.getItem('holdem-streak-v1') ?? '{}',
          ),
          prior = raw && typeof raw === 'object' ? raw : {};
        localStorage.setItem(
          'holdem-streak-v1',
          JSON.stringify({ ...prior, [seed]: next.filter(Boolean).length }),
        );
        setStorageMessage('The completed score is stored on this device.');
      } catch {
        setStorageMessage(
          'Storage is unavailable; the completed score remains visible for this visit.',
        );
      }
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
  function setStorageMessage(
    value:
      | typeof storageMessage
      | ((previous: typeof storageMessage) => typeof storageMessage),
  ) {
    storageMessage =
      typeof value === 'function' ? value(storageMessage) : value;
  }
  function setScores(
    value: typeof scores | ((previous: typeof scores) => typeof scores),
  ) {
    scores = typeof value === 'function' ? value(scores) : value;
  }
</script>

<section class="panel">
  <h2>Question {index + 1} of 5</h2>
  <p>
    Each independent fresh trial has win chance {truth.toString()}. You just {q.lost
      ? 'lost'
      : 'won'}
    {q.streak} in a row. Compared with the original chance, is winning the next trial
    more likely, less likely, or unchanged?
  </p>
  <label
    >Prediction<select
      aria-label="Streak prediction"
      value={answer}
      disabled={answered}
      onchange={(e) => setAnswer(e.currentTarget.value)}
      ><option value="">Choose</option><option value="higher"
        >More likely</option
      ><option value="lower">Less likely</option><option value="same"
        >Unchanged</option
      ></select
    ></label
  ><button disabled={!answer || answered} onclick={grade}
    >Check prediction</button
  >{#if answered}<h3>
      {scores[index] ? 'Correct' : 'Review the independence assumption'}
    </h3>
    <NotebookBlock
      lines={[
        'P(W_{n+1}\\mid H_n)',
        'P(W_{n+1})',
        `${truth.numerator}/${truth.denominator}`,
      ]}
    ></NotebookBlock><ExactValue value={truth}></ExactValue>
    <p>
      The complete observed history is H. Independence means conditioning on
      that history does not change the next chance. In a real game, changing
      opponents or ranges can violate the premise; a streak alone does not
      establish such a change.
    </p>
    {#if index < 4}<button
        onclick={() => {
          setIndex(index + 1);
          setAnswer('');
        }}>Next question</button
      >{:else}<p role="status">
        Set complete: {scores.filter(Boolean).length} / 5. {storageMessage}
      </p>{/if}{/if}
</section>
<section class="panel">
  <h2>Does a long streak occur somewhere?</h2>
  <p>
    Search twenty independent fair trials for a run of five wins. This is
    different from requiring five wins at one specified starting point. The
    exact calculation tracks the current run length so overlapping streaks are
    not counted twice.
  </p>
  <ExactValue value={finalFacts.streakChance(1, 2, 5, 20)}
  ></ExactValue><FinalExperiment
    request={{
      type: 'streak',
      p: 1,
      d: 2,
      length: 5,
      trials: 20,
      seed,
      samples: 10000,
    }}
  ></FinalExperiment>
</section>
