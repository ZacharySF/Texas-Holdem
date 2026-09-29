<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import {
    legalActions,
    playerView,
    potSize,
    type Action,
  } from '../../engine/game';
  import {
    newTournament,
    tournamentAction,
    nextTournamentHand,
    timeoutAction,
    tournamentLevel,
    TOURNAMENT,
    type Tournament,
  } from '../../engine/tournament';
  import { newSeed } from '../lab/state';
  import { analysisSeed } from '../play/storage';
  import Table from '../play/Table.svelte';
  import { seatName, actionText } from '../play/Table';
  import '../play/play.css';
  import './tournament.css';

  const STORAGE_KEY = 'holdem-tournament-session-v1';
  let eventState = $state.raw<Tournament | null>(null);
  let now = $state(Date.now());
  let raise = $state('');
  let message = $state('');
  let storageWarning = $state('');
  let ready = $state(false);
  let game = $derived(eventState?.game);
  let legal = $derived(game ? legalActions(game) : null);
  let playing = $derived(eventState?.status === 'playing');
  let heroTurn = $derived(
    playing && game && !game.complete && game.actor === 0,
  );
  let seconds = $derived(
    eventState ? Math.max(0, Math.ceil((eventState.deadline - now) / 1000)) : 0,
  );
  let levelSeconds = $derived(
    eventState
      ? Math.max(
          0,
          Math.ceil(
            (eventState.startedAt +
              (tournamentLevel(eventState.startedAt, now) + 1) *
                TOURNAMENT.levelMs -
              now) /
              1000,
          ),
        )
      : 0,
  );
  let raiseTo = $derived(Number(raise));
  let validRaise = $derived(
    legal &&
      Number.isSafeInteger(raiseTo) &&
      raiseTo <= legal.maxRaiseTo &&
      (raiseTo >= legal.minRaiseTo || raiseTo === legal.maxRaiseTo) &&
      raiseTo > (game?.bet ?? 0),
  );

  function save() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          active: eventState?.status === 'playing',
          status: eventState?.status,
          place: eventState?.place,
        }),
      );
    } catch {
      storageWarning =
        'Session storage is unavailable. Results will be lost when this page closes.';
    }
  }
  function start() {
    try {
      eventState = newTournament(newSeed(), Date.now());
      now = Date.now();
      message = '';
      save();
    } catch {
      message =
        'A secure browser context with Web Crypto is required to start a tournament.';
    }
  }
  function move(action: Action) {
    if (
      !eventState ||
      eventState.status !== 'playing' ||
      eventState.game.complete
    )
      return;
    try {
      const expired = Date.now() >= eventState.deadline;
      const actorName = seatName(eventState.ids[eventState.game.actor]);
      const fallback = timeoutAction(eventState.game);
      eventState = tournamentAction(eventState, action, Date.now());
      now = Date.now();
      message = expired
        ? `${actorName}: time expired — automatic ${fallback.type}.`
        : '';
      save();
    } catch (error) {
      message = error instanceof Error ? error.message : 'Action unavailable.';
    }
  }
  function submit(action: Action) {
    if (heroTurn) move(action);
  }
  function forfeit() {
    if (eventState?.status === 'playing') {
      eventState = { ...eventState, status: 'forfeited' };
      save();
      message = 'You forfeited this tournament.';
    }
  }
  onMount(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved?.active) {
        message =
          'Your previous tournament was forfeited when you left or reloaded. Start a new tournament below.';
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ active: false, status: 'forfeited' }),
        );
      } else if (saved?.status)
        message = `Previous tournament: ${saved.status}${saved.place ? `, place ${saved.place}` : ''}.`;
    } catch {
      storageWarning = 'Previous tournament results could not be read.';
    }
    ready = true;
    const tick = () => {
      now = Date.now();
      if (
        !eventState ||
        eventState.status !== 'playing' ||
        now < eventState.deadline
      )
        return;
      if (eventState.game.complete) {
        eventState = nextTournamentHand(eventState, newSeed(), now);
        save();
      } else move(timeoutAction(eventState.game));
    };
    const timer = setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('pagehide', forfeit);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('pagehide', forfeit);
      forfeit();
    };
  });
  $effect(() => {
    const current = eventState;
    if (current && !current.game.complete) {
      const actions = legalActions(current.game);
      raise = String(Math.min(actions.minRaiseTo, actions.maxRaiseTo));
    }
  });
  $effect(() => {
    const current = eventState;
    if (
      !current ||
      current.status !== 'playing' ||
      current.game.complete ||
      current.game.actor === 0
    )
      return;
    return untrack(() => {
      let cancelled = false;
      let worker: Worker | undefined;
      let delay: ReturnType<typeof setTimeout> | undefined;
      const begun = Date.now();
      const fallback = () => {
        if (!cancelled && eventState === current) {
          move(timeoutAction(current.game));
          message =
            'Opponent computation unavailable; the dealer applied a check/fold fallback.';
        }
      };
      void analysisSeed(
        current.game.config.seed,
        `tournament:${current.game.history.length}`,
      )
        .then((seed) => {
          if (cancelled) return;
          worker = new Worker(
            new URL('../../workers/tournament.worker.ts', import.meta.url),
            { type: 'module' },
          );
          worker.onmessage = (
            event: MessageEvent<{ action?: Action; error?: boolean }>,
          ) => {
            if (cancelled || eventState !== current) return;
            const action = event.data.action;
            if (!action) {
              fallback();
              return;
            }
            delay = setTimeout(
              () => {
                if (!cancelled && eventState === current) move(action);
              },
              Math.max(0, 650 - (Date.now() - begun)),
            );
          };
          worker.onerror = fallback;
          worker.postMessage({
            view: playerView(current.game, current.game.actor),
            seed,
          });
        })
        .catch(fallback);
      return () => {
        cancelled = true;
        worker?.terminate();
        clearTimeout(delay);
      };
    });
  });
