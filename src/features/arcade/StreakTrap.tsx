import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Rng } from '../../engine/rng';
import { finalFacts } from '../../content/facts';
import { newSeed } from '../lab/state';
import { ExactValue, NotebookBlock } from '../learn/NotebookBlock';
import { FinalExperiment } from '../../ui/FinalExperiment';
export default function StreakTrap() {
  const [params, setParams] = useSearchParams(),
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
      <h1>Streak Trap</h1>
      <p>
        Predict the next independent result, before seeing an explanation. No
        clock is needed for this drill.
      </p>
      <p>
        Seed: <code>{seed}</code>
      </p>
      <button onClick={() => setParams({ seed: newSeed() })}>
        New seeded set
      </button>
      <Set key={seed} seed={seed} />
      <Link to="/learn/20-2">Streaks, selection, and confirmation bias</Link>
    </main>
  );
}
function Set({ seed }: { seed: string }) {
  const [questions] = useState(() => {
      const rng = new Rng(seed);
      return Array.from({ length: 5 }, (_, i) => ({
        wins: i % 2 ? 4 : 1,
        total: i % 2 ? 5 : 2,
        streak: 3 + rng.int(8),
        lost: rng.int(2) === 0,
      }));
    }),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(''),
    [storageMessage, setStorageMessage] = useState(''),
    [scores, setScores] = useState<boolean[]>([]),
    q = questions[index],
    truth = finalFacts.streakNext(q.wins, q.total),
    answered = scores.length > index;
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
  return (
    <>
      <section className="panel">
        <h2>Question {index + 1} of 5</h2>
        <p>
          Each independent fresh trial has win chance {truth.toString()}. You
          just {q.lost ? 'lost' : 'won'} {q.streak} in a row. Compared with the
          original chance, is winning the next trial more likely, less likely,
          or unchanged?
        </p>
        <label>
          Prediction
          <select
            aria-label="Streak prediction"
            value={answer}
            disabled={answered}
            onChange={(e) => setAnswer(e.target.value)}
          >
            <option value="">Choose</option>
            <option value="higher">More likely</option>
            <option value="lower">Less likely</option>
            <option value="same">Unchanged</option>
          </select>
        </label>
        <button disabled={!answer || answered} onClick={grade}>
          Check prediction
        </button>
        {answered && (
          <>
            <h3>
              {scores[index] ? 'Correct' : 'Review the independence assumption'}
            </h3>
            <NotebookBlock
              lines={[
                'P(W_{n+1}\\mid H_n)',
                'P(W_{n+1})',
                `${truth.numerator}/${truth.denominator}`,
              ]}
            />
            <ExactValue value={truth} />
            <p>
              The complete observed history is H. Independence means
              conditioning on that history does not change the next chance. In a
              real game, changing opponents or ranges can violate the premise; a
              streak alone does not establish such a change.
            </p>
            {index < 4 ? (
              <button
                onClick={() => {
                  setIndex(index + 1);
                  setAnswer('');
                }}
              >
                Next question
              </button>
            ) : (
              <p role="status">
                Set complete: {scores.filter(Boolean).length} / 5.{' '}
                {storageMessage}
              </p>
            )}
          </>
        )}
      </section>
      <section className="panel">
        <h2>Does a long streak occur somewhere?</h2>
        <p>
          Search twenty independent fair trials for a run of five wins. This is
          different from requiring five wins at one specified starting point.
          The exact calculation tracks the current run length so overlapping
          streaks are not counted twice.
        </p>
        <ExactValue value={finalFacts.streakChance(1, 2, 5, 20)} />
        <FinalExperiment
          request={{
            type: 'streak',
            p: 1,
            d: 2,
            length: 5,
            trials: 20,
            seed,
            samples: 10000,
          }}
        />
      </section>
    </>
  );
}
