// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/svelte';
import { lessons } from '../../content/lessons';
import LessonTestHost from './LessonTestHost.svelte';
import PracticeSet from './PracticeSet.svelte';
import { makePractice } from './practice';
afterEach(cleanup);
it('keeps solutions hidden until each answer, grades once, and saves only a full set', async () => {
  const lesson = lessons.find((l) => l.id === '3-1')!,
    seed = '0123456789abcdef0123456789abcdef',
    completed: boolean[][] = [];
  render(LessonTestHost, {
    value: {
      lesson,
      seed,
      onComplete: (answers: readonly boolean[]) => completed.push([...answers]),
    },
    content: PracticeSet,
  });
  expect(
    screen.queryByRole('region', { name: 'Worked derivation' }),
  ).toBeNull();
  const problems = makePractice(lesson.id, seed);
  for (let i = 0; i < 5; i++) {
    await fireEvent.input(screen.getByLabelText('Your answer'), {
      target: { value: problems[i].answer.toString() },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Correct.')).toBeDefined();
    expect(
      (
        screen.getByRole('button', {
          name: 'Check answer',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    if (i < 4) {
      expect(completed).toHaveLength(0);
      await fireEvent.click(
        screen.getByRole('button', { name: 'Next question' }),
      );
    }
  }
  expect(completed).toEqual([[true, true, true, true, true]]);
  expect(screen.getByText('Lesson mastered')).toBeDefined();
});
