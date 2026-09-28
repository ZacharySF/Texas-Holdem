import { Rng } from './rng';
import { normalInterval, Welford, wilson } from './stats';
export interface BankrollInput {
  seed: string;
  rate: number;
  sd: number;
  hands: number;
  bankroll: number;
  runs: number;
}
export interface BankrollResult {
  runs: number;
  mean: number;
  meanInterval: readonly [number, number];
  ruin: number;
  ruinInterval: readonly [number, number];
  expected: number;
  theoreticalSD: number;
  endings: number[];
  drawdowns: number[];
  longestDownswings: number[];
  paths: number[][];
}
/** Box–Muller draws an independent normal increment per 100-hand block; the final partial block scales with its length. */
export function* bankrollSteps(
  input: BankrollInput,
): Generator<BankrollResult, BankrollResult> {
  const { rate, sd, hands, bankroll, runs } = input;
  if (
    ![rate, sd, bankroll].every(Number.isFinite) ||
    sd < 0 ||
    bankroll < 0 ||
    !Number.isSafeInteger(hands) ||
    hands < 1 ||
    hands > 1000000 ||
    !Number.isInteger(runs) ||
    runs < 2 ||
    runs > 10000
  )
    throw new Error('Invalid bankroll model.');
  const rng = new Rng(input.seed),
    stats = new Welford(),
    endings: number[] = [],
    drawdowns: number[] = [],
    longestDownswings: number[] = [],
    paths: number[][] = [];
  let ruined = 0;
  const normal = () =>
    Math.sqrt(-2 * Math.log((rng.nextUint32() + 1) / 4294967297)) *
    Math.cos((2 * Math.PI * (rng.nextUint32() + 1)) / 4294967297);
  const snap = (): BankrollResult => ({
    runs: stats.count,
    mean: stats.mean,
    meanInterval: normalInterval(stats.mean, stats.standardError),
    ruin: ruined / stats.count,
    ruinInterval: wilson(ruined, stats.count),
    expected: (rate * hands) / 100,
    theoreticalSD: sd * Math.sqrt(hands / 100),
    endings: [...endings],
    drawdowns: [...drawdowns],
    longestDownswings: [...longestDownswings],
    paths: [...paths],
  });
  for (let run = 0; run < runs; run++) {
    let total = 0,
      peak = 0,
      maxDrop = 0,
      length = 0,
      longest = 0,
      ruin = bankroll === 0;
    const path = [0];
    for (let h = 0; h < hands; h += 100) {
      const block = Math.min(100, hands - h);
      total += (rate * block) / 100 + sd * Math.sqrt(block / 100) * normal();
      if (total >= peak) {
        peak = total;
        length = 0;
      } else {
        length += block;
        longest = Math.max(longest, length);
      }
      maxDrop = Math.max(maxDrop, peak - total);
      if (bankroll + total <= 0) ruin = true;
      if (run < 8) path.push(total);
    }
    if (ruin) ruined++;
    stats.add(total);
    endings.push(total);
    drawdowns.push(maxDrop);
    longestDownswings.push(longest);
    if (run < 8) paths.push(path);
    if ((run + 1) % 100 === 0 && run + 1 < runs) yield snap();
  }
  return snap();
}
