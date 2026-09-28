import {
  experimentProbability,
  experimentDeck,
  experimentDraws,
  eventMatches,
  type Experiment,
} from './experiments';
import { Rng } from './rng';
import { deck, rank } from './cards';
import { Rational } from './math';
import {
  probability,
  hypergeometric,
  binomial,
  geometricMean,
  geometricBy,
  betaBinomial,
  bayes,
  payoffMoments,
  higherPair,
} from './inference';
import { Welford, normalInterval, wilson, type Interval } from './stats';
export type ModelSpec =
  | {
      type: 'hypergeometric';
      population: number;
      successes: number;
      draws: number;
      atLeast: number;
    }
  | { type: 'binomial'; trials: number; p: number; d: number; hits: number }
  | { type: 'waiting'; p: number; d: number; within?: number }
  | { type: 'payoff'; p: number; d: number; win: number; lose: number }
  | { type: 'means'; p: number; d: number; size: number }
  | {
      type: 'bayes';
      prior: number;
      likeA: number;
      likeB: number;
      denominator: number;
    }
  | {
      type: 'repeat';
      event: Experiment;
      repetitions: number;
      hits: number;
      atLeast: boolean;
    }
  | { type: 'higherPair'; rank: number; opponents: number }
  | { type: 'coverage'; p: number; d: number; size: number }
  | {
      type: 'predictive';
      alpha: number;
      beta: number;
      trials: number;
      hits: number;
    };
export function modelTruth(model: ModelSpec): Rational {
  switch (model.type) {
    case 'repeat': {
      const p = experimentProbability(model.event);
      if (!model.atLeast) return binomial(model.repetitions, model.hits, p);
      let sum = new Rational(0);
      for (let k = model.hits; k <= model.repetitions; k++)
        sum = sum.add(binomial(model.repetitions, k, p));
      return sum;
    }
    case 'higherPair':
      return higherPair(model.rank, model.opponents);
    case 'coverage': {
      const p = probability(model.p, model.d);
      binomial(model.size, 0, p);
      let total = new Rational(0);
      for (let k = 0; k <= model.size; k++) {
        const ci = wilson(k, model.size);
        if (ci[0] <= p.toNumber() && ci[1] >= p.toNumber())
          total = total.add(binomial(model.size, k, p));
      }
      return total;
    }
    case 'hypergeometric': {
      if (
        !Number.isInteger(model.atLeast) ||
        model.atLeast < 0 ||
        model.atLeast > model.draws + 1
      )
        throw new Error('Invalid hit count.');
      let p = new Rational(0);
      for (let k = model.atLeast; k <= model.draws; k++)
        p = p.add(
          hypergeometric(model.population, model.successes, model.draws, k),
        );
      hypergeometric(model.population, model.successes, model.draws, 0);
      return p;
    }
    case 'binomial':
      return binomial(model.trials, model.hits, probability(model.p, model.d));
    case 'waiting':
      return model.within === undefined
        ? geometricMean(probability(model.p, model.d))
        : geometricBy(model.within, probability(model.p, model.d));
    case 'payoff':
      return payoffMoments(probability(model.p, model.d), model.win, model.lose)
        .mean;
    case 'means':
      if (!Number.isInteger(model.size) || model.size < 1 || model.size > 10000)
        throw new Error('Invalid mean sample size.');
      return probability(model.p, model.d);
    case 'bayes':
      return bayes(
        probability(model.prior, model.denominator),
        probability(model.likeA, model.denominator),
        probability(model.likeB, model.denominator),
      );
    case 'predictive':
      return betaBinomial(model.trials, model.hits, model.alpha, model.beta);
  }
}
export const binaryModel = (m: ModelSpec) =>
  m.type !== 'payoff' &&
  m.type !== 'means' &&
  !(m.type === 'waiting' && m.within === undefined);
