import { learningFacts } from '../content/facts';
import { Rational, formatPercent } from '../engine/math';
import type { Probability as Value } from '../engine/equity';
export const percent = formatPercent;
export function Probability({
  label,
  value,
  sampled,
}: {
  label: string;
  value: Value;
  sampled: boolean;
}) {
  const display = new Rational(
    BigInt(value.numerator),
    BigInt(value.denominator),
  ).display();
  return (
    <div className="probability">
      <span className="field-label">{label}</span>
      <strong>{display.percent}</strong>
      <span className="fraction">{display.fraction}</span>
      <span>{display.oneIn}</span>
      <span>{display.against}</span>
      <small>
        {sampled
          ? `${learningFacts.confidence().display().percent} CI`
          : 'Exact interval'}
        : {percent(value.interval[0])}–{percent(value.interval[1])}
      </small>
    </div>
  );
}

export function exactValue(value: Rational): Value {
  const n = value.toNumber();
  return {
    numerator: String(value.numerator),
    denominator: String(value.denominator),
    value: n,
    interval: [n, n],
  };
}
