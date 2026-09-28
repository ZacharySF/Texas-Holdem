import { readForecasts, forecastXp } from '../arcade/forecastStorage';
import { readDrill, drillXp } from '../arcade/progress';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  act,
  newGame,
  legalActions,
  playerView,
  potSize,
  type Game,
  type GameConfig,
  type Action,
} from '../../engine/game';
import { directOptions } from '../../engine/coach';
import { Rational } from '../../engine/math';
import { PERSONAS, type Persona } from '../../engine/bots';
import type { PlayResponse } from '../../workers/playProtocol';
import { newSeed } from '../lab/state';
import { decodeProgress, mastered, PROGRESS_KEY } from '../learn/progress';
import {
  seedHash,
  analysisSeed,
  saveHand,
  loadHands,
  parseProfile,
  awardHand,
  PROFILE_KEY,
  type SavedHand,
  type DecisionNote,
  type Profile,
} from './storage';
import { PlayingCards } from '../../ui/PlayingCards';
import { CoachPanel, type Assessment } from './CoachPanel';
import { HistoryPanel } from './HistoryPanel';
import './play.css';
function readProfile(): Profile {
  try {
    return parseProfile(localStorage.getItem(PROFILE_KEY));
  } catch {
    return parseProfile(null);
  }
}
export default function Play() {
  const [profile, setProfile] = useState(readProfile),
    [persona, setPersona] = useState<Persona>('tight-passive'),
    [bigBlind, setBigBlind] = useState(10),
    [seats, setSeats] = useState(2),
    [twice, setTwice] = useState(false),
    [pending, setPending] = useState<{
      config: GameConfig;
      hash: string;
    } | null>(null),
    [game, setGame] = useState<Game | null>(null),
    [commitment, setCommitment] = useState(''),
    [assessment, setAssessment] = useState<Assessment | null>(null),
    [thinking, setThinking] = useState(false),
    [error, setError] = useState(''),
    [coach, setCoach] = useState(true),
    [exam, setExam] = useState(false),
    [guess, setGuess] = useState(''),
    [revealedAt, setRevealedAt] = useState(-1),
    [raise, setRaise] = useState(''),
    [foldPercent, setFoldPercent] = useState(0),
    [grade, setGrade] = useState(''),
    [history, setHistory] = useState<SavedHand[]>([]),
    [review, setReview] = useState<SavedHand | null>(null),
    [retry, setRetry] = useState(0);
  const notes = useRef<DecisionNote[]>([]),
    worker = useRef<Worker | null>(null),
    saved = useRef(new Set<string>());
  const [lessonXp] = useState(() => {
    try {
      return (
        Object.values(
          decodeProgress(localStorage.getItem(PROGRESS_KEY)).results,
        ).filter(mastered).length * 20
      );
    } catch {
      return 0;
    }
  });
  const [arcadeXp] = useState(
    () => drillXp(readDrill()) + forecastXp(readForecasts()),
  );
  const xp = profile.xp + lessonXp + arcadeXp,
    active = game && !game.complete;
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      setError('Bankroll and XP cannot be saved in this browser.');
    }
  }, [profile]);
  useEffect(() => {
    void loadHands()
      .then(setHistory)
      .catch(() =>
        setError(
          'Hand-history storage is unavailable. The current hand still works in memory.',
        ),
      );
    return () => worker.current?.terminate();
  }, []);
  useEffect(() => {
    if (game && !game.complete) {
      const l = legalActions(game);
      setRaise(String(Math.min(l.minRaiseTo, l.maxRaiseTo)));
    }
  }, [game]);
  useEffect(() => {
    worker.current?.terminate();
    worker.current = null;
    setAssessment(null);
    setGuess('');
    setRevealedAt(-1);
    setFoldPercent(0);
    if (!game || game.complete) {
      setThinking(false);
      return;
    }
    const legal = legalActions(game);

    setThinking(true);
    let cancelled = false;
    void analysisSeed(game.config.seed, `decision:${game.history.length}`)
      .then((seed) => {
        if (cancelled) return;
        const current = new Worker(
          new URL('../../workers/play.worker.ts', import.meta.url),
          { type: 'module' },
        );
        worker.current = current;
        current.onmessage = (event: MessageEvent<PlayResponse>) => {
          if (cancelled || worker.current !== current) return;
          const response = event.data;
          setThinking(false);
          if (response.type === 'error') {
            setError(response.message);
            current.terminate();
            return;
          }
          const value: Assessment = {
            equity: response.equity,
            seed,
            reference: response.reference,
            options: response.options,
          };
          if (game.actor > 0 && response.action) {
            try {
              const next = act(game, response.action);
              notes.current.push({
                index: game.history.length,
                seat: game.actor,
                action: response.action,
                reason: response.reason ?? 'Seeded bot decision.',
                equity: response.equity,
                analysisSeed: seed,
                reference: response.reference,
              });
              setGame(next);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Bot action failed.');
            }
          } else setAssessment(value);
          current.terminate();
        };
        current.onerror = () => {
          if (!cancelled) {
            setThinking(false);
            setError('Analysis worker failed. Use Retry analysis.');
            current.terminate();
          }
        };
        current.postMessage({
          view: playerView(game, game.actor),
          persona,
          seed,
          bot: game.actor > 0,
          raiseTo:
            Number(raise) >= legal.minRaiseTo &&
            Number(raise) <= legal.maxRaiseTo
              ? Number(raise)
              : Math.min(legal.minRaiseTo, legal.maxRaiseTo),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setThinking(false);
          setError('Web Crypto is required for reproducible decision seeds.');
        }
      });
    return () => {
      cancelled = true;
      worker.current?.terminate();
      worker.current = null;
    };
  }, [game, persona, retry, raise]);
  useEffect(() => {
    if (!game?.complete || saved.current.has(game.config.seed)) return;
    saved.current.add(game.config.seed);
    const record: SavedHand = {
      version: 1,
      id: game.config.seed,
      date: new Date().toISOString(),
      config: game.config,
      commitment,
      persona,
      actions: game.history,
      notes: [...notes.current],
    };
    setReview(record);
    setHistory((h) => [record, ...h.filter((item) => item.id !== record.id)]);
    setProfile((p) =>
      awardHand(
        p,
        record.id,
        game.config.stacks[0],
        game.players[0].stack,
        notes.current.filter(
          (n) =>
            n.seat === 0 &&
            n.gap !== undefined &&
            n.gap <= game.config.bigBlind / 2,
        ).length,
      ),
    );
    void saveHand(record).catch(() =>
      setError(
        'This hand is available in memory, but could not be saved to IndexedDB.',
      ),
    );
  }, [game, commitment, persona]);
  async function prepare() {
    try {
      setError('');
      const seed = newSeed(),
        config: GameConfig = {
          seed,
          stacks: Array.from({ length: seats }, (_, i) =>
            i === 0
              ? Math.min(profile.bankroll, bigBlind * 200)
              : bigBlind * (seats === 2 ? 200 : 80 + i * 20),
          ),
          button: game
            ? (game.config.button + 1) % seats
            : profile.hands % seats,
          smallBlind: Math.floor(bigBlind / 2),
          bigBlind,
          runItTwice: twice,
        };
      const hash = await seedHash(seed);
      setPending({ config, hash });
    } catch {
      setError(
        'A secure browser context with Web Crypto is required to commit a deal.',
      );
    }
  }
  function deal() {
    if (!pending) return;
    try {
      const next = newGame(pending.config);
      notes.current = [];
      setCommitment(pending.hash);
      setGame(next);
      setPending(null);
      setReview(null);
      setGrade('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cannot deal.');
    }
  }
  function submit(action: Action) {
    if (!game || game.actor !== 0 || !assessment) return;
    try {
      const next = act(game, action),
        view = playerView(game, 0),
        value = assessment.equity.players[0].equity,
        equity = new Rational(
          BigInt(value.numerator),
          BigInt(value.denominator),
        ),
        options = assessment.options
          ? {
              fold: 0,
              check: assessment.options.call,
              call: assessment.options.call,
              raise: assessment.options.raise,
            }
          : directOptions(
              view,
              equity,
              modelRaiseTo,
              new Rational(foldPercent, 100),
            ),
        candidates = [
          options.fold,
          view.legal.canCheck ? options.check : options.call,
          ...(view.legal.canRaise ? [options.raise] : []),
        ],
        gap = Math.max(...candidates) - options[action.type],
        reason = `${gap <= game.config.bigBlind / 2 ? 'Close to the best direct-odds option' : `${gap.toFixed(2)} chips below the best modeled option`}. Direct odds ignore future betting and depend on the range estimate. ${assessment.options ? 'Multiway pots are awarded separately; all live opponents are assumed to call the chosen amount.' : 'Raise fold chance was your assumption;'} close gaps can be sampling noise.`;
      notes.current.push({
        index: game.history.length,
        seat: 0,
        action,
        reason,
        equity: assessment.equity,
        analysisSeed: assessment.seed,
        reference: assessment.reference,
        gap,
        guess: exam ? Number(guess) / 100 : undefined,
      });
      setGrade(reason);
      setGame(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That action is unavailable.');
    }
  }
  const heroTurn = !!active && game.actor === 0,
    legal = game ? legalActions(game) : null,
    showCoach =
      coach &&
      heroTurn &&
      assessment &&
      (!exam || revealedAt === game.history.length),
    canAct =
      heroTurn && !!assessment && (!exam || revealedAt === game.history.length),
    raiseTo = Number(raise),
    requiredXp = [0, 20, 40, 60];
  const modelRaiseTo =
    legal &&
    Number.isSafeInteger(raiseTo) &&
    raiseTo > game!.bet &&
    raiseTo <= legal.maxRaiseTo &&
    (raiseTo >= legal.minRaiseTo || raiseTo === legal.maxRaiseTo)
      ? raiseTo
      : Math.min(legal?.minRaiseTo ?? 0, legal?.maxRaiseTo ?? 0);
  return (
    <main className="play">
      <header className="play-header">
        <div>
          <span className="eyebrow">PLAY / NO-LIMIT HOLD’EM</span>
          <h1>
            Make the decision.
            <br />
            <em>Then see the math.</em>
          </h1>
        </div>
        <div className="bankroll">
          <span>PLAY-MONEY BANKROLL</span>
          <strong>{profile.bankroll.toLocaleString()}</strong>
          <small>
            {xp} XP · {profile.hands} completed hands
          </small>
        </div>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}{' '}
          {active && (
            <button
              onClick={() => {
                setError('');
                setRetry((n) => n + 1);
              }}
            >
              Retry analysis
            </button>
          )}
        </p>
      )}
      <section className="panel play-settings">
        <label>
          <input
            type="checkbox"
            checked={twice}
            disabled={!!active || !!pending}
            onChange={(e) => setTwice(e.target.checked)}
          />{' '}
          Run it twice when betting is closed by all-ins
        </label>
        <p className="hint">
          All seats agree before the deal. Remaining boards use the same deck
          without replacement; each pot is split across both boards. Final
          fractional chips are rounded once, clockwise from the button.
        </p>
        <label>
          Table size
          <select
            aria-label="Table size"
            value={seats}
            disabled={!!active || !!pending}
            onChange={(e) => setSeats(Number(e.target.value))}
          >
            <option value={2}>Heads-up</option>
            <option value={6}>6-max</option>
          </select>
        </label>
        <div>
          <label htmlFor="persona">Bot persona</label>
          <select
            id="persona"
            value={persona}
            disabled={!!active || !!pending}
            onChange={(e) => setPersona(e.target.value as Persona)}
          >
            {PERSONAS.map((p, i) => (
              <option key={p} value={p} disabled={xp < requiredXp[i]}>
                {p}
                {xp < requiredXp[i] ? ` · unlock at ${requiredXp[i]} XP` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stakes">Blinds</label>
          <select
            id="stakes"
            value={bigBlind}
            disabled={!!active || !!pending}
            onChange={(e) => setBigBlind(Number(e.target.value))}
          >
            {[10, 20, 50].map((b, i) => (
              <option value={b} key={b} disabled={xp < i * 40}>
                {b / 2} / {b}
                {xp < i * 40 ? ` · unlock at ${i * 40} XP` : ''}
              </option>
            ))}
          </select>
        </div>
        <label>
          <input
            type="checkbox"
            checked={coach}
            onChange={(e) => setCoach(e.target.checked)}
          />{' '}
          Coach
        </label>
        <label>
          <input
            type="checkbox"
            checked={exam}
            onChange={(e) => {
              setExam(e.target.checked);
              if (e.target.checked) setCoach(true);
            }}
          />{' '}
          Exam mode
        </label>
        <p className="hint">
          Earn 20 XP per completed hand or mastered lesson, plus 5 XP for
          decisions close to this coach model. Higher stakes and additional bots
          unlock with XP. Outs Rush adds 5 XP per new correct answer in a seed’s
          best completed set. These chips have no cash value.
        </p>
      </section>
      {!active && !pending && (
        <div className="play-actions">
          <button
            className="primary"
            disabled={profile.bankroll < 1}
            onClick={() => void prepare()}
          >
            Commit next deal
          </button>
          {profile.bankroll < 1 && (
            <button
              onClick={() => setProfile((p) => ({ ...p, bankroll: 2000 }))}
            >
              Refill play-money bankroll
            </button>
          )}
        </div>
      )}
      {pending && (
        <section className="panel commitment">
          <h2>Seed committed before the deal</h2>
          <code className="seed-code">{pending.hash}</code>
          <p>
            The SHA-256 hash is fixed now. The seed will be revealed after the
            hand so you can verify and replay it.
          </p>
          <button className="primary" onClick={deal}>
            Deal committed hand
          </button>
        </section>
      )}
      {game && (
        <section className="felt-table" aria-label="Poker table">
          <div className="opponent-seats">
            {game.players.slice(1).map((p, index) => {
              const seat = index + 1;
              return (
                <div
                  key={seat}
                  className={`seat bot-seat ${game.actor === seat && !game.complete ? 'acting' : ''}`}
                >
                  <h2>
                    Seat {seat + 1} · {persona}
                    {game.config.button === seat ? ' · Button' : ''}
                  </h2>
                  <p>
                    {p.stack} chips · {p.round} this round
                    {p.folded ? ' · folded' : ''}
                  </p>
                  <PlayingCards
                    cards={game.complete ? p.hand : []}
                    hidden={game.complete ? 0 : 2}
                  />
                </div>
              );
            })}
          </div>
          <div className="table-center">
            <span className="pot-chip">POT {potSize(game)}</span>
            <p className="eyebrow">
              {game.complete ? 'HAND COMPLETE' : game.street.toUpperCase()}
            </p>
            <PlayingCards cards={game.board} />
            {game.runouts && (
              <div>
                <p>Second runout</p>
                <PlayingCards cards={game.runouts[1]} />
              </div>
            )}
            {game.board.length === 0 && (
              <p className="hint">
                The community cards arrive after preflop betting.
              </p>
            )}
          </div>
          <div className={`seat hero-seat ${heroTurn ? 'acting' : ''}`}>
            <PlayingCards cards={game.players[0].hand} />
            <h2>
              You
              {game.config.button === 0
                ? game.players.length === 2
                  ? ' · Button / small blind'
                  : ' · Button'
                : ''}
            </h2>
            <p>
              {game.players[0].stack} chips · {game.players[0].round} this round
              {game.players[0].folded ? ' · folded' : ''}
            </p>
          </div>
          <p role="status" className="table-status">
            {game.complete
              ? `Hand over. You receive ${game.awards[0]} chips from the matched pots.`
              : game.actor > 0
                ? 'Bot is considering its visible cards and the public action.'
                : thinking
                  ? 'Calculating your visible-card estimates…'
                  : 'Your action.'}
          </p>
        </section>
      )}
      {heroTurn && exam && revealedAt !== game.history.length && (
        <section className="panel">
          <h2>Estimate before you reveal</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(guess);
              if (guess.trim() && Number.isFinite(n) && n >= 0 && n <= 100) {
                setRevealedAt(game.history.length);
                setError('');
              } else
                setError(
                  `Enter an equity estimate from ${new Rational(0).display().percent} to ${new Rational(1).display().percent}.`,
                );
            }}
          >
            <label htmlFor="exam-guess">
              Your estimated equity, in percent
            </label>
            <input
              id="exam-guess"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              inputMode="decimal"
            />
            <button disabled={!assessment} type="submit">
              Reveal coach
            </button>
          </form>
        </section>
      )}
      {heroTurn && legal && (
        <section className="panel action-panel">
          <h2>Your action</h2>
          <div className="play-actions">
            <button disabled={!canAct} onClick={() => submit({ type: 'fold' })}>
              Fold
            </button>
            {legal.canCheck ? (
              <button
                className="primary"
                disabled={!canAct}
                onClick={() => submit({ type: 'check' })}
              >
                Check
              </button>
            ) : (
              <button
                className="primary"
                disabled={!canAct}
                onClick={() => submit({ type: 'call' })}
              >
                Call {legal.toCall}
                {game.players[0].stack === legal.toCall ? ' · all in' : ''}
              </button>
            )}
          </div>
          {legal.canRaise && (
            <div className="raise-controls">
              <label htmlFor="raise-to">
                Raise to (total chips this round)
              </label>
              <input
                id="raise-to"
                type="number"
                min={Math.min(legal.minRaiseTo, legal.maxRaiseTo)}
                max={legal.maxRaiseTo}
                step="1"
                value={raise}
                onChange={(e) => setRaise(e.target.value)}
              />
              <button
                disabled={
                  !canAct ||
                  !Number.isInteger(raiseTo) ||
                  raiseTo <= game.bet ||
                  raiseTo > legal.maxRaiseTo ||
                  (raiseTo < legal.minRaiseTo && raiseTo !== legal.maxRaiseTo)
                }
                onClick={() => submit({ type: 'raise', to: raiseTo })}
              >
                Raise to {raise || '…'}
              </button>
              <button
                disabled={!canAct}
                onClick={() => {
                  setRaise(String(legal.maxRaiseTo));
                }}
              >
                Set all-in amount
              </button>
              <p className="hint">
                Full minimum: {legal.minRaiseTo}. Maximum: {legal.maxRaiseTo}. A
                shorter raise is allowed only for your full stack and does not
                reopen betting for a player who already acted.
              </p>
            </div>
          )}
        </section>
      )}
      {grade && (
        <section className="panel decision-grade">
          <h2>Your last decision grade</h2>
          <p>{grade}</p>
          <Link to="/learn/12-2">Review direct call EV →</Link>
        </section>
      )}
      {showCoach && (
        <CoachPanel
          view={playerView(game, 0)}
          assessment={assessment}
          raiseTo={modelRaiseTo}
          foldPercent={foldPercent}
          onFoldPercent={setFoldPercent}
        />
      )}
      {game && !game.complete && (
        <details className="commitment-current">
          <summary>Current deal commitment</summary>
          <code className="seed-code">{commitment}</code>
          <p>The seed and all hands will be shown when this hand ends.</p>
        </details>
      )}
      {review && !active && <HistoryPanel key={review.id} hand={review} />}
      <section className="panel">
        <h2>Saved hands on this device</h2>
        {history.length ? (
          <ul className="saved-hands">
            {history.slice(0, 30).map((h) => (
              <li key={h.id}>
                <button
                  disabled={!!active}
                  onClick={() => {
                    try {
                      newGame(h.config);
                      setReview(h);
                      setError('');
                    } catch {
                      setError(
                        'This saved hand is malformed and cannot be replayed.',
                      );
                    }
                  }}
                >
                  {new Date(h.date).toLocaleString()} · {h.persona} · review
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Completed hands will be saved here with their seed, actions, and
            reasoning.
          </p>
        )}
      </section>
    </main>
  );
}
