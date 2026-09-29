import { evaluateFast } from './evaluator';
import { showdownSampler, callScenario } from './payouts';
import { settlePots } from './game';
import { Welford } from './stats';
import type { PlayerInput } from './equity';
import { deck, rank, suit } from './cards';
import { combinations } from './math';
import { Rng } from './rng';
import type { WeightedRange } from './ranges';
import type { Action, PlayerView } from './game';
export const PERSONAS = [
  'tight-passive',
  'loose-aggressive',
  'calling-station',
  'equity-driven',
] as const;
export type Persona = (typeof PERSONAS)[number];
export function estimatedRange(
  view: PlayerView,
  persona: Persona,
  opponentSeat?: number,
): WeightedRange {
  const known = [...view.hand, ...view.board],
    last = [...view.history]
      .reverse()
      .find((h) =>
        opponentSeat === undefined
          ? h.seat !== view.seat
          : h.seat === opponentSeat,
      )?.action.type;
  const combos = [
    ...combinations(
      deck().filter((c) => !known.includes(c)),
      2,
    ),
  ].map((cards) => {
    const a = rank(cards[0]),
      b = rank(cards[1]);
    const quality =
      a +
      b +
      (a === b ? 20 : 0) +
      (suit(cards[0]) === suit(cards[1]) ? 3 : 0) +
      (Math.abs(a - b) === 1 ? 2 : 0);
    let weight =
      persona === 'calling-station'
        ? 10
        : persona === 'loose-aggressive'
          ? Math.max(2, quality - 10)
          : Math.max(1, quality - 18);
    if (last === 'raise') weight *= quality >= 28 ? 4 : 1;
    return { hand: [cards[0], cards[1]] as const, weight };
  });
  return { combos };
}
export interface BotActionValue {
  action: Action;
  mean: number;
  standardError: number;
}

/** Compare the same hypothetical deals across actions; never read an actual opponent hand. */
export function botActionValues(
  view: PlayerView,
  persona: Persona,
  seed: string,
  samples = 800,
  players: PlayerInput[] = view.players.map((p, i) =>
    i === view.seat
      ? view.hand
      : p.folded
        ? 'random'
        : estimatedRange(view, persona, i),
  ),
): BotActionValue[] {
  if (!Number.isInteger(samples) || samples < 2 || samples > 100000)
    throw new Error('Use between 2 and 100000 bot samples.');
  const legal = view.legal,
    hero = view.players[view.seat];
  const actions: Action[] = legal.canCheck
    ? [{ type: 'check' }]
    : [{ type: 'fold' }, { type: 'call' }];
  if (legal.canRaise) {
    const current = hero.round + legal.toCall;
    const sizes = [
      legal.minRaiseTo,
      current + Math.floor((view.pot + legal.toCall) / 2),
      current + view.pot + legal.toCall,
      legal.maxRaiseTo,
    ];
    for (const to of new Set(
      sizes.map((n) =>
        Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, n)),
      ),
    ))
      actions.push({ type: 'raise', to });
  }
  const rng = new Rng(seed),
    sample = showdownSampler(players, view.board, [], rng);
  // Relative made-hand strength on the CURRENT street. Future sampled cards are
  // used only for settlement, never for deciding whether a modeled opponent calls.
  const strength = (hand: readonly number[]) =>
    view.board.length >= 3
      ? evaluateFast([...hand, ...view.board])
      : rank(hand[0]) +
        rank(hand[1]) +
        (rank(hand[0]) === rank(hand[1]) ? 20 : 0) +
        (suit(hand[0]) === suit(hand[1]) ? 3 : 0) +
        (Math.abs(rank(hand[0]) - rank(hand[1])) === 1 ? 2 : 0);
  const known = [...view.hand, ...view.board];
  const strengths = [
    ...combinations(
      deck().filter((c) => !known.includes(c)),
      2,
    ),
  ]
    .map(strength)
    .sort((a, b) => a - b);
  const percentile = (value: number) => {
    let low = 0,
      high = strengths.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (strengths[mid] <= value) low = mid + 1;
      else high = mid;
    }
    return low / strengths.length;
  };
  const stats = actions.map(() => new Welford());
  const scenarios = actions.map((a) =>
    callScenario(view, a.type === 'raise' ? a.to : undefined),
  );
  const style = {
    'calling-station': -0.2,
    'loose-aggressive': -0.08,
    'equity-driven': 0,
    'tight-passive': 0.1,
  }[persona];
  for (let draw = 0; draw < samples; draw++) {
    const deal = sample();
    const finalStrengths = deal.hands.map((h) =>
      evaluateFast([...h, ...deal.board]),
    );
    const currentStrengths = deal.hands.map((h) => percentile(strength(h)));
    const tickets = view.players.map(() => rng.int(1000000) / 1000000);
    actions.forEach((action, index) => {
      if (action.type === 'fold') {
        stats[index].add(0);
        return;
      }
      const scenario = scenarios[index];
      const contributions = [...scenario.contributions],
        folded = [...scenario.folded];
      if (action.type === 'raise') {
        view.players.forEach((p, seat) => {
          if (seat === view.seat || p.folded || p.stack === 0) return;
          const cost = contributions[seat] - p.contributed;
          if (cost === 0) return;
          const price = cost / (view.pot + scenario.risk + cost);
          // Explicit behavioral assumption, not a solved poker strategy. Larger
          // prices tighten the calling range; stronger sampled holdings call more.
          const threshold =
            0.35 + price * 0.8 + (cost / p.stack) * 0.15 + style;
          const callChance = Math.max(
            0.02,
            Math.min(0.98, 0.5 + (currentStrengths[seat] - threshold) * 3),
          );
          if (tickets[seat] >= callChance) {
            folded[seat] = true;
            contributions[seat] = p.contributed;
          }
        });
      }
      const award = settlePots(
        contributions,
        folded,
        finalStrengths,
        view.button,
      ).awards[view.seat];
      stats[index].add(award - scenario.risk);
    });
  }
  return actions.map((action, i) => ({
    action,
    mean: stats[i].mean,
    standardError: stats[i].standardError,
  }));
}

export function chooseBot(
  view: PlayerView,
  persona: Persona,
  seed: string,
  samples = 800,
) {
  const values = botActionValues(view, persona, seed, samples);
  // Stable ordering prefers the cheaper action when estimated returns are equal.
  const best = values.reduce((a, b) => (b.mean > a.mean + 1e-9 ? b : a));
  const label = (a: Action) =>
    a.type === 'raise' ? `raise to ${a.to}` : a.type;
  return {
    action: best.action,
    reason:
      `${persona}: ${label(best.action)} has the highest estimated net chip return. ` +
      values.map((v) => `${label(v.action)}: ${v.mean.toFixed(2)}`).join('; ') +
      `. ${samples} shared sampled deals; hidden cards are guessed from public information. ` +
      'Raise responses depend on current hand strength and price; no re-raises or later betting are modeled. Close estimates can be sampling noise.',
  };
}
