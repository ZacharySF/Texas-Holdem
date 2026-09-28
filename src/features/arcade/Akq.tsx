import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  kuhnDeal,
  kuhnBot,
  kuhnTerminal,
  kuhnEquilibrium,
} from '../../engine/kuhn';
import { Rng } from '../../engine/rng';
import { newSeed } from '../lab/state';
import { FinalExperiment } from '../../ui/FinalExperiment';
import { finalFacts } from '../../content/facts';
export default function Akq() {
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
      <span className="eyebrow">ARCADE / AKQ</span>
      <h1>One card. One bet.</h1>
      <p>
        Q &lt; K &lt; A. Each player antes one chip and receives one distinct
        card. Check or bet one; facing a bet, fold or call. No raises. Payoffs
        include the ante.
      </p>
      <button onClick={() => setParams({ seed: newSeed() })}>New deal</button>
      <Hand key={seed} seed={seed} />
      <h2>Train a small solver</h2>
      <p>
        CFR visits every deal and information set, accumulates regret, and
        averages the strategies. Compare the resulting policy with a complete
        best-response enumeration. This does not solve full Hold’em.
      </p>
      <FinalExperiment request={{ type: 'cfr', iterations: 10000 }} />
      <p>
        Exact first-player equilibrium value:{' '}
        {finalFacts.kuhnExactValue().toString()} chips per hand. The bot uses an
        equilibrium policy and only its own card and public history.
      </p>
      <Link to="/learn/25-1">Work through counterfactual regrets</Link>
    </main>
  );
}
function Hand({ seed }: { seed: string }) {
  const [cards] = useState(() => kuhnDeal(seed)),
    [history, setHistory] = useState(''),
    [transcript, setTranscript] = useState<string[]>([]),
    result = kuhnTerminal(cards, history),
    facing = history.endsWith('b');
  function submit(action: 'p' | 'b') {
    if (result !== null) return;
    let h = history + action;
    const notes = [
      ...transcript,
      `You ${action === 'b' ? (facing ? 'call' : 'bet') : facing ? 'fold' : 'check'}.`,
    ];
    if (kuhnTerminal(cards, h) === null && h.length % 2 === 1) {
      const rng = new Rng(seed);
      for (let i = 0; i < 8 + h.length; i++) rng.nextUint32();
      const a = kuhnBot(cards[1], h, rng);
      notes.push(
        `Bot ${a === 'b' ? (h.endsWith('b') ? 'calls' : 'bets') : h.endsWith('b') ? 'folds' : 'checks'}.`,
      );
      h += a;
    }
    setHistory(h);
    setTranscript(notes);
  }
  return (
    <section className="panel">
      <h2>Your card: {['Q', 'K', 'A'][cards[0]]}</h2>
      <p>Bot card: {result === null ? 'hidden' : ['Q', 'K', 'A'][cards[1]]}</p>
      <div className="tool-actions">
        <button disabled={result !== null} onClick={() => submit('p')}>
          {facing ? 'Fold' : 'Check'}
        </button>
        <button disabled={result !== null} onClick={() => submit('b')}>
          {facing ? 'Call' : 'Bet one'}
        </button>
      </div>
      <ol>
        {transcript.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      {result !== null && (
        <>
          <p role="status">
            Your net result: {result} chips. Bot result: {-result}.
          </p>
          <p>
            Revealed seed: <code>{seed}</code>
          </p>
          <details>
            <summary>Bot policy at every public information set</summary>
            {Object.entries(kuhnEquilibrium()).map(([key, p]) => (
              <p key={key}>
                {key}: bet/call frequency {p.toFixed(4)}.
              </p>
            ))}
          </details>
          <button
            onClick={() => {
              setHistory('');
              setTranscript([]);
            }}
          >
            Replay this exact deal
          </button>
        </>
      )}
    </section>
  );
}
