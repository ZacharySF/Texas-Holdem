/// <reference lib="webworker" />
import {
  chartClasses,
  handChartCell,
  type HandChartCell,
  type HandChartSettings,
} from '../content/handChartFacts';
import { Rng } from '../engine/rng';
export type HandChartResponse =
  | { type: 'cell'; cell: HandChartCell }
  | { type: 'done' }
  | { type: 'error'; message: string };
const scope = self as DedicatedWorkerGlobalScope;
scope.onmessage = (event: MessageEvent<HandChartSettings>) => {
  try {
    const rng = new Rng(event.data.seed);
    for (const label of chartClasses) {
      const seed = Array.from({ length: 4 }, () =>
        rng.nextUint32().toString(16).padStart(8, '0'),
      ).join('');
      scope.postMessage({
        type: 'cell',
        cell: handChartCell(label, { ...event.data, seed }),
      } satisfies HandChartResponse);
    }
    scope.postMessage({ type: 'done' } satisfies HandChartResponse);
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message:
        error instanceof Error ? error.message : 'Chart calculation failed.',
    } satisfies HandChartResponse);
  }
};
