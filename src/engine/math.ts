/** Retain significant digits for rare nonzero events instead of displaying zero. */
export function formatPercent(value: number, digits = 2): string {
  const percentage = value * 100;
  return `${percentage !== 0 && Math.abs(percentage) < 10 ** -digits ? percentage.toPrecision(3) : percentage.toFixed(digits)}%`;
}
export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}
export class Rational {
  readonly numerator: bigint;
  readonly denominator: bigint;
  constructor(numerator: bigint | number, denominator: bigint | number = 1n) {
    let n = BigInt(numerator),
      d = BigInt(denominator);
    if (d === 0n) throw new Error('Zero denominator.');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const divisor = gcd(n, d);
    this.numerator = n / divisor;
    this.denominator = d / divisor;
  }
  add(other: Rational): Rational {
    return new Rational(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  }
  multiply(other: Rational): Rational {
    return new Rational(
      this.numerator * other.numerator,
      this.denominator * other.denominator,
    );
  }
  compare(other: Rational): number {
    const delta =
      this.numerator * other.denominator - other.numerator * this.denominator;
    return delta < 0n ? -1 : delta > 0n ? 1 : 0;
  }
  toNumber(): number {
    return Number(this.numerator) / Number(this.denominator);
  }
  toString(): string {
    return `${this.numerator}/${this.denominator}`;
  }
  display(): {
    fraction: string;
    percent: string;
    oneIn: string;
    against: string;
  } {
    const p = this.toNumber();
    return {
      fraction: this.toString(),
      percent: formatPercent(p),
      oneIn: p === 0 ? '1 in ∞' : `1 in ${(1 / p).toFixed(2)}`,
      against:
        p === 0 ? '∞ : 1 against' : `${((1 - p) / p).toFixed(2)} : 1 against`,
    };
  }
}
function natural(n: number): void {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error('Expected a nonnegative safe integer.');
}
export function factorial(n: number): bigint {
  natural(n);
  let value = 1n;
  for (let i = 2; i <= n; i++) value *= BigInt(i);
  return value;
}
export function nCr(n: number, k: number): bigint {
  natural(n);
  natural(k);
  if (k > n) return 0n;
  k = Math.min(k, n - k);
  let value = 1n;
  for (let i = 1; i <= k; i++) value = (value * BigInt(n - k + i)) / BigInt(i);
  return value;
}
export function* combinations<T>(
  values: readonly T[],
  k: number,
): Generator<T[]> {
  natural(k);
  if (k > values.length) return;
  if (k === 0) {
    yield [];
    return;
  }
  const indices = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield indices.map((i) => values[i]);
    let i = k - 1;
    while (i >= 0 && indices[i] === values.length - k + i) i--;
    if (i < 0) return;
    indices[i]++;
    for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
  }
}
