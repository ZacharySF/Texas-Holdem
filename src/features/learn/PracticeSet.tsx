import { useMemo, useState } from 'react';
import { learningFacts } from '../../content/facts';
import { Rational } from '../../engine/math';
import { useLesson } from './context';
import { isCorrect, makePractice, parseAnswer } from './practice';
import { NotebookBlock } from './NotebookBlock';
export function PracticeSet() {
  const { lesson, seed, onComplete } = useLesson();
  const problems = useMemo(
    () => makePractice(lesson.id, seed),
    [lesson.id, seed],
  );
  const [answers, setAnswers] = useState<(boolean | null)[]>(
      Array.from({ length: problems.length }, () => null),
    ),
    [index, setIndex] = useState(0),
    [text, setText] = useState(''),
    [error, setError] = useState('');
  const problem = problems[index],
    answered = answers[index] !== null,
    finished = answers.every((a) => a !== null),
    correct = answers.filter((a) => a === true).length;
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
  return (
    <section data-part="practice" className="lesson-section practice">
      <span className="eyebrow">05 / YOUR TURN</span>
      <h2>Check your understanding</h2>
      <p>
        Five questions, one attempt per question. Mastery requires{' '}
        {learningFacts.mastery().display().percent}. Equivalent fractions are
        accepted. Scores save after the whole set; unfinished answers reset if
        you leave. Open Practice settings above for a fresh set.
      </p>
      <div className="practice-question">
        <h3>
          Question {index + 1} of {problems.length}
        </h3>
        <p>{problem.prompt}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!answered) check();
          }}
        >
          <label htmlFor="practice-answer">Your answer</label>
          <div className="answer-row">
            <input
              id="practice-answer"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={answered}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby={error ? 'answer-error' : undefined}
            />
            <button type="submit" className="primary" disabled={answered}>
              Check answer
            </button>
          </div>
        </form>
        {error && (
          <p id="answer-error" role="alert" className="error">
            {error}
          </p>
        )}
        {answered && (
          <div className="solution">
            <p role="status">
              <strong>{answers[index] ? 'Correct.' : 'Not quite.'}</strong>{' '}
              {problem.explanation}
            </p>
            <NotebookBlock lines={problem.lines} />
            <p>
              Accepted exact value: <strong>{problem.answer.toString()}</strong>
              .
            </p>
            {index < problems.length - 1 && (
              <button
                onClick={() => {
                  setIndex((i) => i + 1);
                  setText('');
                  setError('');
                }}
              >
                Next question
              </button>
            )}
          </div>
        )}
      </div>
      {finished && (
        <div className="practice-score" role="status">
          <h3>
            {new Rational(correct, problems.length).compare(
              learningFacts.mastery(),
            ) >= 0
              ? 'Lesson mastered'
              : 'Keep practicing'}
          </h3>
          <p>
            {correct} / {problems.length} correct ·{' '}
            {new Rational(correct, problems.length).display().percent}. Your
            best completed score is saved. Reading ahead is always allowed.
          </p>
          <details>
            <summary>Review all worked solutions</summary>
            {problems.map((p, i) => (
              <div key={i}>
                <h4>
                  Question {i + 1} · {answers[i] ? 'correct' : 'incorrect'}
                </h4>
                <p>{p.prompt}</p>
                <p>{p.explanation}</p>
                <NotebookBlock lines={p.lines} />
              </div>
            ))}
          </details>
        </div>
      )}
    </section>
  );
}
