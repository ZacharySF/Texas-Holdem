import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { makeOutsRush, scoreOuts, outsSolution } from '../../engine/outsRush';
import { Rng } from '../../engine/rng';
import { newSeed } from '../lab/state';
import { PlayingCards } from '../../ui/PlayingCards';
import { Probability, exactValue } from '../../ui/Probability';
import { SeedInput } from '../../ui/SeedInput';
import { readDrill, recordDrill, drillXp, OUTS_PROGRESS_KEY } from './progress';
import styles from './OutsRush.module.css';
function Round({
  seed,
  limit,
  onComplete,
}: {
  seed: string;
  limit: number | null;
  onComplete: (correct: number) => void;
}) {
  const [questions] = useState(() => makeOutsRush(seed)),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(''),
    [results, setResults] = useState<boolean[]>([]),
    [remaining, setRemaining] = useState(limit ?? 0),
    [paused, setPaused] = useState(false),
    [submitted, setSubmitted] = useState(false);
  const started = useRef(performance.now()),
    elapsed = useRef(0),
    locked = useRef(false),
    input = useRef<HTMLInputElement>(null);
  const question = questions[index],
    finished = results.length === questions.length,
    solution = outsSolution(question);
  function submit(expired = false) {
    if (locked.current || paused || finished) return;
    locked.current = true;
    const time = elapsed.current + performance.now() - started.current;
    const correct = !expired && scoreOuts(question, answer, time, limit);
    const next = [...results, correct];
    setResults(next);
    setSubmitted(true);
    if (next.length === questions.length)
      onComplete(next.filter(Boolean).length);
  }
  const expire = useRef(() => {});
  expire.current = () => submit(true);
  useEffect(() => {
    if (limit === null || paused || submitted) return;
    const timer = window.setInterval(() => {
      const left = Math.max(
        0,
        limit - elapsed.current - (performance.now() - started.current),
      );
      setRemaining(left);
      if (left === 0) expire.current();
    }, 100);
    return () => clearInterval(timer);
  }, [limit, paused, submitted, index]);
  function pause() {
    if (paused) started.current = performance.now();
    else elapsed.current += performance.now() - started.current;
    setPaused(!paused);
  }
  function next() {
    locked.current = false;
    elapsed.current = 0;
    started.current = performance.now();
    setIndex(index + 1);
    setAnswer('');
    setSubmitted(false);
    setRemaining(limit ?? 0);
    setPaused(false);
    setTimeout(() => input.current?.focus(), 0);
  }
  return (
    <section className={`panel ${styles.round}`}>
      <p className="field-label">
        QUESTION {index + 1} OF {questions.length}
      </p>
      <p aria-live="off">
        {limit === null
          ? 'Untimed practice'
          : `Time left: ${Math.ceil(remaining / 1000)} seconds`}
        {paused ? ' · paused' : ''}
      </p>
      {!submitted && limit !== null && (
        <button onClick={pause}>
          {paused ? 'Resume timer' : 'Pause timer'}
        </button>
      )}
      <h2>{question.label}</h2>
      <p>Your hand</p>
      <PlayingCards cards={question.hand} />
      <p>Board</p>
      <PlayingCards cards={question.board} />
      {question.opponent && (
        <>
          <p>Exposed opponent</p>
          <PlayingCards cards={question.opponent} />
        </>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="outs-answer">Number of distinct outs</label>
        <input
          ref={input}
          id="outs-answer"
          inputMode="numeric"
          autoComplete="off"
          value={answer}
          disabled={submitted || paused}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button disabled={submitted || paused || !/^\d+$/.test(answer.trim())}>
          Check outs
        </button>
      </form>
      <p className="hint">
        Count only the named next-card target. A backdoor requiring two cards is
        not a next-card out. Known opponent cards are removed only when shown.
      </p>
      {submitted && (
        <div className={styles.solution}>
          <h3 aria-live="polite">
            {results[index] ? 'Correct' : 'Review the count'} · {solution.count}{' '}
            outs
          </h3>
          <p>
            {question.unseen} cards remain unseen. Test each remaining physical
            card against the target and count it once, even if it completes two
            draws.
          </p>
          <PlayingCards cards={question.outs} highlight={question.outs} />
          {solution.count === 0 && (
            <p>No single remaining card meets this target.</p>
          )}
          <Probability
            label="EXACT NEXT-CARD CHANCE"
            value={exactValue(solution.chance)}
            sampled={false}
          />
          <p>
            Next-card probability = {solution.count} / {question.unseen}. A
            completed draw can still lose; “ahead” questions compare both shown
            hands after one card and exclude ties.
          </p>
          <Link to="/learn/8-2">Review overlap, dirty outs, and backdoors</Link>
          {!finished && <button onClick={next}>Next question</button>}
        </div>
      )}
      {finished && (
        <div role="status">
          <h2>
            Set complete · {results.filter(Boolean).length} / {questions.length}
          </h2>
          <p>
            Your best score for this seed is saved. Replaying it improves the
            same record; it does not award the same correct answers twice.
          </p>
        </div>
      )}
    </section>
  );
}
export default function OutsRush() {
  const [params, setParams] = useSearchParams(),
    [fallback] = useState(newSeed),
    [active, setActive] = useState(false),
    [limit, setLimit] = useState('20'),
    [attempt, setAttempt] = useState(0),
    [progress, setProgress] = useState(readDrill),
    [error, setError] = useState('');
  let seed = (params.get('seed') ?? fallback).toLowerCase();
  try {
    new Rng(seed);
  } catch {
    seed = fallback;
  }
  useEffect(() => {
    if (params.get('seed') !== seed) setParams({ seed }, { replace: true });
  }, [params, seed, setParams]);
  function changeSeed(next: string) {
    setActive(false);
    setParams({ seed: next }, { replace: true });
  }
  function complete(correct: number) {
    const next = recordDrill(progress, seed, correct);
    setProgress(next);
    try {
      localStorage.setItem(OUTS_PROGRESS_KEY, JSON.stringify(next));
    } catch {
      setError(
        'Progress works for this visit, but browser storage could not save it.',
      );
    }
  }
  return (
    <main className={styles.arcade}>
      <header>
        <h1>Outs Rush</h1>
        <p>
          Five seeded card spots. Name the target, remove known cards, and count
          each out once.
        </p>
      </header>
      <section className="panel">
        <label htmlFor="seed">
          Drill seed · copy the address to share this set
        </label>
        <SeedInput seed={seed} key={seed} onCommit={changeSeed} />
        <label htmlFor="time-limit">Time per question</label>
        <select
          id="time-limit"
          value={limit}
          disabled={active}
          onChange={(e) => setLimit(e.target.value)}
        >
          <option value="20">20 seconds</option>
          <option value="40">40 seconds</option>
          <option value="0">Untimed practice</option>
        </select>
        <p>
          Pause at any time. Expired questions reveal the full solution and wait
          for you; no automatic advance. Timer settings do not change the card
          sequence.
        </p>
        <div className={styles.actions}>
          <button
            onClick={() => {
              setAttempt((n) => n + 1);
              setActive(true);
            }}
          >
            {active ? 'Replay this seed' : 'Start Outs Rush'}
          </button>
          <button onClick={() => changeSeed(newSeed())}>New seed</button>
          {active && (
            <button onClick={() => setActive(false)}>
              End set and change timing
            </button>
          )}
        </div>
        <p>
          Best on this seed: {progress.best[seed] ?? 0} / 5 · Drill XP:{' '}
          {drillXp(progress)}. Each new correct answer in a seed’s best
          completed set earns 5 XP, including untimed practice.
        </p>
        {error && <p role="alert">{error}</p>}
      </section>
      {active && (
        <Round
          key={`${seed}-${attempt}`}
          seed={seed}
          limit={limit === '0' ? null : Number(limit) * 1000}
          onComplete={complete}
        />
      )}
      <section className="panel">
        <h2>Build the count before racing it</h2>
        <p>
          <Link to="/learn/8-1">One-card and two-card drawing odds</Link>
        </p>
        <p>
          <Link to="/learn/8-2">
            Overlapping outs, dirty outs, and backdoors
          </Link>
        </p>
        <p>
          Call or Fold and Guess the Equity arrive in Phase 5; Combo Counter in
          Phase 7; Streak Trap in Phase 8.
        </p>
      </section>
    </main>
  );
}
