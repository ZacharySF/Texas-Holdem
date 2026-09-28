import { learningFacts } from '../../content/facts';
import { useEffect, useRef, useState } from 'react';
import { replay, type Street } from '../../engine/game';
import { evaluateReference } from '../../engine/evaluator';
import type { PayoutResult } from '../../engine/payouts';
import { Histogram } from '../../ui/SeriesChart';
import type { PayoutResponse } from '../../workers/payout.worker';
import { percent } from '../../ui/Probability';
import { PlayingCards } from '../../ui/PlayingCards';
import { analysisSeed, verifyCommitment, type SavedHand } from './storage';
export function HistoryPanel({ hand }: { hand: SavedHand }) {
  const [step, setStep] = useState(hand.actions.length),
    [street, setStreet] = useState<Street>('preflop'),
    [result, setResult] = useState<PayoutResult | null>(null),
    [running, setRunning] = useState(false),
    [verification, setVerification] = useState(''),
    [seed, setSeed] = useState(hand.config.seed),
    [error, setError] = useState('');
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  const final = replay(hand.config, hand.actions),
    shown = replay(hand.config, hand.actions, step);
  async function run() {
    worker.current?.terminate();
    setRunning(true);
    setResult(null);
    setError('');
    const current = new Worker(
      new URL('../../workers/payout.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.current = current;
    current.onmessage = (event: MessageEvent<PayoutResponse>) => {
      if (worker.current !== current) return;
      const m = event.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        current.terminate();
        return;
      }
      setResult(m.result);
      if (m.type === 'result') {
        setRunning(false);
        current.terminate();
      }
    };
    current.onerror = () => {
      setError('Runout worker failed.');
      setRunning(false);
      current.terminate();
    };
    const runSeed = await analysisSeed(hand.config.seed, `runout:${street}`);
    if (worker.current === current)
      current.postMessage({
        players: final.players.map((p) => p.hand),
        contributions: final.finalContributions,
        folded: final.players.map(() => false),
        button: hand.config.button,
        board: final.boards[street] ?? [],
        method: 'monteCarlo',
        samples: 10000,
        seed: runSeed,
      });
  }
  return (
    <section className="panel history-panel">
      <h2>Hand history, replay, and x-ray</h2>
      <p>
        {new Date(hand.date).toLocaleString()} · {hand.persona}
      </p>
      <p className="hint">
        All hands are revealed because this hand has ended. Replays preserve the
        recorded actions.
      </p>
      <div className="replay-hands">
        {final.players.map((p, i) => (
          <div key={i}>
            <h3>{i === 0 ? 'You' : `Seat ${i + 1}`}</h3>
            <PlayingCards cards={p.hand} />
            {final.board.length >= 3 && (
              <p>{evaluateReference([...p.hand, ...final.board]).name}</p>
            )}
          </div>
        ))}
      </div>
      <p>
        Board at replay step {step}: {shown.street}
      </p>
      <PlayingCards cards={shown.board} />
      {shown.runouts && (
        <>
          <p>Second runout</p>
          <PlayingCards cards={shown.runouts[1]} />
        </>
      )}
      <div className="play-actions">
        <button onClick={() => setStep(0)}>Replay this exact deal</button>
        <button disabled={step === 0} onClick={() => setStep((n) => n - 1)}>
          Previous action
        </button>
        <button
          disabled={step === hand.actions.length}
          onClick={() => setStep((n) => n + 1)}
        >
          Next action
        </button>
        <button onClick={() => setStep(hand.actions.length)}>
          Show final result
        </button>
      </div>
      <ol className="action-history">
        {hand.actions.map((action, i) => (
          <li key={i} aria-current={i === step - 1 ? 'step' : undefined}>
            <strong>
              {action.seat === 0 ? 'You' : `Seat ${action.seat + 1}`}
            </strong>{' '}
            · {action.street} · {action.action.type}
            {action.action.type === 'raise' ? ` to ${action.action.to}` : ''} ·
            pot before action {action.pot}
          </li>
        ))}
      </ol>
      <p>
        Returned uncalled chips:{' '}
        {final.returns.length
          ? final.returns
              .map(
                (r) =>
                  `${r.seat === 0 ? 'you' : `seat ${r.seat + 1}`} ${r.amount}`,
              )
              .join(', ')
          : 'none'}
        . Final awards:{' '}
        {final.awards.map((v, i) => `seat ${i + 1}: ${v}`).join(', ')}.
      </p>
      <details>
        <summary>Verify the committed deal</summary>
        <p>Pre-deal SHA-256 commitment:</p>
        <code className="seed-code">{hand.commitment}</code>
        <label htmlFor="verify-seed">Revealed seed</label>
        <input
          id="verify-seed"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
        />
        <button
          onClick={() => {
            void verifyCommitment(seed, hand.commitment)
              .then((ok) =>
                setVerification(
                  ok
                    ? 'Verified: this seed matches the pre-deal commitment.'
                    : 'Mismatch: this seed does not match the commitment.',
                ),
              )
              .catch(() => setVerification('Web Crypto is unavailable.'));
          }}
        >
          Verify seed
        </button>
        <p role="status">{verification}</p>
        <p className="hint">
          The seed replays the shuffle, hole cards, burns, and board. A local
          browser commitment checks consistency; it does not provide an
          independent server or prevent someone inspecting their own browser
          state.
        </p>
      </details>
      <details>
        <summary>Bot reasoning and your decision grades</summary>
        {hand.notes.map((note) => (
          <div className="decision-note" key={note.index}>
            <h3>
              Action {note.index + 1} ·{' '}
              {note.seat === 0 ? 'Your decision' : 'Bot x-ray'}
            </h3>
            <p>{note.reason}</p>
            <p>
              Estimated equity {percent(note.equity.players[0].equity.value)} ·{' '}
              {note.equity.samples.toLocaleString()} samples ·{' '}
              {learningFacts.confidence().display().percent} interval{' '}
              {percent(note.equity.players[0].equity.interval[0])}–
              {percent(note.equity.players[0].equity.interval[1])}.
            </p>
            {note.reference && (
              <p>
                Exact range equity{' '}
                {percent(note.reference.players[0].equity.value)} · gap{' '}
                {(
                  (note.equity.players[0].equity.value -
                    note.reference.players[0].equity.value) *
                  100
                ).toFixed(3)}{' '}
                percentage points.
              </p>
            )}
            {note.guess !== undefined && (
              <p>Your pre-reveal estimate: {percent(note.guess)}.</p>
            )}
            <code className="seed-code">
              Analysis seed: {note.analysisSeed}
            </code>
          </div>
        ))}
      </details>
      <h3>Run this street out 10,000 times</h3>
      <p>
        This comparison deals one board per trial, even for a hand originally
        run twice.
      </p>
      <label htmlFor="runout-street">Start from</label>
      <select
        id="runout-street"
        value={street}
        disabled={running}
        onChange={(e) => {
          setStreet(e.target.value as Street);
          setResult(null);
        }}
      >
        {(Object.keys(final.boards) as Street[]).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button disabled={running} onClick={() => void run()}>
        Run out 10,000 times
      </button>
      {running && (
        <button
          onClick={() => {
            worker.current?.terminate();
            worker.current = null;
            setRunning(false);
          }}
        >
          Cancel runout
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      <p className="hint">
        All revealed hands stay fixed; future board cards are re-dealt without
        replacement. This is a showdown experiment using the final matched
        contributions, including for a hand that originally ended in a fold. It
        does not replay future betting.
      </p>
      {result && (
        <>
          <p>
            {result.method} · {result.samples.toLocaleString()} samples.
            Expected net chips:{' '}
            {(result.meanAwards[0] - final.finalContributions[0]).toFixed(2)}.
            {learningFacts.confidence().display().percent} interval:{' '}
            {result.intervals[0]
              .map((v) => (v - final.finalContributions[0]).toFixed(2))
              .join(' to ')}
            .
          </p>
          <Histogram
            label="Net chip outcome frequencies"
            items={result.heroOutcomes.map((b) => ({
              value: b.award - final.finalContributions[0],
              count: b.count,
            }))}
          />
          <p>
            This comparison runs one board per trial, even for a hand dealt
            twice. Each sampled deal settles every main and side pot using its
            eligibility and odd-chip order.
          </p>
        </>
      )}
    </section>
  );
}
