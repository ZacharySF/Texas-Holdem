// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import OutsRush from './OutsRush';
import { makeOutsRush } from '../../engine/outsRush';
import {
  decodeDrill,
  drillXp,
  recordDrill,
  OUTS_PROGRESS_KEY,
} from './progress';
const seed = '0123456789abcdef0123456789abcdef';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});
function open() {
  render(
    <MemoryRouter initialEntries={[`/arcade?seed=${seed}`]}>
      <OutsRush />
    </MemoryRouter>,
  );
}
it('pauses, resumes, expires once, and waits for the learner to advance', () => {
  vi.useFakeTimers();
  open();
  fireEvent.click(screen.getByRole('button', { name: 'Start Outs Rush' }));
  act(() => vi.advanceTimersByTime(5000));
  fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }));
  act(() => vi.advanceTimersByTime(60000));
  expect(screen.queryByText(/Review the count/)).toBeNull();
  expect(
    (screen.getByRole('button', { name: 'Check outs' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Resume timer' }));
  act(() => vi.advanceTimersByTime(15000));
  expect(screen.getByText(/Review the count/)).toBeDefined();
  expect(screen.getByText('QUESTION 1 OF 5')).toBeDefined();
  act(() => vi.advanceTimersByTime(60000));
  expect(screen.getByText('QUESTION 1 OF 5')).toBeDefined();
  expect(localStorage.getItem(OUTS_PROGRESS_KEY)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
  expect(screen.getByText('QUESTION 2 OF 5')).toBeDefined();
});
it('saves only complete sets, grades once, and replays without duplicate XP', () => {
  vi.useFakeTimers();
  open();
  fireEvent.change(screen.getByLabelText('Time per question'), {
    target: { value: '0' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Start Outs Rush' }));
  act(() => vi.advanceTimersByTime(100000));
  expect(screen.queryByText(/Review the count/)).toBeNull();
  const questions = makeOutsRush(seed);
  for (let run = 0; run < 2; run++) {
    for (let i = 0; i < 5; i++) {
      fireEvent.change(screen.getByLabelText('Number of distinct outs'), {
        target: { value: String(questions[i].outs.length) },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Check outs' }));
      expect(
        screen.getByText(
          new RegExp(`Correct · ${questions[i].outs.length} outs`),
        ),
      ).toBeDefined();
      expect(
        (
          screen.getByRole('button', {
            name: 'Check outs',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      if (i < 4) {
        if (run === 0)
          expect(localStorage.getItem(OUTS_PROGRESS_KEY)).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
      }
    }
    expect(screen.getByText('Set complete · 5 / 5')).toBeDefined();
    expect(drillXp(decodeDrill(localStorage.getItem(OUTS_PROGRESS_KEY)))).toBe(
      25,
    );
    if (run === 0)
      fireEvent.click(screen.getByRole('button', { name: 'Replay this seed' }));
  }
  cleanup();
  open();
  expect(screen.getByText(/Best on this seed: 5 \/ 5/)).toBeDefined();
});
it('sanitizes saved drill scores and preserves the best completed result', () => {
  for (const raw of [
    '{',
    'null',
    '{"version":2}',
    '{"version":1,"best":{"bad":5}}',
  ])
    expect(decodeDrill(raw)).toEqual({ version: 1, best: {} });
  let progress = recordDrill(decodeDrill(null), seed, 4);
  progress = recordDrill(progress, seed, 2);
  expect(progress.best[seed]).toBe(4);
  expect(drillXp(progress)).toBe(20);
  expect(decodeDrill(JSON.stringify(progress))).toEqual(progress);
});
