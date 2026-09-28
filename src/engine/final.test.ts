import { payouts } from './payouts';
import { handResult } from './ledger';
import { expect, it } from 'vitest';
import fc from 'fast-check';
import { finalFacts as f } from '../content/facts';
import {
  finalExample,
  finalRequest,
  riverExample,
} from '../content/finalLessonFacts';
import { Rational } from './math';
import { shuffleSteps, streakSteps } from './shuffleLab';
import { finiteSteps, tournamentSteps } from './finalExperiments';
import { scalar } from './sizingExperiment';
import { runoutComparison } from './runTwice';
import {
  kuhnValue,
  kuhnExploitability,
  trainKuhn,
  kuhnDeal,
  kuhnBot,
  kuhnTerminal,
} from './kuhn';
import { pushToyValue } from './pushToy';
import { act, newGame, legalActions, replay, settleBoards } from './game';
import { Rng } from './rng';
const seed = '0123456789abcdef0123456789abcdef';
function finish<T>(g: Generator<T, T>) {
  let v = g.next();
  while (!v.done) v = g.next();
  return v.value;
}
it('proves the exhaustive naive-shuffle anchor and rejection mechanism', () => {
  const naive = f.naiveAnchor();
  expect(naive.reduce((s, r) => s + r.count, 0)).toBe(27);
  expect(naive.map((r) => r.count).sort()).toEqual([4, 4, 4, 5, 5, 5]);
  expect(f.shufflePaths('fisherYates').map((r) => r.count)).toEqual([
    1, 1, 1, 1, 1, 1,
  ]);
  expect(f.moduloCounts()).toEqual({
    biased: [3, 3, 2],
    rejected: [2, 2, 2],
    discarded: 2,
  });
  expect(f.moduloCounts(9, 3).discarded).toBe(0);
  for (const method of ['naive', 'fisherYates'] as const) {
    const result = finish(shuffleSteps(method, seed, 30000));
    expect(result.samples).toBe(30000);
    expect(result.rows.reduce((s, r) => s + r.observed, 0)).toBe(30000);
    for (const row of result.rows)
      expect(Math.abs(row.estimate - row.exact)).toBeLessThan(0.02);
    expect(result).toEqual(finish(shuffleSteps(method, seed, 30000)));
    if (method === 'naive') expect(result.pValue).toBeLessThan(0.001);
  }
  expect(f.chiSquareFiveTail(0)).toBeCloseTo(1);
  expect(f.chiSquareFiveTail(11.0704977)).toBeCloseTo(0.05, 6);
  expect(() => f.shufflePaths('naive', 1)).toThrow();
  expect(() => f.moduloCounts(2, 3)).toThrow();
  expect(() => finish(shuffleSteps('naive', seed, 1))).toThrow();
  expect(() => f.chiSquareFiveTail(-1)).toThrow();
});
it('counts overlapping streaks against independent binary enumeration', () => {
  for (let n = 1; n <= 10; n++)
    for (let k = 1; k <= 4; k++) {
      let hits = 0;
      for (let mask = 0; mask < 2 ** n; mask++) {
        const s = mask.toString(2).padStart(n, '0');
        if (s.includes('1'.repeat(k))) hits++;
      }
      expect(f.streakChance(1, 2, k, n).toNumber()).toBe(hits / 2 ** n);
    }
  expect(f.streakChance(0, 2, 3, 10).toNumber()).toBe(0);
  expect(f.streakChance(2, 2, 3, 10).toNumber()).toBe(1);
  expect(f.streakNext(4, 5).toString()).toBe('4/5');
  const r = finish(streakSteps(1, 2, 3, 5, seed, 20000));
  expect(Math.abs(r.mean - r.exact)).toBeLessThan(
    4 * Math.sqrt((r.exact * (1 - r.exact)) / r.samples),
  );
  expect(r).toEqual(finish(streakSteps(1, 2, 3, 5, seed, 20000)));
  expect(() => f.streakChance(3, 2, 2, 2)).toThrow();
  expect(() => f.streakNext(-1, 2)).toThrow();
  expect(() => finish(streakSteps(1, 2, 3, 5, seed, 1))).toThrow();
});
it('derives bluff, polarized-range and insurance anchors from payoffs', () => {
  expect(f.bluffAnchor().toString()).toBe('1/3');
  expect(f.defenseAnchor().toString()).toBe('2/3');
  expect(f.mixAnchor().toString()).toBe('1/3');
  expect(
    f.semiBluffEV(100, 50, f.bluffAnchor(), new Rational(0)).toString(),
  ).toBe('0/1');
  expect(
    f.semiBluffEV(100, 50, new Rational(0), new Rational(1, 4)).toNumber(),
  ).toBe(0);
  const r = f.insurance(new Rational(1, 10), 100, new Rational(1, 5));
  expect(r.fair.toNumber()).toBe(10);
  expect(r.premium.toNumber()).toBe(12);
  expect(r.buyerEV.toNumber()).toBe(-2);
  expect(f.insurance(new Rational(1, 10), 100).buyerEV.toNumber()).toBe(0);
  expect(
    f
      .pushFold(100, 50, 50, new Rational(1, 2), new Rational(1, 4))
      .ev.toNumber(),
  ).toBe(50);
  for (const action of [
    () => f.bluffBreakEven(0, 1),
    () => f.insurance(new Rational(2), 100),
    () => f.insurance(new Rational(1, 2), 100, new Rational(-1)),
    () => f.pushFold(1, 1, -1, new Rational(0), new Rational(0)),
    () => f.polarizedBluffs(-1, 2),
  ])
    expect(action).toThrow();
});
it('conserves ICM prizes, including zero stacks, and computes bubble risk', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 0, max: 100 }), {
        minLength: 2,
        maxLength: 6,
      }),
      (stacks) => {
        const prizes = stacks.map((_, i) => (stacks.length - i) * 10),
          r = f.icm(stacks, prizes);
        expect(r.reduce((a, b) => a.add(b), new Rational(0))).toEqual(
          new Rational(prizes.reduce((a, b) => a + b, 0)),
        );
        expect(
          f.icm(
            stacks.map((s) => s * 7),
            prizes,
          ),
        ).toEqual(r);
      },
    ),
  );
  expect(f.icm([1, 1], [100, 20]).map((r) => r.toNumber())).toEqual([60, 60]);
  expect(f.icm([1, 0, 0], [100, 20, 10]).map((r) => r.toNumber())).toEqual([
    100, 15, 15,
  ]);
  const b = f.bubbleFactor([50, 30, 20], [50, 30, 20], 0, 1, 10);
  expect(b.ratio!.toNumber()).toBeGreaterThan(1);
  expect(b.breakEven!.multiply(b.gain.add(b.loss)).compare(b.loss)).toBe(0);
  expect(f.bubbleFactor([1, 1], [10, 10], 0, 1, 1).ratio).toBeNull();
  const sim = finish(tournamentSteps([50, 30, 20], [50, 30, 20], seed, 10000));
  expect(sim.rows.reduce((s, r) => s + r.mean, 0)).toBeCloseTo(100);
  for (const r of sim.rows) expect(Math.abs(r.mean - r.exact)).toBeLessThan(1);
  for (const action of [
    () => f.icm([1], [10]),
    () => f.icm([1, 2], [10, 20]),
    () => f.bubbleFactor([1, 1], [10, 0], 0, 1, 2),
    () => finish(tournamentSteps([0, 1], [10, 0], seed, 5)),
  ])
    expect(action).toThrow();
});
it('checks ruin recurrence, boundaries and the Kelly maximum', () => {
  expect(f.ruinChance(new Rational(1, 2), 5, 10).toString()).toBe('1/2');
  expect(f.ruinChance(new Rational(0), 5, 10).toNumber()).toBe(1);
  expect(f.ruinChance(new Rational(1), 5, 10).toNumber()).toBe(0);
  for (const p of [new Rational(2, 5), new Rational(3, 5)])
    for (let i = 2; i < 9; i++) {
      const next = f
        .ruinChance(p, i + 1, 10)
        .multiply(p)
        .add(
          f
            .ruinChance(p, i - 1, 10)
            .multiply(new Rational(1).add(p.multiply(new Rational(-1)))),
        );
      expect(f.ruinChance(p, i, 10)).toEqual(next);
    }
  const k = f.kelly(new Rational(3, 5), new Rational(1));
  expect(k.toString()).toBe('1/5');
  expect(f.kelly(new Rational(2, 5), new Rational(1)).toNumber()).toBe(0);
  for (let i = 0; i < 100; i++)
    expect(f.logGrowth(0.6, 1, i / 100)).toBeLessThanOrEqual(
      f.logGrowth(0.6, 1, k.toNumber()) + 1e-12,
    );
  for (const type of ['growth', 'ruin'] as const) {
    const q = {
      type,
      p: 6,
      d: 10,
      bankroll: 5,
      target: 10,
      fraction: 0.2,
      odds: 1,
      hands: 20,
      seed,
      samples: 10000,
    };
    const r = finish(scalar(q));
    expect(Math.abs(r.mean - r.exact)).toBeLessThan(0.02);
    expect(r).toEqual(finish(scalar(q)));
  }
  for (const action of [
    () => f.ruinChance(new Rational(1, 2), 10, 10),
    () => f.kelly(new Rational(1, 2), new Rational(0)),
    () => f.logGrowth(0.5, 1, 1),
    () =>
      finish(
        scalar({
          type: 'growth',
          p: 1,
          d: 2,
          fraction: 1,
          odds: 1,
          hands: 2,
          seed,
          samples: 10,
        }),
      ),
    () =>
      finish(
        scalar({
          type: 'ruin',
          p: 0,
          d: 2,
          bankroll: 1,
          target: 3,
          seed,
          samples: 10,
        }),
      ),
  ])
    expect(action).toThrow();
});
it('verifies AKQ and push/fold equilibria against every pure deviation', () => {
  expect(kuhnValue(f.kuhnEquilibrium())).toBeCloseTo(
    f.kuhnExactValue().toNumber(),
    12,
  );
  expect(kuhnExploitability(f.kuhnEquilibrium()).exploitability).toBeLessThan(
    1e-12,
  );
  const trained = finish(trainKuhn(10000));
  expect(trained.exploitability).toBeLessThan(0.01);
  expect(trained.value).toBeCloseTo(-1 / 18, 2);
  expect(finish(trainKuhn(1)).iterations).toBe(1);
  expect(kuhnDeal(seed)).toEqual(kuhnDeal(seed));
  expect(kuhnDeal(seed)[0]).not.toBe(kuhnDeal(seed)[1]);
  expect(kuhnBot(2, 'b', new Rng(seed))).toBe('b');
  expect(kuhnBot(0, 'b', new Rng(seed))).toBe('p');
  expect(kuhnTerminal([0, 2], 'pbp')).toBe(-1);
  expect(() => kuhnBot(3, '', new Rng(seed))).toThrow();
  expect(() => finish(trainKuhn(0))).toThrow();
  const toy = f.pushToyEquilibrium(),
    push = toy.push.map((p) => p.toNumber()),
    call = toy.call.map((p) => p.toNumber()),
    value = toy.value.toNumber();
  expect(pushToyValue(push, call)).toBeCloseTo(value);
  for (let mask = 0; mask < 8; mask++) {
    const pure = [0, 1, 2].map((i) => (mask >> i) & 1);
    expect(pushToyValue(pure, call)).toBeLessThanOrEqual(value + 1e-12);
    expect(pushToyValue(push, pure)).toBeGreaterThanOrEqual(value - 1e-12);
  }
  expect(() => pushToyValue([1], [0, 1, 0])).toThrow();
});
it('preserves the two-river mean and includes finite-deck covariance', () => {
  const { players, board } = riverExample(),
    r = f.riverRunoutFacts(players, board);
  expect(r.rivers).toBe(44);
  expect(r.mean.toString()).toBe('21/22');
  expect(r.loss.toString()).toBe('1/22');
  // Independent ordered-pair count: two losing kings and forty-two winning rivers.
  const shares = [...Array<number>(42).fill(1), 0, 0],
    pairs = shares.flatMap((a, i) =>
      shares.filter((_, j) => i !== j).map((b) => (a + b) / 2),
    );
  const mean = pairs.reduce((a, b) => a + b, 0) / pairs.length,
    variance = pairs.reduce((s, x) => s + (x - mean) ** 2, 0) / pairs.length;
  const exactMean = new Rational(
      pairs.reduce((s, x) => s + 2 * x, 0),
      2 * pairs.length,
    ),
    exactSecondMoment = new Rational(
      pairs.reduce((s, x) => s + 4 * x * x, 0),
      4 * pairs.length,
    ),
    exactVariance = exactSecondMoment.add(
      exactMean.multiply(exactMean).multiply(new Rational(-1)),
    );
  expect(exactMean).toEqual(r.mean);
  expect(exactVariance).toEqual(r.twiceVariance);
  const cross = shares.flatMap((a, i) =>
    shares.filter((_, j) => i !== j).map((b) => a * b),
  );
  expect(
    new Rational(
      cross.reduce((s, x) => s + x, 0),
      cross.length,
    ).add(r.mean.multiply(r.mean).multiply(new Rational(-1))),
  ).toEqual(r.covariance);
  expect(r.covariance.toNumber()).toBeLessThan(0);
  const sim = finish(runoutComparison(players, board, seed, 10000));
  expect(sim.single).toBeCloseTo(mean, 2);
  expect(sim.twice).toBeCloseTo(mean, 2);
  expect(sim.twiceVariance).toBeCloseTo(variance, 2);
  expect(sim).toEqual(finish(runoutComparison(players, board, seed, 10000)));
  expect(() => f.riverRunoutFacts(players, [])).toThrow();
  expect(() => finish(runoutComparison(players, board, seed, 1))).toThrow();
});
it('settles both boards once per side pot and replays complete two/six-seat deals', () => {
  expect(
    settleBoards(
      [5, 5, 5],
      [false, false, true],
      [
        [2, 2, 1],
        [2, 2, 1],
      ],
      0,
    ).awards,
  ).toEqual([7, 8, 0]);
  expect(
    settleBoards(
      [50, 100, 100],
      [false, false, false],
      [
        [3, 2, 1],
        [1, 2, 3],
      ],
      0,
    ).awards,
  ).toEqual([75, 50, 125]);
  expect(() => settleBoards([5, 5], [false, false], [], 0)).toThrow();
  for (const seats of [2, 6])
    for (let n = 1; n < 30; n++) {
      let g = newGame({
        seed: n.toString(16).padStart(32, '0'),
        stacks: Array<number>(seats).fill(100),
        button: 0,
        smallBlind: 5,
        bigBlind: 10,
        runItTwice: true,
      });
      while (!g.complete) {
        const legal = legalActions(g);
        g = act(
          g,
          legal.canRaise
            ? { type: 'raise', to: legal.maxRaiseTo }
            : { type: legal.canCheck ? 'check' : 'call' },
        );
      }
      expect(g.runouts).toHaveLength(2);
      expect(new Set(g.runouts!.flat()).size).toBe(10);
      expect(g.players.reduce((s, p) => s + p.stack, 0)).toBe(seats * 100);
      expect(replay(g.config, g.history)).toEqual(g);
      expect(
        g.potAwards!.reduce((s, a) => s + a.reduce((x, y) => x + y, 0), 0),
      ).toBe(seats * 100);
    }
  const config = {
    seed,
    stacks: [100, 100],
    button: 0,
    smallBlind: 5,
    bigBlind: 10,
    runItTwice: true,
  };
  expect(act(newGame(config), { type: 'fold' }).runouts).toBeUndefined();
  let g = act(newGame(config), { type: 'call' });
  g = act(g, { type: 'check' });
  const flop = [...g.board];
  g = act(g, { type: 'raise', to: legalActions(g).maxRaiseTo });
  g = act(g, { type: 'call' });
  expect(g.runouts!.every((b) => b.slice(0, 3).join() === flop.join())).toBe(
    true,
  );
  expect(new Set(g.runouts!.flat()).size).toBe(7);
});
it('checks every final lesson fact, notebook and simulation specification', () => {
  for (let c = 20; c <= 25; c++)
    for (let l = 1; l <= 2; l++) {
      const id = `${c}-${l}`,
        e = finalExample(id, id === '24-2' ? 2 : 5);
      expect(Number.isFinite(e.answer.toNumber())).toBe(true);
      expect(e.gap.add(e.answer)).toEqual(e.shortcut);
      expect(finalRequest(id, seed)).toBeDefined();
    }
  const finite = finish(finiteSteps([100, -50], [1, 2], seed, 10000));
  expect(finite.exact).toBe(0);
  expect(Math.abs(finite.mean)).toBeLessThan(3);
  expect(finite).toEqual(finish(finiteSteps([100, -50], [1, 2], seed, 10000)));
  expect(finish(finiteSteps([1, 2], [0, 1], seed, 2)).mean).toBe(2);
  for (const action of [
    () => finish(finiteSteps([], [], seed, 2)),
    () => finish(finiteSteps([1], [0], seed, 2)),
    () => finish(tournamentSteps([1, 1], [1, 0], seed, 1)),
  ])
    expect(action).toThrow();
});

