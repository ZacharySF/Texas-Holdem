import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import type { MDXProps } from 'mdx/types';
import { lessons, lessonById } from '../../content/lessons';
import { learningFacts } from '../../content/facts';
import { Rng } from '../../engine/rng';
import { newSeed } from '../lab/state';
import { SeedInput } from '../../ui/SeedInput';
import { LessonContext } from './context';
import { mdxComponents } from './components';
import { useProgress, mastered } from './progress';
import { useJourney, lessonGameLink, practiceFocus } from './journey';
import { CourseContents } from './CourseContents';
import 'katex/dist/katex.min.css';
import './learn.css';
const modules = import.meta.glob<{ default: ComponentType<MDXProps> }>(
  '../../content/lessons/*.mdx',
);
const content = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [
    path.split('/').pop()?.replace('.mdx', ''),
    lazy(load),
  ]),
);
const parts = [
  ['hook', 'The example'],
  ['idea', 'The idea'],
  ['derivation', 'The steps'],
  ['simulation', 'Try an experiment'],
  ['practice', 'Check your understanding'],
  ['table', 'Use it in poker'],
  ['quant', 'Beyond poker'],
];
function jumpTo(part: string) {
  const section = document.querySelector<HTMLElement>(`[data-part="${part}"]`);
  section?.setAttribute('tabindex', '-1');
  section?.focus({ preventScroll: true });
  section?.scrollIntoView({ block: 'start' });
}
function LessonReady({
  id,
  onReady,
}: {
  id: string;
  onReady: (id: string) => void;
}) {
  useEffect(() => onReady(id), [id, onReady]);
  return null;
}
export default function Learn() {
  const [readyLesson, setReadyLesson] = useState('');
  const { lessonId } = useParams(),
    [params, setParams] = useSearchParams(),
    [fallback] = useState(newSeed);
  const { progress, storageError, complete } = useProgress();
  const { journey, storageError: journeyError, visit, markRead } = useJourney();
  const lesson = lessonId ? lessonById(lessonId) : undefined;
  let seed = params.get('seed') ?? fallback,
    invalid = false;
  try {
    new Rng(seed);
  } catch {
    seed = fallback;
    invalid = true;
  }
  useEffect(() => {
    if (lesson && (!params.has('seed') || invalid))
      setParams({ seed: fallback }, { replace: true });
  }, [lesson, params, setParams, fallback, invalid]);
  useEffect(() => {
    if (lesson) visit(lesson.id);
    window.scrollTo(0, 0);
  }, [lesson, visit]);
  const Content = lesson ? content[lesson.id] : undefined;
  const index = lesson ? lessons.indexOf(lesson) : -1;
  const previous = index > 0 ? lessons[index - 1] : undefined,
    next = index >= 0 ? lessons[index + 1] : undefined;
  const resume =
    lessonById(journey.current) ?? lessons.find((l) => l.id === '1-1')!;
  return (
    <main className="learn course-layout">
      <CourseContents
        chapter={lesson?.chapter}
        current={lesson?.id}
        progress={progress}
        journey={journey}
      />
      <div className="course-main">
        {(storageError || journeyError) && (
          <p role="alert">
            Progress works for this visit, but this browser cannot save it.
          </p>
        )}
        {!lessonId ? (
          <>
            <header className="learn-header">
              <h1>Course</h1>
              <p>
                Start with Chapter 1. We’ll explain one idea at a time, then
                help you notice it in a real game. You only need fractions and
                basic algebra.
              </p>
            </header>
            <section className="course-start panel">
              <h2>Chapter 1 · Probability from one deck</h2>
              <p>
                Learn what “chance” means using ordinary playing cards. No
                probability background needed.
              </p>
              <Link className="course-primary" to="/learn/1-1">
                Start Chapter 1 →
              </Link>
              {journey.current !== '1-1' && (
                <Link to={`/learn/${resume.id}`}>
                  Continue {resume.id.replace('-', '.')} · {resume.title} →
                </Link>
              )}
              <Link to="/learn/0-1">New to poker? Learn the rules first</Link>
            </section>
            <section className="learning-loop">
              <h2>How the course works</h2>
              <ol>
                <li>
                  <strong>Read one idea.</strong> Follow the card example. New
                  words are explained where they appear.
                </li>
                <li>
                  <strong>Try it.</strong> Run the experiment or answer the
                  practice questions when you feel ready.
                </li>
                <li>
                  <strong>Play a hand.</strong> The coach gives you something to
                  watch for. Finish the hand, then return here.
                </li>
                <li>
                  <strong>Move on at your pace.</strong> Mark a lesson as read
                  and use the next-lesson link. You can revisit anything.
                </li>
              </ol>
              <p className="hint">
                Reading, playing, and quiz mastery are tracked separately. A
                quiz pass needs {learningFacts.mastery().display().percent}; you
                do not need a pass to read the next lesson.
              </p>
            </section>
            <section className="course-overview">
              <h2>Your route through the course</h2>
              {[
                [
                  1,
                  'Start with the cards',
                  'Chance, counting, and what changes when cards are revealed.',
                ],
                [
                  8,
                  'Make decisions at the table',
                  'Draws, the price of a call, and making choices with uncertain outcomes.',
                ],
                [
                  14,
                  'Understand results over time',
                  'Why good decisions can lose, and how experiments help you learn.',
                ],
                [
                  20,
                  'Explore further',
                  'Randomness, running twice, strategy, tournaments, and bankrolls.',
                ],
              ].map(([chapter, title, text]) => (
                <Link key={chapter} to={`/learn/${chapter}-1`}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                  <small>From Chapter {chapter} →</small>
                </Link>
              ))}
            </section>
            <p className="hint">
              Use Course contents to see every numbered chapter and lesson. Your
              reading position is saved on this device.
            </p>
          </>
        ) : lesson && Content ? (
          <>
            <nav className="course-breadcrumb" aria-label="Breadcrumb">
              <Link to="/learn">Course</Link>
              <span>
                {' '}
                / Chapter {lesson.chapter} / Lesson{' '}
                {lesson.id.replace('-', '.')}
              </span>
            </nav>
            <header className="learn-header">
              <h1>{lesson.title}</h1>
              <p>
                {lesson.chapter === 1
                  ? 'Start with what you can see. Name the possibilities, then describe the chance of the result you care about.'
                  : 'Take this one step at a time. Read the example, try it yourself, then take the idea to the table.'}
              </p>
            </header>
            <nav className="lesson-nav" aria-label="Lesson navigation">
              {previous ? (
                <Link to={`/learn/${previous.id}`}>
                  ← Previous: {previous.id.replace('-', '.')}
                </Link>
              ) : (
                <Link to="/learn">← Course overview</Link>
              )}
              {next && (
                <Link to={`/learn/${next.id}`}>
                  Next: {next.id.replace('-', '.')} →
                </Link>
              )}
            </nav>
            <section className="lesson-road-sign">
              <h2>In this lesson</h2>
              <ul>
                {lesson.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              <div className="lesson-part-nav" aria-label="On this page">
                {parts.map(([part, title]) => (
                  <button
                    key={part}
                    disabled={readyLesson !== lesson.id}
                    onClick={() => jumpTo(part)}
                  >
                    {title}
                  </button>
                ))}
              </div>
              <p className="hint">
                No need to memorize everything. Read the example first; use the
                steps and experiments when you want to see why it works.
              </p>
            </section>
            <details className="lesson-replay-settings">
              <summary>Practice settings &amp; repeat this experiment</summary>
              <p>
                A seed is a code that recreates the same questions and
                experiment. You can leave it alone.
              </p>
              <label htmlFor="seed">
                Lesson seed · shared by the experiment and practice
              </label>
              <SeedInput
                key={seed}
                seed={seed}
                onCommit={(value) =>
                  setParams({ seed: value }, { replace: true })
                }
              />
              <button
                onClick={() =>
                  setParams({ seed: newSeed() }, { replace: true })
                }
              >
                New seed and practice set
              </button>
              <p className="hint">
                Changing this code clears unfinished answers. Copy the page
                address to repeat this version.
              </p>
              {invalid && (
                <p role="alert">
                  That code was invalid, so a new one was created.
                </p>
              )}
            </details>
            <LessonContext.Provider
              key={`${lesson.id}-${seed}`}
              value={{
                lesson,
                seed,
                onComplete: (answers) => complete(lesson.id, answers),
              }}
            >
              <Suspense fallback={<p role="status">Loading lesson…</p>}>
                <Content components={mdxComponents} />
                <LessonReady id={lesson.id} onReady={setReadyLesson} />
              </Suspense>
            </LessonContext.Provider>
            <section className="lesson-game-stop panel">
              <h2>Try this at the table</h2>
              <p>{practiceFocus(lesson.chapter)}</p>
              <Link
                className="course-primary"
                to={lessonGameLink(lesson.id, seed)}
              >
                Play a practice hand →
              </Link>
              <p className="hint">
                Your lesson and experiment code come with you. Finish any
                unfinished quiz first; partial answers reset when you leave.
                This game is practice, not a quiz.
              </p>
              {journey.played.includes(lesson.id) && (
                <p className="course-status">
                  Hand played for this lesson. What did you notice?
                </p>
              )}
            </section>
            <section className="lesson-finish">
              <h2>Ready for the next step?</h2>
              <p>
                {mastered(progress.results[lesson.id])
                  ? 'You passed this lesson’s quiz.'
                  : 'Read at your own pace. The quiz is there to check your understanding when you are ready.'}
              </p>
              <button
                onClick={() => markRead(lesson.id)}
                disabled={journey.read.includes(lesson.id)}
              >
                {journey.read.includes(lesson.id)
                  ? 'Marked as read'
                  : 'Mark lesson as read'}
              </button>
              <nav className="lesson-nav" aria-label="Next lesson">
                <Link to="/learn">All chapters and progress</Link>
                {next ? (
                  <Link to={`/learn/${next.id}`}>
                    Next lesson: {next.id.replace('-', '.')} · {next.title} →
                  </Link>
                ) : (
                  <Link to="/play">Back to the poker room →</Link>
                )}
              </nav>
            </section>
          </>
        ) : (
          <section className="panel">
            <h1>Lesson not found</h1>
            <Link to="/learn">Choose a lesson from the course</Link>
          </section>
        )}
      </div>
    </main>
  );
}
