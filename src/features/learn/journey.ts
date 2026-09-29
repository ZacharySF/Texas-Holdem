import { lessonById, lessons } from '../../content/lessons';
import type { LessonId } from '../../content/lessonTypes';
export const JOURNEY_KEY = 'holdem-course-journey-v1';
export interface Journey {
  version: 1;
  current: LessonId;
  read: LessonId[];
  played: LessonId[];
}
export const emptyJourney = (): Journey => ({
  version: 1,
  current: '1-1',
  read: [],
  played: [],
});
export function decodeJourney(raw: string | null): Journey {
  try {
    const v: unknown = JSON.parse(raw ?? 'null');
    if (!v || typeof v !== 'object' || !('version' in v) || v.version !== 1)
      return emptyJourney();
    const data = v as Record<string, unknown>;
    const ids = (value: unknown) =>
      Array.isArray(value)
        ? lessons.filter((l) => value.includes(l.id)).map((l) => l.id)
        : [];
    return {
      version: 1,
      current:
        typeof data.current === 'string'
          ? (lessonById(data.current)?.id ?? '1-1')
          : '1-1',
      read: ids(data.read),
      played: ids(data.played),
    };
  } catch {
    return emptyJourney();
  }
}

export function lessonGameLink(id: LessonId, seed: string) {
  return `/play?${new URLSearchParams({ lesson: id, lessonSeed: seed })}`;
}
export function lessonReturnLink(id: LessonId, seed: string | null) {
  return `/learn/${id}${seed ? `?${new URLSearchParams({ seed })}` : ''}`;
}
export function practiceFocus(chapter: number): string {
  const tasks = [
    'Follow one hand. Notice when you can check, when you must call to stay in, and when the shared cards appear.',
    'Before a new shared card appears, name an event: “the next card is a heart,” for example. Notice which visible cards can no longer be dealt. You do not need to calculate a number yet.',
    'Watch cards leave the deck. Say how the first card changes what can appear next.',
    'Look at your two hole cards. Would reversing their order change the poker hand?',
    'Describe a result you are waiting for. Try saying its opposite, and notice when two descriptions could refer to the same card.',
    'Before the next card, identify the cards you can see. The coach must reason without seeing the bots’ cards.',
    'Name your best made hand after the flop. Watch whether its category changes on the turn or river.',
    'Look at the flop: are any ranks repeated? Are the cards the same suit? Notice how the board connects with your hand.',
    'Name cards that might improve your hand. Improving does not always mean winning; compare the revealed hands afterward.',
  ];
  return (
    tasks[chapter] ??
    'Play a hand and notice one decision you found difficult. Afterward, compare it with the lesson. This is a normal poker hand, so the lesson’s exact scenario may not occur.'
  );
}
