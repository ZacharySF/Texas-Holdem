import { deck, type Hand } from './cards';
import { evaluateFast } from './evaluator';
import { Rng, shuffle } from './rng';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type Action =
  { type: 'fold' | 'check' | 'call' } | { type: 'raise'; to: number };
export interface GameConfig {
  seed: string;
  stacks: number[];
  button: number;
  smallBlind: number;
  bigBlind: number;
  runItTwice?: boolean;
  /** Explicit tournament blinds preserve dead-button obligations after elimination. */
  tournamentBlinds?: { small: number | null; big: number; deadButton: boolean };
}
export interface Seat {
  stack: number;
  hand: Hand;
  round: number;
  contributed: number;
  folded: boolean;
  acted: boolean;
  actedAt: number;
}
export interface ActionRecord {
  seat: number;
  street: Street;
  action: Action;
  board: number[];
  pot: number;
}
export interface Pot {
  amount: number;
  eligible: number[];
  winners: number[];
}
export interface Game {
  config: GameConfig;
  players: Seat[];
  deck: number[];
  cursor: number;
  board: number[];
  street: Street;
  actor: number;
  bet: number;
  minRaise: number;
  complete: boolean;
  history: ActionRecord[];
  pots: Pot[];
  awards: number[];
  finalContributions: number[];
  boards: Partial<Record<Street, number[]>>;
  returns: { seat: number; amount: number }[];
  runouts?: number[][];
  potAwards?: number[][];
}
const next = (seat: number, n: number) => (seat + 1) % n;
export const potSize = (game: Game): number =>
  game.players.reduce((s, p) => s + p.contributed, 0);
