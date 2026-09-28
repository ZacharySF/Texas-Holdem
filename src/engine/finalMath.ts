import { Rational } from './math';
import { normalCDF } from './inference';
const zero = new Rational(0),
  one = new Rational(1);
function prob(p: Rational) {
  if (p.compare(zero) < 0 || p.compare(one) > 0)
    throw new Error('Probability must be between zero and one.');
}
function positive(...xs: number[]) {
  if (xs.some((x) => !Number.isSafeInteger(x) || x <= 0))
    throw new Error('Use positive integer amounts.');
}
export function bluffBreakEven(pot: number, bet: number) {
  positive(pot, bet);
  return new Rational(bet, pot + bet);
}
export function minimumDefense(pot: number, bet: number) {
  return one.add(bluffBreakEven(pot, bet).multiply(new Rational(-1)));
}
export function polarizedBluffs(pot: number, bet: number) {
  positive(pot, bet);
  return new Rational(bet, pot + 2 * bet);
}
export function semiBluffEV(
  pot: number,
  bet: number,
  fold: Rational,
  equity: Rational,
) {
  positive(pot, bet);
  prob(fold);
  prob(equity);
  return fold
    .multiply(new Rational(pot))
    .add(
      one
        .add(fold.multiply(new Rational(-1)))
        .multiply(
          equity.multiply(new Rational(pot + 2 * bet)).add(new Rational(-bet)),
        ),
    );
}
export function insurance(
  lossChance: Rational,
  benefit: number,
  loading: Rational = zero,
) {
  prob(lossChance);
  positive(benefit);
  if (loading.compare(zero) < 0) throw new Error('Margin cannot be negative.');
  const fair = lossChance.multiply(new Rational(benefit)),
    premium = fair.multiply(one.add(loading));
  return {
    fair,
    premium,
    buyerEV: fair.add(premium.multiply(new Rational(-1))),
  };
}
/** Even-money random walk, absorbing barriers 0 and target, integer betting units. */
export function ruinChance(p: Rational, bankroll: number, target: number) {
  prob(p);
  positive(bankroll, target);
  if (target > 1000 || bankroll >= target)
    throw new Error('Start strictly between zero and target.');
  if (p.numerator === 0n) return one;
  if (p.compare(one) === 0) return zero;
  if (p.compare(new Rational(1, 2)) === 0)
    return new Rational(target - bankroll, target);
  const q = one.add(p.multiply(new Rational(-1))),
    ratio = q.multiply(new Rational(p.denominator, p.numerator)),
    a = new Rational(
      ratio.numerator ** BigInt(bankroll),
      ratio.denominator ** BigInt(bankroll),
    ),
    b = new Rational(
      ratio.numerator ** BigInt(target),
      ratio.denominator ** BigInt(target),
    );
  return a
    .add(b.multiply(new Rational(-1)))
    .multiply(
      new Rational(
        one.add(b.multiply(new Rational(-1))).denominator,
        one.add(b.multiply(new Rational(-1))).numerator,
      ),
    );
}
export function kelly(p: Rational, netOdds: Rational) {
  prob(p);
  if (netOdds.compare(zero) <= 0) throw new Error('Net odds must be positive.');
  const f = p.add(
    one
      .add(p.multiply(new Rational(-1)))
      .multiply(new Rational(-netOdds.denominator, netOdds.numerator)),
  );
  return f.compare(zero) < 0 ? zero : f;
}
export function logGrowth(p: number, netOdds: number, fraction: number) {
  if (
    !Number.isFinite(p) ||
    p < 0 ||
    p > 1 ||
    !Number.isFinite(netOdds) ||
    netOdds <= 0 ||
    !Number.isFinite(fraction) ||
    fraction < 0 ||
    fraction >= 1
  )
    throw new Error(
      'Use probability in [0,1], positive odds and fraction below one.',
    );
  return p * Math.log1p(netOdds * fraction) + (1 - p) * Math.log1p(-fraction);
}
/** Malmuth–Harville: choose each next finisher in proportion to remaining chips. */
export function icm(
  stacks: readonly number[],
  prizes: readonly number[],
): Rational[] {
  if (
    stacks.length < 2 ||
    stacks.length > 6 ||
    stacks.some((s) => !Number.isSafeInteger(s) || s < 0) ||
    !Number.isSafeInteger(stacks.reduce((a, b) => a + b, 0)) ||
    prizes.length !== stacks.length ||
    !Number.isSafeInteger(prizes.reduce((a, b) => a + b, 0)) ||
    prizes.some(
      (p, i) =>
        !Number.isSafeInteger(p) || p < 0 || (i > 0 && p > prizes[i - 1]),
    )
  )
    throw new Error(
      'Use two to six nonnegative stacks and descending integer prizes.',
    );
  const result = stacks.map(() => zero);
  function visit(seats: number[], place: number, weight: Rational) {
    const total = seats.reduce((s, i) => s + stacks[i], 0);
    if (total === 0) {
      const remaining = prizes.slice(place).reduce((a, b) => a + b, 0);
      for (const i of seats)
        result[i] = result[i].add(
          weight.multiply(new Rational(remaining, seats.length)),
        );
      return;
    }
    for (const i of seats) {
      if (!stacks[i]) continue;
      const w = weight.multiply(new Rational(stacks[i], total));
      result[i] = result[i].add(w.multiply(new Rational(prizes[place])));
      visit(
        seats.filter((s) => s !== i),
        place + 1,
        w,
      );
    }
  }
  visit(
    stacks.map((_, i) => i),
    0,
    one,
  );
  return result;
}
export function bubbleFactor(
  stacks: number[],
  prizes: number[],
  hero: number,
  opponent: number,
  risk: number,
) {
  positive(risk);
  if (
    hero === opponent ||
    !stacks[hero] ||
    !stacks[opponent] ||
    risk > Math.min(stacks[hero], stacks[opponent])
  )
    throw new Error('Choose two live seats and a covered risk.');
  const before = icm(stacks, prizes)[hero],
    won = [...stacks],
    lost = [...stacks];
  won[hero] += risk;
  won[opponent] -= risk;
  lost[hero] -= risk;
  lost[opponent] += risk;
  const gain = icm(won, prizes)[hero].add(before.multiply(new Rational(-1))),
    loss = before.add(icm(lost, prizes)[hero].multiply(new Rational(-1)));
  return {
    before,
    gain,
    loss,
    ratio: gain.numerator
      ? loss.multiply(new Rational(gain.denominator, gain.numerator))
      : null,
    breakEven: loss.add(gain).numerator
      ? loss.multiply(
          new Rational(loss.add(gain).denominator, loss.add(gain).numerator),
        )
      : null,
  };
}
/** Incremental shove value versus folding; equity is conditional on being called. */
export function pushFold(
  pot: number,
  risk: number,
  opponentCall: number,
  fold: Rational,
  calledEquity: Rational,
) {
  positive(pot, risk);
  if (!Number.isSafeInteger(opponentCall) || opponentCall < 0)
    throw new Error('Invalid call.');
  prob(fold);
  prob(calledEquity);
  const called = calledEquity
    .multiply(new Rational(pot + risk + opponentCall))
    .add(new Rational(-risk));
  return {
    called,
    ev: fold
      .multiply(new Rational(pot))
      .add(one.add(fold.multiply(new Rational(-1))).multiply(called)),
  };
}
/** Survival probability for chi-square with five degrees of freedom. */
export function chiSquareFiveTail(x: number) {
  if (!Number.isFinite(x) || x < 0) throw new Error('Invalid statistic.');
  const z = x / 2;
  return Math.min(
    1,
    2 * (1 - normalCDF(Math.sqrt(x))) +
      (Math.exp(-z) / Math.sqrt(Math.PI)) *
        (2 * Math.sqrt(z) + (4 / 3) * z ** 1.5),
  );
}
