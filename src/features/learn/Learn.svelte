<script lang="ts">
  import CourseIndexLine from '../../decor/CourseIndexLine.svelte';
  import { lessons, lessonById } from '../../content/lessons';
  import { learningFacts } from '../../content/facts';
  import { Rng } from '../../engine/rng';
  import { newSeed } from '../lab/state';
  import SeedInput from '../../ui/SeedInput.svelte';
  import LessonBody from './LessonBody.svelte';
  import { createProgress, mastered } from './progress.svelte';
  import {
    createJourney,
    lessonGameLink,
    practiceFocus,
  } from './journey.svelte';
  import CourseContents from './CourseContents.svelte';
  import CourseIndex from './CourseIndex.svelte';
  import { readingGuides } from '../../content/readingGuides';
  import 'katex/dist/katex.min.css';
  import './learn.css';
  import { navigation, setParams } from '../../navigation.svelte';
  import { untrack } from 'svelte';
  const parts = [
    ['hook', 'The example'],
    ['idea', 'The idea'],
    ['derivation', 'The steps'],
    ['simulation', 'Try an experiment'],
    ['practice', 'Check your understanding'],
    ['table', 'Use it in poker'],
    ['quant', 'Beyond poker'],
    ['summary', 'Lesson summary'],
  ];
  function jumpTo(part: string) {
    const section =
      part === 'summary' || part === 'index'
        ? document.getElementById(
            part === 'summary' ? 'lesson-summary' : 'course-index-heading',
          )
        : document.querySelector<HTMLElement>(`[data-part="${part}"]`);
    section?.setAttribute('tabindex', '-1');
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: 'start' });
  }

  let readyLesson = $state.raw('');
  let { lessonId } = $derived(navigation.params);
  let params = $derived(new URLSearchParams(navigation.search));
  let fallback = $state.raw(newSeed());
  const courseProgress = createProgress();
  let progress = $derived(courseProgress.progress);
  let storageError = $derived(courseProgress.storageError);
  let complete = $derived(courseProgress.complete);
  const courseJourney = createJourney();
  let journey = $derived(courseJourney.journey);
  let journeyError = $derived(courseJourney.storageError);
  let visit = $derived(courseJourney.visit);
  let markRead = $derived(courseJourney.markRead);
  let lesson = $derived(lessonId ? lessonById(lessonId) : undefined);
  let computed5 = $derived.by(() => {
    let seed = params.get('seed') ?? fallback,
      invalid = false;
    try {
      new Rng(seed);
    } catch {
      seed = fallback;
      invalid = true;
    }
    return { seed, invalid };
  });
  let seed = $derived(computed5.seed);
  let invalid = $derived(computed5.invalid);
  $effect(() => {
    const dependencies = {
      d0: lesson,
      d1: params,
      d2: setParams,
      d3: fallback,
      d4: invalid,
    };
    void dependencies;
    return untrack(() => {
      const lesson = dependencies.d0;
      const params = dependencies.d1;
      const setParams = dependencies.d2;
      const fallback = dependencies.d3;
      const invalid = dependencies.d4;
      if (lesson && (!params.has('seed') || invalid))
        setParams({ seed: fallback }, { replace: true });
    });
  });
  $effect(() => {
    const dependencies = { d0: lesson, d1: visit };
    void dependencies;
    return untrack(() => {
      const lesson = dependencies.d0;
      const visit = dependencies.d1;
      if (lesson) visit(lesson.id);
      window.scrollTo(0, 0);
    });
  });
  let Content = $derived(!!lesson);
  let guide = $derived(lesson ? readingGuides[lesson.id] : undefined);
  let prerequisites = $derived(
    (guide?.prerequisites ?? [])
      .map(lessonById)
      .filter((item) => item !== undefined),
  );
  let index = $derived(lesson ? lessons.indexOf(lesson) : -1);
  let previous = $derived(index > 0 ? lessons[index - 1] : undefined);
  let next = $derived(index >= 0 ? lessons[index + 1] : undefined);
  let resume = $derived(
    lessonById(journey.current) ?? lessons.find((l) => l.id === '1-1')!,
  );
  function setReadyLesson(
    value:
      | typeof readyLesson
      | ((previous: typeof readyLesson) => typeof readyLesson),
  ) {
    readyLesson = typeof value === 'function' ? value(readyLesson) : value;
  }
</script>

