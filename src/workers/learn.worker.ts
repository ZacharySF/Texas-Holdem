/// <reference lib="webworker" />
import { simulateExperiment } from '../engine/experiments';
import type { ExperimentSnapshot } from '../engine/experiments';
import type { LearnRequest, LearnResponse } from './learnProtocol';
const scope = self as DedicatedWorkerGlobalScope;
const send = (message: LearnResponse): void => scope.postMessage(message);
scope.onmessage = async (event: MessageEvent<LearnRequest>) => {
  try {
    const { event: experiment, seed, samples } = event.data;
    const steps = simulateExperiment(experiment, seed, samples);
    let trace: ExperimentSnapshot[] = [],
      last = performance.now();
    while (true) {
      const next = steps.next();
      trace.push(next.value);
      if (next.done) {
        send({ type: 'result', trace });
        return;
      }
      if (performance.now() - last >= 50) {
        send({ type: 'progress', trace });
        trace = [];
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        last = performance.now();
      }
    }
  } catch (error) {
    send({
      type: 'error',
      message: error instanceof Error ? error.message : 'Experiment failed.',
    });
  }
};
