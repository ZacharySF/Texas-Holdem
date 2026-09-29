import { getContext, setContext } from 'svelte';
import type { Lesson } from '../../content/lessonTypes';
export interface LessonContextValue {
  lesson: Lesson;
  seed: string;
  onComplete: (answers: readonly boolean[]) => void;
}
export const LESSON_CONTEXT = Symbol('lesson');
export function setLesson(value: LessonContextValue) {
  setContext(LESSON_CONTEXT, value);
}
export function getLesson(): LessonContextValue {
  const context = getContext<LessonContextValue>(LESSON_CONTEXT);
  if (!context) throw new Error('Lesson components require a lesson context.');
  return context;
}
