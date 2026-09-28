import type { EquityInput, EquityResult } from '../engine/equity';
export type WorkerRequest = { type: 'run'; input: EquityInput };
export type WorkerResponse =
  | {
      type: 'progress' | 'result' | 'reference';
      result: EquityResult;
      trace?: EquityResult[];
    }
  | { type: 'error'; message: string };
