import { Rational, formatPercent } from '../engine/math';
import type { Probability as Value } from '../engine/equity';
export const percent = formatPercent;
export function exactValue(value: Rational): Value {
  const n = value.toNumber();
  return {
    numerator: String(value.numerator),
    denominator: String(value.denominator),
    value: n,
    interval: [n, n],
  };
}
