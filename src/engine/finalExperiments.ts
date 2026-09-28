import { Rng } from './rng';
import { Rational } from './math';
import { Welford, normalInterval } from './stats';
import { icm } from './finalMath';
export function* finiteSteps(
  outcomes: number[],
  weights: number[],
  seed: string,
  samples: number,
) {
  if (
    !outcomes.length ||
    outcomes.length !== weights.length ||
    outcomes.some((v) => !Number.isSafeInteger(v)) ||
    weights.some((w) => !Number.isInteger(w) || w < 0) ||
    !Number.isInteger(samples) ||
    samples < 2 ||
    samples > 1000000
  )
    throw new Error('Invalid finite experiment.');
  const total = weights.reduce((a, b) => a + b, 0);
  if (total < 1 || total > 1000000) throw new Error('Invalid total weight.');
  const exact = outcomes
      .reduce(
        (a, v, i) => a.add(new Rational(BigInt(v) * BigInt(weights[i]), total)),
        new Rational(0),
      )
      .toNumber(),
    rng = new Rng(seed),
    stats = new Welford();
  const snap = () => ({
    samples: stats.count,
    mean: stats.mean,
    interval: normalInterval(stats.mean, stats.standardError),
    exact,
  });
  for (let i = 0; i < samples; i++) {
    let ticket = rng.int(total),
      index = 0;
    while (ticket >= weights[index]) ticket -= weights[index++];
    stats.add(outcomes[index]);
    if ((i + 1) % 500 === 0 && i + 1 < samples) yield snap();
  }
  return snap();
}
export function* tournamentSteps(
  stacks: number[],
  prizes: number[],
  seed: string,
  samples: number,
) {
  const exact = icm(stacks, prizes).map((p) => p.toNumber());
  if (
    stacks.some((s) => s === 0) ||
    stacks.reduce((a, b) => a + b, 0) > 1000000 ||
    !Number.isInteger(samples) ||
    samples < 2 ||
    samples > 100000
  )
    throw new Error(
      'Simulation needs positive stacks totalling at most one million and 2–100,000 samples.',
    );
  const rng = new Rng(seed),
    stats = stacks.map(() => new Welford());
  const snap = () => ({
    samples: stats[0].count,
    rows: stats.map((s, i) => ({
      mean: s.mean,
      interval: normalInterval(s.mean, s.standardError),
      exact: exact[i],
    })),
  });
  for (let t = 0; t < samples; t++) {
    let seats = stacks.map((_, i) => i);
    for (let place = 0; place < prizes.length; place++) {
      let ticket = rng.int(seats.reduce((sum, i) => sum + stacks[i], 0)),
        index = 0;
      while (ticket >= stacks[seats[index]]) ticket -= stacks[seats[index++]];
      const seat = seats[index];
      stats[seat].add(prizes[place]);
      seats = seats.filter((i) => i !== seat);
    }
    if ((t + 1) % 500 === 0 && t + 1 < samples) yield snap();
  }
  return snap();
}
