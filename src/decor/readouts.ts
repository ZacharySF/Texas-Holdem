import { parseProfile, PROFILE_KEY } from '../features/play/storage';
import {
  decodeProgress,
  mastered,
  PROGRESS_KEY,
} from '../features/learn/progress';
import { drillXp, readDrill } from '../features/arcade/progress';
import { forecastXp, readForecasts } from '../features/arcade/forecastStorage';
function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
/** Read-only snapshot using the application's existing parsers and XP selectors. */
export function readouts() {
  const profile = parseProfile(read(PROFILE_KEY));
  const lessons = Object.values(
    decodeProgress(read(PROGRESS_KEY)).results,
  ).filter(mastered).length;
  return {
    chips: profile.bankroll,
    hands: profile.hands,
    lessons,
    xp:
      profile.xp +
      lessons * 20 +
      drillXp(readDrill()) +
      forecastXp(readForecasts()),
  };
}
