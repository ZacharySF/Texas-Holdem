import {
  PROGRESS_KEY,
  decodeProgress,
  emptyProgress,
  recordAttempt,
} from './progress';
import type { LessonId } from '../../content/lessonTypes';
export * from './progress';
export function createProgress() {
  let progress = $state.raw(
    (() => {
      try {
        return decodeProgress(localStorage.getItem(PROGRESS_KEY));
      } catch {
        return emptyProgress();
      }
    })(),
  );
  let storageError = $state(false);
  $effect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      storageError = false;
    } catch {
      storageError = true;
    }
  });
  return {
    get progress() {
      return progress;
    },
    get storageError() {
      return storageError;
    },
    complete: (id: LessonId, answers: readonly boolean[]) => {
      progress = recordAttempt(progress, id, answers);
    },
    skipIntro: () => {
      progress = { ...progress, skippedIntro: true };
    },
  };
}
