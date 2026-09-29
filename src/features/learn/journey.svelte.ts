import { JOURNEY_KEY, decodeJourney, emptyJourney } from './journey';
import type { LessonId } from '../../content/lessonTypes';
export * from './journey';
export function createJourney() {
  let journey = $state.raw(
    (() => {
      try {
        return decodeJourney(localStorage.getItem(JOURNEY_KEY));
      } catch {
        return emptyJourney();
      }
    })(),
  );
  let storageError = $state(false);
  $effect(() => {
    try {
      localStorage.setItem(JOURNEY_KEY, JSON.stringify(journey));
      storageError = false;
    } catch {
      storageError = true;
    }
  });
  return {
    get journey() {
      return journey;
    },
    get storageError() {
      return storageError;
    },
    visit: (id: LessonId) => {
      if (journey.current !== id) journey = { ...journey, current: id };
    },
    markRead: (id: LessonId) => {
      if (!journey.read.includes(id))
        journey = { ...journey, read: [...journey.read, id] };
    },
    markPlayed: (id: LessonId) => {
      if (!journey.played.includes(id))
        journey = { ...journey, played: [...journey.played, id] };
    },
  };
}
