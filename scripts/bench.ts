import { payouts } from '../src/engine/payouts';
import { simulateExperiment } from '../src/engine/experiments';
import { newGame, playerView } from '../src/engine/game';
import { chooseBot, estimatedRange } from '../src/engine/bots';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { deck, parseCards, type Hand } from '../src/engine/cards';
import { evaluateFast } from '../src/engine/evaluator';
import { equity } from '../src/engine/equity';
import { Rng, shuffle } from '../src/engine/rng';
const seed = '0123456789abcdef0123456789abcdef';
const rng = new Rng(seed);
const hands = Array.from({ length: 10000 }, () =>
  shuffle(deck(), rng).slice(0, 7),
);
let checksum = 0;
for (const h of hands) checksum += evaluateFast(h);
let start = performance.now();
const evaluations = 1000000;
for (let i = 0; i < evaluations; i++)
  checksum += evaluateFast(hands[i % hands.length]);
const evalRate = evaluations / ((performance.now() - start) / 1000);
start = performance.now();
const result = equity({
  players: [parseCards('As Ah') as unknown as Hand, 'random'],
  board: [],
  method: 'monteCarlo',
  samples: 100000,
  seed,
});
const sampleRate = result.samples / ((performance.now() - start) / 1000);
const view = playerView(
  newGame({
    seed,
    stacks: [2000, 2000],
    button: 0,
    smallBlind: 5,
    bigBlind: 10,
  }),
  0,
);
const range = estimatedRange(view, 'tight-passive');
start = performance.now();
const weighted = equity({
  players: [view.hand, range],
  board: [],
  method: 'monteCarlo',
  samples: 10000,
  seed,
});
const rangeRate = weighted.samples / ((performance.now() - start) / 1000);
start = performance.now();
const experiment = simulateExperiment(
  { kind: 'courseDraw', topic: 'category', size: 7, category: 1 },
  seed,
  100000,
);
let trial = experiment.next();
while (!trial.done) trial = experiment.next();
const lessonRate = trial.value.samples / ((performance.now() - start) / 1000);
start = performance.now();
const multiway = payouts({
  players: [view.hand, 'random', 'random', 'random', 'random', 'random'],
  board: [],
  contributions: [50, 100, 200, 200, 200, 200],
  folded: [false, false, false, false, false, false],
  button: 0,
  seed,
  samples: 10000,
  method: 'monteCarlo',
});
const payoutRate = multiway.samples / ((performance.now() - start) / 1000);
const botTimings = [2, 6].map((seats) => {
  const botView = playerView(
    newGame({
      seed,
      stacks: Array(seats).fill(1000),
      button: 0,
      smallBlind: 5,
      bigBlind: 10,
    }),
    seats === 2 ? 0 : 3,
  );
  chooseBot(botView, 'equity-driven', seed);
  const started = performance.now();
  for (let i = 0; i < 20; i++) chooseBot(botView, 'equity-driven', seed);
  return Number(((performance.now() - started) / 20).toFixed(2));
});
console.log(
  JSON.stringify(
    {
      date: new Date().toISOString(),
      node: process.version,
      cpu: os.cpus()[0].model,
      logicalCpus: os.cpus().length,
      memoryGiB: +(os.totalmem() / 2 ** 30).toFixed(1),
      platform: `${os.platform()} ${os.release()} ${os.arch()}`,
      evaluationsPerSecond: Math.round(evalRate),
      monteCarloSamplesPerSecond: Math.round(sampleRate),
      weightedRangeSamplesPerSecond: Math.round(rangeRate),
      lessonTrialsPerSecond: Math.round(lessonRate),
      sixSeatPayoutsPerSecond: Math.round(payoutRate),
      botHeadsUpMs: botTimings[0],
      botSixSeatMs: botTimings[1],
      seed,
      checksum,
    },
    null,
    2,
  ),
);
