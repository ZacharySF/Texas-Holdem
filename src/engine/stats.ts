export type Interval = readonly [number, number];
export const Z95 = 1.959963984540054;
export class Welford {
  count = 0;
  mean = 0;
  m2 = 0;
  add(value: number): void {
    this.count++;
    const delta = value - this.mean;
    this.mean += delta / this.count;
    this.m2 += delta * (value - this.mean);
  }
  get variance(): number {
    return this.count > 1 ? this.m2 / (this.count - 1) : 0;
  }
  get standardError(): number {
    return this.count > 1 ? Math.sqrt(this.variance / this.count) : 0;
  }
}
export function normalInterval(mean: number, se: number): Interval {
  return [mean - Z95 * se, mean + Z95 * se];
}
export function wilson(successes: number, n: number): Interval {
  if (!Number.isInteger(n) || n < 0 || successes < 0 || successes > n)
    throw new Error('Invalid binomial counts.');
  if (n === 0) return [0, 1];
  const p = successes / n,
    z2 = Z95 ** 2,
    divisor = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / divisor;
  const half =
    (Z95 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / divisor;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}
/** Normal mean-share interval plus a boundary safeguard, not a binomial model for ties. */
export function shareInterval(stats: Welford): Interval {
  if (stats.count < 2) return [0, 1];
  const radius = Math.max(
    Z95 * stats.standardError,
    Z95 ** 2 / (stats.count + Z95 ** 2),
  );
  return [Math.max(0, stats.mean - radius), Math.min(1, stats.mean + radius)];
}
export function chiSquare(
  observed: readonly number[],
  expected: readonly number[],
): number {
  if (observed.length !== expected.length || expected.some((v) => v <= 0))
    throw new Error('Positive matching expectations required.');
  return observed.reduce(
    (sum, value, i) => sum + (value - expected[i]) ** 2 / expected[i],
    0,
  );
}
export function brier(
  predictions: readonly number[],
  outcomes: readonly number[],
): number {
  if (
    !predictions.length ||
    predictions.length !== outcomes.length ||
    [...predictions, ...outcomes].some(
      (v) => !Number.isFinite(v) || v < 0 || v > 1,
    )
  )
    throw new Error('Matching probabilities and outcomes required.');
  return (
    predictions.reduce((sum, p, i) => sum + (p - outcomes[i]) ** 2, 0) /
    predictions.length
  );
}
