import { expect, it } from 'vitest';
import { deck, parseCards, rank, suit, type Hand } from './cards';
import { combinations, nCr, Rational } from './math';
import { evaluateReference } from './evaluator';
import {
  courseDeck,
  courseDrawCount,
  courseMatches,
  courseProbability,
  hasStraight,
  validateCourseDraw,
  type CourseDraw,
} from './courseDraws';
import {
  drawingFacts,
  drawEvent,
  flopEvent,
  fiveCardCounts,
  sevenCardCounts,
  outChance,
  outShortcut,
  probabilityTree,
  targetOuts,
} from '../content/facts';
import { phaseFourLessons } from '../content/phaseFourLessons';
import {
  experimentProbability,
  simulateExperiment,
  type ExperimentSnapshot,
} from './experiments';
import { makeOutsRush, scoreOuts, outsSolution } from './outsRush';
const seed = '0123456789abcdef0123456789abcdef';
it('proves every Phase 4 numeric anchor through the facts registry', () => {
  expect([9, 8, 15].map((o) => outChance(47, o, 2).toString())).toEqual([
    '378/1081',
    '340/1081',
    '585/1081',
  ]);
  expect(outChance(46, 9, 1).toString()).toBe('9/46');
  expect(outShortcut(15, 2).toString()).toBe('3/5');
  expect(outShortcut(15, 2, true).toString()).toBe('53/100');
  expect(outShortcut(15, 2).display().percent).toBe('60.00%');
  expect(outShortcut(15, 2, true).display().percent).toBe('53.00%');
  expect(outShortcut(8, 2, true)).toEqual(outShortcut(8, 2));
  expect(outShortcut(9, 1, true).toString()).toBe('9/50');
  expect(drawingFacts.flopSet().toString()).toBe('144/1225');
  expect(drawingFacts.royal(7).toString()).toBe('1/30940');
  expect(nCr(52, 7)).toBe(133784560n);
  expect(drawingFacts.royal(7).multiply(new Rational(nCr(52, 7)))).toEqual(
    new Rational(4324),
  );
  expect(drawingFacts.royal(5).toString()).toBe('1/649740');
  expect(drawingFacts.royal(7).display().percent).toBe('0.00323%');
  expect(drawingFacts.royal(5).display().percent).toBe('0.000154%');
  expect(drawingFacts.flopPair().toString()).toBe('227/700');
  expect(drawingFacts.flopFlushDraw().toString()).toBe('429/3920');
  expect(drawingFacts.flopFlush().toString()).toBe('33/3920');
  expect(drawingFacts.queensOvercards().toString()).toBe('29/70');
  expect(drawingFacts.boardSet().toString()).toBe('47/245');
  const combo = drawingFacts.combo();
  expect([
    combo.flush.length,
    combo.straight.length,
    combo.overlap.length,
    combo.union.length,
  ]).toEqual([9, 8, 2, 15]);
  expect(combo.overlap).toEqual(parseCards('5h Th'));
  const dirty = drawingFacts.dirty();
  expect(dirty.dirty).toEqual(parseCards('2h'));
  expect(dirty.clean).toHaveLength(8);
  expect(fiveCardCounts()).toEqual([
    1302540n,
    1098240n,
    123552n,
    54912n,
    10200n,
    5108n,
    3744n,
    624n,
    40n,
  ]);
  expect(sevenCardCounts()).toEqual([
    23294460n,
    58627800n,
    31433400n,
    6461620n,
    6180020n,
    4047644n,
    3473184n,
    224848n,
    41584n,
  ]);
  expect(fiveCardCounts().reduce((a, b) => a + b)).toBe(nCr(52, 5));
  expect(sevenCardCounts().reduce((a, b) => a + b)).toBe(nCr(52, 7));
  expect(sevenCardCounts()[0]).toBeLessThan(sevenCardCounts()[1]);
  expect(sevenCardCounts()[0]).toBeLessThan(sevenCardCounts()[2]);
});
it('checks closed-form drawing counts against independently dealt sets, including the full board', () => {
  const events: CourseDraw[] = [
    ...[
      'pairHole',
      'twoPair',
      'flushDraw',
      'flush',
      'straight',
      'set',
      'overcard',
    ].map((event) =>
      flopEvent(
        event === 'set' || event === 'overcard' ? 'Qs Qd' : '8h 9h',
        event as Extract<CourseDraw, { topic: 'flop' }>['event'],
      ),
    ),
    {
      kind: 'courseDraw',
      topic: 'boardRank',
      hand: parseCards('Qs Qd') as unknown as Hand,
    },
    drawEvent(9),
    drawEvent(8),
    drawEvent(15),
    drawEvent(9, 1),
    {
      kind: 'courseDraw',
      topic: 'removal',
      known: parseCards('As'),
      target: 'rank',
      value: 14,
      draws: 2,
      all: true,
    },
    {
      kind: 'courseDraw',
      topic: 'removal',
      known: parseCards('Ah Jh 2h 7c Ks'),
      target: 'suit',
      value: 2,
      draws: 2,
      all: true,
    },
  ];
  for (const e of events) {
    let total = 0,
      hits = 0;
    for (const cards of combinations(courseDeck(e), courseDrawCount(e))) {
      total++;
      if (courseMatches(e, cards)) hits++;
    }
    expect(courseProbability(e)).toEqual(new Rational(hits, total));
  }
  expect(courseProbability(flopEvent('8h 9h', 'straight')).toString()).toBe(
    '16/1225',
  );
});
it('checks board suit textures by independent suit counts after removal', () => {
  for (const hole of ['Qs Qd', 'Ah Kh', 'As Kd']) {
    const e = flopEvent(hole, 'monotone'),
      pool = courseDeck(e),
      sizes = [0, 1, 2, 3].map((s) => pool.filter((c) => suit(c) === s).length);
    const monotone = sizes.reduce((a, n) => a + nCr(n, 3), 0n);
    const twoTone = sizes.reduce((a, n) => a + nCr(n, 2) * BigInt(50 - n), 0n);
    const rainbow = [...combinations(sizes, 3)].reduce(
      (a, counts) => a + BigInt(counts.reduce((x, y) => x * y)),
      0n,
    );
    for (const [event, count] of [
      ['monotone', monotone],
      ['twoTone', twoTone],
      ['rainbow', rainbow],
    ] as const)
      expect(courseProbability(flopEvent(hole, event))).toEqual(
        new Rational(count, nCr(50, 3)),
      );
    expect(monotone + twoTone + rainbow).toBe(nCr(50, 3));
    const ranks = Array.from(
      { length: 13 },
      (_, i) => pool.filter((c) => rank(c) === i + 2).length,
    );
    const distinct = [...combinations(ranks, 3)].reduce(
      (a, c) => a + BigInt(c.reduce((x, y) => x * y)),
      0n,
    );
    expect(courseProbability(flopEvent(hole, 'pairedBoard'))).toEqual(
      new Rational(nCr(50, 3) - distinct, nCr(50, 3)),
    );
  }
});
it('checks dependence, tree conservation, backdoors, and impossible events', () => {
  const paths = probabilityTree(3, 51);
  expect(
    paths
      .map((p) => p.probability)
      .reduce((a, b) => a.add(b))
      .toString(),
  ).toBe('1/1');
  expect(paths[0].probability.toString()).toBe('1/425');
  expect(paths[1].probability).toEqual(paths[2].probability);
  expect(() => probabilityTree(0, 51)).toThrow();
  expect(outChance(47, 0, 2).toString()).toBe('0/1');
  expect(outChance(47, 47, 2).toString()).toBe('1/1');
  expect(hasStraight(parseCards('As 2h 3d 4c 5h'))).toBe(true);
  expect(hasStraight(parseCards('Qs Kd As 2h 3c'))).toBe(false);
  const backdoor: CourseDraw = {
    kind: 'courseDraw',
    topic: 'removal',
    known: parseCards('Ah Jh 2h 7c Ks'),
    target: 'suit',
    value: 2,
    draws: 2,
    all: true,
  };
  expect(courseProbability(backdoor).toString()).toBe('45/1081');
  const dead: CourseDraw = {
    kind: 'courseDraw',
    topic: 'showdown',
    hero: parseCards('Ah Ad') as unknown as Hand,
    opponent: parseCards('Kc Kd') as unknown as Hand,
    board: parseCards('Ks Kh 2c 3d'),
  };
  expect(courseProbability(dead).toNumber()).toBe(0);
  expect(
    courseMatches(
      { ...dead, hero: dead.opponent, opponent: dead.hero },
      parseCards('5s'),
    ),
  ).toBe(true);
  expect(
    courseMatches(
      { kind: 'courseDraw', topic: 'royal', size: 7 },
      parseCards('As Ks Qs Js Ts 2c 3d'),
    ),
  ).toBe(true);
});
it('simulates every selectable Phase 4 event reproducibly against its exact answer', () => {
  const events = [
    ...new Map(
      phaseFourLessons
        .flatMap((l) => [l.experiment, ...(l.experiments ?? [])])
        .map((e) => [JSON.stringify(e), e]),
    ).values(),
  ];
  for (const e of events) {
    const samples =
      e.kind === 'courseDraw' && e.topic === 'royal' ? 1000000 : 20000;
    const run = () => {
      const it = simulateExperiment(e, seed, samples);
      let next = it.next();
      while (!next.done) next = it.next();
      return next.value as ExperimentSnapshot;
    };
    const result = run(),
      p = experimentProbability(e).toNumber();
    expect(result.samples).toBe(samples);
    expect(result.interval[0]).toBeGreaterThanOrEqual(0);
    expect(result.interval[1]).toBeLessThanOrEqual(1);
    expect(Math.abs(result.estimate - p)).toBeLessThanOrEqual(
      6 * Math.sqrt((p * (1 - p)) / samples) + 1 / samples,
    );
    if (e.kind === 'courseDraw' && e.topic === 'outs')
      expect(result).toEqual(run());
  }
});
it('generates replayable drill spots and independently verifies the exposed-hand outs', () => {
  const goals = new Set<string>();
  for (let n = 1; n <= 50; n++) {
    const s = n.toString(16).padStart(32, '0'),
      questions = makeOutsRush(s);
    expect(questions).toEqual(makeOutsRush(s));
    expect(questions).toHaveLength(5);
    for (const q of questions) {
      goals.add(q.goal);
      expect(new Set(q.outs).size).toBe(q.outs.length);
      expect(outsSolution(q).chance).toEqual(
        new Rational(q.outs.length, q.unseen),
      );
      if (q.opponent) {
        const known = [...q.hand, ...q.board, ...q.opponent];
        const reference = deck().filter(
          (c) =>
            !known.includes(c) &&
            evaluateReference([...q.hand, ...q.board, c]).strength >
              evaluateReference([...q.opponent!, ...q.board, c]).strength,
        );
        expect(q.outs).toEqual(reference);
      }
    }
  }
  expect(goals.size).toBe(4);
  const q = makeOutsRush(seed)[0];
  expect(scoreOuts(q, String(q.outs.length), 19999, 20000)).toBe(true);
  expect(scoreOuts(q, String(q.outs.length), 20000, 20000)).toBe(false);
  expect(scoreOuts(q, String(q.outs.length), 999999, null)).toBe(true);
  expect(scoreOuts(q, 'invalid', 1, null)).toBe(false);
  expect(scoreOuts(q, '99', 1, null)).toBe(false);
});
it('rejects malformed experiment parameters and card collisions', () => {
  const bad: CourseDraw[] = [
    drawEvent(-1),
    drawEvent(53),
    { kind: 'courseDraw', topic: 'category', size: 5, category: 9 },
    {
      kind: 'courseDraw',
      topic: 'removal',
      known: parseCards('As As'),
      target: 'rank',
      value: 14,
      draws: 1,
      all: false,
    },
    flopEvent('As Ks', 'set'),
    flopEvent('As Ad', 'pairHole'),
    flopEvent('As Kd', 'flushDraw'),
  ];
  for (const e of bad) expect(() => validateCourseDraw(e)).toThrow();
  expect(() => outShortcut(26, 2)).toThrow();
  expect(() =>
    targetOuts(
      parseCards('As Ad') as unknown as Hand,
      parseCards('2c 3h 4s'),
      'ahead',
    ),
  ).toThrow();
  expect(() =>
    validateCourseDraw({
      kind: 'courseDraw',
      topic: 'royal',
      size: 6,
    } as unknown as CourseDraw),
  ).toThrow();
  expect(() =>
    validateCourseDraw({
      kind: 'courseDraw',
      topic: 'category',
      size: 6,
      category: 0,
    } as unknown as CourseDraw),
  ).toThrow();
});
