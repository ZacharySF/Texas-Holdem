import { advancedFacts } from '../../content/facts';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import {
  decisionProblems,
  callSolution,
  calibration,
  type DrillMode,
  type Forecast,
} from '../../engine/decisionDrills';
import { brier } from '../../engine/stats';
import { Rng } from '../../engine/rng';
import { gridRange } from '../../engine/rangeGrid';
import { newSeed } from '../lab/state';
import { PlayingCards } from '../../ui/PlayingCards';
import { Probability, exactValue, percent } from '../../ui/Probability';
import { SeriesChart } from '../../ui/SeriesChart';
import { readForecasts, saveForecasts } from './forecastStorage';
import type { GuessResponse } from '../../workers/drill.worker';
function DrillSet({ mode, seed }: { mode: DrillMode; seed: string }) {
  const [questions] = useState(() => decisionProblems(seed)),
    [index, setIndex] = useState(0),
    [guess, setGuess] = useState('50'),
    [answer, setAnswer] = useState(''),
    [result, setResult] = useState<GuessResponse | null>(null),
    [pending, setPending] = useState(false),
    [records, setRecords] = useState<Forecast[]>([]),
    [all, setAll] = useState(readForecasts),
    [error, setError] = useState(''),
    [timed, setTimed] = useState(false),
    [paused, setPaused] = useState(false),
    [elapsed, setElapsed] = useState(0);
  const worker = useRef<Worker | null>(null),
    start = useRef(performance.now()),
    base = useRef(0),
    locked = useRef(false),
    q = questions[index],
    done = records.length === 5,
    graded = records.length > index,
    solution = callSolution(q);
  useEffect(() => () => worker.current?.terminate(), []);
  const expire = useRef(() => {});
  useEffect(() => {
    if (!timed || paused || graded || pending) return;
    const timer = setInterval(() => {
      const ms = base.current + performance.now() - start.current;
      setElapsed(ms);
      if (ms >= 20000) expire.current();
    }, 100);
    return () => clearInterval(timer);
  }, [timed, paused, graded, pending, index]);
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
    if (locked.current || paused) return;
    locked.current = true;
    const late =
      expired ||
      (timed && base.current + performance.now() - start.current >= 20000);
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
    worker.current = w;
    w.onmessage = (e: MessageEvent<GuessResponse>) => {
      if (worker.current !== w) return;
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
        locked.current = false;
      }
      w.terminate();
    };
    w.onerror = () => {
      setPending(false);
      setError('Worker failed. Retry this question.');
      locked.current = false;
    };
    w.postMessage({ hand: q.hand, opponent: q.opponent, board: q.board, seed });
  }
  expire.current = () => submit(undefined, true);
  function next() {
    locked.current = false;
    setIndex(index + 1);
    setResult(null);
    setAnswer('');
    setGuess('50');
    base.current = 0;
    start.current = performance.now();
    setElapsed(0);
    setPaused(false);
  }
  const forecasts = [
      ...all,
      ...records.filter((r) => !all.some((a) => a.id === r.id)),
    ].filter((r) => r.mode === 'guess'),
    bins = calibration(forecasts);
  return (
    <>
      <section className="panel">
        <label>
          <input
            type="checkbox"
            checked={timed}
            disabled={graded || pending}
            onChange={(e) => {
              setTimed(e.target.checked);
              base.current = 0;
              start.current = performance.now();
              setElapsed(0);
              setPaused(false);
            }}
          />{' '}
          20-second speed drill (optional)
        </label>
        {timed && !graded && (
          <>
            <p aria-live="off">
              {Math.max(0, 20 - Math.floor(elapsed / 1000))} seconds remaining
              {paused ? ' · paused' : ''}
            </p>
            <button
              onClick={() => {
                if (paused) start.current = performance.now();
                else base.current += performance.now() - start.current;
                setPaused(!paused);
              }}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </>
        )}
        <h2>Question {index + 1} of 5</h2>
        {mode === 'call' ? (
          <>
            <p>
              Pot including the bet: {q.pot} chips. Call: {q.call}. Rake
              deducted from the final pot: {q.rake}. Treat the supplied equity
              as exact and assume no future betting.
            </p>
            <Probability
              label="SUPPLIED EQUITY"
              value={exactValue(q.equity)}
              sampled={false}
            />
            <div className="tool-actions">
              <button disabled={graded || paused} onClick={() => submit(true)}>
                Call
              </button>
              <button disabled={graded || paused} onClick={() => submit(false)}>
                Fold
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Your cards</p>
            <PlayingCards cards={q.hand} />
            <p>Board</p>
            <PlayingCards cards={q.board} />
            {mode === 'guess' ? (
              <>
                <p>Exposed opponent</p>
                <PlayingCards cards={q.opponent} />
                <label>
                  Estimated equity: {guess}%
                  <input
                    aria-label="Estimated equity"
                    type="range"
                    min="0"
                    max="100"
                    value={guess}
                    disabled={graded || pending || paused}
                    onChange={(e) => setGuess(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <p>
                  How many physical {q.className} combos remain after removing
                  your cards and the board? The opponent's cards are unknown.
                </p>
                <label>
                  Combo count
                  <input
                    inputMode="numeric"
                    value={answer}
                    disabled={graded || paused}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </label>
              </>
            )}
            <button
              disabled={
                graded ||
                pending ||
                paused ||
                (mode === 'combo' && !/^\d+$/.test(answer))
              }
              onClick={() => submit()}
            >
              Check answer
            </button>
          </>
        )}
        {pending && <p role="status">Enumerating every river…</p>}
        {error && <p role="alert">{error}</p>}
        {graded && (
          <div>
            <h3 aria-live="polite">
              {records[index].correct ? 'Correct' : 'Review the calculation'}
            </h3>
            {mode === 'call' ? (
              <>
                <p>
                  EV(call) = equity × (pot + call − rake) − call ={' '}
                  {q.equity.toString()} × ({q.pot} + {q.call} − {q.rake}) −{' '}
                  {q.call} = {solution.ev.toString()} chips. EV(fold) = 0.{' '}
                  {solution.ev.numerator === 0n
                    ? 'Both choices break even.'
                    : solution.call
                      ? 'Call has the higher direct EV.'
                      : 'Fold has the higher direct EV.'}
                </p>
                <Probability
                  label="RAKE-ADJUSTED BREAK-EVEN"
                  value={exactValue(solution.threshold)}
                  sampled={false}
                />
              </>
            ) : mode === 'combo' ? (
              <>
                <p>
                  {q.className}: {q.combos} remaining combos. List each pair of
                  physical cards once, then remove every pair containing a shown
                  card.
                </p>
                {gridRange({ [q.className]: 100 }, [
                  ...q.hand,
                  ...q.board,
                ]).combos.map((c) => (
                  <PlayingCards key={c.hand.join('-')} cards={c.hand} />
                ))}
              </>
            ) : (
              result?.type === 'result' && (
                <>
                  <p>
                    Exact enumeration · {result.equity.samples} river cards.
                  </p>
                  <Probability
                    label="TRUE EQUITY"
                    value={result.equity.players[0].equity}
                    sampled={false}
                  />
                  <p>
                    Your estimate {percent(Number(guess) / 100)}. Squared error
                    against exact equity:{' '}
                    {(
                      (Number(guess) / 100 -
                        result.equity.players[0].equity.value) **
                      2
                    ).toFixed(5)}
                    . Brier score against the sampled pot-unit outcome:{' '}
                    {brier([Number(guess) / 100], [result.outcome]).toFixed(5)}.
                  </p>
                  <PlayingCards cards={[result.river]} />
                  <p>
                    The sampled outcome is {result.outcome}. On a tie, a seeded
                    coin assigns one randomly selected pot unit, making its win
                    chance equal to equity. This keeps the Brier outcome binary.
                    One outcome is noisy; calibration needs many forecasts.
                  </p>
                </>
              )
            )}
            <Link
              to={
                mode === 'call'
                  ? '/learn/12-2'
                  : mode === 'guess'
                    ? '/learn/16-2'
                    : '/learn/18-1'
              }
            >
              Read the worked lesson
            </Link>
            {!done && <button onClick={next}>Next question</button>}
          </div>
        )}
        {done && (
          <p role="status">
            Set complete: {records.filter((r) => r.correct).length} / 5. Results
            saved once per seed; replay does not duplicate XP or calibration
            records.
          </p>
        )}
      </section>
      {mode === 'guess' && (
        <section className="panel">
          <h2>Forecast calibration over time</h2>
          <p>
            {forecasts.length} forecasts. Mean Brier score:{' '}
            {forecasts.length
              ? brier(
                  forecasts.map((f) => f.prediction),
                  forecasts.map((f) => f.outcome),
                ).toFixed(5)
              : '—'}
            . Smaller is better. A forecast within five percentage points of
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
          />
          {bins.map((b) => (
            <p key={b.low}>
              {percent(b.low)}–{percent(b.high)}: {b.count} predictions;
              observed {b.count ? percent(b.observed) : '—'}.
            </p>
          ))}
          <SeriesChart
            label="Brier score in chronological forecast order"
            series={[
              {
                name: 'Brier',
                values: forecasts.map((f) => (f.prediction - f.outcome) ** 2),
              },
            ]}
          />
        </section>
      )}
    </>
  );
}
export default function DecisionDrills() {
  const { drill } = useParams(),
    mode: DrillMode =
      drill === 'guess' ? 'guess' : drill === 'combo' ? 'combo' : 'call',
    [params, setParams] = useSearchParams(),
    [fallback] = useState(newSeed);
  let seed = params.get('seed') ?? fallback;
  try {
    new Rng(seed);
  } catch {
    seed = fallback;
  }
  useEffect(() => {
    if (params.get('seed') !== seed) setParams({ seed }, { replace: true });
  }, [params, seed, setParams]);
  return (
    <main className="tool-page">
      <h1>
        {mode === 'call'
          ? 'Call or Fold'
          : mode === 'guess'
            ? 'Guess the Equity'
            : 'Combo Counter'}
      </h1>
      <p>
        Seed: <code>{seed}</code>. Share this address to repeat all five
        questions. Solutions appear only after answering.
      </p>
      <button onClick={() => setParams({ seed: newSeed() })}>
        New seeded set
      </button>
      <DrillSet key={mode + seed} mode={mode} seed={seed} />
      <Link to="/arcade">All Arcade drills</Link>
    </main>
  );
}
