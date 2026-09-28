/// <reference lib="webworker" />
import { modelSteps } from '../engine/models';
import { bankrollSteps } from '../engine/bankroll';
import type { AnalysisRequest, AnalysisResponse } from './analysisProtocol';
const scope = self as DedicatedWorkerGlobalScope;
const send = (message: AnalysisResponse) => scope.postMessage(message);
scope.onmessage = async (event: MessageEvent<AnalysisRequest>) => {
  try {
    const request = event.data;
    let last = performance.now();
    if (request.kind === 'model') {
      const iterator = modelSteps(request.model, request.seed, request.samples);
      let trace = [];
      while (true) {
        const next = iterator.next();
        trace.push(next.value);
        if (next.done) {
          send({ type: 'result', kind: 'model', value: next.value, trace });
          break;
        }
        if (performance.now() - last > 50) {
          send({ type: 'progress', kind: 'model', value: next.value, trace });
          trace = [];
          await new Promise<void>((r) => setTimeout(r, 0));
          last = performance.now();
        }
      }
    } else {
      const iterator = bankrollSteps(request.input);
      while (true) {
        const next = iterator.next();
        if (next.done) {
          send({ type: 'result', kind: 'bankroll', value: next.value });
          break;
        }
        if (performance.now() - last > 50) {
          send({ type: 'progress', kind: 'bankroll', value: next.value });
          await new Promise<void>((r) => setTimeout(r, 0));
          last = performance.now();
        }
      }
    }
  } catch (e) {
    send({
      type: 'error',
      message: e instanceof Error ? e.message : 'Analysis failed.',
    });
  }
};