</script>

<main class="tournament-page">
  <nav aria-label="Play mode">
    <a href="#/play">Practice with the coach</a><span aria-current="page"
      >Tournament</span
    >
  </nav>
  <p>
    Six-player no-limit Hold’em freezeout. Tournament chips are separate from
    your practice bankroll.
  </p>
  {#if message}<p role="status">{message}</p>{/if}
  {#if storageWarning}<p role="alert">{storageWarning}</p>{/if}
  {#if !eventState}
    <p>
      Start with {TOURNAMENT.startingStack.toLocaleString()} chips. You have {TOURNAMENT.turnMs /
        1000} seconds for each decision. No coach, equity estimates, hints, rebuys,
      or run-it-twice.
    </p>
    <p>
      <strong>Leaving this page or reloading forfeits your tournament.</strong> Switching
      browser tabs does not pause the clock.
    </p>
    <button class="primary" disabled={!ready} onclick={start}
      >Start tournament</button
    >
  {:else if game}
    <section class="tournament-readout" aria-label="Tournament standings">
      <div><span>Hand</span><strong>{eventState.hand}</strong></div>
      <div>
        <span>Players</span><strong
          >{game.complete
            ? game.players.filter((p) => p.stack > 0).length
            : eventState.ids.length} / {TOURNAMENT.seats}</strong
        >
      </div>
      <div>
        <span>Your chips</span><strong
          >{game.players[0].stack.toLocaleString()}</strong
        >
      </div>
      <div>
        <span>Level {eventState.level + 1}</span><strong
          >{game.config.smallBlind} / {game.config.bigBlind}</strong
        >
      </div>
      <div>
        <span>{game.complete ? 'Next deal' : 'Action clock'}</span><strong
          role="timer"
          aria-label="Seconds remaining">{playing ? seconds : '—'}</strong
        >
      </div>
    </section>
    <p>
      {eventState.level === TOURNAMENT.bigBlinds.length - 1
        ? 'Final blind level.'
        : tournamentLevel(eventState.startedAt, now) > eventState.level
          ? 'Blinds increase on the next hand.'
          : `Next level in ${Math.floor(levelSeconds / 60)}:${String(levelSeconds % 60).padStart(2, '0')}.`}
      No antes. {eventState.timeouts} timed-out decisions.
    </p>
    {#if game.config.tournamentBlinds?.deadButton}<p>
        Dead button: dealing and action begin clockwise after the vacant button
        position.
      </p>{/if}
    {#if game.config.tournamentBlinds?.small === null}<p>
        Dead small blind this hand. The next surviving player posts the big
        blind.
      </p>{/if}
    <Table
      {game}
      total={game.complete
        ? game.finalContributions.reduce((a, b) => a + b, 0)
        : potSize(game)}
      botDescription="Tournament opponent"
      seatName={(seat) => seatName(eventState!.ids[seat])}
      {actionText}
      tournament
    />
    {#if playing && !game.complete}
      <section class="tournament-actions" aria-label="Tournament actions">
        <p>
          {heroTurn
            ? `Your decision · ${seconds}s remaining`
            : `${seatName(eventState.ids[game.actor])} to act`}
        </p>
        {#if heroTurn && seconds <= 5}<p class="clock-warning" role="alert">
            Five seconds or less remain. Act now.
          </p>{/if}
        <div class="tournament-action-row">
          <button disabled={!heroTurn} onclick={() => submit({ type: 'fold' })}
            >Fold</button
          >
          <button
            disabled={!heroTurn}
            onclick={() => submit({ type: legal?.canCheck ? 'check' : 'call' })}
            >{legal?.canCheck ? 'Check' : `Call ${legal?.toCall ?? 0}`}</button
          >
          <label
            >Raise to (total this round)<input
              type="number"
              min={Math.min(legal?.minRaiseTo ?? 0, legal?.maxRaiseTo ?? 0)}
              max={legal?.maxRaiseTo ?? 0}
              step="1"
              value={raise}
              oninput={(event) => (raise = event.currentTarget.value)}
              disabled={!heroTurn || !legal?.canRaise}
            /></label
          >
          <button
            disabled={!heroTurn || !legal?.canRaise || !validRaise}
            onclick={() => submit({ type: 'raise', to: raiseTo })}>Raise</button
          >
          <button
            disabled={!heroTurn || !legal?.canRaise}
            onclick={() => submit({ type: 'raise', to: legal!.maxRaiseTo })}
            >All in</button
          >
        </div>
        <p>
          At zero: check if no bet is owed; otherwise fold. A short all-in does
          not necessarily reopen raising.
        </p>
      </section>
    {:else if !playing}
      <section aria-label="Tournament result" class="tournament-result">
        <h2>
          {eventState.status === 'won'
            ? 'You won the tournament'
            : eventState.status === 'eliminated'
              ? `Eliminated — ${eventState.tied ? 'tied ' : ''}place ${eventState.place}`
              : 'Tournament forfeited'}
        </h2>
        <p>
          {eventState.status === 'won'
            ? 'You hold every tournament chip.'
            : 'No re-entry into this tournament. You can start a new event.'}
        </p>
        <button onclick={start}>Start new tournament</button>
        <a href="#/learn/23-2">Study tournament chip value after the game →</a>
      </section>
    {/if}
    {#if playing}<details>
        <summary>Leave this tournament</summary>
        <p>Forfeiting ends your run immediately.</p>
        <button onclick={forfeit}>Forfeit tournament</button>
      </details>{/if}
  {/if}
  <details class="tournament-rules" open={!eventState}>
    <summary>Tournament rules and blind schedule</summary>
    <p>
      This single-table browser event applies no-limit Hold’em betting and
      settlement rules. Its automatic shot clock and blind schedule are house
      rules, not a claim that every tournament uses the same format.
    </p>
    <ol>
      <li>
        Six equal starting stacks. No rebuys, add-ons, rake, antes, breaks, or
        real-money prizes. Last player with chips wins.
      </li>
      <li>
        Blinds rise every {TOURNAMENT.levelMs / 60000} minutes and change only when
        a new hand begins. The final level stays in force. Completed hands redeal
        automatically after {TOURNAMENT.dealDelayMs / 1000} seconds.
      </li>
      <li>
        Act in turn within {TOURNAMENT.turnMs / 1000} seconds. The final five seconds
        are part of that allowance. Expiry checks a free option or folds when facing
        a bet. Hidden tabs still use the elapsed deadline. Leaving or reloading forfeits;
        there is no pause or time bank.
      </li>
      <li>
        Full raises must equal at least the last full bet or raise increment.
        Smaller raises are allowed only all in. Cumulative short raises reopen
        action only after a full increment. You cannot raise when no opponent
        can respond.
      </li>
      <li>
        All-in players remain eligible only for matched pots. Side pots settle
        separately; uncalled chips return. Ties split each pot, with odd chips
        awarded clockwise left of the button. Only one board runs out.
      </li>
      <li>
        Busted players leave between hands. The big blind advances to the next
        surviving seat; the small blind or button can be dead. Heads-up, the
        button posts the small blind and acts first preflop, last after the
        flop.
      </li>
      <li>
        At a contested showdown, all live hands are shown. Folded hands stay
        hidden. No rabbit hunting or live hand-history x-ray. Simultaneous
        eliminations rank by starting stack for that hand; equal stacks tie.
      </li>
      <li>
        No coaching, equity readout, model grades, or bot reasoning. Opponents
        receive only their own cards and public table information. This is local
        practice, not a tamper-resistant online competition.
      </li>
    </ol>
    <p>
      Physical dealing mistakes, verbal bets, table balancing, and floor
      penalties are outside this single-table digital format. Legal inputs and
      automatic dealing prevent those physical-table situations.
    </p>
    <p>
      <a
        href="https://www.pokertda.com/view-poker-tda-rules/"
        target="_blank"
        rel="noreferrer"
        >Poker Tournament Directors Association rules reference</a
      >
    </p>
    <table>
      <caption>Blind schedule · no ante</caption><thead
        ><tr><th>Level</th><th>Small blind</th><th>Big blind</th></tr></thead
      ><tbody
        >{#each TOURNAMENT.bigBlinds as blind, i (blind)}<tr
            ><td>{i + 1}</td><td>{blind / 2}</td><td>{blind}</td></tr
          >{/each}</tbody
      >
    </table>
  </details>
</main>
