import { readForecasts, forecastXp } from '../arcade/forecastStorage';
import { readDrill, drillXp } from '../arcade/progress';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { lessonById, lessons } from '../../content/lessons';
import { useJourney, practiceFocus, lessonReturnLink } from '../learn/journey';
import {
  act,
  newGame,
  legalActions,
  playerView,
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
import { Table, botStyles } from './Table';
import { CoachSidebar } from './CoachSidebar';
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
  const [params] = useSearchParams();
  const courseLesson = lessonById(params.get('lesson') ?? '');
  const {
    journey,
    markPlayed,
    storageError: courseStorageError,
  } = useJourney();
  const returnToLesson = courseLesson
    ? lessonReturnLink(courseLesson.id, params.get('lessonSeed'))
    : '/learn/1-1';
  const nextCourseLesson = courseLesson
    ? lessons[lessons.indexOf(courseLesson) + 1]
    : undefined;
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
    [dealing, setDealing] = useState(false),
    [guided, setGuided] = useState(true),
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
    saved = useRef(new Set<string>()),
    preparing = useRef(false);
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
    let botTimer: ReturnType<typeof setTimeout> | undefined;
    const started = performance.now();
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
              const note: DecisionNote = {
                index: game.history.length,
                seat: game.actor,
                action: response.action,
                reason: response.reason ?? 'Seeded bot decision.',
                equity: response.equity,
                analysisSeed: seed,
                reference: response.reference,
              };
              botTimer = setTimeout(
                () => {
                  if (!cancelled) {
                    notes.current.push(note);
                    setGame(next);
                  }
                },
                Math.max(0, 850 - (performance.now() - started)),
              );
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
      clearTimeout(botTimer);
      worker.current?.terminate();
      worker.current = null;
    };
  }, [game, persona, retry, raise]);
  useEffect(() => {
    if (!game?.complete || saved.current.has(game.config.seed)) return;
    saved.current.add(game.config.seed);
    if (courseLesson) markPlayed(courseLesson.id);
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
  }, [game, commitment, persona, courseLesson, markPlayed]);
  async function prepare(manual = false) {
    if (preparing.current || active || pending) return;
    preparing.current = true;
    setDealing(true);
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
      if (manual) setPending({ config, hash });
      else startHand(config, hash);
    } catch {
      setError(
        'A secure browser context with Web Crypto is required to commit a deal.',
      );
    } finally {
      preparing.current = false;
      setDealing(false);
    }
  }
  function startHand(config: GameConfig, hash: string) {
    try {
      const next = newGame(config);
      notes.current = [];
      setCommitment(hash);
      setGame(next);
      setPending(null);
      setReview(null);
      setGrade('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cannot deal.');
    }
  }
  function submit(action: Action) {
    if (!game || game.complete || game.actor !== 0) return;
    if (!assessment) {
      if (exam) return;
      try {
        setGame(act(game, action));
        setGrade(
          'You played before the estimate was ready. This action is saved in the replay without a model grade.',
        );
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'That action is unavailable.',
        );
      }
      return;
    }
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
      heroTurn &&
      (!exam || (!!assessment && revealedAt === game.history.length)),
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
          <span className="eyebrow">THE MONTE CARLO POKER ROOM</span>
          <h1>
            {game ? 'A seat at the table.' : 'Your next hand starts here.'}
          </h1>
          <p className="room-subtitle">Play the hand. Find your edge.</p>
        </div>
        <div className="bankroll">
          <span>YOUR CHIPS · PLAY MONEY</span>
          <strong>{profile.bankroll.toLocaleString()}</strong>
          <small>
            {xp} XP · {profile.hands} hands played
          </small>
        </div>
      </header>
      {!game && !courseLesson && (
        <section className="course-invitation">
          <div>
            <span className="eyebrow">NOT SURE WHERE TO BEGIN?</span>
            <h2>Start at Chapter 1. We’ll guide you.</h2>
            <p>
              Read a short lesson, play a hand with the coach, then pick up
              where you left off.
            </p>
          </div>
          <div>
            <Link className="course-primary" to="/learn/1-1">
              Start Chapter 1 →
            </Link>
            <Link
              to={
                journey.current === '1-1'
                  ? '/learn'
                  : `/learn/${journey.current}`
              }
            >
              {journey.current === '1-1'
                ? 'Browse the course'
                : 'Continue learning'}{' '}
              →
            </Link>
          </div>
        </section>
      )}
      {courseStorageError && (
        <p role="status" className="hint">
          Your course progress works for this visit, but this browser could not
          save it.
        </p>
      )}
      {courseLesson && (
        <section className="course-practice-banner">
          <span className="eyebrow">COURSE → PLAY → BACK TO YOUR LESSON</span>
          <h2>
            Practice for {courseLesson.id.replace('-', '.')} ·{' '}
            {courseLesson.title}
          </h2>
          <p>{practiceFocus(courseLesson.chapter)}</p>
          {active ? (
            <p className="hint">
              Finish this hand to save it. Your return-to-lesson button will
              appear here.
            </p>
          ) : (
            <div className="lesson-actions">
              <Link to={returnToLesson}>
                Return to lesson {courseLesson.id.replace('-', '.')} →
              </Link>
              {game?.complete && nextCourseLesson && (
                <Link to={`/learn/${nextCourseLesson.id}`}>
                  Next lesson: {nextCourseLesson.id.replace('-', '.')} →
                </Link>
              )}
            </div>
          )}
          {game?.complete && (
            <p className="course-status">
              Practice hand complete. Think about what you noticed, then
              continue the lesson.
            </p>
          )}
        </section>
      )}
      {!game && !pending && (
        <section className="game-lobby">
          <div className="lobby-copy">
            <span className="eyebrow">PULL UP A CHAIR</span>
            <h2>
              Real hands.
              <br />
              Your decisions.
            </h2>
            <p>
              Take on the bots in no-limit Hold’em. Find your rhythm at a quiet
              table, or join five opponents. Your coach walks through the game
              with you.
            </p>
            <div className="table-picker" aria-label="Choose your table">
              {[2, 6].map((count) => (
                <button
                  key={count}
                  aria-pressed={seats === count}
                  onClick={() => setSeats(count)}
                >
                  <strong>
                    {count === 2 ? 'Heads-up' : 'Six-player table'}
                  </strong>
                  <span>
                    {count === 2
                      ? 'You + one bot · room to learn'
                      : 'You + five bots · more action'}
                  </span>
                </button>
              ))}
            </div>
            <button
              className="primary start-game"
              disabled={dealing || profile.bankroll < 1}
              onClick={() => void prepare()}
            >
              {dealing ? 'Shuffling…' : 'Take a seat & play'}
            </button>
            <p className="hint">No buy-in. No timer. Just play-money poker.</p>
          </div>
          <div className="lobby-table" aria-hidden="true">
            <div className="lobby-orbit">
              <span>♠</span>
              <div className="lobby-cards">
                <span>
                  A<small>♠</small>
                </span>
                <span>
                  K<small>♥</small>
                </span>
              </div>
              <div className="lobby-chips">
                <i />
                <i />
                <i />
              </div>
              <p>THE NEXT MOVE IS YOURS</p>
            </div>
          </div>
        </section>
      )}
      <div className="session-toolbar">
        <span>
          {seats === 2 ? 'Heads-up' : 'Six-player'} · {bigBlind / 2} /{' '}
          {bigBlind} blinds · {botStyles[persona].name}
        </span>
        <label>
          <input
            type="checkbox"
            checked={guided}
            onChange={(e) => setGuided(e.target.checked)}
          />{' '}
          Walk me through the hand
        </label>
      </div>
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
      {profile.bankroll < 1 && !active && (
        <button onClick={() => setProfile((p) => ({ ...p, bankroll: 2000 }))}>
          Refill play-money bankroll
        </button>
      )}
      {pending && (
        <section className="panel commitment">
          <h2>Seed committed before the deal</h2>
          <code className="seed-code">{pending.hash}</code>
          <p>
            The SHA-256 hash is fixed now. The seed will be revealed after the
            hand so you can verify and replay it.
          </p>
          <button
            className="primary"
            onClick={() => startHand(pending.config, pending.hash)}
          >
            Deal committed hand
          </button>
        </section>
      )}
      <div className={game ? 'poker-workspace' : undefined}>
        <div className="table-column">
          {game && <Table game={game} persona={persona} />}
          {game?.complete && (
            <section className="hand-result" aria-label="Hand result">
              <div>
                <span className="eyebrow">HAND COMPLETE</span>
                <h2>
                  {game.players[0].stack > game.config.stacks[0]
                    ? 'Chips coming your way.'
                    : game.players[0].stack < game.config.stacks[0]
                      ? 'A fresh hand awaits.'
                      : 'Back where you started.'}
                </h2>
                <p>
                  <strong>
                    {game.players[0].stack - game.config.stacks[0] > 0
                      ? '+'
                      : ''}
                    {game.players[0].stack - game.config.stacks[0]} chips
                  </strong>{' '}
                  this hand · {game.awards[0]} returned from the pots
                </p>
              </div>
              <button
                className="primary"
                disabled={dealing || !!pending || profile.bankroll < 1}
                onClick={() => void prepare()}
              >
                {dealing ? 'Shuffling…' : 'Deal next hand'}
              </button>
            </section>
          )}
          {heroTurn && exam && revealedAt !== game.history.length && (
            <section className="panel">
              <h2>Estimate before you reveal</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(guess);
                  if (
                    guess.trim() &&
                    Number.isFinite(n) &&
                    n >= 0 &&
                    n <= 100
                  ) {
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
              <div className="action-heading">
                <h2>Your move</h2>
                <span>
                  {legal.canCheck
                    ? 'You can check for free'
                    : `${legal.toCall} chips to stay in`}
                </span>
              </div>
              <div className="play-actions">
                <button
                  disabled={!canAct}
                  onClick={() => submit({ type: 'fold' })}
                >
                  Fold
                  {guided && <small>Leave this hand</small>}
                </button>
                {legal.canCheck ? (
                  <button
                    className="primary"
                    disabled={!canAct}
                    onClick={() => submit({ type: 'check' })}
                  >
                    Check
                    {guided && <small>Stay in for free</small>}
                  </button>
                ) : (
                  <button
                    className="primary"
                    disabled={!canAct}
                    onClick={() => submit({ type: 'call' })}
                  >
                    Call {legal.toCall}
                    {game.players[0].stack === legal.toCall ? ' · all in' : ''}
                    {guided && <small>Match the bet</small>}
                  </button>
                )}
              </div>
              {legal.canRaise && (
                <div className="raise-controls">
                  <input
                    aria-label="Raise amount"
                    type="range"
                    min={Math.min(legal.minRaiseTo, legal.maxRaiseTo)}
                    max={legal.maxRaiseTo}
                    step="1"
                    value={modelRaiseTo}
                    disabled={!canAct}
                    onChange={(e) => setRaise(e.target.value)}
                  />
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
                      (raiseTo < legal.minRaiseTo &&
                        raiseTo !== legal.maxRaiseTo)
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
                  <details className="raise-explanation">
                    <summary>How raising works</summary>
                    <p className="hint">
                      Full minimum: {legal.minRaiseTo}. Maximum:{' '}
                      {legal.maxRaiseTo}. A shorter raise is allowed only for
                      your full stack and does not reopen betting for a player
                      who already acted.
                    </p>
                  </details>
                </div>
              )}
            </section>
          )}
        </div>
        {game && (
          <CoachSidebar
            game={game}
            guided={guided}
            feedback={grade}
            course={
              courseLesson && (
                <section className="coach-course-focus">
                  <span className="eyebrow">
                    LESSON {courseLesson.id.replace('-', '.')} · YOUR FOCUS
                  </span>
                  <p>{practiceFocus(courseLesson.chapter)}</p>
                  {game.complete && (
                    <Link to={returnToLesson}>Return to your lesson →</Link>
                  )}
                </section>
              )
            }
            odds={
              showCoach ? (
                <CoachPanel
                  view={playerView(game, 0)}
                  assessment={assessment}
                  raiseTo={modelRaiseTo}
                  foldPercent={foldPercent}
                  onFoldPercent={setFoldPercent}
                />
              ) : (
                <p role="status">
                  {game.complete
                    ? 'This hand is over. Open Review this hand below the table to see the cards, replay the action, and explore the results.'
                    : exam && heroTurn && revealedAt !== game.history.length
                      ? 'Make your equity prediction at the table first, then choose Reveal coach.'
                      : !coach
                        ? 'Turn on Coach in Table settings to see the estimates.'
                        : heroTurn && thinking
                          ? 'Updating your estimate. You can still act while it loads.'
                          : 'I’ll show your odds when it is your turn. For now, follow the action in Explain the hand.'}
                </p>
              )
            }
          />
        )}
      </div>
      {game && !game.complete && (
        <details className="commitment-current">
          <summary>Current deal commitment</summary>
          <code className="seed-code">{commitment}</code>
          <p>The seed and all hands will be shown when this hand ends.</p>
        </details>
      )}
      {review && !active && (
        <details className="review-drawer" key={review.id}>
          <summary>Review this hand · replay, cards &amp; bot thinking</summary>
          <HistoryPanel hand={review} />
        </details>
      )}
      <details className="panel table-settings">
        <summary>Table settings &amp; advanced options</summary>
        <div className="play-settings">
          <label>
            <input
              type="checkbox"
              checked={twice}
              disabled={!!active || !!pending || dealing}
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
              disabled={!!active || !!pending || dealing}
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
              disabled={!!active || !!pending || dealing}
              onChange={(e) => setPersona(e.target.value as Persona)}
            >
              {PERSONAS.map((p, i) => (
                <option key={p} value={p} disabled={xp < requiredXp[i]}>
                  {botStyles[p].name}
                  {xp < requiredXp[i] ? ` · unlock at ${requiredXp[i]} XP` : ''}
                </option>
              ))}
            </select>
            <p className="hint">
              {botStyles[persona].description}
              {seats === 6 ? ' All five opponents use this style.' : ''}
            </p>
          </div>
          <div>
            <label htmlFor="stakes">Blinds</label>
            <select
              id="stakes"
              value={bigBlind}
              disabled={!!active || !!pending || dealing}
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
            decisions close to this coach model. Higher stakes and additional
            bots unlock with XP. Outs Rush adds 5 XP per new correct answer in a
            seed’s best completed set. These chips have no cash value.
          </p>
        </div>
        {!active && !pending && (
          <button
            disabled={dealing || profile.bankroll < 1}
            onClick={() => void prepare(true)}
          >
            Commit next deal
          </button>
        )}
        <p className="hint">
          Deals are committed automatically before cards are dealt. Use the
          manual option to inspect the commitment first. Leaving Play or
          reloading ends an unfinished hand without saving it.
        </p>
      </details>

      <details className="panel saved-hands-drawer">
        <summary>Saved hands on this device · {history.length}</summary>
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
      </details>
      {!game && (
        <div className="room-paths">
          <div>
            <span className="eyebrow">01 / TAKE YOUR SEAT</span>
            <h2>Play against the bots</h2>
            <p>
              Every opponent acts on their own cards and the action they can
              see.
            </p>
          </div>
          <div>
            <span className="eyebrow">02 / LEARN IN THE HAND</span>
            <h2>A little help when it matters</h2>
            <p>Follow the walkthrough, or switch it off and trust your read.</p>
          </div>
          <div>
            <span className="eyebrow">03 / GO DEEPER</span>
            <h2>Bring your questions</h2>
            <p>Replay a hand, explore the odds, or open a lesson.</p>
            <Link to="/learn">Visit the learning room →</Link>
          </div>
        </div>
      )}
    </main>
  );
}
