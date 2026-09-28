import type { Experiment, ExperimentSnapshot } from '../engine/experiments';
export interface LearnRequest {
  event: Experiment;
  seed: string;
  samples: number;
}
export type LearnResponse =
  | { type: 'progress' | 'result'; trace: ExperimentSnapshot[] }
  | { type: 'error'; message: string };
