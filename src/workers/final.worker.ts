/// <reference lib="webworker" />
import { finiteSteps, tournamentSteps } from '../engine/finalExperiments';
import {
  shuffleSteps,
  streakSteps,
  type ShuffleMethod,
} from '../engine/shuffleLab';
import { trainKuhn } from '../engine/kuhn';
import { runoutComparison } from '../engine/runTwice';
import { scalar } from '../engine/sizingExperiment';
import type { Hand } from '../engine/cards';
export type FinalRequest =
  | {
      type: 'icm';
      stacks: number[];
      prizes: number[];
      seed: string;
      samples: number;
    }
  | {
      type: 'finite';
      outcomes: number[];
      weights: number[];
      seed: string;
      samples: number;
    }
  | {
      type: 'streak';
      p: number;
      d: number;
      length: number;
      trials: number;
      seed: string;
      samples: number;
    }
  | { type: 'shuffle'; method: ShuffleMethod; seed: string; samples: number }
  | { type: 'cfr'; iterations: number }
  | {
      type: 'runouts';
      players: Hand[];
      board: number[];
      seed: string;
      samples: number;
    }
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
type End<G> = G extends Generator<unknown, infer R> ? R : never;
export type FinalResult =
  | { kind: 'icm'; result: End<ReturnType<typeof tournamentSteps>> }
  | { kind: 'shuffle'; result: End<ReturnType<typeof shuffleSteps>> }
  | { kind: 'cfr'; result: End<ReturnType<typeof trainKuhn>> }
  | { kind: 'runouts'; result: End<ReturnType<typeof runoutComparison>> }
  | {
      kind: 'scalar';
      result: {
        samples: number;
        mean: number;
        interval: readonly [number, number];
        exact: number;
      };
    };
export type FinalResponse =
  | { type: 'progress' | 'result'; data: FinalResult; trace: FinalResult[] }
  | { type: 'error'; message: string };
const scope = self as DedicatedWorkerGlobalScope;
scope.onmessage = async (e: MessageEvent<FinalRequest>) => {
  try {
    const q = e.data;
    async function run<T>(g: Generator<T, T>, wrap: (r: T) => FinalResult) {
      let last = performance.now();
      let trace: FinalResult[] = [];
      while (true) {
        const n = g.next();
        if (n.done) {
          scope.postMessage({
            type: 'result',
            data: wrap(n.value),
            trace: [...trace, wrap(n.value)],
          } satisfies FinalResponse);
          return;
        }
        trace.push(wrap(n.value));
        if (performance.now() - last >= 50) {
          scope.postMessage({
            type: 'progress',
            data: wrap(n.value),
            trace,
          } satisfies FinalResponse);
          await new Promise<void>((r) => setTimeout(r, 0));
          last = performance.now();
          trace = [];
        }
      }
    }
    if (q.type === 'icm')
      await run(
        tournamentSteps(q.stacks, q.prizes, q.seed, q.samples),
        (result) => ({ kind: 'icm', result }),
      );
    else if (q.type === 'finite')
      await run(
        finiteSteps(q.outcomes, q.weights, q.seed, q.samples),
        (result) => ({ kind: 'scalar', result }),
      );
    else if (q.type === 'streak')
      await run(
        streakSteps(q.p, q.d, q.length, q.trials, q.seed, q.samples),
        (result) => ({ kind: 'scalar', result }),
      );
    else if (q.type === 'shuffle')
      await run(shuffleSteps(q.method, q.seed, q.samples), (result) => ({
        kind: 'shuffle',
        result,
      }));
    else if (q.type === 'cfr')
      await run(trainKuhn(q.iterations), (result) => ({ kind: 'cfr', result }));
    else if (q.type === 'runouts')
      await run(
        runoutComparison(q.players, q.board, q.seed, q.samples),
        (result) => ({ kind: 'runouts', result }),
      );
    else await run(scalar(q), (result) => ({ kind: 'scalar', result }));
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Experiment failed.',
    } satisfies FinalResponse);
  }
};
