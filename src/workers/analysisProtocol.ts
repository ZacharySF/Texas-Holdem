import type { ModelSpec, ModelResult } from '../engine/models';
import type { BankrollInput, BankrollResult } from '../engine/bankroll';
export type AnalysisRequest =
  | { kind: 'model'; model: ModelSpec; seed: string; samples: number }
  | { kind: 'bankroll'; input: BankrollInput };
export type AnalysisResponse =
  | { type: 'error'; message: string }
  | {
      type: 'progress' | 'result';
      kind: 'model';
      value: ModelResult;
      trace: ModelResult[];
    }
  | { type: 'progress' | 'result'; kind: 'bankroll'; value: BankrollResult };
