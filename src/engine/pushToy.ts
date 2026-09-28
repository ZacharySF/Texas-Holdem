import { Rational } from './math';
/** Three ranks, one-chip antes, shove one further chip. Ranges are conditional on own rank. */
export function pushToyValue(push: readonly number[], call: readonly number[]) {
  if (
    push.length !== 3 ||
    call.length !== 3 ||
    [...push, ...call].some((v) => !Number.isFinite(v) || v < 0 || v > 1)
  )
    throw new Error('Supply three probabilities per player.');
  let value = 0;
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      if (a !== b)
        value +=
          ((1 - push[a]) * -1 +
            push[a] * (1 - call[b] + call[b] * (a > b ? 2 : -2))) /
          6;
  return value;
}
export function pushToyEquilibrium() {
  return {
    push: [new Rational(1, 3), new Rational(1), new Rational(1)],
    call: [new Rational(0), new Rational(1, 3), new Rational(1)],
    value: new Rational(-1, 9),
  };
}
