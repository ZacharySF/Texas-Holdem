import { act, legalActions, newGame, type Action, type Game } from './game';
import { Rng } from './rng';

export const TOURNAMENT = {
  seats: 6,
  startingStack: 2000,
  turnMs: 30000,
  levelMs: 180000,
  dealDelayMs: 4000,
  bigBlinds: [20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240],
} as const;
export interface Tournament {
  seed: string;
  startedAt: number;
  hand: number;
  level: number;
  /** Stable physical seats; indices in game are compacted after elimination. */
  ids: number[];
  bigBlindSeat: number;
  smallBlindSeat: number | null;
  game: Game;
  deadline: number;
  status: 'playing' | 'won' | 'eliminated' | 'forfeited';
  place?: number;
  tied?: boolean;
  timeouts: number;
}
export function tournamentLevel(startedAt: number, now: number) {
  return Math.min(
    TOURNAMENT.bigBlinds.length - 1,
    Math.max(0, Math.floor((now - startedAt) / TOURNAMENT.levelMs)),
  );
}
export function newTournament(seed: string, now: number): Tournament {
  const ids = Array.from({ length: TOURNAMENT.seats }, (_, i) => i);
  const button = new Rng(seed).int(ids.length);
  const smallBlindSeat = (button + 1) % ids.length;
  const bigBlindSeat = (button + 2) % ids.length;
  const game = newGame({
    seed,
    stacks: ids.map(() => TOURNAMENT.startingStack),
    button,
    smallBlind: TOURNAMENT.bigBlinds[0] / 2,
    bigBlind: TOURNAMENT.bigBlinds[0],
    tournamentBlinds: {
      small: smallBlindSeat,
      big: bigBlindSeat,
      deadButton: false,
    },
  });
  return {
    seed,
    startedAt: now,
    hand: 1,
    level: 0,
    ids,
    smallBlindSeat,
    bigBlindSeat,
    game,
    deadline: now + TOURNAMENT.turnMs,
    status: 'playing',
    timeouts: 0,
  };
}
export function timeoutAction(game: Game): Action {
  return { type: legalActions(game).canCheck ? 'check' : 'fold' };
}
/** The same deadline check protects clicks, worker replies and timer ticks. */
export function tournamentAction(
  state: Tournament,
  action: Action,
  now: number,
): Tournament {
  if (state.status !== 'playing' || state.game.complete)
    throw new Error('No tournament action is pending.');
  const expired = now >= state.deadline;
  const game = act(state.game, expired ? timeoutAction(state.game) : action);
  return settleTournament({
    ...state,
    game,
    timeouts:
      state.timeouts + Number(expired && state.ids[state.game.actor] === 0),
    deadline:
      now + (game.complete ? TOURNAMENT.dealDelayMs : TOURNAMENT.turnMs),
  });
}
function settleTournament(state: Tournament): Tournament {
  const game = state.game;
  if (!game.complete) return state;
  const hero = state.ids.indexOf(0);
  if (game.players[hero].stack === 0) {
    const place =
      1 +
      game.players.filter(
        (p, i) =>
          p.stack > 0 ||
          (p.stack === 0 && game.config.stacks[i] > game.config.stacks[hero]),
      ).length;
    const tied = game.players.some(
      (p, i) =>
        i !== hero &&
        p.stack === 0 &&
        game.config.stacks[i] === game.config.stacks[hero],
    );
    return { ...state, status: 'eliminated', place, tied };
  }
  return game.players.filter((p) => p.stack > 0).length === 1
    ? { ...state, status: 'won', place: 1 }
    : state;
}

export function nextTournamentHand(
  state: Tournament,
  seed: string,
  now: number,
): Tournament {
  if (state.status !== 'playing' || !state.game.complete)
    throw new Error('Finish the current hand first.');
  const ids = state.ids.filter((_, i) => state.game.players[i].stack > 0);
  const bigBlindSeat = [...ids].sort(
    (a, b) =>
      ((a - state.bigBlindSeat + 5) % 6) - ((b - state.bigBlindSeat + 5) % 6),
  )[0];
  const big = ids.indexOf(bigBlindSeat);
  const smallBlindSeat =
    ids.length === 2
      ? ids[1 - big]
      : ids.includes(state.bigBlindSeat)
        ? state.bigBlindSeat
        : null;
  const small = smallBlindSeat === null ? null : ids.indexOf(smallBlindSeat);
  // A dead button is represented by the last live seat before the first recipient.
  // This keeps dealing, postflop order and odd chips clockwise from the real button.
  const button =
    ids.length === 2 ? small! : ((small ?? big) - 1 + ids.length) % ids.length;
  const deadButton =
    ids.length > 2 &&
    (state.smallBlindSeat === null || !ids.includes(state.smallBlindSeat));
  const level = tournamentLevel(state.startedAt, now);
  const bigBlind = TOURNAMENT.bigBlinds[level];
  const game = newGame({
    seed,
    stacks: ids.map((id) => state.game.players[state.ids.indexOf(id)].stack),
    button,
    smallBlind: bigBlind / 2,
    bigBlind,
    runItTwice: false,
    tournamentBlinds: { small, big, deadButton },
  });
  return settleTournament({
    ...state,
    hand: state.hand + 1,
    ids,
    game,
    level,
    smallBlindSeat,
    bigBlindSeat,
    deadline:
      now + (game.complete ? TOURNAMENT.dealDelayMs : TOURNAMENT.turnMs),
  });
}
