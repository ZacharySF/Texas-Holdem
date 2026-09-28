import { useEffect, useState } from 'react';
import { learningFacts } from '../../content/facts';
import { lessons } from '../../content/lessons';
import type { LessonId } from '../../content/lessonTypes';
import { Rational } from '../../engine/math';
export const PROGRESS_KEY = 'holdem-learn-v1';
export interface Result {
  bestCorrect: number;
  total: 5;
  attempts: number;
}
export interface Progress {
  version: 1;
  skippedIntro: boolean;
  results: Partial<Record<LessonId, Result>>;
}
export const emptyProgress = (): Progress => ({
  version: 1,
  skippedIntro: false,
  results: {},
});
export function decodeProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      value.version !== 1 ||
      !('results' in value) ||
      !value.results ||
      typeof value.results !== 'object'
    )
      return emptyProgress();
    const clean = emptyProgress();
    clean.skippedIntro = 'skippedIntro' in value && value.skippedIntro === true;
    for (const lesson of lessons) {
      const record = (value.results as Record<string, unknown>)[lesson.id];
      if (!record || typeof record !== 'object') continue;
      const r = record as Record<string, unknown>;
      if (
        r.total === 5 &&
        typeof r.bestCorrect === 'number' &&
        Number.isInteger(r.bestCorrect) &&
        r.bestCorrect >= 0 &&
        r.bestCorrect <= 5 &&
        typeof r.attempts === 'number' &&
        Number.isSafeInteger(r.attempts) &&
        r.attempts > 0
      )
        clean.results[lesson.id] = {
          bestCorrect: r.bestCorrect,
          total: 5,
          attempts: r.attempts,
        };
    }
    return clean;
  } catch {
    return emptyProgress();
  }
}
export function mastered(result: Result | undefined): boolean {
  return (
    !!result &&
    new Rational(result.bestCorrect, result.total).compare(
      learningFacts.mastery(),
    ) >= 0
  );
}
export function recordAttempt(
  progress: Progress,
  id: LessonId,
  answers: readonly boolean[],
): Progress {
  if (answers.length !== 5 || answers.some((a) => typeof a !== 'boolean'))
    throw new Error('Finish all five problems first.');
  const previous = progress.results[id],
    correct = answers.filter(Boolean).length;
  return {
    ...progress,
    results: {
      ...progress.results,
      [id]: {
        bestCorrect: Math.max(previous?.bestCorrect ?? 0, correct),
        total: 5,
        attempts: (previous?.attempts ?? 0) + 1,
      },
    },
  };
}
export function chapterUnlocked(chapter: number, progress: Progress): boolean {
  return lessons
    .filter(
      (l) => l.chapter < chapter && !(l.chapter === 0 && progress.skippedIntro),
    )
    .every((l) => mastered(progress.results[l.id]));
}
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => {
    try {
      return decodeProgress(localStorage.getItem(PROGRESS_KEY));
    } catch {
      return emptyProgress();
    }
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [progress]);
  return {
    progress,
    storageError,
    complete: (id: LessonId, answers: readonly boolean[]) =>
      setProgress((p) => recordAttempt(p, id, answers)),
    skipIntro: () => setProgress((p) => ({ ...p, skippedIntro: true })),
  };
}
