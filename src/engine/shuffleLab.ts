import { Rng, shuffle } from './rng';
import { chiSquare, wilson } from './stats';
import { chiSquareFiveTail } from './finalMath';
export type ShuffleMethod = 'naive' | 'fisherYates';
export function shufflePaths(method: ShuffleMethod, size = 3) {
  if (!Number.isInteger(size) || size < 2 || size > 5)
    throw new Error('Choose two to five labels.');
  const counts = new Map<string, number>();
  function visit(cards: number[], step: number) {
    if (step === (method === 'naive' ? size : size - 1)) {
      const key = cards.join('');
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return;
    }
    const i = method === 'naive' ? step : size - 1 - step;
    for (let j = 0; j < (method === 'naive' ? size : i + 1); j++) {
      const next = [...cards];
      [next[i], next[j]] = [next[j], next[i]];
      visit(next, step + 1);
    }
  }
  visit(
    Array.from({ length: size }, (_, i) => i),
    0,
  );
  return [...counts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([order, count]) => ({ order, count }));
}
export function moduloCounts(source = 8, bound = 3) {
  if (
    !Number.isInteger(source) ||
    !Number.isInteger(bound) ||
    bound < 1 ||
    source < bound ||
    source > 10000
  )
    throw new Error('Invalid finite generator.');
  const biased = Array<number>(bound).fill(0),
    rejected = Array<number>(bound).fill(0),
    limit = Math.floor(source / bound) * bound;
  for (let i = 0; i < source; i++) {
    biased[i % bound]++;
    if (i < limit) rejected[i % bound]++;
  }
  return { biased, rejected, discarded: source - limit };
}
export function* shuffleSteps(
  method: ShuffleMethod,
  seed: string,
  samples: number,
) {
  if (!Number.isInteger(samples) || samples < 10 || samples > 1000000)
    throw new Error('Use 10 to one million trials.');
  const rng = new Rng(seed),
    rows = shufflePaths(method).map((r) => ({ ...r, observed: 0 })),
    total = rows.reduce((a, b) => a + b.count, 0);
  const snapshot = () => {
    const n = rows.reduce((a, b) => a + b.observed, 0),
      statistic = chiSquare(
        rows.map((r) => r.observed),
        rows.map(() => n / rows.length),
      );
    return {
      samples: n,
      rows: rows.map((r) => ({
        ...r,
        exact: r.count / total,
        estimate: r.observed / n,
        interval: wilson(r.observed, n),
      })),
      statistic,
      pValue: chiSquareFiveTail(statistic),
    };
  };
  for (let i = 0; i < samples; i++) {
    let cards = [0, 1, 2];
    if (method === 'fisherYates') cards = shuffle(cards, rng);
    else
      for (let k = 0; k < 3; k++) {
        const j = rng.int(3);
        [cards[k], cards[j]] = [cards[j], cards[k]];
      }
    rows.find((r) => r.order === cards.join(''))!.observed++;
    if ((i + 1) % 1000 === 0 && i + 1 < samples) yield snapshot();
  }
  return snapshot();
}

import { Rational } from './math';
export function streakChance(
  wins: number,
  total: number,
  length: number,
  trials: number,
) {
  if (
    !Number.isInteger(wins) ||
    !Number.isInteger(total) ||
    wins < 0 ||
    wins > total ||
    total < 1 ||
    !Number.isInteger(length) ||
    length < 1 ||
    length > 20 ||
    !Number.isInteger(trials) ||
    trials < 1 ||
    trials > 200
  )
    throw new Error('Invalid streak model.');
  let states = Array<bigint>(length).fill(0n);
  states[0] = 1n;
  for (let i = 0; i < trials; i++) {
    const next = Array<bigint>(length).fill(0n);
    next[0] = states.reduce((a, b) => a + b, 0n) * BigInt(total - wins);
    for (let j = 1; j < length; j++) next[j] = states[j - 1] * BigInt(wins);
    states = next;
  }
  const denominator = BigInt(total) ** BigInt(trials);
  return new Rational(
    denominator - states.reduce((a, b) => a + b, 0n),
    denominator,
  );
}
export function* streakSteps(
  wins: number,
  total: number,
  length: number,
  trials: number,
  seed: string,
  samples: number,
) {
  const exact = streakChance(wins, total, length, trials).toNumber();
  if (!Number.isInteger(samples) || samples < 2 || samples > 1000000)
    throw new Error('Invalid sample count.');
  const rng = new Rng(seed);
  let hits = 0;
  const snap = (n: number) => ({
    samples: n,
    mean: hits / n,
    interval: wilson(hits, n),
    exact,
  });
  for (let i = 0; i < samples; i++) {
    let run = 0,
      found = false;
    for (let j = 0; j < trials; j++) {
      run = rng.int(total) < wins ? run + 1 : 0;
      if (run >= length) found = true;
    }
    if (found) hits++;
    if ((i + 1) % 500 === 0 && i + 1 < samples) yield snap(i + 1);
  }
  return snap(samples);
}
