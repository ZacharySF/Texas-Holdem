// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { lessons } from '../../content/lessons';
import { LessonContext } from './context';
import { PracticeSet } from './PracticeSet';
import { makePractice } from './practice';
afterEach(cleanup);
it('keeps solutions hidden until each answer, grades once, and saves only a full set', () => {
  const lesson = lessons.find((l) => l.id === '3-1')!,
    seed = '0123456789abcdef0123456789abcdef',
    completed: boolean[][] = [];
  render(
    <LessonContext.Provider
      value={{
        lesson,
        seed,
        onComplete: (answers) => completed.push([...answers]),
      }}
    >
      <PracticeSet />
    </LessonContext.Provider>,
  );
  expect(
    screen.queryByRole('region', { name: 'Worked derivation' }),
  ).toBeNull();
  const problems = makePractice(lesson.id, seed);
  for (let i = 0; i < 5; i++) {
    fireEvent.change(screen.getByLabelText('Your answer'), {
      target: { value: problems[i].answer.toString() },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
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
      fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
    }
  }
  expect(completed).toEqual([[true, true, true, true, true]]);
  expect(screen.getByText('Lesson mastered')).toBeDefined();
});
