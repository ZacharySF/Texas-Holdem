import { assertCards, deck, type Hand } from './cards';
import { combinations, gcd, nCr, Rational } from './math';
import { Rng } from './rng';
import { evaluateFast } from './evaluator';
import { Welford, shareInterval, wilson, type Interval } from './stats';
import type {
  EquityInput,
  EquityPlan,
  EquityResult,
  PlayerInput,
  Probability,
} from './equity';
export interface WeightedCombo {
  hand: Hand;
  weight: number;
}
export interface WeightedRange {
  combos: readonly WeightedCombo[];
}
export const isRange = (player: PlayerInput): player is WeightedRange =>
  typeof player === 'object' && !Array.isArray(player);
function prepare(input: EquityInput) {
  if (
    input.players.length < 2 ||
    input.players.length > 9 ||
    input.board.length > 5 ||
    !Number.isSafeInteger(input.samples) ||
    input.samples < 1 ||
    input.samples > 10000000
  )
    throw new Error('Invalid equity request.');
  const fixed = input.players.flatMap((p) =>
    p === 'random' || isRange(p) ? [] : [...p],
  );
  if (
    input.players.some((p) => p !== 'random' && !isRange(p) && p.length !== 2)
  )
    throw new Error('Use two hole cards.');
  const known = [...fixed, ...input.board, ...(input.dead ?? [])];
  assertCards(known);
  const available = deck().filter((c) => !known.includes(c));
  const options = input.players.map((p) => {
    if (p === 'random')
      return [...combinations(available, 2)].map((pair) => ({
        hand: [pair[0], pair[1]] as Hand,
        weight: 1,
      }));
    if (!isRange(p)) return [{ hand: p, weight: 1 }];
    const seen = new Set<string>();
    for (const combo of p.combos) {
      assertCards(combo.hand);
      if (
        combo.hand.length !== 2 ||
        !Number.isSafeInteger(combo.weight) ||
        combo.weight < 1 ||
        combo.weight > 1000000
      )
        throw new Error('Use positive integer range weights.');
      const key = [...combo.hand].sort((a, b) => a - b).join(',');
      if (seen.has(key)) throw new Error('Duplicate combo in range.');
      seen.add(key);
    }
    const valid = p.combos.filter((c) =>
      c.hand.every((card) => !known.includes(card)),
    );
    if (!valid.length || valid.reduce((s, c) => s + c.weight, 0) > 2 ** 32)
      throw new Error('Range has no available combos or excessive weight.');
    return valid;
  });
  const hidden = input.players.filter(
    (p) => p === 'random' || isRange(p),
  ).length;
  const afterHands = available.length - 2 * hidden;
  if (afterHands < 5 - input.board.length)
    throw new Error('Not enough cards remain.');
  const upper = options.reduce(
    (p, c) => p * BigInt(c.length),
    nCr(afterHands, 5 - input.board.length),
  );
  return { options, upper };
}
function* assignments(
  options: WeightedCombo[][],
  index = 0,
  hands: Hand[] = [],
  used: number[] = [],
  weight = 1n,
): Generator<{ hands: Hand[]; weight: bigint }> {
  if (index === options.length) {
    yield { hands, weight };
    return;
  }
  for (const combo of options[index])
    if (!combo.hand.some((c) => used.includes(c)))
      yield* assignments(
        options,
        index + 1,
        [...hands, combo.hand],
        [...used, ...combo.hand],
        weight * BigInt(combo.weight),
      );
}
export function planRanges(input: EquityInput): EquityPlan {
  const { upper } = prepare(input),
    exactFeasible = upper * BigInt(input.players.length) <= 120000n;
  return {
    assignments: upper,
    exactFeasible,
    method:
      input.method === 'auto'
        ? exactFeasible
          ? 'exact'
          : 'monteCarlo'
        : input.method,
  };
}
function probability(n: bigint, d: bigint, interval: Interval): Probability {
  const p = new Rational(n, d);
  return {
    numerator: p.numerator.toString(),
    denominator: p.denominator.toString(),
    value: p.toNumber(),
    interval,
  };
}
export function* rangeEquitySteps(
  input: EquityInput,
  batch = 256,
): Generator<EquityResult, EquityResult> {
  if (!Number.isSafeInteger(batch) || batch < 1)
    throw new Error('Batch size must be positive.');
  const { options, upper } = prepare(input),
    method = planRanges(input).method,
    rng = new Rng(input.seed);
  if (assignments(options).next().done)
    throw new Error('Ranges have no disjoint joint assignment.');
  const total = method === 'exact' ? Number(upper) : input.samples;
  if (!Number.isSafeInteger(total))
    throw new Error('Exact enumeration is too large.');
  let scale = 1n;
  for (let i = 2n; i <= BigInt(options.length); i++)
    scale = (scale * i) / gcd(scale, i);
  const wins = options.map(() => 0n),
    ties = [...wins],
    losses = [...wins],
    shares = [...wins],
    stats = options.map(() => new Welford());
  let count = 0,
    mass = 0n;
  const baseKnown = [...input.board, ...(input.dead ?? [])];
  function* deals() {
    if (method === 'exact') {
      for (const assignment of assignments(options)) {
        const remaining = deck().filter(
          (c) =>
            !baseKnown.includes(c) &&
            !assignment.hands.some((h) => h.includes(c)),
        );
        for (const runout of combinations(remaining, 5 - input.board.length))
          yield { ...assignment, board: [...input.board, ...runout] };
      }
    } else
      for (let trial = 0; trial < input.samples; trial++) {
        let hands: Hand[] = [];
        let accepted = false;
        for (let attempt = 0; attempt < 10000; attempt++) {
          hands = options.map((combos) => {
            let ticket = rng.int(combos.reduce((s, c) => s + c.weight, 0));
            for (const combo of combos) {
              ticket -= combo.weight;
              if (ticket < 0) return combo.hand;
            }
            throw new Error('Invalid weighted ticket.');
          });
          if (new Set(hands.flat()).size === hands.length * 2) {
            accepted = true;
            break;
          }
        }
        if (!accepted)
          throw new Error('Ranges overlap too heavily to sample efficiently.');
        const remaining = deck().filter(
            (c) => !baseKnown.includes(c) && !hands.some((h) => h.includes(c)),
          ),
          board = [...input.board];
        for (let i = 0; board.length < 5; i++) {
          const j = i + rng.int(remaining.length - i);
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
          board.push(remaining[i]);
        }
        yield { hands, board, weight: 1n };
      }
  }
  const snapshot = (complete: boolean): EquityResult => ({
    method,
    samples: count,
    total: complete ? count : total,
    complete,
    players: stats.map((s, i) => {
      const interval = (n: bigint): Interval =>
        method === 'exact'
          ? complete
            ? [Number(n) / Number(mass), Number(n) / Number(mass)]
            : [0, 1]
          : wilson(Number(n), count);
      const share = new Rational(shares[i], mass * scale).toNumber();
      return {
        win: probability(wins[i], mass, interval(wins[i])),
        tie: probability(ties[i], mass, interval(ties[i])),
        loss: probability(losses[i], mass, interval(losses[i])),
        equity: probability(
          shares[i],
          mass * scale,
          method === 'exact'
            ? complete
              ? [share, share]
              : [0, 1]
            : shareInterval(s),
        ),
        standardError: method === 'exact' ? 0 : s.standardError,
      };
    }),
  });
  for (const deal of deals()) {
    const strengths = deal.hands.map((h) =>
        evaluateFast([...h, ...deal.board]),
      ),
      best = Math.max(...strengths),
      winners = strengths.filter((s) => s === best).length;
    count++;
    mass += deal.weight;
    strengths.forEach((s, i) => {
      const won = s === best;
      if (!won) losses[i] += deal.weight;
      else if (winners === 1) wins[i] += deal.weight;
      else ties[i] += deal.weight;
      shares[i] += won ? (deal.weight * scale) / BigInt(winners) : 0n;
      stats[i].add(won ? 1 / winners : 0);
    });
    if (count % batch === 0) yield snapshot(false);
  }
  return snapshot(true);
}
