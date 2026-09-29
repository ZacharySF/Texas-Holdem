<script lang="ts">
  import { untrack } from 'svelte';
  import { learningFacts } from '../../content/facts';
  import { Rational } from '../../engine/math';
  import { getLesson } from './context';
  import { isCorrect, makePractice, parseAnswer } from './practice';
  import NotebookBlock from './NotebookBlock.svelte';

  const { lesson, seed, onComplete } = getLesson();
  let problems = $derived.by(() => makePractice(lesson.id, seed));
  let answers = $state.raw<(boolean | null)[]>(
    untrack(() => Array.from({ length: problems.length }, () => null)),
  );
  let index = $state.raw(0);
  let text = $state.raw('');
  let error = $state.raw('');
  let problem = $derived(problems[index]);
  let answered = $derived(answers[index] !== null);
  let finished = $derived(answers.every((a) => a !== null));
  let correct = $derived(answers.filter((a) => a === true).length);
  function check() {
    if (parseAnswer(text) === null) {
      setError(
        'Enter an integer, fraction, decimal, percent, “1 in N”, or “N : 1”. A denominator cannot be zero.',
      );
      return;
    }
    const next = [...answers];
    next[index] = isCorrect(text, problem);
    setAnswers(next);
    setError('');
    if (next.every((a): a is boolean => a !== null)) onComplete(next);
  }
  function setAnswers(
    value: typeof answers | ((previous: typeof answers) => typeof answers),
  ) {
    answers = typeof value === 'function' ? value(answers) : value;
  }
  function setIndex(
    value: typeof index | ((previous: typeof index) => typeof index),
  ) {
    index = typeof value === 'function' ? value(index) : value;
  }
  function setText(
    value: typeof text | ((previous: typeof text) => typeof text),
  ) {
    text = typeof value === 'function' ? value(text) : value;
  }
  function setError(
    value: typeof error | ((previous: typeof error) => typeof error),
  ) {
    error = typeof value === 'function' ? value(error) : value;
  }
</script>

<section data-part="practice" class="lesson-section practice">
  <h2>Check your understanding</h2>
  <p>
    Five questions, one attempt per question. Mastery requires {learningFacts
      .mastery()
      .display().percent}. Equivalent fractions are accepted. Scores save after
    the whole set; unfinished answers reset if you leave. Open Practice settings
    above for a fresh set.
  </p>
  <div class="practice-question">
    <h3>Question {index + 1} of {problems.length}</h3>
    <p>{problem.prompt}</p>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        if (!answered) check();
      }}
    >
      <label for="practice-answer">Your answer</label>
      <div class="answer-row">
        <input
          id="practice-answer"
          value={text}
          oninput={(e) => setText(e.currentTarget.value)}
          disabled={answered}
          autocomplete="off"
          spellcheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? 'answer-error' : undefined}
        /><button type="submit" class="primary" disabled={answered}
          >Check answer</button
        >
      </div>
    </form>
    {#if error}<p id="answer-error" role="alert" class="error">
        {error}
      </p>{/if}{#if answered}<div class="solution">
        <p role="status">
          <strong>{answers[index] ? 'Correct.' : 'Not quite.'}</strong>
          {problem.explanation}
        </p>
        <NotebookBlock lines={problem.lines}></NotebookBlock>
        <p>
          Accepted exact value: <strong>{problem.answer.toString()}</strong>.
        </p>
        {#if index < problems.length - 1}<button
            onclick={() => {
              setIndex((i) => i + 1);
              setText('');
              setError('');
            }}>Next question</button
          >{/if}
      </div>{/if}
  </div>
  {#if finished}<div class="practice-score" role="status">
      <h3>
        {new Rational(correct, problems.length).compare(
          learningFacts.mastery(),
        ) >= 0
          ? 'Lesson mastered'
          : 'Keep practicing'}
      </h3>
      <p>
        {correct} / {problems.length} correct · {new Rational(
          correct,
          problems.length,
        ).display().percent}. Your best completed score is saved. Reading ahead
        is always allowed.
      </p>
      <details>
        <summary>Review all worked solutions</summary
        >{#each problems as p, i (i)}<div>
            <h4>Question {i + 1} · {answers[i] ? 'correct' : 'incorrect'}</h4>
            <p>{p.prompt}</p>
            <p>{p.explanation}</p>
            <NotebookBlock lines={p.lines}></NotebookBlock>
          </div>{/each}
      </details>
    </div>{/if}
</section>
