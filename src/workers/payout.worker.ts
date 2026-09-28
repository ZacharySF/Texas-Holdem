/// <reference lib="webworker" />
import {
  payoutSteps,
  type PayoutInput,
  type PayoutResult,
} from '../engine/payouts';
export type PayoutResponse =
  | { type: 'result' | 'progress'; result: PayoutResult }
  | { type: 'error'; message: string };
const scope = self as DedicatedWorkerGlobalScope;
scope.onmessage = async (e: MessageEvent<PayoutInput>) => {
  try {
    const steps = payoutSteps(e.data);
    let last = performance.now();
    while (true) {
      const n = steps.next();
      if (n.done) {
        scope.postMessage({
          type: 'result',
          result: n.value,
        } satisfies PayoutResponse);
        return;
      }
      if (performance.now() - last > 50) {
        scope.postMessage({
          type: 'progress',
          result: n.value,
        } satisfies PayoutResponse);
        await new Promise<void>((r) => setTimeout(r, 0));
        last = performance.now();
      }
    }
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message:
        error instanceof Error ? error.message : 'Payout experiment failed.',
    } satisfies PayoutResponse);
  }
};