function validate(config: GameConfig): void {
  const { stacks, button, smallBlind, bigBlind } = config;
  if (
    stacks.length < 2 ||
    stacks.length > 9 ||
    stacks.some((s) => !Number.isSafeInteger(s) || s < 1) ||
    !Number.isSafeInteger(stacks.reduce((a, b) => a + b, 0)) ||
    !Number.isInteger(button) ||
    button < 0 ||
    button >= stacks.length ||
    !Number.isSafeInteger(smallBlind) ||
    !Number.isSafeInteger(bigBlind) ||
    smallBlind < 1 ||
    bigBlind < smallBlind
  )
    throw new Error('Invalid table configuration.');
  const blinds = config.tournamentBlinds;
  if (
    blinds &&
    (!Number.isInteger(blinds.big) ||
      blinds.big < 0 ||
      blinds.big >= stacks.length ||
      (blinds.small !== null &&
        (!Number.isInteger(blinds.small) ||
          blinds.small < 0 ||
          blinds.small >= stacks.length ||
          blinds.small === blinds.big)) ||
      (stacks.length === 2 &&
        (blinds.small !== button ||
          blinds.big === button ||
          blinds.deadButton)))
  )
    throw new Error('Invalid tournament blinds.');
}
export function legalActions(game: Game, seat = game.actor) {
  const player = game.players[seat];
  if (
    game.complete ||
    seat !== game.actor ||
    !player ||
    player.folded ||
    player.stack === 0
  )
    return {
      toCall: 0,
      canCheck: false,
      canFold: false,
      canRaise: false,
      minRaiseTo: 0,
      maxRaiseTo: 0,
    };
  const owed = Math.max(0, game.bet - player.round),
    maxRaiseTo = player.round + player.stack;
  return {
    toCall: Math.min(owed, player.stack),
    canCheck: owed === 0,
    canFold: true,
    canRaise:
      maxRaiseTo > game.bet &&
      game.players.some((p, i) => i !== seat && !p.folded && p.stack > 0) &&
      (!player.acted || game.bet - player.actedAt >= game.minRaise),
    minRaiseTo: game.bet + game.minRaise,
    maxRaiseTo,
  };
}
function pay(game: Game, seat: number, amount: number) {
  const p = game.players[seat];
  const paid = Math.min(p.stack, amount);
  p.stack -= paid;
  p.round += paid;
  p.contributed += paid;
}
export function settlePots(
  contributions: readonly number[],
  folded: readonly boolean[],
  strengths: readonly number[],
  button: number,
): { pots: Pot[]; awards: number[] } {
  const levels = [...new Set(contributions.filter((n) => n > 0))].sort(
      (a, b) => a - b,
    ),
    awards = contributions.map(() => 0),
    pots: Pot[] = [];
  let previous = 0;
  for (const level of levels) {
    const participants = contributions.flatMap((n, i) =>
        n >= level ? [i] : [],
      ),
      amount = (level - previous) * participants.length,
      eligible = participants.filter((i) => !folded[i]);
    previous = level;
    if (!eligible.length) throw new Error('A pot needs an eligible winner.');
    const best = Math.max(...eligible.map((i) => strengths[i])),
      winners = eligible
        .filter((i) => strengths[i] === best)
        .sort(
          (a, b) =>
            ((a - button - 1 + contributions.length) % contributions.length) -
            ((b - button - 1 + contributions.length) % contributions.length),
        );
    const each = Math.floor(amount / winners.length),
      odd = amount % winners.length;
    winners.forEach((seat, i) => (awards[seat] += each + (i < odd ? 1 : 0)));
    pots.push({ amount, eligible, winners });
  }
  return { pots, awards };
}
/** Split each pot across boards in exact sub-chip units, then round only once. */
export function settleBoards(
  contributions: number[],
  folded: boolean[],
  strengths: number[][],
  button: number,
) {
  if (strengths.length < 1 || strengths.length > 2)
    throw new Error('Use one or two boards.');
  const results = strengths.map((s) =>
      settlePots(contributions, folded, s, button),
    ),
    pots = results[0].pots,
    awards = contributions.map(() => 0),
    potAwards: number[][] = [];
  const unit = 2520n * BigInt(strengths.length);
  for (let i = 0; i < pots.length; i++) {
    const shares = contributions.map(() => 0n);
    for (const result of results) {
      const p = result.pots[i];
      for (const seat of p.winners)
        shares[seat] += (BigInt(p.amount) * 2520n) / BigInt(p.winners.length);
    }
    const paid = shares.map((v) => Number(v / unit));
    let odd = pots[i].amount - paid.reduce((a, b) => a + b, 0);
    for (let step = 1; step <= paid.length && odd > 0; step++) {
      const seat = (button + step) % paid.length;
      if (shares[seat] % unit) {
        paid[seat]++;
        odd--;
      }
    }
    paid.forEach((v, seat) => (awards[seat] += v));
    potAwards.push(paid);
  }
  return { pots, awards, potAwards };
}
function returnUncalled(game: Game) {
  const ranked = game.players
    .map((p, seat) => ({ seat, total: p.contributed }))
    .sort((a, b) => b.total - a.total);
  const excess = ranked[0].total - ranked[1].total;
  if (excess > 0) {
    const p = game.players[ranked[0].seat];
    p.stack += excess;
    p.contributed -= excess;
    p.round = Math.max(0, p.round - excess);
    game.returns.push({ seat: ranked[0].seat, amount: excess });
  }
}
function finish(game: Game) {
  returnUncalled(game);
  const strengths = game.players.map((p) =>
    p.folded
      ? -1
      : game.board.length === 5
        ? evaluateFast([...p.hand, ...game.board])
        : 0,
  );
  const result = game.runouts
    ? settleBoards(
        game.players.map((p) => p.contributed),
        game.players.map((p) => p.folded),
        game.runouts.map((b) =>
          game.players.map((p) =>
            p.folded ? -1 : evaluateFast([...p.hand, ...b]),
          ),
        ),
        game.config.button,
      )
    : {
        ...settlePots(
          game.players.map((p) => p.contributed),
          game.players.map((p) => p.folded),
          strengths,
          game.config.button,
        ),
        potAwards: undefined,
      };
  game.potAwards = result.potAwards;
  game.pots = result.pots;
  game.awards = result.awards;
  game.finalContributions = game.players.map((p) => p.contributed);
  game.players.forEach((p, i) => {
    p.stack += result.awards[i];
    p.contributed = 0;
    p.round = 0;
  });
  game.complete = true;
  game.actor = -1;
}
function dealStreet(game: Game) {
  const streets: Street[] = ['preflop', 'flop', 'turn', 'river'];
  game.street = streets[streets.indexOf(game.street) + 1];
  game.cursor++;
  const count = game.street === 'flop' ? 3 : 1;
  game.board.push(...game.deck.slice(game.cursor, game.cursor + count));
  game.cursor += count;
  game.boards[game.street] = [...game.board];
  game.bet = 0;
  game.minRaise = game.config.bigBlind;
  game.players.forEach((p) => {
    p.round = 0;
    p.acted = false;
    p.actedAt = 0;
  });
}
function advance(game: Game, after: number) {
  while (!game.complete) {
    const alive = game.players.flatMap((p, i) => (!p.folded ? [i] : []));
    if (alive.length === 1) {
      finish(game);
      return;
    }
    const able = alive.filter((i) => game.players[i].stack > 0);
    if (game.config.tournamentBlinds && able.length === 1) {
      game.bet = Math.min(
        game.bet,
        Math.max(...game.players.map((p) => p.round)),
      );
    }
    const pending = able.filter(
      (i) =>
        game.players[i].round < game.bet ||
        (!game.players[i].acted && able.length > 1),
    );
    if (pending.length) {
      for (let step = 1; step <= game.players.length; step++) {
        const seat = (after + step) % game.players.length;
        if (pending.includes(seat)) {
          game.actor = seat;
          return;
        }
      }
    }
    if (game.street === 'river') {
      finish(game);
      return;
    }
    returnUncalled(game);
    if (game.config.runItTwice && able.length <= 1) {
      const prefix = [...game.board],
        street = game.street,
        runouts: number[][] = [];
      let firstBoards = { ...game.boards };
      for (let run = 0; run < 2; run++) {
        game.board = [...prefix];
        game.street = street;
        while (game.board.length < 5) dealStreet(game);
        runouts.push([...game.board]);
        if (run === 0) firstBoards = { ...game.boards };
      }
      game.runouts = runouts;
      game.boards = firstBoards;
      game.board = runouts[0];
      game.boards.river = runouts[0];
      finish(game);
      return;
    }
    dealStreet(game);
    after = game.config.button;
  }
}
export function newGame(config: GameConfig): Game {
  validate(config);
  const shuffled = shuffle(deck(), new Rng(config.seed)),
    n = config.stacks.length,
    start = next(config.button, n),
    hands: number[][] = config.stacks.map(() => []);
  let cursor = 0;
  for (let round = 0; round < 2; round++)
    for (let i = 0; i < n; i++) hands[(start + i) % n].push(shuffled[cursor++]);
  const game: Game = {
    config: { ...config, stacks: [...config.stacks] },
    players: config.stacks.map((stack, i) => ({
      stack,
      hand: [hands[i][0], hands[i][1]],
      round: 0,
      contributed: 0,
      folded: false,
      acted: false,
      actedAt: 0,
    })),
    deck: shuffled,
    cursor,
    board: [],
    street: 'preflop',
    actor: start,
    bet: 0,
    minRaise: config.bigBlind,
    complete: false,
    history: [],
    pots: [],
    awards: config.stacks.map(() => 0),
    finalContributions: [],
    boards: { preflop: [] },
    returns: [],
  };
  const sb = config.tournamentBlinds
      ? config.tournamentBlinds.small
      : n === 2
        ? config.button
        : next(config.button, n),
    bb = config.tournamentBlinds?.big ?? next(sb!, n);
  if (sb !== null) pay(game, sb, config.smallBlind);
  pay(game, bb, config.bigBlind);
  game.bet =
    n > 2 ? config.bigBlind : Math.max(...game.players.map((p) => p.round));
  advance(game, n === 2 ? next(config.button, n) : bb);
  return game;
}
export function act(original: Game, action: Action): Game {
  const legal = legalActions(original);
  if (original.complete) throw new Error('The hand is complete.');
  const seat = original.actor,
    player = original.players[seat];
  if (
    (action.type === 'check' && !legal.canCheck) ||
    (action.type === 'call' && legal.toCall === 0)
  )
    throw new Error('That action is not available.');
  if (
    action.type === 'raise' &&
    (!Number.isSafeInteger(action.to) ||
      !legal.canRaise ||
      action.to > legal.maxRaiseTo ||
      action.to <= original.bet ||
      (action.to < legal.minRaiseTo && action.to !== legal.maxRaiseTo))
  )
    throw new Error('Illegal raise.');
  const game: Game = {
    ...original,
    players: original.players.map((p) => ({ ...p })),
    board: [...original.board],
    history: [
      ...original.history,
      {
        seat,
        street: original.street,
        action: { ...action },
        board: [...original.board],
        pot: potSize(original),
      },
    ],
    boards: { ...original.boards },
    returns: [...original.returns],
  };
  const p = game.players[seat];
  switch (action.type) {
    case 'fold':
      p.folded = true;
      break;
    case 'check':
      break;
    case 'call':
      pay(game, seat, legal.toCall);
      break;
    case 'raise': {
      const increment = action.to - game.bet;
      pay(game, seat, action.to - player.round);
      game.bet = action.to;
      if (increment >= game.minRaise) {
        game.minRaise = increment;
        game.players.forEach((other) => (other.acted = false));
      }
      break;
    }
    default:
      throw new Error('Unknown action.');
  }
  p.acted = true;
  p.actedAt = game.bet;
  advance(game, seat);
  return game;
}
export function replay(
  config: GameConfig,
  actions: readonly ActionRecord[],
  count = actions.length,
): Game {
  let game = newGame(config);
  for (const record of actions.slice(0, count)) {
    if (record.seat !== game.actor || record.street !== game.street)
      throw new Error('Replay action does not match the deal.');
    game = act(game, record.action);
  }
  return game;
}
export function nextButton(game: Game): number {
  return next(game.config.button, game.players.length);
}
/** Explicit information boundary: no opponent hand, undealt deck, cursor, or deal seed. */
export function playerView(game: Game, seat: number) {
  return {
    seat,
    hand: [...game.players[seat].hand] as Hand,
    board: [...game.board],
    street: game.street,
    button: game.config.button,
    bigBlind: game.config.bigBlind,
    pot: potSize(game),
    players: game.players.map((p) => ({
      stack: p.stack,
      round: p.round,
      contributed: p.contributed,
      folded: p.folded,
    })),
    legal: legalActions(game, seat),
    history: game.history.map((h) => ({
      ...h,
      action: { ...h.action },
      board: [...h.board],
    })),
  };
}
export type PlayerView = ReturnType<typeof playerView>;
