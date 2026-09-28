/// <reference lib="webworker" />
import {
  equitySteps,
  planEquity,
  type EquityInput,
  type EquityResult,
} from '../engine/equity';
import type { WorkerRequest, WorkerResponse } from './protocol';
const scope = self as DedicatedWorkerGlobalScope;
const send = (message: WorkerResponse): void => scope.postMessage(message);
async function run(
  input: EquityInput,
  reference: boolean,
): Promise<{ result: EquityResult; trace: EquityResult[] }> {
  const sampled = planEquity(input).method === 'monteCarlo';
  // Preserve the convergence path even when the whole run finishes before a progress message.
  const batch = sampled ? Math.max(32, Math.ceil(input.samples / 250)) : 256;
  const steps = equitySteps(input, batch);
  let last = performance.now();
  let trace: EquityResult[] = [];
  while (true) {
    const next = steps.next();
    if (sampled) trace.push(next.value);
    if (next.done) return { result: next.value, trace };
    if (performance.now() - last >= 50) {
      if (!reference) send({ type: 'progress', result: next.value, trace });
      trace = [];
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      last = performance.now();
    }
  }
}
scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    const input = event.data.input;
    const plan = planEquity(input);
    if (plan.method === 'monteCarlo' && plan.exactFeasible)
      send({
        type: 'reference',
        result: (await run({ ...input, method: 'exact' }, true)).result,
      });
    send({ type: 'result', ...(await run(input, false)) });
  } catch (error) {
    send({
      type: 'error',
      message: error instanceof Error ? error.message : 'Simulation failed.',
    });
  }
};
