import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  deck,
  parseCards,
  type Card as CardValue,
  type Hand,
} from '../../engine/cards';
import {
  planEquity,
  type EquityInput,
  type EquityResult,
  type Method,
} from '../../engine/equity';
import { Rng, shuffle } from '../../engine/rng';
import { evaluateReference } from '../../engine/evaluator';
import { Card } from '../../ui/Card';
import { SeedInput } from '../../ui/SeedInput';
import { CardPicker } from '../../ui/CardPicker';
import { ConvergenceChart } from '../../ui/ConvergenceChart';
import { Probability, percent } from '../../ui/Probability';
import type { WorkerResponse } from '../../workers/protocol';
import { decodeState, newSeed, type LabState } from './state';
import styles from './Lab.module.css';
type Target = {
  group: 'player' | 'board' | 'dead';
  player: number;
  index: number;
  label: string;
};
export function Lab() {
  const [params, setParams] = useSearchParams();
  const [fallback] = useState<LabState>(() => ({
    players: [parseCards('As Ah'), parseCards('Ks Kh')],
    board: [],
    dead: [],
    seed: newSeed(),
    samples: 10000,
    method: 'monteCarlo',
  }));
  useEffect(() => {
    if (!params.has('state')) {
      setParams({ state: JSON.stringify(fallback) }, { replace: true });
    }
  }, [params, setParams, fallback]);
  const decoded = useMemo(
    () => decodeState(params.get('state'), fallback),
    [params, fallback],
  );
  const state = decoded.state;
  const [target, setTarget] = useState<Target | null>(null),
    [result, setResult] = useState<EquityResult | null>(null),
    [reference, setReference] = useState<EquityResult | null>(null),
    [history, setHistory] = useState<EquityResult[]>([]),
    [running, setRunning] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const worker = useRef<Worker | null>(null);
  const start = useCallback((input: EquityInput) => {
    worker.current?.terminate();
    setRunning(true);
    setError('');
    setNotice('');
    setHistory([]);
    setResult(null);
    setReference(null);
    const current = new Worker(
      new URL('../../workers/equity.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.current = current;
    current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (worker.current !== current) return;
      const message = event.data;
      if (message.type === 'error') {
        setError(message.message);
        setRunning(false);
        current.terminate();
        return;
      }
      if (message.type === 'reference') {
        setReference(message.result);
        return;
      }
      setResult(message.result);
      if (message.result.method === 'monteCarlo')
        setHistory((h) => [...h, ...(message.trace ?? [message.result])]);
      if (message.type === 'result') {
        setRunning(false);
        current.terminate();
      }
    };
    current.onerror = () => {
      if (worker.current === current) {
        setError('The worker stopped unexpectedly. Try a smaller run.');
        setRunning(false);
        current.terminate();
      }
    };
    current.postMessage({ type: 'run', input });
  }, []);
  const configKey = JSON.stringify(state);
  useEffect(() => {
    setResult(null);
    setReference(null);
    setHistory([]);
    setError('');
    setNotice('');
    setRunning(false);
    worker.current?.terminate();
    worker.current = null;
  }, [configKey]);
  useEffect(() => () => worker.current?.terminate(), []);
  function update(next: LabState) {
    worker.current?.terminate();
    worker.current = null;
    setRunning(false);
    setParams({ state: JSON.stringify(next) }, { replace: true });
  }
  const prepared = useMemo(() => {
    try {
      if (state.players.some((p) => p !== 'random' && p.length !== 2))
        throw new Error('Choose two cards for each specific hand.');
      const input: EquityInput = {
        ...state,
        players: state.players.map((p) =>
          p === 'random' ? 'random' : ([p[0], p[1]] as Hand),
        ),
      };
      return { input, plan: planEquity(input), error: '' };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid setup.' };
    }
  }, [state]);
  const used = [
    ...state.players.flatMap((p) => (p === 'random' ? [] : p)),
    ...state.board,
    ...state.dead,
  ];
  function pick(card: CardValue | undefined) {
    if (!target) return;
    const next = structuredClone(state);
    const cards =
      target.group === 'player'
        ? next.players[target.player]
        : next[target.group];
    if (cards === 'random') return;
    if (card === undefined) cards.splice(target.index, 1);
    else cards[target.index] = card;
    update(next);
    setTarget(null);
  }
  function run(method: Method, samples = state.samples) {
    if (!prepared.input) return;
    // Save the chosen run before starting; the URL effect clears only the previous worker.
    const next = { ...state, method, samples };
    if (JSON.stringify(next) !== configKey) {
      setParams({ state: JSON.stringify(next) }, { replace: true });
      pending.current = { ...prepared.input, method, samples };
      return;
    }
    start({ ...prepared.input, method, samples });
  }
  const pending = useRef<EquityInput | null>(null);
  useEffect(() => {
    if (pending.current) {
      const input = pending.current;
      pending.current = null;
      start(input);
    }
  }, [configKey, start]);

  function cancel() {
    worker.current?.terminate();
    worker.current = null;
    setRunning(false);
    setNotice('Run cancelled. The last completed batch is shown.');
  }
  function deal() {
    const seed = newSeed(),
      cards = shuffle(
        deck().filter((c) => !state.dead.includes(c)),
        new Rng(seed),
      );
    let cursor = 0;
    const needed =
      state.players.filter((p) => p !== 'random').length * 2 +
      state.board.length;
    if (cards.length < needed) {
      setError('Clear some dead cards before dealing.');
      return;
    }
    update({
      ...state,
      seed,
      players: state.players.map((p) =>
        p === 'random' ? 'random' : [cards[cursor++], cards[cursor++]],
      ),
      board: state.board.map(() => cards[cursor++]),
    });
  }
  async function share() {
    const url = new URL(window.location.href);
    url.hash = `/lab?${new URLSearchParams({ state: JSON.stringify(state) })}`;
    try {
      await navigator.clipboard.writeText(url.href);
      setNotice(
        'Link copied. It includes cards, seed, method, and sample count.',
      );
    } catch {
      setNotice('Copy the address from your browser to share this setup.');
      setParams({ state: JSON.stringify(state) }, { replace: true });
    }
  }
  const exact =
    reference ??
    (result?.method === 'exact' && result.complete ? result : null);
  return (
    <main className={styles.lab}>
      <header className={styles.intro}>
        <div>
          <span className="eyebrow">EXPERIMENT 01 / EQUITY LAB</span>
          <h1>
            Put the odds
            <br />
            <em>on the table.</em>
          </h1>
          <p>
            Choose the cards. Count every possible finish, or deal thousands of
            boards and watch the answer take shape.
          </p>
        </div>
        <div className={styles.introAside}>
          <span className={styles.orbit}>
            A<span>♠</span>
          </span>
          <p>
            One deck. Many futures.
            <br />
            Every result reproducible.
          </p>
        </div>
      </header>
      <div className={styles.workspace}>
        <section
          className={`panel ${styles.setup}`}
          aria-labelledby="setup-title"
        >
          <div className="section-head">
            <h2 id="setup-title">The setup</h2>
            <button className="text-button" onClick={deal}>
              Deal random
            </button>
          </div>
          <div className={styles.hands}>
            {state.players.map((hand, p) => (
              <div className={styles.hand} key={p}>
                <div className="section-head">
                  <label className="eyebrow" htmlFor={`player-${p}`}>
                    {p === 0 ? 'YOUR HAND' : `OPPONENT ${p}`}
                  </label>
                  {p > 0 && (
                    <select
                      id={`player-${p}`}
                      aria-label={`Opponent ${p} hand type`}
                      value={hand === 'random' ? 'random' : 'specific'}
                      onChange={(e) => {
                        const players = [...state.players];
                        players[p] =
                          e.target.value === 'random' ? 'random' : [];
                        update({ ...state, players });
                      }}
                    >
                      <option value="specific">Specific</option>
                      <option value="random">Random</option>
                    </select>
                  )}
                </div>
                <div className={styles.cardRow}>
                  {hand === 'random' ? (
                    <div className={styles.randomHand}>
                      <span>?</span>
                      <p>
                        Any available
                        <br />
                        two cards
                      </p>
                    </div>
                  ) : (
                    [0, 1].map((i) => (
                      <Card
                        key={`${i}-${hand[i]}`}
                        card={hand[i]}
                        label={`${p === 0 ? 'Your hand' : `Opponent ${p}`} card ${i + 1}`}
                        onClick={() =>
                          setTarget({
                            group: 'player',
                            player: p,
                            index: Math.min(i, hand.length),
                            label: p === 0 ? 'Your hand' : `Opponent ${p}`,
                          })
                        }
                      />
                    ))
                  )}
                </div>
                {p > 1 && (
                  <button
                    className="text-button"
                    onClick={() =>
                      update({
                        ...state,
                        players: state.players.filter((_, i) => i !== p),
                      })
                    }
                  >
                    Remove opponent {p}
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            className="secondary"
            disabled={state.players.length >= 9}
            onClick={() =>
              update({ ...state, players: [...state.players, 'random'] })
            }
          >
            + Add opponent
          </button>
          <div className={styles.board}>
            <div className="section-head">
              <h3>Community cards</h3>
              <span className="muted">{state.board.length} / 5</span>
            </div>
            <div className={styles.cardRow}>
              {Array.from({ length: 5 }, (_, i) => (
                <Card
                  key={`${i}-${state.board[i]}`}
                  card={state.board[i]}
                  label={`Board card ${i + 1}`}
                  onClick={() =>
                    setTarget({
                      group: 'board',
                      player: 0,
                      index: Math.min(i, state.board.length),
                      label: 'Community card',
                    })
                  }
                />
              ))}
            </div>
            <p className="hint">
              Leave cards open to explore possible runouts.
            </p>
          </div>
          <details>
            <summary>
              Dead cards <span className="muted">({state.dead.length})</span>
            </summary>
            <p className="hint">Known cards that cannot be dealt.</p>
            <div className={`${styles.cardRow} ${styles.deadCards}`}>
              {state.dead.map((c, i) => (
                <Card
                  key={c}
                  card={c}
                  label={`Dead card ${i + 1}`}
                  onClick={() =>
                    setTarget({
                      group: 'dead',
                      player: 0,
                      index: i,
                      label: 'Dead card',
                    })
                  }
                />
              ))}
              <button
                className="secondary"
                onClick={() =>
                  setTarget({
                    group: 'dead',
                    player: 0,
                    index: state.dead.length,
                    label: 'Add dead card',
                  })
                }
              >
                + Add
              </button>
            </div>
          </details>
          <div className={styles.seed}>
            <label htmlFor="seed">Deal seed</label>
            <SeedInput
              key={state.seed}
              seed={state.seed}
              onCommit={(seed) => update({ ...state, seed })}
            />
            <button
              className="text-button"
              onClick={() => update({ ...state, seed: newSeed() })}
            >
              New seed
            </button>
          </div>
          <div className={styles.controls}>
            <button
              className="primary"
              disabled={running || !prepared.plan?.exactFeasible}
              onClick={() => run('exact')}
            >
              Count exact
            </button>
            <button
              className="secondary"
              disabled={running || !prepared.input}
              onClick={() => run('auto')}
            >
              Auto
            </button>
          </div>
          <p className="hint">
            {prepared.error ||
              (prepared.plan?.exactFeasible
                ? `${prepared.plan.assignments.toLocaleString()} possible deals. Exact counting is available.`
                : `${prepared.plan?.assignments.toLocaleString()} possible deals. Exact is disabled above the interactive work budget; use simulation.`)}
          </p>
          <span className="eyebrow">SIMULATE BOARDS</span>
          <div className={styles.simButtons}>
            {[1000, 10000, 100000, 1000000].map((n) => (
              <button
                key={n}
                disabled={running || !prepared.input}
                onClick={() => run('monteCarlo', n)}
              >
                {n === 1000000 ? '1M' : `${n / 1000}k`}
              </button>
            ))}
          </div>
          {running && (
            <button className="cancel" onClick={cancel}>
              Cancel run
            </button>
          )}
          <button className="text-button" onClick={share}>
            Copy reproducible link ↗
          </button>
        </section>
        <section className={styles.results} aria-labelledby="results-title">
          <div className={`panel ${styles.resultPanel}`}>
            <div className="section-head">
              <h2 id="results-title">Your share of the pot</h2>
              <span className={styles.liveDot}>
                {running
                  ? 'RUNNING'
                  : result?.complete
                    ? 'COMPLETE'
                    : result
                      ? 'STOPPED'
                      : 'READY'}
              </span>
            </div>
            {(error || decoded.error) && (
              <p role="alert" className="error">
                {error || decoded.error}
              </p>
            )}
            <div role="status" aria-live="polite">
              {notice && <p className="hint">{notice}</p>}
              {running && (
                <p className="hint">
                  {result
                    ? `${result.samples.toLocaleString()} / ${result.total.toLocaleString()} deals evaluated`
                    : 'Preparing the experiment…'}
                </p>
              )}
            </div>
            {result && (result.method === 'monteCarlo' || result.complete) ? (
              <>
                <p className="method">
                  {result.method === 'exact'
                    ? result.complete
                      ? 'Exact enumeration'
                      : 'Exact enumeration in progress'
                    : 'Monte Carlo estimate'}{' '}
                  · {result.samples.toLocaleString()}{' '}
                  {result.method === 'exact' ? 'deals' : 'samples'}
                </p>
                {!result.complete && !running && (
                  <p className="hint">
                    Partial result. Start a new run to finish.
                  </p>
                )}
                <div className={styles.heroEquity}>
                  <Probability
                    label="EQUITY"
                    value={result.players[0].equity}
                    sampled={result.method === 'monteCarlo' || !result.complete}
                  />
                </div>
                <div className={styles.outcomes}>
                  {(['win', 'tie', 'loss'] as const).map((key) => (
                    <Probability
                      key={key}
                      label={key === 'loss' ? 'LOSE' : key.toUpperCase()}
                      value={result.players[0][key]}
                      sampled={
                        result.method === 'monteCarlo' || !result.complete
                      }
                    />
                  ))}
                </div>
                {result.method === 'monteCarlo' && (
                  <p className="hint">
                    Fractions describe this sample. Intervals estimate
                    uncertainty in the underlying probabilities. Equity uses an
                    approximate normal mean-share interval with a boundary
                    safeguard; win/tie/lose use Wilson intervals.
                  </p>
                )}
                {exact && result.method === 'monteCarlo' && (
                  <p className={styles.comparison}>
                    Exact equity{' '}
                    <strong>{percent(exact.players[0].equity.value)}</strong> ·
                    gap{' '}
                    <strong>
                      {(
                        (result.players[0].equity.value -
                          exact.players[0].equity.value) *
                        100
                      ).toFixed(3)}{' '}
                      percentage points
                    </strong>
                  </p>
                )}
                {result.method === 'monteCarlo' && !exact && (
                  <p className="hint">
                    An exact reference is not computed for this setup because
                    enumeration exceeds the interactive budget. Add board cards
                    to reduce the work.
                  </p>
                )}
                {result.players.length > 1 && (
                  <details>
                    <summary>All players</summary>
                    <div className={styles.allPlayers}>
                      {result.players.slice(1).map((p, i) => (
                        <div key={i}>
                          <h3>Opponent {i + 1}</h3>
                          <div className={styles.opponentValues}>
                            {(['equity', 'win', 'tie', 'loss'] as const).map(
                              (key) => (
                                <Probability
                                  key={key}
                                  label={key}
                                  value={p[key]}
                                  sampled={
                                    result.method === 'monteCarlo' ||
                                    !result.complete
                                  }
                                />
                              ),
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <div className={styles.emptyResult}>
                <div className={styles.emptyNumber}>
                  —<span>%</span>
                </div>
                <h3>How much of the pot is yours?</h3>
                <p>
                  Equity counts wins and your share of ties. Pick a run size to
                  find out.
                </p>
                <div className={styles.emptyMetrics}>
                  <span>
                    WIN <b>—</b>
                  </span>
                  <span>
                    TIE <b>—</b>
                  </span>
                  <span>
                    LOSE <b>—</b>
                  </span>
                </div>
              </div>
            )}
            <details className={styles.why}>
              <summary>Why is this the equity?</summary>
              <p>
                For each deal, compare every player's best five cards. A sole
                winner receives the whole pot. Tied winners split it equally.
                Add your shares and divide by the number of deals.
              </p>
              <p>
                Exact counting visits every legal assignment once. Simulation
                samples legal assignments with a seeded Fisher–Yates draw. Known
                hole cards, community cards, and dead cards are removed first.
                The engine keeps fractional pot shares exactly, including
                multiway ties.
              </p>
              <a href="#/learn">
                Equity and expected value · chapter 12, Phase 5
              </a>
            </details>
          </div>
          <div className={`panel ${styles.chartPanel}`}>
            <div className="section-head">
              <h2>Watch it converge</h2>
              <span className="eyebrow">SAMPLE → ESTIMATE</span>
            </div>
            <ConvergenceChart
              history={history}
              exact={exact?.players[0].equity.value}
            />
          </div>
          {state.board.length >= 3 &&
            state.players[0] !== 'random' &&
            state.players[0].length === 2 && (
              <div className="panel">
                <span className="eyebrow">YOUR HAND RIGHT NOW</span>
                <h3>
                  {
                    evaluateReference([...state.players[0], ...state.board])
                      .name
                  }
                </h3>
                <p className="hint">
                  The strongest five-card hand you can make with the cards
                  currently shown.
                </p>
              </div>
            )}
          <p className={styles.footnote}>
            A probability is a statement about possible outcomes. A single deal
            can still go either way.
          </p>
        </section>
      </div>
      {target && (
        <CardPicker
          used={used}
          label={target.label}
          onPick={pick}
          onClose={() => setTarget(null)}
        />
      )}
    </main>
  );
}
