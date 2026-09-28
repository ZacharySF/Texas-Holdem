import {
  isRange,
  planRanges,
  rangeEquitySteps,
  type WeightedRange,
} from './ranges';
import { assertCards, deck, type Card, type Hand } from './cards';
import { evaluateFast } from './evaluator';
import { combinations, gcd, nCr, Rational } from './math';
import { Rng } from './rng';
import { shareInterval, Welford, wilson, type Interval } from './stats';
/** Extend this union with weighted ranges in Phase 3. */
export type PlayerInput = Hand | 'random' | WeightedRange;
export type Method = 'exact' | 'monteCarlo' | 'auto';
export interface EquityInput {
  players: readonly PlayerInput[];
  board: readonly Card[];
  dead?: readonly Card[];
  method: Method;
  samples: number;
  seed: string;
}
export interface Probability {
  numerator: string;
  denominator: string;
  value: number;
  interval: Interval;
}
export interface PlayerResult {
  win: Probability;
  tie: Probability;
  loss: Probability;
  equity: Probability;
  standardError: number;
}
export interface EquityResult {
  method: 'exact' | 'monteCarlo';
  samples: number;
  total: number;
  complete: boolean;
  players: PlayerResult[];
}
export interface EquityPlan {
  assignments: bigint;
  exactFeasible: boolean;
  method: 'exact' | 'monteCarlo';
}
// Conservative budget: full assignments × players, based on the checked-in benchmark.
export const EXACT_EVALUATION_BUDGET = 120000;
function remaining(input: EquityInput): Card[] {
  if (input.players.length < 2 || input.players.length > 9)
    throw new Error('Choose two through nine players.');
  if (
    input.board.length > 5 ||
    input.players.some((p) => p !== 'random' && !isRange(p) && p.length !== 2)
  )
    throw new Error('Use two hole cards and at most five board cards.');
  if (
    !Number.isSafeInteger(input.samples) ||
    input.samples < 1 ||
    input.samples > 10000000
  )
    throw new Error('Samples must be an integer from 1 to 10,000,000.');
  const known = [
    ...input.board,
    ...(input.dead ?? []),
    ...input.players.flatMap((p) =>
      p === 'random' || isRange(p) ? [] : [...p],
    ),
  ];
  assertCards(known);
  const available = deck().filter((c) => !known.includes(c));
  if (
    available.length <
    5 -
      input.board.length +
      2 * input.players.filter((p) => p === 'random').length
  )
    throw new Error('Not enough cards remain.');
  return available;
}
export function planEquity(input: EquityInput): EquityPlan {
  if (input.players.some(isRange)) return planRanges(input);
  let n = remaining(input).length;
  let assignments = nCr(n, 5 - input.board.length);
  n -= 5 - input.board.length;
  for (const p of input.players)
    if (p === 'random') {
      assignments *= nCr(n, 2);
      n -= 2;
    }
  const exactFeasible =
    assignments * BigInt(input.players.length) <=
    BigInt(EXACT_EVALUATION_BUDGET);
  return {
    assignments,
    exactFeasible,
    method:
      input.method === 'auto'
        ? exactFeasible
          ? 'exact'
          : 'monteCarlo'
        : input.method,
  };
}
function* exactDeals(
  input: EquityInput,
  available: Card[],
): Generator<{ board: Card[]; hands: Hand[] }> {
  function* assign(
    index: number,
    rest: Card[],
    hands: Hand[],
    board: Card[],
  ): Generator<{ board: Card[]; hands: Hand[] }> {
    if (index === input.players.length) {
      yield { board, hands };
      return;
    }
    const player = input.players[index];
    if (player !== 'random' && !isRange(player)) {
      yield* assign(index + 1, rest, [...hands, player], board);
      return;
    }
    for (const pair of combinations(rest, 2))
      yield* assign(
        index + 1,
        rest.filter((c) => !pair.includes(c)),
        [...hands, [pair[0], pair[1]]],
        board,
      );
  }
  for (const runout of combinations(available, 5 - input.board.length))
    yield* assign(
      0,
      available.filter((c) => !runout.includes(c)),
      [],
      [...input.board, ...runout],
    );
}
function probability(n: number, d: number, interval: Interval): Probability {
  const fraction = new Rational(n, d);
  return {
    numerator: fraction.numerator.toString(),
    denominator: fraction.denominator.toString(),
    value: n / d,
    interval,
  };
}
/** Pure, incremental iterator: worker schedules batches and handles cancellation. */
export function* equitySteps(
  input: EquityInput,
  batchSize = 256,
): Generator<EquityResult, EquityResult> {
  if (input.players.some(isRange))
    return yield* rangeEquitySteps(input, batchSize);
  if (!Number.isSafeInteger(batchSize) || batchSize < 1)
    throw new Error('Batch size must be positive.');
  const available = remaining(input),
    plan = planEquity(input);
  const total =
    plan.method === 'exact' ? Number(plan.assignments) : input.samples;
  if (!Number.isSafeInteger(total))
    throw new Error('Exact enumeration exceeds safe counter precision.');
  const rng = new Rng(input.seed);
  const stats = input.players.map(() => new Welford());
  const wins = input.players.map(() => 0),
    ties = [...wins],
    losses = [...wins],
    shares = [...wins];
  let scale = 1;
  for (let i = 2; i <= input.players.length; i++)
    scale = (scale * i) / Number(gcd(BigInt(scale), BigInt(i)));
  if (!Number.isSafeInteger(total * scale))
    throw new Error('Exact pot-share counter would overflow.');
  const exact =
    plan.method === 'exact' ? exactDeals(input, available) : undefined;
  let count = 0;
  const snapshot = (): EquityResult => ({
    method: plan.method,
    samples: count,
    total,
    complete: count === total,
    players: stats.map((s, i) => {
      const interval = (n: number): Interval =>
        plan.method === 'exact'
          ? count === total
            ? [n / count, n / count]
            : [0, 1]
          : wilson(n, count);
      return {
        win: probability(wins[i], count, interval(wins[i])),
        tie: probability(ties[i], count, interval(ties[i])),
        loss: probability(losses[i], count, interval(losses[i])),
        equity: probability(
          shares[i],
          count * scale,
          plan.method === 'exact'
            ? count === total
              ? [shares[i] / (count * scale), shares[i] / (count * scale)]
              : [0, 1]
            : shareInterval(s),
        ),
        standardError:
          plan.method === 'exact' && count === total ? 0 : s.standardError,
      };
    }),
  });
  while (count < total) {
    let board: Card[], hands: Hand[];
    if (exact) {
      const next = exact.next();
      if (next.done) throw new Error('Enumeration ended early.');
      ({ board, hands } = next.value);
    } else {
      const pool = [...available];
      let cursor = 0;
      const draw = (): Card => {
        const j = cursor + rng.int(pool.length - cursor);
        [pool[cursor], pool[j]] = [pool[j], pool[cursor]];
        return pool[cursor++];
      };
      board = [...input.board];
      while (board.length < 5) board.push(draw());
      hands = input.players.map((p) =>
        p === 'random' || isRange(p) ? [draw(), draw()] : p,
      );
    }
    const strengths = hands.map((h) => evaluateFast([...h, ...board]));
    const best = Math.max(...strengths),
      winners = strengths.filter((s) => s === best).length;
    for (let i = 0; i < strengths.length; i++) {
      const won = strengths[i] === best,
        share = won ? 1 / winners : 0;
      if (!won) losses[i]++;
      else if (winners === 1) wins[i]++;
      else ties[i]++;
      shares[i] += won ? scale / winners : 0;
      stats[i].add(share);
    }
    count++;
    if (count % batchSize === 0 && count < total) yield snapshot();
  }
  return snapshot();
}
export function equity(input: EquityInput): EquityResult {
  const steps = equitySteps(input);
  let next = steps.next();
  while (!next.done) next = steps.next();
  return next.value;
}
