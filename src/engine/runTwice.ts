import { assertCards, deck, type Hand } from './cards';
import { evaluateFast } from './evaluator';
import { Rng } from './rng';
import { Rational } from './math';
import { Welford, normalInterval } from './stats';
export function riverRunoutFacts(
  players: Hand[],
  board: number[],
  dead: number[] = [],
) {
  assertCards([...players.flat(), ...board, ...dead]);
  if (players.length < 2 || players.length > 6 || board.length !== 4)
    throw new Error('Specify two to six hands and a four-card board.');
  const remaining = deck().filter(
      (c) => ![...players.flat(), ...board, ...dead].includes(c),
    ),
    units = 60;
  if (remaining.length < 2) throw new Error('Need two possible rivers.');
  const shares = remaining.map((c) => {
      const strengths = players.map((h) => evaluateFast([...h, ...board, c])),
        best = Math.max(...strengths),
        winners = strengths.filter((s) => s === best).length;
      return strengths[0] === best ? units / winners : 0;
    }),
    n = shares.length,
    sum = shares.reduce((a, b) => a + b, 0),
    square = shares.reduce((a, b) => a + b * b, 0),
    mean = new Rational(sum, n * units),
    variance = new Rational(square, n * units * units).add(
      mean.multiply(mean).multiply(new Rational(-1)),
    ),
    covariance = variance.multiply(new Rational(-1, n - 1));
  return {
    mean,
    variance,
    covariance,
    twiceVariance: variance.add(covariance).multiply(new Rational(1, 2)),
    independentVariance: variance.multiply(new Rational(1, 2)),
    loss: new Rational(shares.filter((s) => s === 0).length, n),
    rivers: n,
  };
}
export function* runoutComparison(
  players: Hand[],
  board: number[],
  seed: string,
  samples: number,
) {
  const exact = riverRunoutFacts(players, board);
  if (!Number.isInteger(samples) || samples < 2 || samples > 1000000)
    throw new Error('Invalid sample count.');
  const pool = deck().filter((c) => ![...players.flat(), ...board].includes(c)),
    rng = new Rng(seed),
    single = new Welford(),
    twice = new Welford(),
    second = new Welford(),
    product = new Welford();
  const share = (c: number) => {
    const s = players.map((h) => evaluateFast([...h, ...board, c])),
      best = Math.max(...s);
    return s[0] === best ? 1 / s.filter((v) => v === best).length : 0;
  };
  const snapshot = () => ({
    samples: single.count,
    single: single.mean,
    twice: twice.mean,
    singleInterval: normalInterval(single.mean, single.standardError),
    twiceInterval: normalInterval(twice.mean, twice.standardError),
    singleVariance: single.variance,
    twiceVariance: twice.variance,
    covariance: product.mean - single.mean * second.mean,
    exact: {
      mean: exact.mean.toNumber(),
      variance: exact.variance.toNumber(),
      covariance: exact.covariance.toNumber(),
      twiceVariance: exact.twiceVariance.toNumber(),
    },
  });
  for (let i = 0; i < samples; i++) {
    const first = rng.int(pool.length),
      secondIndex = rng.int(pool.length - 1),
      a = share(pool[first]),
      b = share(pool[secondIndex >= first ? secondIndex + 1 : secondIndex]);
    single.add(a);
    second.add(b);
    twice.add((a + b) / 2);
    product.add(a * b);
    if ((i + 1) % 500 === 0 && i + 1 < samples) yield snapshot();
  }
  return snapshot();
}
