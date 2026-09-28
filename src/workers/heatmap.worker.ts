/// <reference lib="webworker" />
import { equity, planEquity, type EquityResult } from '../engine/equity';
import { gridClass, gridRange, type RangeWeights } from '../engine/rangeGrid';
import { Rng } from '../engine/rng';
export interface HeatRequest {
  weights: RangeWeights;
  versus: 'random' | 'range';
  board: number[];
  dead: number[];
  samples: number;
  seed: string;
}
export interface HeatCell {
  label: string;
  result: EquityResult;
  reference?: EquityResult;
}
export type HeatResponse =
  | { type: 'cell'; cell: HeatCell }
  | { type: 'skipped'; label: string; message: string }
  | { type: 'done' }
  | { type: 'error'; message: string };
const scope = self as DedicatedWorkerGlobalScope;
scope.onmessage = async (e: MessageEvent<HeatRequest>) => {
  try {
    const input = e.data,
      rng = new Rng(input.seed);
    for (let i = 0; i < 169; i++) {
      const label = gridClass(Math.floor(i / 13), i % 13),
        hero = gridRange({ [label]: 100 }, [...input.board, ...input.dead]);
      if (!hero.combos.length) continue;
      const seed = Array.from({ length: 4 }, () =>
        rng.nextUint32().toString(16).padStart(8, '0'),
      ).join('');
      const request = {
        players: [
          hero,
          input.versus === 'random'
            ? ('random' as const)
            : gridRange(input.weights),
        ],
        board: input.board,
        dead: input.dead,
        seed,
        samples: input.samples,
        method: 'monteCarlo' as const,
      };
      try {
        const result = equity(request),
          reference = planEquity(request).exactFeasible
            ? equity({ ...request, method: 'exact' })
            : undefined;
        scope.postMessage({
          type: 'cell',
          cell: { label, result, reference },
        } satisfies HeatResponse);
      } catch (error) {
        scope.postMessage({
          type: 'skipped',
          label,
          message:
            error instanceof Error ? error.message : 'No compatible deal.',
        } satisfies HeatResponse);
      }
      await new Promise<void>((r) => setTimeout(r, 0));
    }
    scope.postMessage({ type: 'done' } satisfies HeatResponse);
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Heatmap failed.',
    } satisfies HeatResponse);
  }
};
