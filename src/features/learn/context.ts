import { createContext, useContext } from 'react';
import type { Lesson } from '../../content/lessonTypes';
export interface LessonContextValue {
  lesson: Lesson;
  seed: string;
  onComplete: (answers: readonly boolean[]) => void;
}
export const LessonContext = createContext<LessonContextValue | null>(null);
export function useLesson(): LessonContextValue {
  const context = useContext(LessonContext);
  if (!context) throw new Error('Lesson components require a lesson context.');
  return context;
}