<main class="learn course-layout">
  <CourseContents
    chapter={lesson?.chapter}
    current={lesson?.id}
    {progress}
    {journey}
  ></CourseContents>
  <div class="course-main">
    {#if storageError || journeyError}<p role="alert">
        Progress works for this visit, but this browser cannot save it.
      </p>{/if}{#if !lessonId}<header class="learn-header">
        <div class="panel-label">02 / course</div>
        <h1>Course</h1>
        <p>
          Welcome to the probability course. We’ll build the ideas from ordinary
          playing cards, explaining each new term before using it. You only need
          fractions and basic algebra. Start with Chapter 1 and work at your own
          pace.
        </p>
      </header>
      <CourseIndexLine />
      <section class="course-start panel">
        <h2>Chapter 1 · Probability from one deck</h2>
        <p>
          Learn what “chance” means using ordinary playing cards. No probability
          background needed.
        </p>
        <a class="course-primary" href="#/learn/1-1">Start Chapter 1 →</a
        >{#if journey.current !== '1-1'}<a href={'#' + `/learn/${resume.id}`}
            >Continue {resume.id.replace('-', '.')} · {resume.title} →</a
          >{/if}<a href="#/learn/0-1">New to poker? Learn the rules first</a>
        <button class="course-index-jump" onclick={() => jumpTo('index')}
          >Browse all {lessons.length} lessons</button
        >
      </section>
      <section class="learning-loop">
        <h2>How the course works</h2>
        <ol>
          <li>
            <strong>Read one idea.</strong> Follow the card example. New words are
            explained where they appear.
          </li>
          <li>
            <strong>Try it.</strong> Run the experiment or answer the practice questions
            after making a prediction. If the result surprises you, go back to the
            example and identify which assumption you missed.
          </li>
          <li>
            <strong>Play a hand.</strong> The coach gives you something to watch for.
            Finish the hand, then return here.
          </li>
          <li>
            <strong>Move on at your pace.</strong> Mark a lesson as read and use the
            next-lesson link. You can revisit anything.
          </li>
        </ol>
        <p class="hint">
          Reading, playing, and quiz mastery are tracked separately. A quiz pass
          needs {learningFacts.mastery().display().percent}; you do not need a
          pass to read the next lesson.
        </p>
      </section>
      <section class="course-overview">
        <h2>Your route through the course</h2>
        {#each [[1, 'Start with the cards', 'Chance, counting, and what changes when cards are revealed.'], [8, 'Make decisions at the table', 'Draws, the price of a call, and making choices with uncertain outcomes.'], [14, 'Understand results over time', 'Why good decisions can lose, and how experiments help you learn.'], [20, 'Explore further', 'Randomness, running twice, strategy, tournaments, and bankrolls.']] as [chapter, title, text] (chapter)}<a
            href={'#' + `/learn/${chapter}-1`}
            ><strong>{title}</strong><span>{text}</span><small
              >From Chapter {chapter} →</small
            ></a
          >{/each}
      </section>
      <p class="hint">
        Your reading position is saved on this device. Use the complete index
        below to find a topic, or the chapter list beside a lesson to move
        around.
      </p>
      <CourseIndex {journey} {progress} />
    {:else}{#if lesson && Content}<nav
          class="course-breadcrumb"
          aria-label="Breadcrumb"
        >
          <a href="#/learn">Course</a><span> / Chapter {lesson.chapter}</span>
        </nav>
        <header class="learn-header">
          <p class="lesson-number panel-label">
            Lesson {lesson.id.replace('-', '.')}
          </p>
          <h1>{lesson.title}</h1>
          <p>
            {guide?.introduction}
          </p>
        </header>
        <nav class="lesson-nav" aria-label="Lesson navigation">
          {#if previous}<a href={'#' + `/learn/${previous.id}`}
              >← Previous: {previous.id.replace('-', '.')} · {previous.title}</a
            >{:else}<a href="#/learn">← Course overview</a>{/if}{#if next}<a
              href={'#' + `/learn/${next.id}`}
              >Next: {next.id.replace('-', '.')} · {next.title} →</a
            >{/if}
        </nav>
        <section class="lesson-prerequisites" aria-label="Before you begin">
          <h2>Before you begin</h2>
          {#if prerequisites.length}
            <p>
              This lesson builds on the ideas below. Follow a link if you need a
              refresher.
            </p>
            <ul>
              {#each prerequisites as prerequisite (prerequisite.id)}
                <li>
                  <a href={`#/learn/${prerequisite.id}`}
                    >{prerequisite.id.replace('-', '.')} · {prerequisite.title}</a
                  >
                </li>
              {/each}
            </ul>
          {:else}<p>
              No earlier probability lessons are needed. Take the examples
              slowly; new words are explained as they appear.
            </p>{/if}
        </section>
        <section class="lesson-road-sign">
          <h2>In this lesson</h2>
          <ul>
            {#each lesson.objectives as o (o)}<li>{o}</li>{/each}
          </ul>
          <div class="lesson-part-nav" aria-label="On this page">
            {#each parts as [part, title] (part)}<button
                disabled={readyLesson !== lesson.id}
                onclick={() => jumpTo(part)}>{title}</button
              >{/each}
          </div>
          <p class="hint">
            First read the example and explanation. Pause at the question and
            try an answer in your own words. Then follow the calculation,
            predict an experiment’s result, and check your understanding with
            the quiz.
          </p>
        </section>
        <details class="lesson-replay-settings">
          <summary>Practice settings &amp; repeat this experiment</summary>
          <p>
            A seed is a code that recreates the same questions and experiment.
            You can leave it alone.
          </p>
          <label for="seed"
            >Lesson seed · shared by the experiment and practice</label
          >{#key seed}<SeedInput
              {seed}
              onCommit={(value) =>
                setParams({ seed: value }, { replace: true })}
            ></SeedInput>{/key}<button
            onclick={() => setParams({ seed: newSeed() }, { replace: true })}
            >New seed and practice set</button
          >
          <p class="hint">
            Changing this code clears unfinished answers. Copy the page address
            to repeat this version.
          </p>
          {#if invalid}<p role="alert">
              That code was invalid, so a new one was created.
            </p>{/if}
        </details>
        {#key `${lesson.id}-${seed}`}<LessonBody
            {lesson}
            {seed}
            onComplete={(answers: readonly boolean[]) =>
              complete(lesson.id, answers)}
            onReady={(id: string) => setReadyLesson(id)}
          ></LessonBody>{/key}
        <section
          class="lesson-summary"
          id="lesson-summary"
          aria-labelledby="lesson-summary-heading"
        >
          <h2 id="lesson-summary-heading">Lesson summary</h2>
          <p>{guide?.takeaway}</p>
          <p><strong>Check yourself:</strong> {guide?.question}</p>
          <button onclick={() => jumpTo('idea')}>Review the explanation</button>
          {#if !next || next.chapter !== lesson.chapter}
            <h3>End of Chapter {lesson.chapter}: a reading checkpoint</h3>
            <p>
              You’ve reached the end of this chapter. Before moving on, try to
              explain the main idea of each lesson without looking. The quiz
              results and reading marks below show different kinds of progress.
            </p>
            <ul class="chapter-review">
              {#each lessons.filter((item) => item.chapter === lesson.chapter) as item (item.id)}
                <li>
                  <a href={`#/learn/${item.id}`}
                    >{item.id.replace('-', '.')} · {item.title}</a
                  >
                  <p>{readingGuides[item.id].takeaway}</p>
                  <small
                    >{mastered(progress.results[item.id])
                      ? 'Quiz passed'
                      : 'Quiz not yet passed'} · {journey.read.includes(item.id)
                      ? 'Marked as read'
                      : 'Not marked as read'}</small
                  >
                </li>
              {/each}
            </ul>
          {/if}
          {#if next}<p class="next-topic">
              <strong>Coming next: {next.title}.</strong>
              {readingGuides[next.id].introduction}
            </p>{:else}<p>
              You’ve reached the end of the course. Revisit a chapter from the
              contents, try its questions again, or use a practice hand to
              explain your decisions.
            </p>{/if}
        </section>
        <section class="lesson-game-stop panel">
          <h2>Try this at the table</h2>
          <p>{practiceFocus(lesson.chapter)}</p>
          <a class="course-primary" href={'#' + lessonGameLink(lesson.id, seed)}
            >Play a practice hand →</a
          >
          <p class="hint">
            Your lesson and experiment code come with you. Finish any unfinished
            quiz first; partial answers reset when you leave. This game is
            practice, not a quiz.
          </p>
          {#if journey.played.includes(lesson.id)}<p class="course-status">
              Hand played for this lesson. What did you notice?
            </p>{/if}
        </section>
        <section class="lesson-finish">
          <h2>Ready for the next step?</h2>
          <p>
            {mastered(progress.results[lesson.id])
              ? 'You passed this lesson’s quiz.'
              : 'Read at your own pace. The quiz is there to check your understanding when you are ready.'}
          </p>
          <button
            onclick={() => markRead(lesson.id)}
            disabled={journey.read.includes(lesson.id)}
            >{journey.read.includes(lesson.id)
              ? 'Marked as read'
              : 'Mark lesson as read'}</button
          >
          <nav class="lesson-nav" aria-label="Next lesson">
            <a href="#/learn">All chapters and progress</a>{#if next}<a
                href={'#' + `/learn/${next.id}`}
                >Next lesson: {next.id.replace('-', '.')} · {next.title} →</a
              >{:else}<a href="#/play">Back to the poker room →</a>{/if}
          </nav>
        </section>{:else}<section class="panel">
          <h1>Lesson not found</h1>
          <a href="#/learn">Choose a lesson from the course</a>
        </section>{/if}{/if}
  </div>
</main>
