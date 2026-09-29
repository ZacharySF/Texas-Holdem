import { describe, expect, it } from 'vitest';
import {
  act,
  legalActions,
  newGame,
  playerView,
  potSize,
  replay,
} from './game';
import {
  newTournament,
  nextTournamentHand,
  tournamentAction,
  tournamentLevel,
  timeoutAction,
  TOURNAMENT,
  type Tournament,
} from './tournament';

const seed = '0123456789abcdef0123456789abcdef';
function settledWith(state: Tournament, stacks: number[]): Tournament {
  return {
    ...state,
    game: {
      ...state.game,
      complete: true,
      players: state.game.players.map((p, i) => ({
        ...p,
        stack: stacks[i],
        contributed: 0,
        round: 0,
      })),
    },
  };
}

describe('tournament lifecycle', () => {
  it('starts a deterministic equal-stack freezeout with an absolute deadline', () => {
    const state = newTournament(seed, 1000);
    expect(newTournament(seed, 1000)).toEqual(state);
    expect(state.game.config.stacks).toEqual(Array(6).fill(2000));
    expect(state.deadline).toBe(31000);
    expect(state.game.config.runItTwice).toBeUndefined();
    expect(
      state.game.players.reduce((n, p) => n + p.stack, potSize(state.game)),
    ).toBe(12000);
    expect(() => nextTournamentHand(state, seed, 2000)).toThrow('Finish');
    expect(() =>
      tournamentAction({ ...state, status: 'won' }, { type: 'fold' }, 2000),
    ).toThrow('No tournament');
  });

  it('enforces expired deadlines in the action handler, even without a timer tick', () => {
    let state = newTournament(seed, 1000);
    while (state.game.actor !== 0)
      state = tournamentAction(state, { type: 'call' }, 2000);
    const before = state;
    expect(timeoutAction(state.game)).toEqual({ type: 'fold' });
    state = tournamentAction(
      state,
      { type: 'raise', to: 2000 },
      state.deadline,
    );
    expect(state.game.history.at(-1)?.action).toEqual({ type: 'fold' });
    expect(state.timeouts).toBe(1);
    expect(state.game.players[0].stack).toBe(before.game.players[0].stack);
    const early = tournamentAction(
      before,
      { type: 'call' },
      before.deadline - 1,
    );
    expect(early.game.history.at(-1)?.action).toEqual({ type: 'call' });
    expect(early.timeouts).toBe(0);
  });

  it('checks a free option on expiry and never grants a fresh deadline for a failed action', () => {
    let state = newTournament(seed, 0);
    while (!legalActions(state.game).canCheck)
      state = tournamentAction(state, { type: 'call' }, 100);
    expect(timeoutAction(state.game)).toEqual({ type: 'check' });
    expect(() =>
      tournamentAction(state, { type: 'raise', to: 1 }, 101),
    ).toThrow('Illegal raise');
    const expired = tournamentAction(
      state,
      { type: 'fold' },
      state.deadline + 50000,
    );
    expect(expired.game.history.at(-1)?.action).toEqual({ type: 'check' });
  });

  it('applies level changes between hands only, caps levels, and preserves the event clock', () => {
    const state = newTournament(seed, 1000);
    expect(tournamentLevel(1000, 1000 - 100)).toBe(0);
    expect(tournamentLevel(1000, 1000 + TOURNAMENT.levelMs - 1)).toBe(0);
    expect(tournamentLevel(1000, 1000 + TOURNAMENT.levelMs)).toBe(1);
    expect(tournamentLevel(1000, 1e12)).toBe(9);
    const next = nextTournamentHand(
      settledWith(state, Array(6).fill(2000)),
      seed,
      1000 + TOURNAMENT.levelMs,
    );
    expect(state.game.config.bigBlind).toBe(20);
    expect(next.game.config.bigBlind).toBe(40);
    expect(next.startedAt).toBe(1000);
    expect(next.hand).toBe(2);
  });

  it('advances the big blind through every surviving-seat subset and keeps correct heads-up order', () => {
    const state = newTournament(seed, 0);
    for (let oldBig = 0; oldBig < 6; oldBig++) {
      for (let mask = 3; mask < 64; mask += 2) {
        const stacks = Array.from({ length: 6 }, (_, i) =>
          mask & (1 << i) ? 2000 : 0,
        );
        if (stacks.filter(Boolean).length < 2) continue;
        const before = settledWith(
          { ...state, bigBlindSeat: oldBig, smallBlindSeat: (oldBig + 5) % 6 },
          stacks,
        );
        const next = nextTournamentHand(before, seed, 500);
        let expectedBig = (oldBig + 1) % 6;
        while (!stacks[expectedBig]) expectedBig = (expectedBig + 1) % 6;
        expect(next.bigBlindSeat).toBe(expectedBig);
        expect(next.ids).toEqual(stacks.flatMap((n, i) => (n ? [i] : [])));
        expect(next.game.config.stacks).toEqual(stacks.filter(Boolean));
        if (next.ids.length === 2) {
          expect(next.smallBlindSeat).toBe(
            next.ids.find((id) => id !== expectedBig),
          );
          expect(next.game.actor).toBe(next.game.config.button);
          let game = act(next.game, { type: 'call' });
          game = act(game, { type: 'check' });
          expect(game.street).toBe('flop');
          expect(game.actor).toBe(next.ids.indexOf(expectedBig));
        } else {
          expect(next.smallBlindSeat).toBe(stacks[oldBig] ? oldBig : null);
          expect(next.game.actor).toBe(
            (next.ids.indexOf(expectedBig) + 1) % next.ids.length,
          );
        }
        expect(replay(next.game.config, next.game.history)).toEqual(next.game);
      }
    }
  });

  it('finishes seeded tournaments with conserved chips, no refill, and stable bot identities', () => {
    const results = new Set<string>();
    for (let trial = 1; trial <= 30; trial++) {
      let state = newTournament(trial.toString(16).padStart(32, '0'), 0);
      for (let step = 0; step < 200 && state.status === 'playing'; step++) {
        if (state.game.complete) {
          const remaining = state.game.players.filter(
            (p) => p.stack > 0,
          ).length;
          state = nextTournamentHand(
            state,
            (trial * 1000 + step).toString(16).padStart(32, '0'),
            1000 + step,
          );
          expect(state.ids.length).toBe(remaining);
        } else {
          const legal = legalActions(state.game);
          state = tournamentAction(
            state,
            legal.canRaise
              ? { type: 'raise', to: legal.maxRaiseTo }
              : { type: legal.canCheck ? 'check' : 'call' },
            1000 + step,
          );
        }
        expect(
          state.game.players.reduce((n, p) => n + p.stack, potSize(state.game)),
        ).toBe(12000);
      }
      expect(state.status).not.toBe('playing');
      expect(state.place).toBeGreaterThanOrEqual(1);
      expect(state.place).toBeLessThanOrEqual(6);
      results.add(state.status);
      if (state.status === 'won')
        expect(state.game.players[0].stack).toBe(12000);
      else expect(state.game.players[0].stack).toBe(0);
    }
    expect([...results].sort()).toEqual(['eliminated', 'won']);
  });

  it('settles hands that end during blind posting and ranks simultaneous busts', () => {
    const state = newTournament(seed, 0);
    let autoSettled = false;
    for (let i = 1; i < 50; i++) {
      const next = nextTournamentHand(
        settledWith(state, [10, 10, 0, 0, 0, 0]),
        i.toString(16).padStart(32, '0'),
        TOURNAMENT.levelMs * 9,
      );
      expect(next.game.complete).toBe(true);
      if (next.status !== 'playing') {
        autoSettled = true;
        expect(['won', 'eliminated']).toContain(next.status);
      }
    }
    expect(autoSettled).toBe(true);
    // Two equally short players bust together against the winning big stack.
    let tiedFound = false;
    for (let i = 1; i < 100 && !tiedFound; i++) {
      const game = newGame({
        seed: i.toString(16).padStart(32, '0'),
        stacks: [20, 20, 100],
        button: 0,
        smallBlind: 5,
        bigBlind: 10,
      });
      let s: Tournament = { ...state, ids: [0, 1, 2], game };
      while (!s.game.complete) {
        const legal = legalActions(s.game);
        s = tournamentAction(
          s,
          legal.canRaise
            ? { type: 'raise', to: legal.maxRaiseTo }
            : { type: legal.canCheck ? 'check' : 'call' },
          1,
        );
      }
      if (s.status === 'eliminated' && s.tied) {
        expect(s.place).toBe(2);
        tiedFound = true;
      }
    }
    expect(tiedFound).toBe(true);
  });
});

