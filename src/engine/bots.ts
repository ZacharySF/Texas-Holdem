import { contestablePot } from './coach';
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
export function chooseBot(
  view: PlayerView,
  persona: Persona,
  equity: number,
  seed: string,
): { action: Action; reason: string } {
  if (!Number.isFinite(equity) || equity < 0 || equity > 1)
    throw new Error('Invalid equity estimate.');
  const rng = new Rng(seed),
    roll = rng.int(100),
    legal = view.legal,
    price = legal.toCall / (contestablePot(view) + legal.toCall || 1);
  const aggression =
    persona === 'loose-aggressive'
      ? 65
      : persona === 'equity-driven'
        ? 30
        : persona === 'calling-station'
          ? 8
          : 12;
  const willing =
    persona === 'calling-station'
      ? equity >= price * 0.3
      : persona === 'loose-aggressive'
        ? equity >= price * 0.8
        : persona === 'tight-passive'
          ? equity >= price + 0.04
          : equity >= price;
  const raise =
    legal.canRaise &&
    (equity > 0.65 || (persona === 'loose-aggressive' && roll < 12)) &&
    roll < aggression;
  if (raise) {
    const target = Math.min(
      legal.maxRaiseTo,
      Math.max(
        legal.minRaiseTo,
        view.players[view.seat].round +
          Math.floor(view.pot * 0.75) +
          legal.toCall,
      ),
    );
    return {
      action: { type: 'raise', to: target },
      reason: `${persona}: a seeded mix selected a raise using visible-card equity and a public-action range estimate. The model assumes the opponent's response; it cannot see their cards.`,
    };
  }
  if (legal.canCheck)
    return {
      action: { type: 'check' },
      reason: `${persona}: no call is owed; the seeded strategy takes the free option.`,
    };
  if (willing || (persona === 'calling-station' && roll < 25))
    return {
      action: { type: 'call' },
      reason: `${persona}: the estimated equity and this persona's willingness to continue selected a call. Future betting is not modeled.`,
    };
  return {
    action: { type: 'fold' },
    reason: `${persona}: the price exceeds this strategy's willingness to continue on its estimated range.`,
  };
}
