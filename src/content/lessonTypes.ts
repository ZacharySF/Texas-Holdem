import type { Experiment } from '../engine/experiments';
export type LessonId =
  | `${9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25}-${1 | 2}`
  | '5-1'
  | '5-2'
  | '6-1'
  | '6-2'
  | '6-3'
  | '7-1'
  | '7-2'
  | '8-1'
  | '8-2'
  | '0-1'
  | '0-2'
  | '1-1'
  | '1-2'
  | '2-1'
  | '2-2'
  | '3-1'
  | '3-2'
  | '4-1'
  | '4-2';
export interface Lesson {
  id: LessonId;
  chapter: number;
  title: string;
  objectives: readonly string[];
  experiment: Experiment;
  experiments?: readonly Experiment[];
  experimentLabel: string;
  shortcut: string;
  advanced?: boolean;
}