it('validates explicit blinds and prices short blind all-ins without phantom calls', () => {
  const config = {
    seed,
    stacks: [100, 100, 100],
    button: 0,
    smallBlind: 10,
    bigBlind: 20,
  };
  for (const blinds of [
    { small: 1, big: 3, deadButton: false },
    { small: 1, big: 1, deadButton: false },
    { small: -1, big: 2, deadButton: false },
    { small: 4, big: 2, deadButton: false },
    { small: 1, big: -1, deadButton: false },
    { small: 1.5, big: 2, deadButton: false },
  ])
    expect(() => newGame({ ...config, tournamentBlinds: blinds })).toThrow(
      'Invalid tournament blinds',
    );
  expect(() =>
    newGame({
      ...config,
      stacks: [100, 100],
      tournamentBlinds: { small: 1, big: 0, deadButton: false },
    }),
  ).toThrow();
  expect(() =>
    newGame({
      ...config,
      stacks: [100, 100],
      tournamentBlinds: { small: 0, big: 1, deadButton: true },
    }),
  ).toThrow();
  const game = newGame({
    ...config,
    stacks: [100, 5, 5],
    tournamentBlinds: { small: 1, big: 2, deadButton: false },
  });
  expect(legalActions(game).toCall).toBe(5);
  expect(legalActions(game).canRaise).toBe(false);
  const done = act(game, { type: 'call' });
  expect(done.complete).toBe(true);
  expect(done.players.reduce((n, p) => n + p.stack, 0)).toBe(110);
  const view = playerView(game, 0);
  expect(view).not.toHaveProperty('deck');
  expect(view.players[1]).not.toHaveProperty('hand');
});
