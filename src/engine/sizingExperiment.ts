import { Rng } from './rng';
import { ruinChance } from './finalMath';
import { Rational } from './math';
import { Welford, normalInterval, wilson } from './stats';
type FinalRequest =
  | {
      type: 'ruin';
      p: number;
      d: number;
      bankroll: number;
      target: number;
      seed: string;
      samples: number;
    }
  | {
      type: 'growth';
      p: number;
      d: number;
      fraction: number;
      odds: number;
      hands: number;
      seed: string;
      samples: number;
    };
export function* scalar(q: Extract<FinalRequest, { type: 'ruin' | 'growth' }>) {
  const p = new Rational(q.p, q.d);
  if (
    !Number.isInteger(q.samples) ||
    q.samples < 2 ||
    q.samples > 100000 ||
    !Number.isInteger(q.p) ||
    !Number.isInteger(q.d) ||
    q.p <= 0 ||
    q.p >= q.d
  )
    throw new Error(
      'Use a nondegenerate success probability and 2–100,000 trials.',
    );
  const exact =
    q.type === 'ruin'
      ? ruinChance(p, q.bankroll, q.target).toNumber()
      : (q.p / q.d) * Math.log1p(q.odds * q.fraction) +
        (1 - q.p / q.d) * Math.log1p(-q.fraction);
  if (
    q.type === 'growth' &&
    (!Number.isInteger(q.hands) ||
      q.hands < 1 ||
      q.hands > 1000 ||
      q.fraction < 0 ||
      q.fraction >= 1 ||
      q.odds <= 0)
  )
    throw new Error('Invalid growth model.');
  const rng = new Rng(q.seed),
    stats = new Welford();
  const snap = () => ({
    samples: stats.count,
    mean: stats.mean,
    interval:
      q.type === 'ruin'
        ? wilson(Math.round(stats.mean * stats.count), stats.count)
        : normalInterval(stats.mean, stats.standardError),
    exact,
  });
  for (let i = 0; i < q.samples; i++) {
    if (q.type === 'ruin') {
      let balance = q.bankroll,
        steps = 0;
      while (balance > 0 && balance < q.target) {
        balance += rng.int(q.d) < q.p ? 1 : -1;
        if (++steps > 1000000)
          throw new Error(
            'Walk exceeds the step budget; choose a smaller target.',
          );
      }
      stats.add(Number(balance === 0));
    } else {
      let growth = 0;
      for (let h = 0; h < q.hands; h++)
        growth +=
          rng.int(q.d) < q.p
            ? Math.log1p(q.odds * q.fraction)
            : Math.log1p(-q.fraction);
      stats.add(growth / q.hands);
    }
    if ((i + 1) % 100 === 0 && i + 1 < q.samples) yield snap();
  }
  return snap();
}
