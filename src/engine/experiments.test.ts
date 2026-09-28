import { expect, it } from 'vitest';
import { combinations, Rational } from './math';
import {
  experimentDeck,
  experimentDraws,
  eventMatches,
  experimentProbability,
  simulateExperiment,
  type Experiment,
} from './experiments';
const events: Experiment[] = [
  { kind: 'rank', rank: 14 },
  { kind: 'suit', suit: 2 },
  { kind: 'pair' },
  { kind: 'suited' },
  { kind: 'pocketRank', rank: 12 },
  { kind: 'atLeastRank', rank: 14 },
  { kind: 'orderedRanks', first: 14, second: 14 },
  { kind: 'orderedRanks', first: 14, second: 13 },
  { kind: 'rankOrSuit', rank: 14, suit: 3 },
  { kind: 'eitherSuit', first: 1, second: 2 },
  { kind: 'permutation', size: 3 },
  { kind: 'subset', size: 4, take: 2 },
  { kind: 'riverWin' },
];
function* permutations(values: number[], take: number): Generator<number[]> {
  if (take === 0) {
    yield [];
    return;
  }
  for (const v of values)
    for (const rest of permutations(
      values.filter((c) => c !== v),
      take - 1,
    ))
      yield [v, ...rest];
}
it('checks every experiment against independent enumeration of its actual outcomes', () => {
  for (const event of events) {
    let total = 0,
      success = 0;
    for (const cards of permutations(
      experimentDeck(event),
      experimentDraws(event),
    )) {
      total++;
      if (eventMatches(event, cards)) success++;
    }
    expect(experimentProbability(event)).toEqual(new Rational(success, total));
  }
});
it('replays streamed samples and agrees with exact counting', () => {
  for (const event of events) {
    const run = () => {
      const iterator = simulateExperiment(
        event,
        '0123456789abcdef0123456789abcdef',
        20000,
      );
      const points = [];
      let next = iterator.next();
      while (!next.done) {
        points.push(next.value);
        next = iterator.next();
      }
      return { points, last: next.value };
    };
    const a = run(),
      b = run();
    expect(a).toEqual(b);
    expect(a.last.samples).toBe(20000);
    const p = experimentProbability(event).toNumber();
    expect(Math.abs(a.last.estimate - p)).toBeLessThan(
      6 * Math.sqrt((p * (1 - p)) / 20000) + 1 / 20000,
    );
    expect(a.points.length).toBeLessThanOrEqual(200);
  }
});
it('handles certain events and rejects invalid parameters', () => {
  expect(
    simulateExperiment(
      { kind: 'subset', size: 2, take: 2 },
      '0123456789abcdef0123456789abcdef',
      1,
    ).next().value.estimate,
  ).toBe(1);
  for (const event of [
    { kind: 'rank', rank: 1 },
    { kind: 'eitherSuit', first: 1, second: 1 },
    { kind: 'permutation', size: 7 },
    { kind: 'subset', size: 4, take: 5 },
    { kind: 'unknown' },
  ] as Experiment[])
    expect(() => experimentProbability(event)).toThrow();
  expect(() => simulateExperiment(events[0], 'bad', 1).next()).toThrow();
  expect(() =>
    simulateExperiment(events[0], '0123456789abcdef0123456789abcdef', 0).next(),
  ).toThrow();
  expect([
    ...combinations(experimentDeck({ kind: 'subset', size: 4, take: 2 }), 2),
  ]).toHaveLength(6);
});