it('prices integer-chip two-board awards in Stats under the actual settlement rule', () => {
  const { players, board } = riverExample();
  const request = {
    players,
    board,
    contributions: [5, 5],
    folded: [false, false],
    button: 0,
    seed,
    samples: 20000,
    runItTwice: true,
    method: 'exact' as const,
  };
  const exact = payouts(request);
  expect(exact.samples).toBe(44 * 43);
  expect(exact.meanAwards.reduce((a, b) => a + b, 0)).toBeCloseTo(10);
  expect(exact.meanAwards[0]).toBeCloseTo((10 * 21) / 22, 10);
  const sampled = payouts({ ...request, method: 'monteCarlo' });
  expect(Math.abs(sampled.meanAwards[0] - exact.meanAwards[0])).toBeLessThan(
    0.1,
  );
  expect(sampled).toEqual(payouts({ ...request, method: 'monteCarlo' }));
  const config = {
    seed,
    stacks: [100, 100],
    button: 0,
    smallBlind: 5,
    bigBlind: 10,
    runItTwice: true,
  };
  let g = newGame(config);
  g = act(g, { type: 'call' });
  g = act(g, { type: 'check' });
  g = act(g, { type: 'check' });
  g = act(g, { type: 'check' });
  g = act(g, { type: 'raise', to: legalActions(g).maxRaiseTo });
  g = act(g, { type: 'call' });
  const result = handResult({
    id: 'twice',
    date: '2026-09-27',
    config,
    actions: g.history,
    notes: [],
  });
  expect(result.actual).toBe((g.players[0].stack - 100) / 10);
  expect(result.adjustedPots).toBe(1);
  const expected = payouts({
    players: g.players.map((p) => p.hand),
    board: g.boards.turn!,
    contributions: [100, 100],
    folded: [false, false],
    button: 0,
    seed,
    samples: 5000,
    runItTwice: true,
    method: 'exact',
  });
  expect(result.adjusted).toBeCloseTo((expected.meanAwards[0] - 100) / 10, 10);
});

