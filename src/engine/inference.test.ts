import { expect, it } from 'vitest';
import {
  advancedFacts,
  advancedExample,
  advancedShortcut,
  modelDerivation,
} from '../content/facts';
import { advancedLessons } from '../content/advancedLessons';
import { Rational, combinations } from './math';
import * as f from './inference';
import { modelTruth, modelSteps, sampleModel, type ModelSpec } from './models';
import { Rng } from './rng';
import { bankrollSteps } from './bankroll';
const seed = '0123456789abcdef0123456789abcdef';
function finish<T>(g: Generator<T, T>) {
  let n = g.next();
  while (!n.done) n = g.next();
  return n.value;
}
it('proves Phase 5 anchors and independently normalizes discrete distributions', () => {
  expect(advancedFacts.waitingAces().toString()).toBe('221/1');
  expect(advancedFacts.fiveFavoriteWins().toString()).toBe('1024/3125');
  expect(advancedFacts.fiveFavoriteWins().toNumber()).toBe(0.32768);
  expect(advancedFacts.callThreshold().toString()).toBe('1/4');
  expect(advancedFacts.fairChance()).toEqual(new Rational(1, 2));
  const setup = advancedFacts.realizationSetup();
  expect(setup.equity).toEqual(new Rational(1, 4));
  expect(setup.capture).toEqual(new Rational(4, 5));
  expect(modelTruth(advancedExample('13-2').model)).toEqual(
    f.realization(setup.equity, setup.capture, setup.pot, setup.cost),
  );
  for (const [N, K, n] of [
    [8, 3, 4],
    [10, 6, 7],
    [52, 4, 7],
  ]) {
    let total = new Rational(0);
    for (let k = 0; k <= n; k++)
      total = total.add(f.hypergeometric(N, K, n, k));
    expect(total.toString()).toBe('1/1');
  }
  const counts = new Map<number, number>();
  for (const c of combinations([0, 1, 2, 3, 4, 5, 6, 7], 4)) {
    const hits = c.filter((x) => x < 3).length;
    counts.set(hits, (counts.get(hits) ?? 0) + 1);
  }
  for (const [k, count] of counts)
    expect(f.hypergeometric(8, 3, 4, k).compare(new Rational(count, 70))).toBe(
      0,
    );
  for (const p of [new Rational(0), new Rational(1, 3), new Rational(1)]) {
    let sum = new Rational(0);
    for (let k = 0; k <= 8; k++) sum = sum.add(f.binomial(8, k, p));
    expect(sum.toString()).toBe('1/1');
  }
  expect(f.binomial(2, 3, new Rational(1, 2)).toString()).toBe('0/1');
  expect(f.geometricBy(5, new Rational(1, 2)).toString()).toBe('31/32');
  expect(f.power(new Rational(2, 3), 0).toString()).toBe('1/1');
  expect(f.higherPair(14, 5).toString()).toBe('0/1');
  expect(f.higherPair(12, 1).compare(new Rational(12, 1225))).toBe(0);
  // Two named opponents with kings: 6 AA choices, then exactly the complementary pair.
  const single = new Rational(6, 1225),
    both = new Rational(6, 1225 * 1128);
  expect(
    f
      .higherPair(13, 2)
      .compare(
        single.multiply(new Rational(2)).add(both.multiply(new Rational(-1))),
      ),
  ).toBe(0);
  expect(f.higherPair(2, 8).toNumber()).toBeGreaterThan(
    f.higherPair(2, 7).toNumber(),
  );
});
it('computes Bayesian evidence, predictive counts, EV, and inference with known answers', () => {
  expect(
    f
      .bayes(new Rational(3, 10), new Rational(4, 5), new Rational(1, 5))
      .toString(),
  ).toBe('12/19');
  expect(f.betaUpdate(2, 2, 3, 10)).toEqual({
    alpha: 5,
    beta: 9,
    mean: new Rational(5, 14),
  });
  let total = new Rational(0);
  for (let k = 0; k <= 5; k++) total = total.add(f.betaBinomial(5, k, 5, 9));
  expect(total.toString()).toBe('1/1');
  expect(f.betaBinomial(2, 3, 1, 1).toString()).toBe('0/1');
  expect(f.betaBinomial(3, 1, 1, 1).toString()).toBe('1/4');
  expect(
    f
      .expectedValue([1, 2], [new Rational(1, 2), new Rational(1, 2)])
      .toString(),
  ).toBe('3/2');
  expect(f.payoffMoments(new Rational(4, 5), 50, -50)).toEqual({
    mean: new Rational(30),
    variance: new Rational(1600),
    sd: 40,
  });
  expect(f.rakedCall(new Rational(1, 4), 150, 50, 4).toString()).toBe('-1/1');
  expect(f.effectiveCall(new Rational(1, 4), 200, 50, 50, 50).toString()).toBe(
    '-25/2',
  );
  expect(
    f.realization(new Rational(1, 4), new Rational(4, 5), 200, 50).toString(),
  ).toBe('-10/1');
  expect(f.binomialTwoSided(4, 0, new Rational(1, 2)).toString()).toBe('1/8');
  expect(f.binomialTwoSided(4, 2, new Rational(1, 2)).toString()).toBe('1/1');
  expect(f.poisson(1, 0)).toBeCloseTo(1 / Math.E, 12);
  expect(f.poisson(1, 2)).toBeCloseTo(1 / (2 * Math.E), 12);
  expect(f.normalCDF(0)).toBeCloseTo(0.5, 6);
  expect(f.normalCDF(-1.96)).toBeCloseTo(0.025, 4);
  expect(f.normalCDF(1.96)).toBeCloseTo(0.975, 4);
  expect(f.requiredHands(100, 5)).toBe(153659);
  const rate = f.winRate([-1, 1, -1, 1]);
  expect(rate.rate).toBe(0);
  expect(rate.pValue).toBeCloseTo(1, 6);
  expect(rate.interval![0]).toBeLessThan(0);
  expect(f.winRate([]).interval).toBeNull();
  expect(f.winRate([1, 1]).pValue).toBeNull();
  expect(advancedFacts.blockedAces()).toBe(3);
  expect(advancedFacts.errorRatio(1000, 4000)).toBe(0.5);
  expect(advancedFacts.forecastTolerance().toString()).toBe('1/20');
});
it('rejects invalid populations, priors, payoffs and precisions', () => {
  const bad = [
    () => f.probability(2, 1),
    () => f.probability(0, 0),
    () => f.probability(-1, 2),
    () => f.power(new Rational(1), 1.5),
    () => f.hypergeometric(0, 0, 0, 0),
    () => f.hypergeometric(5, 6, 2, 1),
    () => f.hypergeometric(5, 1, 6, 1),
    () => f.binomial(3, 1, new Rational(-1)),
    () => f.binomial(3, 1, new Rational(2)),
    () => f.geometricMean(new Rational(0)),
    () => f.geometricMean(new Rational(2)),
    () => f.poisson(-1, 1),
    () => f.poisson(Infinity, 1),
    () => f.poisson(1, 1001),
    () => f.bayes(new Rational(2), new Rational(1), new Rational(1)),
    () => f.bayes(new Rational(1), new Rational(0), new Rational(0)),
    () => f.betaUpdate(0, 1, 0, 1),
    () => f.betaUpdate(1, 1, 2, 1),
    () => f.expectedValue([], []),
    () => f.expectedValue([1], [new Rational(-1)]),
    () => f.expectedValue([1], [new Rational(1, 2)]),
    () => f.rakedCall(new Rational(1), 10, 10, 21),
    () => f.requiredHands(-1, 1),
    () => f.requiredHands(1, 0),
    () => f.winRate([NaN]),
    () => f.higherPair(1, 1),
    () => f.higherPair(12, 9),
  ];
  bad.forEach((fn) => expect(fn).toThrow());
});
it('checks every lesson model against controlled seeded experiments', () => {
  const extra: ModelSpec[] = [
    { type: 'binomial', trials: 20, p: 4, d: 5, hits: 16 },
    { type: 'waiting', p: 1, d: 5, within: 4 },
    {
      type: 'hypergeometric',
      population: 8,
      successes: 3,
      draws: 4,
      atLeast: 2,
    },
    {
      type: 'repeat',
      event: { kind: 'pair' },
      repetitions: 3,
      hits: 1,
      atLeast: false,
    },
    {
      type: 'repeat',
      event: { kind: 'pair' },
      repetitions: 3,
      hits: 1,
      atLeast: true,
    },
  ];
  for (const model of [
    ...advancedLessons.map((l) => advancedExample(l.id).model),
    ...extra,
  ]) {
    const a = finish(modelSteps(model, seed, 10000)),
      truth = modelTruth(model).toNumber(),
      se = Math.sqrt(a.variance / a.samples);
    expect(Math.abs(a.mean - truth)).toBeLessThan(6 * se + 0.002);
    expect(a.histogram.reduce((n, b) => n + b.count, 0)).toBe(a.samples);
    expect(finish(modelSteps(model, seed, 50))).toEqual(
      finish(modelSteps(model, seed, 50)),
    );
    expect(modelDerivation(model).length).toBeGreaterThan(2);
  }
  for (const l of advancedLessons) {
    const s = advancedShortcut(l.id);
    expect(Math.abs(s.gap.toNumber())).toBeLessThanOrEqual(0.0051);
  }
  expect(() => advancedExample('99-1')).toThrow();
  expect(
    finish(modelSteps({ type: 'means', p: 0, d: 1, size: 1 }, seed, 1)).mean,
  ).toBe(0);
  for (const m of [
    { type: 'means', p: 1, d: 2, size: 0 },
    {
      type: 'hypergeometric',
      population: 8,
      successes: 3,
      draws: 4,
      atLeast: -1,
    },
    {
      type: 'hypergeometric',
      population: 8,
      successes: 3,
      draws: 4,
      atLeast: 6,
    },
  ] as ModelSpec[])
    expect(() => modelTruth(m)).toThrow();
  expect(() => finish(modelSteps(extra[0], seed, 0))).toThrow();
  expect(() =>
    sampleModel(
      { type: 'bayes', prior: 1, likeA: 0, likeB: 0, denominator: 2 },
      new Rng(seed),
    ),
  ).toThrow();
});
it('bankroll paths reproduce controlled means, variance, drawdowns and ruin', () => {
  const input = {
      seed,
      rate: 3,
      sd: 20,
      hands: 250,
      bankroll: 100,
      runs: 10000,
    },
    r = finish(bankrollSteps(input));
  expect(Math.abs(r.mean - r.expected)).toBeLessThan(1);
  const variance =
    r.endings.reduce((s, x) => s + (x - r.mean) ** 2, 0) / (r.runs - 1);
  expect(variance).toBeCloseTo(r.theoreticalSD ** 2, -2);
  expect(r.paths).toHaveLength(8);
  expect(r.paths[0]).toHaveLength(4);
  expect(r.ruinInterval[0]).toBeLessThanOrEqual(r.ruin);
  expect(r.ruinInterval[1]).toBeGreaterThanOrEqual(r.ruin);
  const fixed = {
      ...input,
      sd: 0,
      rate: -10,
      hands: 250,
      bankroll: 20,
      runs: 2,
    },
    a = finish(bankrollSteps(fixed));
  expect(a).toEqual(finish(bankrollSteps(fixed)));
  expect(a.endings).toEqual([-25, -25]);
  expect(a.ruin).toBe(1);
  expect(a.drawdowns).toEqual([25, 25]);
  expect(a.longestDownswings).toEqual([250, 250]);
  expect(finish(bankrollSteps({ ...fixed, bankroll: 0, rate: 10 })).ruin).toBe(
    1,
  );
  expect(finish(bankrollSteps({ ...fixed, rate: 10, bankroll: 1 })).ruin).toBe(
    0,
  );
  for (const patch of [
    { sd: -1 },
    { hands: 0 },
    { runs: 0 },
    { bankroll: -1 },
    { rate: NaN },
    { hands: 1000001 },
  ])
    expect(() => finish(bankrollSteps({ ...input, ...patch }))).toThrow();
});
