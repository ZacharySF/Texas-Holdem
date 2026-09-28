/// <reference lib="webworker" />
import { equity } from '../engine/equity';
import { deck, type Hand } from '../engine/cards';
import { evaluateFast } from '../engine/evaluator';
import { Rng } from '../engine/rng';
const scope = self as DedicatedWorkerGlobalScope;
export interface GuessRequest {
  hand: Hand;
  opponent: Hand;
  board: number[];
  seed: string;
}
export type GuessResponse =
  | {
      type: 'result';
      equity: ReturnType<typeof equity>;
      outcome: number;
      river: number;
    }
  | { type: 'error'; message: string };
scope.onmessage = async (e: MessageEvent<GuessRequest>) => {
  try {
    const q = e.data;
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(
        `${q.seed}:forecast:${q.hand.join(',')}:${q.opponent.join(',')}:${q.board.join(',')}`,
      ),
    );
    const forecastSeed = [...new Uint8Array(digest)]
      .slice(0, 16)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const result = equity({
        players: [q.hand, q.opponent],
        board: q.board,
        method: 'exact',
        samples: 1,
        seed: q.seed,
      }),
      rng = new Rng(
        /^0+$/.test(forecastSeed)
          ? '00000000000000000000000000000001'
          : forecastSeed,
      ),
      pool = deck().filter(
        (c) => ![...q.hand, ...q.opponent, ...q.board].includes(c),
      ),
      river = pool[rng.int(pool.length)],
      a = evaluateFast([...q.hand, ...q.board, river]),
      b = evaluateFast([...q.opponent, ...q.board, river]);
    const outcome = a === b ? rng.int(2) : Number(a > b);
    scope.postMessage({
      type: 'result',
      equity: result,
      outcome,
      river,
    } satisfies GuessResponse);
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Drill failed.',
    } satisfies GuessResponse);
  }
};
