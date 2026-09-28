import { Rational } from './math';
import { Rng, shuffle } from './rng';
export type Strategy = Record<string, number>;
export const kuhnKeys = () =>
  [0, 1, 2].flatMap((r) => ['', 'p', 'b', 'pb'].map((h) => `${r}:${h}`));
/** Q=0, K=1, A=2. p=check/fold; b=bet/call. Ante one, at most one bet of one. */
export function kuhnTerminal(
  cards: readonly number[],
  history: string,
): number | null {
  if (history === 'bp') return 1;
  if (history === 'pbp') return -1;
  if (['pp', 'bb', 'pbb'].includes(history))
    return (cards[0] > cards[1] ? 1 : -1) * (history === 'pp' ? 1 : 2);
  return null;
}
export function kuhnEquilibrium(): Strategy {
  return {
    '0:': 1 / 3,
    '1:': 0,
    '2:': 1,
    '0:p': 1 / 3,
    '1:p': 0,
    '2:p': 1,
    '0:b': 0,
    '1:b': 1 / 3,
    '2:b': 1,
    '0:pb': 0,
    '1:pb': 2 / 3,
    '2:pb': 1,
  };
}
export function kuhnValue(strategy: Strategy): number {
  function tree(cards: number[], h: string): number {
    const end = kuhnTerminal(cards, h);
    if (end !== null) return end;
    const seat = h.length % 2,
      p = strategy[`${cards[seat]}:${h}`];
    return (1 - p) * tree(cards, h + 'p') + p * tree(cards, h + 'b');
  }
  let v = 0;
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++) if (a !== b) v += tree([a, b], '') / 6;
  return v;
}
export function kuhnExploitability(strategy: Strategy) {
  const baseline = kuhnValue(strategy),
    best = [-Infinity, Infinity];
  for (let seat = 0; seat < 2; seat++) {
    const keys = kuhnKeys().filter((k) => k.split(':')[1].length % 2 === seat);
    for (let mask = 0; mask < 64; mask++) {
      const candidate = { ...strategy };
      keys.forEach((k, i) => (candidate[k] = (mask >> i) & 1));
      const v = kuhnValue(candidate);
      best[seat] =
        seat === 0 ? Math.max(best[seat], v) : Math.min(best[seat], v);
    }
  }
  return {
    value: baseline,
    firstGain: best[0] - baseline,
    secondGain: baseline - best[1],
    exploitability: (best[0] - best[1]) / 2,
  };
}
export function* trainKuhn(iterations: number) {
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 100000)
    throw new Error('Use one to 100,000 iterations.');
  const nodes = Object.fromEntries(
    kuhnKeys().map((k) => [k, { regrets: [0, 0], sum: [0, 0] }]),
  );
  const average = (): Strategy =>
    Object.fromEntries(
      Object.entries(nodes).map(([k, n]) => [
        k,
        n.sum[0] + n.sum[1] ? n.sum[1] / (n.sum[0] + n.sum[1]) : 0.5,
      ]),
    );
  function walk(cards: number[], h: string, reach: number[]): number {
    const end = kuhnTerminal(cards, h),
      seat = h.length % 2;
    if (end !== null) return (seat === 0 ? 1 : -1) * end;
    const node = nodes[`${cards[seat]}:${h}`],
      positive = node.regrets.map((r) => Math.max(0, r)),
      total = positive[0] + positive[1],
      s = total ? positive.map((r) => r / total) : [0.5, 0.5];
    for (let a = 0; a < 2; a++) node.sum[a] += reach[seat] * s[a];
    const u = s.map((_, a) => {
        const next = [...reach];
        next[seat] *= s[a];
        return -walk(cards, h + (a ? 'b' : 'p'), next);
      }),
      v = u[0] * s[0] + u[1] * s[1];
    for (let a = 0; a < 2; a++) node.regrets[a] += reach[1 - seat] * (u[a] - v);
    return v;
  }
  for (let i = 1; i <= iterations; i++) {
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++) if (a !== b) walk([a, b], '', [1, 1]);
    if (i % 100 === 0 && i < iterations) {
      const strategy = average();
      yield { iterations: i, strategy, ...kuhnExploitability(strategy) };
    }
  }
  const strategy = average();
  return { iterations, strategy, ...kuhnExploitability(strategy) };
}
export const kuhnExactValue = () => new Rational(-1, 18);
export function kuhnDeal(seed: string) {
  return shuffle([0, 1, 2], new Rng(seed)).slice(0, 2);
}
/** Information-set policy receives own card and public actions only. */
export function kuhnBot(
  card: number,
  history: string,
  rng: Rng,
  strategy = kuhnEquilibrium(),
) {
  const p = strategy[`${card}:${history}`];
  if (p === undefined) throw new Error('Unknown information set.');
  return rng.int(0x100000000) / 0x100000000 < p ? 'b' : 'p';
}
