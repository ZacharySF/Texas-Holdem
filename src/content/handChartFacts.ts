import { equity } from '../engine/equity';
import { gridClass, gridRange, presetRange } from '../engine/rangeGrid';
import { nCr, Rational } from '../engine/math';
import { pushFold } from '../engine/finalMath';

export const chartClasses = Array.from({ length: 169 }, (_, i) =>
  gridClass(Math.floor(i / 13), i % 13),
);
export type CallingRange = 'broad' | 'tight' | 'pairs' | 'all';
export interface HandChartSettings {
  mode: 'equity' | 'shove';
  opponents: number;
  stackBB: number;
  callingRange: CallingRange;
  samples: number;
  seed: string;
}
export function handClassFacts(label: string) {
  const combos = gridRange({ [label]: 100 }).combos;
  return {
    label,
    combos: combos.length,
    hand: combos[0].hand,
    kind:
      label.length === 2 ? 'pair' : label.endsWith('s') ? 'suited' : 'offsuit',
  };
}
/** Unopened heads-up SB versus BB; both began with stackBB big blinds. */
export function shoveScenario(
  label: string,
  stackBB: number,
  callingRange: CallingRange,
) {
  if (!Number.isInteger(stackBB) || stackBB < 2 || stackBB > 40)
    throw new Error('Use an effective stack from 2 to 40 big blinds.');
  if (!['broad', 'tight', 'pairs', 'all'].includes(callingRange))
    throw new Error('Unknown calling range.');
  const { hand } = handClassFacts(label);
  const weights =
    callingRange === 'broad'
      ? Object.fromEntries(
          chartClasses.map((key) => [
            key,
            key.length === 2 ||
            key.startsWith('A') ||
            (key.startsWith('K') && key.endsWith('s')) ||
            ('AKQJT'.includes(key[0]) && 'AKQJT'.includes(key[1]))
              ? 100
              : 0,
          ]),
        )
      : presetRange(callingRange);
  const range = gridRange(weights, hand);
  const total = Number(nCr(50, 2));
  return {
    hand,
    range,
    available: total,
    calls: range.combos.length,
    fold: new Rational(total - range.combos.length, total),
    // Integer half-blind units keep the existing exact EV function unchanged.
    pot: 3,
    risk: stackBB * 2 - 1,
    call: stackBB * 2 - 2,
    unitsPerBB: 2,
  };
}
export function handChartCell(label: string, settings: HandChartSettings) {
  if (
    !['equity', 'shove'].includes(settings.mode) ||
    !Number.isInteger(settings.opponents) ||
    settings.opponents < 1 ||
    settings.opponents > 5 ||
    ![1000, 5000].includes(settings.samples)
  )
    throw new Error('Invalid chart settings.');
  const scenario = shoveScenario(
    label,
    settings.stackBB,
    settings.callingRange,
  );
  const result = equity({
    players: [
      scenario.hand,
      ...(settings.mode === 'shove'
        ? [scenario.range]
        : Array.from({ length: settings.opponents }, () => 'random' as const)),
    ],
    board: [],
    method: 'monteCarlo',
    samples: settings.samples,
    seed: settings.seed,
  }).players[0].equity;
  const evAt = (e: Rational) =>
    pushFold(
      scenario.pot,
      scenario.risk,
      scenario.call,
      scenario.fold,
      e,
    ).ev.toNumber() / scenario.unitsPerBB;
  const ev = evAt(
    new Rational(BigInt(result.numerator), BigInt(result.denominator)),
  );
  const interval = result.interval.map((e) =>
    evAt(new Rational(Math.round(e * 1000000000), 1000000000)),
  );
  return {
    label,
    equity: result.value,
    equityInterval: result.interval,
    ev,
    evInterval: interval,
    decision: interval[0] > 0 ? 'shove' : interval[1] < 0 ? 'fold' : 'close',
    foldChance: scenario.fold.toNumber(),
    callingCombos: scenario.calls,
  };
}
export type HandChartCell = ReturnType<typeof handChartCell>;
