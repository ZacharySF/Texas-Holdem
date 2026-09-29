<script lang="ts">
  import TableEdge from '../../decor/TableEdge.svelte';
  import { sitePath } from '../../decor/site';
  import PlayDecor from '../../decor/PlayDecor.svelte';
  import WindowFrame from '../../decor/WindowFrame.svelte';
  import { readForecasts, forecastXp } from '../arcade/forecastStorage';
  import { readDrill, drillXp } from '../arcade/progress';
  import { lessonById, lessons } from '../../content/lessons';
  import {
    createJourney,
    practiceFocus,
    lessonReturnLink,
  } from '../learn/journey.svelte';
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
  import {
    decodeProgress,
    mastered,
    PROGRESS_KEY,
  } from '../learn/progress.svelte';
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
  import Table from './PokerTable.svelte';
  import { botStyles } from './Table';
  import CoachSidebar from './CoachSidebar.svelte';
  import CoachPanel from './CoachPanel.svelte';
  import { type Assessment } from './CoachPanel';
  import HistoryPanel from './HistoryPanel.svelte';
  import './play.css';
  import Home from './Home.svelte';
  import { navigation } from '../../navigation.svelte';
  import { untrack } from 'svelte';
  function readProfile(): Profile {
    try {
      return parseProfile(localStorage.getItem(PROFILE_KEY));
    } catch {
      return parseProfile(null);
    }
  }

  let params = $derived(new URLSearchParams(navigation.search));
  let courseLesson = $derived(lessonById(params.get('lesson') ?? ''));
  const courseJourney = createJourney();
  let journey = $derived(courseJourney.journey);
  let markPlayed = $derived(courseJourney.markPlayed);
  let courseStorageError = $derived(courseJourney.storageError);
  let returnToLesson = $derived(
    courseLesson
      ? lessonReturnLink(courseLesson.id, params.get('lessonSeed'))
      : '/learn/1-1',
  );
  let nextCourseLesson = $derived(
    courseLesson ? lessons[lessons.indexOf(courseLesson) + 1] : undefined,
  );
  let profile = $state.raw(readProfile());
  let persona = $state.raw<Persona>('tight-passive');
  let bigBlind = $state.raw(10);
  let seats = $state.raw(2);
  let twice = $state.raw(false);
  let pending = $state.raw<{
    config: GameConfig;
    hash: string;
  } | null>(null);
  let game = $state.raw<Game | null>(null);
  let commitment = $state.raw('');
  let assessment = $state.raw<Assessment | null>(null);
  let thinking = $state.raw(false);
  let dealing = $state.raw(false);
  let guided = $state.raw(true);
  let error = $state.raw('');
  let coach = $state.raw(true);
  let exam = $state.raw(false);
  let guess = $state.raw('');
  let revealedAt = $state.raw(-1);
  let raise = $state.raw('');
  let foldPercent = $state.raw(0);
  let grade = $state.raw('');
  let history = $state.raw<SavedHand[]>([]);
  let review = $state.raw<SavedHand | null>(null);
  let retry = $state.raw(0);
  let notes: DecisionNote[] = [];
  let worker: Worker | null | null = null;
  // The persistence guard is bookkeeping, not rendered state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const saved = new Set<string>();
  let preparing = false;
  let lessonXp = $state.raw(
    (() => {
      try {
        return (
          Object.values(
            decodeProgress(localStorage.getItem(PROGRESS_KEY)).results,
          ).filter(mastered).length * 20
        );
      } catch {
        return 0;
      }
    })(),
  );
  let arcadeXp = $state.raw(
    (() => drillXp(readDrill()) + forecastXp(readForecasts()))(),
  );
  let xp = $derived(profile.xp + lessonXp + arcadeXp);
  let active = $derived(game && !game?.complete);
  $effect(() => {
    const dependencies = { d0: profile };
    void dependencies;
    return untrack(() => {
      const profile = dependencies.d0;
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      } catch {
        setError('Bankroll and XP cannot be saved in this browser.');
      }
    });
  });
  $effect(() => {
    const dependencies = {};
    void dependencies;
    return untrack(() => {
      void loadHands()
        .then(setHistory)
        .catch(() =>
          setError(
            'Hand-history storage is unavailable. The current hand still works in memory.',
          ),
        );
      return () => worker?.terminate();
    });
  });
  $effect(() => {
    const dependencies = { d0: game };
    void dependencies;
    return untrack(() => {
      const game = dependencies.d0;
      if (game && !game?.complete) {
        const l = legalActions(game);
        setRaise(String(Math.min(l.minRaiseTo, l.maxRaiseTo)));
      }
    });
  });
  $effect(() => {
    const dependencies = { d0: game, d1: persona, d2: retry, d3: raise };
    void dependencies;
    return untrack(() => {
      const game = dependencies.d0;
      const persona = dependencies.d1;
      const raise = dependencies.d3;
      worker?.terminate();
      worker = null;
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
          worker = current;
          current.onmessage = (event: MessageEvent<PlayResponse>) => {
            if (cancelled || worker !== current) return;
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
                      notes.push(note);
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
        worker?.terminate();
        worker = null;
      };
    });
  });
  $effect(() => {
    const dependencies = {
      d0: game,
      d1: commitment,
      d2: persona,
      d3: courseLesson,
      d4: markPlayed,
    };
    void dependencies;
    return untrack(() => {
      const game = dependencies.d0;
      const commitment = dependencies.d1;
      const persona = dependencies.d2;
      const courseLesson = dependencies.d3;
      const markPlayed = dependencies.d4;
      if (!game?.complete || saved.has(game.config.seed)) return;
      saved.add(game.config.seed);
      if (courseLesson) markPlayed(courseLesson.id);
      const record: SavedHand = {
        version: 1,
        id: game.config.seed,
        date: new Date().toISOString(),
        config: game.config,
        commitment,
        persona,
        actions: game.history,
        notes: [...notes],
      };
      setReview(record);
      setHistory((h) => [record, ...h.filter((item) => item.id !== record.id)]);
      setProfile((p) =>
        awardHand(
          p,
          record.id,
          game.config.stacks[0],
          game.players[0].stack,
          notes.filter(
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
    });
  });
  async function prepare(manual = false, tableSeats = seats) {
    if (preparing || active || pending) return;
    preparing = true;
    setDealing(true);
    try {
      setError('');
      setSeats(tableSeats);
      const seed = newSeed(),
        config: GameConfig = {
          seed,
          stacks: Array.from({ length: tableSeats }, (_, i) =>
            i === 0
              ? Math.min(profile.bankroll, bigBlind * 200)
              : bigBlind * (tableSeats === 2 ? 200 : 80 + i * 20),
          ),
          button: game
            ? (game.config.button + 1) % tableSeats
            : profile.hands % tableSeats,
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
      preparing = false;
      setDealing(false);
    }
  }
  function startHand(config: GameConfig, hash: string) {
    try {
      const next = newGame(config);
      notes = [];
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
      notes.push({
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
  let heroTurn = $derived(!!active && game?.actor === 0);
  let legal = $derived(game ? legalActions(game) : null);
  let showCoach = $derived(
    coach &&
      heroTurn &&
      assessment &&
      (!exam || revealedAt === game?.history.length),
  );
  let canAct = $derived(
    heroTurn &&
      (!exam || (!!assessment && revealedAt === game?.history.length)),
  );
  let raiseTo = $derived(Number(raise));
  let requiredXp = $derived([0, 20, 40, 60]);
  let modelRaiseTo = $derived(
    legal &&
      Number.isSafeInteger(raiseTo) &&
      raiseTo > game!.bet &&
      raiseTo <= legal.maxRaiseTo &&
      (raiseTo >= legal.minRaiseTo || raiseTo === legal.maxRaiseTo)
      ? raiseTo
      : Math.min(legal?.minRaiseTo ?? 0, legal?.maxRaiseTo ?? 0),
  );
  function setProfile(
    value: typeof profile | ((previous: typeof profile) => typeof profile),
  ) {
    profile = typeof value === 'function' ? value(profile) : value;
  }
  function setPersona(
    value: typeof persona | ((previous: typeof persona) => typeof persona),
  ) {
    persona = typeof value === 'function' ? value(persona) : value;
  }
  function setBigBlind(
    value: typeof bigBlind | ((previous: typeof bigBlind) => typeof bigBlind),
  ) {
    bigBlind = typeof value === 'function' ? value(bigBlind) : value;
  }
  function setSeats(
    value: typeof seats | ((previous: typeof seats) => typeof seats),
  ) {
    seats = typeof value === 'function' ? value(seats) : value;
  }
  function setTwice(
    value: typeof twice | ((previous: typeof twice) => typeof twice),
  ) {
    twice = typeof value === 'function' ? value(twice) : value;
  }
  function setPending(
    value: typeof pending | ((previous: typeof pending) => typeof pending),
  ) {
    pending = typeof value === 'function' ? value(pending) : value;
  }
  function setGame(
    value: typeof game | ((previous: typeof game) => typeof game),
  ) {
    game = typeof value === 'function' ? value(game) : value;
  }
  function setCommitment(
    value:
      typeof commitment | ((previous: typeof commitment) => typeof commitment),
  ) {
    commitment = typeof value === 'function' ? value(commitment) : value;
  }
  function setAssessment(
    value:
      typeof assessment | ((previous: typeof assessment) => typeof assessment),
  ) {
    assessment = typeof value === 'function' ? value(assessment) : value;
  }
  function setThinking(
    value: typeof thinking | ((previous: typeof thinking) => typeof thinking),
  ) {
    thinking = typeof value === 'function' ? value(thinking) : value;
  }
  function setDealing(
    value: typeof dealing | ((previous: typeof dealing) => typeof dealing),
  ) {
    dealing = typeof value === 'function' ? value(dealing) : value;
  }
  function setGuided(
    value: typeof guided | ((previous: typeof guided) => typeof guided),
  ) {
    guided = typeof value === 'function' ? value(guided) : value;
  }
  function setError(
    value: typeof error | ((previous: typeof error) => typeof error),
  ) {
    error = typeof value === 'function' ? value(error) : value;
  }
  function setCoach(
    value: typeof coach | ((previous: typeof coach) => typeof coach),
  ) {
    coach = typeof value === 'function' ? value(coach) : value;
  }
  function setExam(
    value: typeof exam | ((previous: typeof exam) => typeof exam),
  ) {
    exam = typeof value === 'function' ? value(exam) : value;
  }
  function setGuess(
    value: typeof guess | ((previous: typeof guess) => typeof guess),
  ) {
    guess = typeof value === 'function' ? value(guess) : value;
  }
  function setRevealedAt(
    value:
      typeof revealedAt | ((previous: typeof revealedAt) => typeof revealedAt),
  ) {
    revealedAt = typeof value === 'function' ? value(revealedAt) : value;
  }
  function setRaise(
    value: typeof raise | ((previous: typeof raise) => typeof raise),
  ) {
    raise = typeof value === 'function' ? value(raise) : value;
  }
  function setFoldPercent(
    value:
      | typeof foldPercent
      | ((previous: typeof foldPercent) => typeof foldPercent),
  ) {
    foldPercent = typeof value === 'function' ? value(foldPercent) : value;
  }
  function setGrade(
    value: typeof grade | ((previous: typeof grade) => typeof grade),
  ) {
    grade = typeof value === 'function' ? value(grade) : value;
  }
  function setHistory(
    value: typeof history | ((previous: typeof history) => typeof history),
  ) {
    history = typeof value === 'function' ? value(history) : value;
  }
  function setReview(
    value: typeof review | ((previous: typeof review) => typeof review),
  ) {
    review = typeof value === 'function' ? value(review) : value;
  }
  function setRetry(
    value: typeof retry | ((previous: typeof retry) => typeof retry),
  ) {
    retry = typeof value === 'function' ? value(retry) : value;
  }
</script>

<main class={`play ${game ? 'in-game' : 'home-page'}`}>
  {#if game}<PlayDecor
      hand={game.players[0].hand}
      board={game.board}
      seed={game.complete ? game.config.seed : undefined}
      street={game.street}
    />
    <header class="play-header">
      <h1>Poker</h1>
    </header>{/if}{#if !game && !pending}<div class="svelte-view">
      <Home
        {...{
          seats,
          dealing,
          bankroll: profile.bankroll,
          onplay: (tableSeats: number) => void prepare(false, tableSeats),
        }}
      />
    </div>{/if}
  <div class="home-stats">
    <div class="bankroll">
      <span>chips</span><strong>{profile.bankroll.toLocaleString()}</strong
      ><small>{xp} XP · {profile.hands} hands played</small>
    </div>
    {#if !game && !courseLesson}<a href="#/learn/1-1">Start Chapter 1 →</a
      >{/if}{#if !game && !courseLesson && journey.current !== '1-1'}<a
        href={'#' + `/learn/${journey.current}`}>Continue learning →</a
      >{/if}
  </div>
  {#if courseStorageError}<p role="status" class="hint">
      Your course progress works for this visit, but this browser could not save
      it.
    </p>{/if}{#if courseLesson}<section class="course-practice-banner">
      <h2>
        Practice for {courseLesson.id.replace('-', '.')} · {courseLesson.title}
      </h2>
      <p>{practiceFocus(courseLesson.chapter)}</p>
      {#if active}<p class="hint">
          Finish this hand to save it. Your return-to-lesson button will appear
          here.
        </p>{:else}<div class="lesson-actions">
          <a href={'#' + returnToLesson}
            >Return to lesson {courseLesson.id.replace('-', '.')} →</a
          >{#if game?.complete && nextCourseLesson}<a
              href={'#' + `/learn/${nextCourseLesson.id}`}
              >Next lesson: {nextCourseLesson.id.replace('-', '.')} →</a
            >{/if}
        </div>{/if}{#if game?.complete}<p class="course-status">
          Practice hand complete. Think about what you noticed, then continue
          the lesson.
        </p>{/if}
    </section>{/if}
  <div class="session-toolbar">
    <span
      >{seats === 2 ? 'Heads-up' : 'Six-player'} · {bigBlind / 2} / {bigBlind}
      blinds · {botStyles[persona].name}</span
    ><label
      ><input
        type="checkbox"
        checked={guided}
        onchange={(e) => setGuided(e.currentTarget.checked)}
      /> Explain action buttons</label
    >
  </div>
  {#if error}<p class="error" role="alert">
      {error}
      {#if active}<button
          onclick={() => {
            setError('');
            setRetry((n) => n + 1);
          }}>Retry analysis</button
        >{/if}
    </p>{/if}{#if profile.bankroll < 1 && !active}<button
      onclick={() => setProfile((p) => ({ ...p, bankroll: 2000 }))}
      >Refill play-money bankroll</button
    >{/if}{#if pending}<section class="panel commitment">
      <h2>Seed committed before the deal</h2>
      <code class="seed-code">{pending.hash}</code>
      <p>
        The SHA-256 hash is fixed now. The seed will be revealed after the hand
        so you can verify and replay it.
      </p>
      <button
        class="primary"
        onclick={() => pending && startHand(pending.config, pending.hash)}
        >Deal committed hand</button
      >
    </section>{/if}
  <div class={game ? 'poker-workspace' : undefined}>
    <div class="table-column">
      {#if game}<WindowFrame title={sitePath('play/table')} active
          ><TableEdge hand={game.players[0].hand} board={game.board} /><Table
            {game}
            {persona}
          ></Table></WindowFrame
        >{/if}{#if game?.complete}<section
          class="hand-result"
          aria-label="Hand result"
        >
          <div>
            <h2>
              {game.players[0].stack > game.config.stacks[0]
                ? 'Hand won'
                : game.players[0].stack < game.config.stacks[0]
                  ? 'Hand lost'
                  : 'Hand tied'}
            </h2>
            <p>
              <strong
                >{game.players[0].stack - game.config.stacks[0] > 0
                  ? '+'
                  : ''}{game.players[0].stack - game.config.stacks[0]} chips</strong
              >
              this hand · {game.awards[0]} returned from the pots
            </p>
          </div>
          <button
            class="primary"
            disabled={dealing || !!pending || profile.bankroll < 1}
            onclick={() => void prepare()}
            >{dealing ? 'Shuffling…' : 'Deal next hand'}</button
          >
        </section>{/if}{#if heroTurn && exam && revealedAt !== game?.history.length}<section
          class="panel"
        >
          <h2>Estimate before you reveal</h2>
          <form
            onsubmit={(e) => {
              e.preventDefault();
              const n = Number(guess);
              if (guess.trim() && Number.isFinite(n) && n >= 0 && n <= 100) {
                if (game) setRevealedAt(game.history.length);
                setError('');
              } else
                setError(
                  `Enter an equity estimate from ${new Rational(0).display().percent} to ${new Rational(1).display().percent}.`,
                );
            }}
          >
            <label for="exam-guess">Your estimated equity, in percent</label
            ><input
              id="exam-guess"
              value={guess}
              oninput={(e) => setGuess(e.currentTarget.value)}
              inputmode="decimal"
            /><button disabled={!assessment} type="submit">Reveal coach</button>
          </form>
        </section>{/if}{#if heroTurn && legal && game}<section
          class="panel action-panel"
        >
          <div class="action-heading">
            <h2>Your move</h2>
            <span
              >{legal.canCheck
                ? 'You can check for free'
                : `${legal.toCall} chips to stay in`}</span
            >
          </div>
          <div class="play-actions">
            <button disabled={!canAct} onclick={() => submit({ type: 'fold' })}
              >Fold{#if guided}<small>Leave this hand</small>{/if}</button
            >{#if legal.canCheck}<button
                class="primary"
                disabled={!canAct}
                onclick={() => submit({ type: 'check' })}
                >Check{#if guided}<small>Stay in for free</small>{/if}</button
              >{:else}<button
                class="primary"
                disabled={!canAct}
                onclick={() => submit({ type: 'call' })}
                >Call {legal.toCall}{game.players[0].stack === legal.toCall
                  ? ' · all in'
                  : ''}{#if guided}<small>Match the bet</small>{/if}</button
              >{/if}
          </div>
          {#if legal.canRaise}<div class="raise-controls">
              <input
                aria-label="Raise amount"
                type="range"
                min={Math.min(legal.minRaiseTo, legal.maxRaiseTo)}
                max={legal.maxRaiseTo}
                step="1"
                value={modelRaiseTo}
                disabled={!canAct}
                oninput={(e) => setRaise(e.currentTarget.value)}
              /><label for="raise-to">Raise to (total chips this round)</label
              ><input
                id="raise-to"
                type="number"
                min={Math.min(legal.minRaiseTo, legal.maxRaiseTo)}
                max={legal.maxRaiseTo}
                step="1"
                value={raise}
                oninput={(e) => setRaise(e.currentTarget.value)}
              /><button
                disabled={!canAct ||
                  !Number.isInteger(raiseTo) ||
                  raiseTo <= game.bet ||
                  raiseTo > legal.maxRaiseTo ||
                  (raiseTo < legal.minRaiseTo && raiseTo !== legal.maxRaiseTo)}
                onclick={() => submit({ type: 'raise', to: raiseTo })}
                >Raise to {raise || '…'}</button
              ><button
                disabled={!canAct}
                onclick={() => {
                  setRaise(String(legal.maxRaiseTo));
                }}>Set all-in amount</button
              >
              <details class="raise-explanation">
                <summary>How raising works</summary>
                <p class="hint">
                  Full minimum: {legal.minRaiseTo}. Maximum: {legal.maxRaiseTo}.
                  A shorter raise is allowed only for your full stack and does
                  not reopen betting for a player who already acted.
                </p>
              </details>
            </div>{/if}
        </section>{/if}
    </div>
    {#if game}<CoachSidebar feedback={grade}
        >{#snippet course()}{#if courseLesson}<section
              class="coach-course-focus"
            >
              <span class="course-reference"
                >LESSON {courseLesson.id.replace('-', '.')} · YOUR FOCUS</span
              >
              <p>{practiceFocus(courseLesson.chapter)}</p>
              {#if game?.complete}<a href={'#' + returnToLesson}
                  >Return to your lesson →</a
                >{/if}
            </section>{/if}{/snippet}{#snippet odds(
          topic,
        )}{#if showCoach && game && assessment}<CoachPanel
              {topic}
              view={playerView(game, 0)}
              {assessment}
              raiseTo={modelRaiseTo}
              {foldPercent}
              onFoldPercent={setFoldPercent}
            ></CoachPanel>{:else}<p role="status">
              {game?.complete
                ? 'This hand is over. Open Review this hand below the table to see the cards, replay the action, and explore the results.'
                : exam && heroTurn && revealedAt !== game?.history.length
                  ? 'Make your equity prediction at the table first, then choose Reveal coach.'
                  : !coach
                    ? 'Turn on Coach in Table settings to see the estimates.'
                    : heroTurn && thinking
                      ? 'Updating your estimate. You can still act while it loads.'
                      : 'Your pot-odds calculation appears when it is your turn. Watch the bets change the price.'}
            </p>{/if}{/snippet}</CoachSidebar
      >{/if}
  </div>
  {#if game && !game?.complete}<details class="commitment-current">
      <summary>Current deal commitment</summary><code class="seed-code"
        >{commitment}</code
      >
      <p>The seed and all hands will be shown when this hand ends.</p>
    </details>{/if}{#if review && !active}{#key review.id}<details
        class="review-drawer"
      >
        <summary>Review this hand · replay, cards &amp; bot thinking</summary
        ><HistoryPanel hand={review}></HistoryPanel>
      </details>{/key}{/if}
  <details class="panel table-settings">
    <summary>Table settings &amp; advanced options</summary>
    <div class="play-settings">
      <label
        ><input
          type="checkbox"
          checked={twice}
          disabled={!!active || !!pending || dealing}
          onchange={(e) => setTwice(e.currentTarget.checked)}
        /> Run it twice when betting is closed by all-ins</label
      >
      <p class="hint">
        All seats agree before the deal. Remaining boards use the same deck
        without replacement; each pot is split across both boards. Final
        fractional chips are rounded once, clockwise from the button.
      </p>
      <label
        >Table size<select
          aria-label="Table size"
          value={seats}
          disabled={!!active || !!pending || dealing}
          onchange={(e) => setSeats(Number(e.currentTarget.value))}
          ><option value={2}>Heads-up</option><option value={6}>6-max</option
          ></select
        ></label
      >
      <div>
        <label for="persona">Bot persona</label><select
          id="persona"
          value={persona}
          disabled={!!active || !!pending || dealing}
          onchange={(e) => setPersona(e.currentTarget.value as Persona)}
          >{#each PERSONAS as p, i (p)}<option
              value={p}
              disabled={xp < requiredXp[i]}
              >{botStyles[p].name}{xp < requiredXp[i]
                ? ` · unlock at ${requiredXp[i]} XP`
                : ''}</option
            >{/each}</select
        >
        <p class="hint">
          {botStyles[persona].description}{seats === 6
            ? ' All five opponents use this style.'
            : ''}
        </p>
      </div>
      <div>
        <label for="stakes">Blinds</label><select
          id="stakes"
          value={bigBlind}
          disabled={!!active || !!pending || dealing}
          onchange={(e) => setBigBlind(Number(e.currentTarget.value))}
          >{#each [10, 20, 50] as b, i (b)}<option
              value={b}
              disabled={xp < i * 40}
              >{b / 2} / {b}{xp < i * 40
                ? ` · unlock at ${i * 40} XP`
                : ''}</option
            >{/each}</select
        >
      </div>
      <label
        ><input
          type="checkbox"
          checked={coach}
          onchange={(e) => setCoach(e.currentTarget.checked)}
        /> Coach</label
      ><label
        ><input
          type="checkbox"
          checked={exam}
          onchange={(e) => {
            setExam(e.currentTarget.checked);
            if (e.currentTarget.checked) setCoach(true);
          }}
        /> Exam mode</label
      >
      <p class="hint">
        Earn 20 XP per completed hand or mastered lesson, plus 5 XP for
        decisions close to this coach model. Higher stakes and additional bots
        unlock with XP. Outs Rush adds 5 XP per new correct answer in a seed’s
        best completed set. These chips have no cash value.
      </p>
    </div>
    {#if !active && !pending}<button
        disabled={dealing || profile.bankroll < 1}
        onclick={() => void prepare(true)}>Commit next deal</button
      >{/if}
    <p class="hint">
      Deals are committed automatically before cards are dealt. Use the manual
      option to inspect the commitment first. Leaving Play or reloading ends an
      unfinished hand without saving it.
    </p>
  </details>
  <details class="panel saved-hands-drawer">
    <summary>Saved hands on this device · {history.length}</summary
    >{#if history.length}<ul class="saved-hands">
        {#each history.slice(0, 30) as h (h.id)}<li>
            <button
              disabled={!!active}
              onclick={() => {
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
              >{new Date(h.date).toLocaleString()} · {h.persona} · review</button
            >
          </li>{/each}
      </ul>{:else}<p>
        Completed hands will be saved here with their seed, actions, and
        reasoning.
      </p>{/if}
  </details>
</main>