export function sampleModel(m: ModelSpec, rng: Rng): number {
  switch (m.type) {
    case 'repeat': {
      let hits = 0;
      const base = experimentDeck(m.event),
        draws = experimentDraws(m.event);
      for (let trial = 0; trial < m.repetitions; trial++) {
        const pool = [...base];
        for (let i = 0; i < draws; i++) {
          const j = i + rng.int(pool.length - i);
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        if (eventMatches(m.event, pool.slice(0, draws))) hits++;
      }
      return Number(m.atLeast ? hits >= m.hits : hits === m.hits);
    }
    case 'higherPair': {
      const pool = deck().filter(
        (c) => c !== 4 * (m.rank - 2) && c !== 4 * (m.rank - 2) + 1,
      );
      for (let i = 0; i < 2 * m.opponents; i++) {
        const j = i + rng.int(pool.length - i);
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      for (let i = 0; i < m.opponents; i++)
        if (
          rank(pool[2 * i]) === rank(pool[2 * i + 1]) &&
          rank(pool[2 * i]) > m.rank
        )
          return 1;
      return 0;
    }
    case 'coverage': {
      let k = 0;
      for (let i = 0; i < m.size; i++) if (rng.int(m.d) < m.p) k++;
      const ci = wilson(k, m.size);
      return Number(ci[0] <= m.p / m.d && ci[1] >= m.p / m.d);
    }
    case 'hypergeometric': {
      let hits = 0;
      for (let i = 0; i < m.draws; i++)
        if (rng.int(m.population - i) < m.successes - hits) hits++;
      return Number(hits >= m.atLeast);
    }
    case 'binomial': {
      let hits = 0;
      for (let i = 0; i < m.trials; i++) if (rng.int(m.d) < m.p) hits++;
      return Number(hits === m.hits);
    }
    case 'waiting': {
      let n = 1;
      while (rng.int(m.d) >= m.p) {
        n++;
        if (m.within !== undefined && n > m.within) return 0;
      }
      return m.within === undefined ? n : Number(n <= m.within);
    }
    case 'payoff':
      return rng.int(m.d) < m.p ? m.win : m.lose;
    case 'means': {
      let hits = 0;
      for (let i = 0; i < m.size; i++) if (rng.int(m.d) < m.p) hits++;
      return hits / m.size;
    }
    case 'bayes': {
      for (let i = 0; i < 100000; i++) {
        const a = rng.int(m.denominator) < m.prior;
        if (rng.int(m.denominator) < (a ? m.likeA : m.likeB)) return Number(a);
      }
      throw new Error('Observation is too rare to condition efficiently.');
    }
    case 'predictive': {
      let hits = 0;
      for (let i = 0; i < m.trials; i++)
        if (rng.int(m.alpha + m.beta + i) < m.alpha + hits) hits++;
      return Number(hits === m.hits);
    }
  }
}
export interface ModelPoint {
  samples: number;
  mean: number;
  variance: number;
  interval: Interval;
}
export interface ModelResult extends ModelPoint {
  histogram: { value: number; count: number }[];
  truth: number;
}
export function* modelSteps(
  m: ModelSpec,
  seed: string,
  samples: number,
): Generator<ModelResult, ModelResult> {
  const truth = modelTruth(m).toNumber();
  if (!Number.isSafeInteger(samples) || samples < 1 || samples > 1000000)
    throw new Error('Invalid sample count.');
  const rng = new Rng(seed),
    stats = new Welford(),
    hist = new Map<number, number>();
  const snap = (): ModelResult => ({
    samples: stats.count,
    mean: stats.mean,
    variance: stats.variance,
    interval: binaryModel(m)
      ? wilson(Math.round(stats.mean * stats.count), stats.count)
      : normalInterval(stats.mean, stats.standardError),
    histogram: [...hist]
      .sort((a, b) => a[0] - b[0])
      .map(([value, count]) => ({ value, count })),
    truth,
  });
  for (let i = 0; i < samples; i++) {
    const x = sampleModel(m, rng);
    stats.add(x);
    const bin =
      m.type === 'waiting' && m.within === undefined
        ? Math.min(10000, Math.floor(x / 10) * 10)
        : Math.round(x * 100) / 100;
    hist.set(bin, (hist.get(bin) ?? 0) + 1);
    if (
      (i + 1) % Math.max(1, Math.ceil(samples / 150)) === 0 &&
      i + 1 < samples
    )
      yield snap();
  }
  return snap();
}
