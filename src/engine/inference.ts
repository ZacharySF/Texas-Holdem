import { factorial, nCr, Rational } from './math';
import { normalInterval, Welford, Z95, type Interval } from './stats';
function count(n: number, max = 10000) {
  if (!Number.isSafeInteger(n) || n < 0 || n > max)
    throw new Error('Invalid count.');
}
export function probability(n: number, d: number): Rational {
  count(n);
  count(d);
  if (d === 0 || n > d) throw new Error('Invalid probability.');
  return new Rational(n, d);
}
export function power(p: Rational, n: number): Rational {
  count(n);
  return new Rational(p.numerator ** BigInt(n), p.denominator ** BigInt(n));
}
export function hypergeometric(
  N: number,
  K: number,
  n: number,
  k: number,
): Rational {
  [N, K, n, k].forEach((v) => count(v));
  if (N === 0 || K > N || n > N) throw new Error('Invalid population.');
  if (k > K || k > n || n - k > N - K) return new Rational(0);
  return new Rational(nCr(K, k) * nCr(N - K, n - k), nCr(N, n));
}
export function binomial(n: number, k: number, p: Rational): Rational {
  count(n, 1000);
  count(k, 1000);
  if (p.compare(new Rational(0)) < 0 || p.compare(new Rational(1)) > 0)
    throw new Error('Invalid probability.');
  if (k > n) return new Rational(0);
  return new Rational(nCr(n, k))
    .multiply(power(p, k))
    .multiply(
      power(new Rational(p.denominator - p.numerator, p.denominator), n - k),
    );
}
export function geometricMean(p: Rational): Rational {
  if (p.numerator <= 0n || p.numerator > p.denominator)
    throw new Error('A positive success chance is needed.');
  return new Rational(p.denominator, p.numerator);
}
export function geometricBy(n: number, p: Rational): Rational {
  count(n);
  const q = power(new Rational(p.denominator - p.numerator, p.denominator), n);
  return new Rational(q.denominator - q.numerator, q.denominator);
}
export function poisson(rate: number, k: number): number {
  if (!Number.isFinite(rate) || rate < 0 || rate > 100)
    throw new Error('Use a finite event rate.');
  count(k, 1000);
  let mass = Math.exp(-rate);
  for (let i = 1; i <= k; i++) mass *= rate / i;
  return mass;
}
export function bayes(
  prior: Rational,
  likelihoodA: Rational,
  likelihoodB: Rational,
): Rational {
  for (const p of [prior, likelihoodA, likelihoodB])
    if (p.toNumber() < 0 || p.toNumber() > 1)
      throw new Error('Invalid probability.');
  const a = prior.multiply(likelihoodA),
    b = new Rational(
      prior.denominator - prior.numerator,
      prior.denominator,
    ).multiply(likelihoodB),
    evidence = a.add(b);
  if (evidence.numerator === 0n)
    throw new Error('The observed event has no probability in this model.');
  return a.multiply(new Rational(evidence.denominator, evidence.numerator));
}
export function betaUpdate(
  alpha: number,
  beta: number,
  successes: number,
  trials: number,
) {
  [alpha, beta, successes, trials].forEach((v) => count(v));
  if (alpha < 1 || beta < 1 || successes > trials)
    throw new Error('Invalid prior or observations.');
  return {
    alpha: alpha + successes,
    beta: beta + trials - successes,
    mean: new Rational(alpha + successes, alpha + beta + trials),
  };
}
export function betaBinomial(
  n: number,
  k: number,
  alpha: number,
  beta: number,
): Rational {
  count(n, 100);
  count(k, 100);
  betaUpdate(alpha, beta, 0, 0);
  if (k > n) return new Rational(0);
  const rising = (x: number, m: number) =>
    Array.from({ length: m }, (_, i) => BigInt(x + i)).reduce(
      (a, b) => a * b,
      1n,
    );
  return new Rational(
    nCr(n, k) * rising(alpha, k) * rising(beta, n - k),
    rising(alpha + beta, n),
  );
}
export function expectedValue(
  values: readonly number[],
  weights: readonly Rational[],
): Rational {
  if (
    !values.length ||
    values.length !== weights.length ||
    values.some((v) => !Number.isSafeInteger(v)) ||
    weights.some((p) => p.toNumber() < 0) ||
    weights
      .reduce((a, b) => a.add(b), new Rational(0))
      .compare(new Rational(1)) !== 0
  )
    throw new Error('Use integer outcomes and probabilities summing to one.');
  return values.reduce(
    (a, v, i) => a.add(weights[i].multiply(new Rational(v))),
    new Rational(0),
  );
}
export function payoffMoments(p: Rational, win: number, lose: number) {
  const mean = expectedValue(
    [win, lose],
    [p, new Rational(p.denominator - p.numerator, p.denominator)],
  );
  const second = expectedValue(
    [win * win, lose * lose],
    [p, new Rational(p.denominator - p.numerator, p.denominator)],
  );
  const variance = second.add(mean.multiply(mean).multiply(new Rational(-1)));
  return { mean, variance, sd: Math.sqrt(variance.toNumber()) };
}
export function rakedCall(
  equity: Rational,
  pot: number,
  call: number,
  rake: number,
): Rational {
  [pot, call, rake].forEach((v) => count(v, 10000000));
  if (rake > pot + call) throw new Error('Rake exceeds the final pot.');
  return equity
    .multiply(new Rational(pot + call - rake))
    .add(new Rational(-call));
}
export function effectiveCall(
  equity: Rational,
  pot: number,
  firstCall: number,
  laterCall: number,
  laterOpponent: number,
): Rational {
  return rakedCall(equity, pot + laterOpponent, firstCall + laterCall, 0);
}
export function realization(
  equity: Rational,
  factor: Rational,
  pot: number,
  cost: number,
): Rational {
  return equity
    .multiply(factor)
    .multiply(new Rational(pot))
    .add(new Rational(-cost));
}
export function binomialTwoSided(n: number, k: number, p: Rational): Rational {
  const observed = binomial(n, k, p);
  let sum = new Rational(0);
  for (let x = 0; x <= n; x++) {
    const mass = binomial(n, x, p);
    if (mass.compare(observed) <= 0) sum = sum.add(mass);
  }
  return sum;
}
/** Standard normal CDF, numerical approximation (maximum absolute error about 1.5e-7). */
export function normalCDF(z: number): number {
  const x = Math.abs(z),
    t = 1 / (1 + 0.2316419 * x);
  const tail =
    (Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI)) *
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - tail : tail;
}
export function requiredHands(
  sdBBPer100: number,
  halfWidthBBPer100: number,
): number {
  if (
    !Number.isFinite(sdBBPer100) ||
    !Number.isFinite(halfWidthBBPer100) ||
    sdBBPer100 < 0 ||
    halfWidthBBPer100 <= 0
  )
    throw new Error('Use nonnegative SD and positive precision.');
  return Math.ceil(100 * ((Z95 * sdBBPer100) / halfWidthBBPer100) ** 2);
}
export function winRate(values: readonly number[]): {
  hands: number;
  rate: number;
  interval: Interval | null;
  sd: number;
  pValue: number | null;
} {
  if (values.some((x) => !Number.isFinite(x)))
    throw new Error('Results must be finite.');
  const stats = new Welford();
  values.forEach((x) => stats.add(x));
  return {
    hands: stats.count,
    rate: stats.mean * 100,
    interval:
      stats.count > 1
        ? normalInterval(stats.mean * 100, stats.standardError * 100)
        : null,
    sd: Math.sqrt(stats.variance * 100),
    pValue:
      stats.count > 1 && stats.standardError > 0
        ? 2 * (1 - normalCDF(Math.abs(stats.mean / stats.standardError)))
        : null,
  };
}
/** Inclusion–exclusion over named opponents; card removal makes their pocket-pair events dependent. */
export function higherPair(pairRank: number, opponents: number): Rational {
  count(pairRank, 14);
  count(opponents, 8);
  if (pairRank < 2) throw new Error('Invalid rank.');
  const higher = 14 - pairRank;
  const assignments = (m: number): bigint => {
    let total = 0n;
    for (let doubles = 0; doubles <= Math.floor(m / 2); doubles++) {
      const singles = m - 2 * doubles;
      if (doubles + singles > higher) continue;
      total +=
        ((nCr(higher, doubles) *
          nCr(higher - doubles, singles) *
          factorial(m)) /
          2n ** BigInt(doubles)) *
        6n ** BigInt(singles + doubles);
    }
    return total;
  };
  let sum = new Rational(0);
  for (let m = 1; m <= opponents; m++) {
    let all = 1n;
    for (let i = 0; i < m; i++) all *= nCr(50 - 2 * i, 2);
    sum = sum.add(
      new Rational(
        (m % 2 ? 1n : -1n) * nCr(opponents, m) * assignments(m),
        all,
      ),
    );
  }
  return sum;
}
