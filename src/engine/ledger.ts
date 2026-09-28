import {
  act,
  newGame,
  type ActionRecord,
  type GameConfig,
  type Game,
} from './game';
import { payouts } from './payouts';
import { Z95 } from './stats';
import { winRate } from './inference';
export interface LedgerHand {
  id: string;
  date: string;
  config: GameConfig;
  actions: ActionRecord[];
  notes: { seat: number; index: number; gap?: number }[];
}
export interface HandResult {
  id: string;
  actual: number;
  adjusted: number;
  adjustmentSE: number;
  adjustedPots: number;
  samples: number;
}
/** Adjust only a pot whose participants and eligibility became fixed before the river. */
export function handResult(
  hand: LedgerHand,
  samples = 5000,
  analysisSeed = hand.config.seed,
): HandResult {
  let game = newGame(hand.config);
  const frames: { game: Game; board: number[] }[] = [{ game, board: [] }];
  for (const action of hand.actions) {
    if (game.actor !== action.seat || game.street !== action.street)
      throw new Error('Invalid history.');
    const board = [...game.board];
    game = act(game, action.action);
    frames.push({ game, board });
  }
  if (!game.complete) throw new Error('Only completed hands have results.');
  const actual = game.players[0].stack - hand.config.stacks[0];
  let adjusted = actual,
    variance = 0,
    adjustedPots = 0,
    totalSamples = 0,
    previous = 0;
  const levels = [
    ...new Set(game.finalContributions.filter((c) => c > 0)),
  ].sort((a, b) => a - b);
  for (let i = 0; i < game.pots.length; i++) {
    const pot = game.pots[i],
      level = levels[i],
      width = level - previous;
    previous = level;
    if (!pot.eligible.includes(0) || pot.eligible.length < 2) continue;
    const participants = game.finalContributions.map((c) => c >= level),
      eligible = pot.eligible;
    const lock = frames.find(
      ({ game: g, board }) =>
        board.length < 5 &&
        participants.every(
          (inPot, s) =>
            !inPot ||
            (g.complete ? g.finalContributions[s] : g.players[s].contributed) >=
              level,
        ) &&
        g.players.every(
          (p, s) => !participants[s] || p.folded === game.players[s].folded,
        ) &&
        g.players.every(
          (p, s) =>
            p.folded ||
            eligible.includes(s) ||
            (g.complete
              ? hand.config.stacks[s] - g.finalContributions[s]
              : p.stack) === 0,
        ) &&
        eligible.filter(
          (s) =>
            (g.complete
              ? hand.config.stacks[s] - g.finalContributions[s]
              : g.players[s].stack) > 0,
        ).length <= 1,
    );
    if (!lock) continue;
    const result = payouts({
      players: game.players.map((p) => p.hand),
      board: lock.board,
      contributions: participants.map((p) => (p ? width : 0)),
      folded: game.players.map((p) => p.folded),
      button: hand.config.button,
      seed: analysisSeed,
      samples,
      method: 'auto',
      runItTwice: !!game.runouts,
    });
    const winnerIndex = pot.winners.indexOf(0),
      actualAward = game.potAwards
        ? game.potAwards[i][0]
        : winnerIndex < 0
          ? 0
          : Math.floor(pot.amount / pot.winners.length) +
            Number(winnerIndex < pot.amount % pot.winners.length);
    adjusted += result.meanAwards[0] - actualAward;
    variance += (result.intervals[0][1] - result.intervals[0][0]) / (2 * Z95);
    adjustedPots++;
    totalSamples += result.samples;
  }
  return {
    id: hand.id,
    actual: actual / hand.config.bigBlind,
    adjusted: adjusted / hand.config.bigBlind,
    adjustmentSE: variance / hand.config.bigBlind,
    adjustedPots,
    samples: totalSamples,
  };
}
export function summarizeResults(results: HandResult[]) {
  let a = 0,
    e = 0;
  return {
    rate: winRate(results.map((r) => r.actual)),
    actual: results.map((r) => (a += r.actual)),
    adjusted: results.map((r) => (e += r.adjusted)),
    adjustedPots: results.reduce((n, r) => n + r.adjustedPots, 0),
    analysisSamples: results.reduce((n, r) => n + r.samples, 0),
    adjustmentSE: results.reduce((s, r) => s + r.adjustmentSE, 0),
  };
}
export function conceptGrades(hands: LedgerHand[]) {
  const groups = new Map<
    string,
    { count: number; gap: number; close: number }
  >();
  for (const h of hands)
    for (const n of h.notes) {
      if (n.seat !== 0 || n.gap === undefined) continue;
      const action = h.actions[n.index];
      if (!action) continue;
      const key =
          action.street === 'preflop'
            ? 'Ranges and preflop matchups'
            : action.action.type === 'raise'
              ? 'Conditional raise EV'
              : 'Call EV and effective odds',
        g = groups.get(key) ?? { count: 0, gap: 0, close: 0 };
      g.count++;
      g.gap += n.gap / h.config.bigBlind;
      g.close += Number(n.gap <= h.config.bigBlind / 2);
      groups.set(key, g);
    }
  return [...groups].map(([concept, g]) => ({
    concept,
    ...g,
    gap: g.gap / g.count,
  }));
}
