// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import DecisionDrills from './DecisionDrills';
import {
  decisionProblems,
  callSolution,
  type Forecast,
} from '../../engine/decisionDrills';
import {
  readForecasts,
  saveForecasts,
  forecastXp,
  FORECAST_KEY,
} from './forecastStorage';
const seed = '0123456789abcdef0123456789abcdef';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});
function open(mode: string) {
  render(
    <MemoryRouter initialEntries={[`/arcade/${mode}?seed=${seed}`]}>
      <Routes>
        <Route path="/arcade/:drill" element={<DecisionDrills />} />
      </Routes>
    </MemoryRouter>,
  );
}
it('completes seeded call and combo sets, gives solutions, and does not duplicate XP', () => {
  for (const mode of ['call', 'combo']) {
    open(mode);
    const questions = decisionProblems(seed);
    for (const [i, q] of questions.entries()) {
      if (mode === 'call')
        fireEvent.click(
          screen.getByRole('button', {
            name: callSolution(q).call ? 'Call' : 'Fold',
          }),
        );
      else {
        fireEvent.change(screen.getByLabelText('Combo count'), {
          target: { value: String(q.combos) },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
      }
      expect(screen.getByRole('heading', { name: 'Correct' })).toBeDefined();
      if (i < 4) {
        expect(readForecasts().filter((f) => f.mode === mode)).toHaveLength(0);
        fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
      }
    }
    expect(screen.getByText(/Set complete: 5 \/ 5/)).toBeDefined();
    cleanup();
  }
  const before = readForecasts();
  expect(before).toHaveLength(10);
  expect(forecastXp(before)).toBe(50);
  expect(saveForecasts(before, before)).toEqual(before);
  expect(forecastXp(readForecasts())).toBe(50);
});
it('timer pauses and expires once without advancing or saving a partial set', () => {
  vi.useFakeTimers();
  open('call');
  fireEvent.click(screen.getByRole('checkbox'));
  act(() => vi.advanceTimersByTime(5000));
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  act(() => vi.advanceTimersByTime(30000));
  expect(screen.queryByText('Review the calculation')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
  act(() => vi.advanceTimersByTime(16000));
  expect(screen.getByText('Review the calculation')).toBeDefined();
  expect(screen.getByText('Question 1 of 5')).toBeDefined();
  act(() => vi.advanceTimersByTime(40000));
  expect(screen.getByText('Question 1 of 5')).toBeDefined();
  expect(readForecasts()).toEqual([]);
});
it('sanitizes forecast storage while retaining valid first observations', () => {
  expect(readForecasts()).toEqual([]);
  localStorage.setItem(FORECAST_KEY, 'bad');
  expect(readForecasts()).toEqual([]);
  localStorage.setItem(FORECAST_KEY, '{}');
  expect(readForecasts()).toEqual([]);
  const f: Forecast = {
    id: 'guess:a:0',
    mode: 'guess',
    date: '2026-09-27',
    prediction: 0.6,
    truth: 0.7,
    outcome: 1,
    correct: false,
  };
  saveForecasts([], [f]);
  expect(saveForecasts(readForecasts(), [{ ...f, correct: true }])).toEqual([
    f,
  ]);
  localStorage.setItem(
    FORECAST_KEY,
    JSON.stringify([f, { ...f, prediction: 3 }, null]),
  );
  expect(readForecasts()).toEqual([f]);
});
