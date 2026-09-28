import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import type { MDXProps } from 'mdx/types';
import { chapters, lessons, lessonById } from '../../content/lessons';
import { learningFacts } from '../../content/facts';
import { Rng } from '../../engine/rng';
import { newSeed } from '../lab/state';
import { SeedInput } from '../../ui/SeedInput';
import { LessonContext } from './context';
import { mdxComponents } from './components';
import { useProgress, chapterUnlocked, mastered } from './progress';
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
export default function Learn() {
  const { lessonId } = useParams(),
    [params, setParams] = useSearchParams(),
    [fallback] = useState(newSeed);
  const { progress, storageError, complete, skipIntro } = useProgress();
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
    window.scrollTo(0, 0);
  }, [lessonId]);
  const Content = lesson ? content[lesson.id] : undefined;
  return (
    <main className="learn">
      <header className="learn-header">
        <span className="eyebrow">LEARN / CHAPTERS 0–25</span>
        <h1>{lesson ? lesson.title : 'Start with one deck.'}</h1>
        <p>
          Count the possibilities, derive the answer, and deal the experiment
          yourself.
        </p>
      </header>
      {storageError && (
        <p role="alert">
          Browser storage is unavailable. Progress works for this visit but
          cannot be saved.
        </p>
      )}
      {!lessonId ? (
        <>
          <p>
            Each lesson has a worked derivation, a live experiment, and five
            practice questions. Mastery requires{' '}
            {learningFacts.mastery().display().percent}. Chapters unlock in
            order; “Open manually” lets you read ahead at any time.
          </p>
          <button onClick={skipIntro} disabled={progress.skippedIntro}>
            {progress.skippedIntro
              ? 'Introduction skipped'
              : 'I know Hold’em: skip chapter 0'}
          </button>
          <div className="chapter-list">
            {chapters.map((title, chapter) => (
              <section key={title} className="panel">
                <span className="eyebrow">
                  CHAPTER {chapter} {chapter === 0 ? '· OPTIONAL' : ''}
                </span>
                <h2>{title}</h2>
                <p className="hint">
                  {chapterUnlocked(chapter, progress)
                    ? 'Ready to learn'
                    : 'Recommended after earlier chapters are mastered'}
                </p>
                {lessons
                  .filter((l) => l.chapter === chapter)
                  .map((l) => (
                    <div className="lesson-link" key={l.id}>
                      <Link to={`/learn/${l.id}`}>
                        {l.id.replace('-', '.')} · {l.title}
                      </Link>
                      <span>
                        {mastered(progress.results[l.id])
                          ? 'Mastered'
                          : progress.results[l.id]
                            ? `${progress.results[l.id]?.bestCorrect} / 5 best`
                            : chapterUnlocked(chapter, progress)
                              ? 'Ready'
                              : 'Open manually'}
                      </span>
                    </div>
                  ))}
              </section>
            ))}
          </div>
        </>
      ) : lesson && Content ? (
        <>
          <nav className="lesson-nav" aria-label="Lesson navigation">
            <Link to="/learn">← All chapters</Link>
            <span>
              Lesson {lesson.id.replace('-', '.')}
              {mastered(progress.results[lesson.id]) ? ' · Mastered' : ''}
            </span>
          </nav>
          {!chapterUnlocked(lesson.chapter, progress) && (
            <p className="manual-note">
              You opened this lesson manually. Earlier chapters remain available
              whenever you need them.
            </p>
          )}
          <section className="panel">
            <h2>What you will be able to do</h2>
            <ul>
              {lesson.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <label htmlFor="seed">
              Lesson seed · shared by the experiment and practice
            </label>
            <SeedInput
              key={seed}
              seed={seed}
              onCommit={(next) => setParams({ seed: next }, { replace: true })}
            />
            <button
              onClick={() => setParams({ seed: newSeed() }, { replace: true })}
            >
              New seed and practice set
            </button>
            <p className="hint">
              Copy this page’s address to reproduce its experiment and
              questions. Changing the seed clears an unfinished set.
            </p>
            {invalid && (
              <p role="alert">
                The link's seed is invalid. A fresh valid seed is shown; use it
                before sharing.
              </p>
            )}
          </section>
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
            </Suspense>
          </LessonContext.Provider>
          <nav className="lesson-nav" aria-label="Next lesson">
            <Link to="/learn">All chapters and progress</Link>
            {lessons[lessons.indexOf(lesson) + 1] && (
              <Link to={`/learn/${lessons[lessons.indexOf(lesson) + 1].id}`}>
                Open next lesson →
              </Link>
            )}
          </nav>
        </>
      ) : (
        <section className="panel">
          <h2>Lesson not found</h2>
          <Link to="/learn">Choose an available lesson</Link>
        </section>
      )}
    </main>
  );
}
