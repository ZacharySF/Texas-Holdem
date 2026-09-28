import { assertCards, deck, type Hand } from './cards';
import { evaluateFast } from './evaluator';
import { combinations, nCr } from './math';
import { Rng } from './rng';
import { isRange } from './ranges';
import { planEquity, type PlayerInput } from './equity';
import { settleBoards, settlePots, type PlayerView } from './game';
import { Z95, Welford, type Interval } from './stats';
export interface PayoutInput {
  players: PlayerInput[];
  board: number[];
  dead?: number[];
  contributions: number[];
  folded: boolean[];
  button: number;
  seed: string;
  samples: number;
  hero?: number;
  method?: 'exact' | 'monteCarlo' | 'auto';
  runItTwice?: boolean;
}
export interface PayoutResult {
  method: 'exact' | 'monteCarlo';
  samples: number;
  meanAwards: number[];
  intervals: Interval[];
  heroOutcomes: { award: number; count: number }[];
  pots: { amount: number; eligible: number[]; heroMean: number }[];
}
/** Product-prior joint rejection, with cumulative weights prepared once. */
export function showdownSampler(
  players: PlayerInput[],
  board: number[],
  dead: number[],
  rng: Rng,
  runItTwice = false,
) {
  planEquity({
    players,
    board,
    dead,
    seed: '00000000000000000000000000000001',
    samples: 1,
    method: 'monteCarlo',
  });
  const known = [
    ...board,
    ...dead,
    ...players.flatMap((p) => (p === 'random' || isRange(p) ? [] : [...p])),
  ];
  assertCards(known);
  if (
    runItTwice &&
    52 - board.length - dead.length - 2 * players.length <
      2 * (5 - board.length)
  )
    throw new Error('Not enough remaining cards for two boards.');
  const available = deck().filter((c) => !known.includes(c));
  const options = players.map((p) => {
    const combos =
      p === 'random'
        ? [...combinations(available, 2)].map((h) => ({
            hand: h as unknown as Hand,
            weight: 1,
          }))
        : isRange(p)
          ? p.combos.filter((c) =>
              c.hand.every((card) => !known.includes(card)),
            )
          : [{ hand: p, weight: 1 }];
    let total = 0;
    return {
      combos,
      cumulative: combos.map((c) => (total += c.weight)),
      total,
    };
  });
  return () => {
    for (let attempt = 0; attempt < 10000; attempt++) {
      const hands = options.map(({ combos, cumulative, total }) => {
        const ticket = rng.int(total);
        let low = 0,
          high = cumulative.length - 1;
        while (low < high) {
          const mid = (low + high) >> 1;
          if (ticket < cumulative[mid]) high = mid;
          else low = mid + 1;
        }
        return combos[low].hand;
      });
      if (new Set(hands.flat()).size === 2 * hands.length) {
        const used = new Set([...board, ...dead, ...hands.flat()]),
          remaining = deck().filter((c) => !used.has(c)),
          runout = [...board];
        for (let i = 0; runout.length < 5; i++) {
          const j = i + rng.int(remaining.length - i);
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
          runout.push(remaining[i]);
        }
        let second: number[] | undefined;
        if (runItTwice) {
          second = [...board];
          for (let i = 5 - board.length; second.length < 5; i++) {
            const j = i + rng.int(remaining.length - i);
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
            second.push(remaining[i]);
          }
        }
        return { hands, board: runout, second };
      }
    }
    throw new Error('Ranges overlap too heavily to sample a legal joint deal.');
  };
}
export function* payoutSteps(
  input: PayoutInput,
): Generator<PayoutResult, PayoutResult> {
  const { players, board, contributions, folded, button } = input,
    hero = input.hero ?? 0;
  if (
    players.length !== contributions.length ||
    players.length !== folded.length ||
    !Number.isInteger(button) ||
    button < 0 ||
    button >= players.length ||
    !Number.isInteger(hero) ||
    hero < 0 ||
    hero >= players.length ||
    contributions.some((n) => !Number.isSafeInteger(n) || n < 0) ||
    !Number.isSafeInteger(contributions.reduce((a, b) => a + b, 0)) ||
    !Number.isInteger(input.samples) ||
    input.samples < 1 ||
    input.samples > 1000000
  )
    throw new Error('Invalid payout inputs.');
  const rng = new Rng(input.seed),
    sample = showdownSampler(
      players,
      board,
      input.dead ?? [],
      rng,
      input.runItTwice,
    ),
    fixed = players.every((p) => p !== 'random' && !isRange(p)),
    allKnown = [
      ...board,
      ...(input.dead ?? []),
      ...players.flatMap((p) => (p === 'random' || isRange(p) ? [] : [...p])),
    ],
    remaining = deck().filter((c) => !allKnown.includes(c)),
    possible =
      nCr(remaining.length, 5 - board.length) *
      (input.runItTwice
        ? nCr(remaining.length - (5 - board.length), 5 - board.length)
        : 1n),
    exact =
      fixed &&
      (input.method === 'exact' ||
        (input.method !== 'monteCarlo' && possible <= 60000n));
  if (input.method === 'exact' && !fixed)
    throw new Error('Exact payouts currently require specified hands.');
  if (exact && possible > 2000000n)
    throw new Error('Exact payouts exceed the work limit.');
  const stats = players.map(() => new Welford()),
    histogram = new Map<number, number>(),
    potStats: Welford[] = [];
  let count = 0,
    latest: ReturnType<typeof settlePots> & { potAwards?: number[][] } = {
      awards: [],
      pots: [],
    };
  const snapshot = (): PayoutResult => ({
    method: exact ? 'exact' : 'monteCarlo',
    samples: count,
    meanAwards: stats.map((s) => s.mean),
    intervals: stats.map((s) =>
      exact
        ? [s.mean, s.mean]
        : (() => {
            const total = contributions.reduce((a, b) => a + b, 0),
              radius = Math.max(
                Z95 * s.standardError,
                (total * Z95 ** 2) / (s.count + Z95 ** 2),
              );
            return [
              Math.max(0, s.mean - radius),
              Math.min(total, s.mean + radius),
            ] as const;
          })(),
    ),
    heroOutcomes: [...histogram]
      .sort((a, b) => a[0] - b[0])
      .map(([award, count]) => ({ award, count })),
    pots: latest.pots.map((p, i) => ({
      amount: p.amount,
      eligible: p.eligible,
      heroMean: potStats[i].mean,
    })),
  });
  function add(hands: Hand[], runout: number[], second?: number[]) {
    const strengths = hands.map((h) => evaluateFast([...h, ...runout]));
    latest = second
      ? settleBoards(
          contributions,
          folded,
          [strengths, hands.map((h) => evaluateFast([...h, ...second]))],
          button,
        )
      : settlePots(contributions, folded, strengths, button);
    count++;
    latest.awards.forEach((a, i) => stats[i].add(a));
    histogram.set(
      latest.awards[hero],
      (histogram.get(latest.awards[hero]) ?? 0) + 1,
    );
    latest.pots.forEach((p, i) => {
      potStats[i] ??= new Welford();
      const index = p.winners.indexOf(hero),
        award = latest.potAwards
          ? latest.potAwards[i][hero]
          : index < 0
            ? 0
            : Math.floor(p.amount / p.winners.length) +
              Number(index < p.amount % p.winners.length);
      potStats[i].add(award);
    });
  }
  if (exact) {
    for (const runout of combinations(remaining, 5 - board.length)) {
      if (input.runItTwice) {
        for (const second of combinations(
          remaining.filter((c) => !runout.includes(c)),
          5 - board.length,
        )) {
          add(players as Hand[], [...board, ...runout], [...board, ...second]);
          if (count % 256 === 0) yield snapshot();
        }
      } else {
        add(players as Hand[], [...board, ...runout]);
        if (count % 256 === 0) yield snapshot();
      }
    }
  } else
    for (let i = 0; i < input.samples; i++) {
      const deal = sample();
      add(deal.hands, deal.board, deal.second);
      if (count % 128 === 0) yield snapshot();
    }
  return snapshot();
}
export function payouts(input: PayoutInput): PayoutResult {
  const steps = payoutSteps(input);
  let next = steps.next();
  while (!next.done) next = steps.next();
  return next.value;
}
export function callScenario(view: PlayerView, raiseTo?: number) {
  const target = Math.max(
      ...view.players.map((p) => p.round),
      view.players[view.seat].round + view.legal.toCall,
      raiseTo ?? 0,
    ),
    contributions = view.players.map(
      (p) =>
        p.contributed +
        (p.folded ? 0 : Math.min(p.stack, Math.max(0, target - p.round))),
    );
  return {
    contributions,
    risk: contributions[view.seat] - view.players[view.seat].contributed,
    folded: view.players.map((p) => p.folded),
  };
}
export interface TableOptions {
  call: number;
  raise: number;
  callInterval: Interval;
  raiseInterval: Interval;
  callPots: PayoutResult['pots'];
  samples: number;
}
export function tableOptions(
  view: PlayerView,
  players: PlayerInput[],
  seed: string,
  raiseTo: number,
  samples = 1500,
): TableOptions {
  const run = (to?: number) => {
    const scenario = callScenario(view, to),
      result = payouts({
        players,
        board: view.board,
        contributions: scenario.contributions,
        folded: scenario.folded,
        button: view.button,
        seed,
        samples,
        hero: view.seat,
        method: 'monteCarlo',
      });
    return {
      value: result.meanAwards[view.seat] - scenario.risk,
      interval: result.intervals[view.seat].map(
        (n) => n - scenario.risk,
      ) as unknown as Interval,
      result,
    };
  };
  const call = run(),
    raise = view.legal.canRaise ? run(raiseTo) : call;
  return {
    call: call.value,
    raise: raise.value,
    callInterval: call.interval,
    raiseInterval: raise.interval,
    callPots: call.result.pots,
    samples,
  };
}
