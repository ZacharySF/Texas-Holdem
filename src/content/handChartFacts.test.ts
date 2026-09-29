import { expect, it } from 'vitest';
import {
  chartClasses,
  handChartCell,
  handClassFacts,
  shoveScenario,
  type HandChartSettings,
} from './handChartFacts';
const settings: HandChartSettings = {
  mode: 'equity',
  opponents: 1,
  stackBB: 10,
  callingRange: 'broad',
  samples: 1000,
  seed: '0123456789abcdef0123456789abcdef',
};
it('covers every distinct starting class and all physical hands', () => {
  expect(new Set(chartClasses).size).toBe(169);
  expect(chartClasses.slice(0, 3)).toEqual(['AA', 'AKs', 'AQs']);
  expect(chartClasses[13]).toBe('AKo');
  expect(
    chartClasses.reduce((n, label) => n + handClassFacts(label).combos, 0),
  ).toBe(1326);
  expect(handClassFacts('AA')).toMatchObject({ combos: 6, kind: 'pair' });
  expect(handClassFacts('AKs')).toMatchObject({ combos: 4, kind: 'suited' });
  expect(handClassFacts('AKo')).toMatchObject({ combos: 12, kind: 'offsuit' });
  expect(() => handClassFacts('invalid')).toThrow();
});
it('prices an unopened heads-up shove and removes hero blockers from the caller range', () => {
  const scenario = shoveScenario('AA', 10, 'pairs');
  expect(scenario).toMatchObject({
    pot: 3,
    risk: 19,
    call: 18,
    unitsPerBB: 2,
    available: 1225,
    calls: 73,
  });
  expect(scenario.fold.toString()).toBe('1152/1225');
  expect(
    scenario.range.combos.every((c) =>
      c.hand.every((card) => !scenario.hand.includes(card)),
    ),
  ).toBe(true);
  expect(shoveScenario('AKs', 10, 'all').fold.toNumber()).toBe(0);
  expect(shoveScenario('AKs', 10, 'broad').calls).toBeGreaterThan(
    shoveScenario('AKs', 10, 'tight').calls,
  );
  expect(() => shoveScenario('AA', 1, 'all')).toThrow();
  expect(() => shoveScenario('AA', 41, 'all')).toThrow();
  expect(() => shoveScenario('AA', 10, 'unknown' as 'all')).toThrow();
});
it('samples reproducible equity and distinguishes profitable and losing all-in hands', () => {
  const aces = handChartCell('AA', settings);
  expect(aces).toEqual(handChartCell('AA', settings));
  expect(aces.equity).toBeGreaterThan(handChartCell('72o', settings).equity);
  expect(
    handChartCell('AA', { ...settings, opponents: 5 }).equity,
  ).toBeLessThan(aces.equity);
  const shove = {
    ...settings,
    mode: 'shove' as const,
    callingRange: 'all' as const,
  };
  expect(handChartCell('AA', shove).decision).toBe('shove');
  expect(handChartCell('72o', shove).decision).toBe('fold');
  expect(handChartCell('72o', shove).evInterval[1]).toBeLessThan(0);
  for (const patch of [
    { opponents: 0 },
    { opponents: 6 },
    { samples: 10 },
    { seed: 'bad' },
    { mode: 'unknown' },
  ])
    expect(() =>
      handChartCell('AA', { ...settings, ...patch } as HandChartSettings),
    ).toThrow();
});