it('conserves every chip in generated unequal-stack two-board hands', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 1, max: 500 }), {
        minLength: 2,
        maxLength: 6,
      }),
      fc.integer({ min: 1, max: 100000 }),
      (stacks, n) => {
        let g = newGame({
          seed: n.toString(16).padStart(32, '0'),
          stacks,
          button: n % stacks.length,
          smallBlind: 5,
          bigBlind: 10,
          runItTwice: true,
        });
        while (!g.complete) {
          const legal = legalActions(g);
          g = act(
            g,
            legal.canRaise
              ? { type: 'raise', to: legal.maxRaiseTo }
              : { type: legal.canCheck ? 'check' : 'call' },
          );
          expect(g.players.every((p) => p.stack >= 0)).toBe(true);
        }
        expect(g.players.reduce((s, p) => s + p.stack, 0)).toBe(
          stacks.reduce((a, b) => a + b, 0),
        );
        expect(replay(g.config, g.history)).toEqual(g);
      },
    ),
    { seed: 8909, numRuns: 200 },
  );
  let g = newGame({
    seed,
    stacks: [100, 100],
    button: 0,
    smallBlind: 5,
    bigBlind: 10,
    runItTwice: true,
  });
  while (!g.complete)
    g = act(g, { type: legalActions(g).canCheck ? 'check' : 'call' });
  expect(g.runouts).toBeUndefined();
});
