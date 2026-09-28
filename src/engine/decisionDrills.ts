import { Rng, shuffle } from './rng';
import { deck, type Hand } from './cards';
import { Rational } from './math';
import { breakEven } from './coach';
import { rakedCall } from './inference';
import { gridClass, gridRange } from './rangeGrid';
export type DrillMode = 'call' | 'guess' | 'combo';
export interface DecisionProblem {
  hand: Hand;
  opponent: Hand;
  board: number[];
  pot: number;
  call: number;
  rake: number;
  equity: Rational;
  className: string;
  combos: number;
}
export function decisionProblems(seed: string): DecisionProblem[] {
  const rng = new Rng(seed);
  return Array.from({ length: 5 }, () => {
    const cards = shuffle(deck(), rng),
      hand = cards.slice(0, 2) as unknown as Hand,
      opponent = cards.slice(2, 4) as unknown as Hand,
      board = cards.slice(4, 8),
      pot = 25 * (2 + rng.int(10)),
      call = 25 * (1 + rng.int(4)),
      rake = rng.int(6),
      equity = new Rational(5 + rng.int(91), 100),
      className = gridClass(rng.int(13), rng.int(13));
    return {
      hand,
      opponent,
      board,
      pot,
      call,
      rake,
      equity,
      className,
      combos: gridRange({ [className]: 100 }, [...hand, ...board]).combos
        .length,
    };
  });
}
export function callSolution(q: DecisionProblem) {
  const ev = rakedCall(q.equity, q.pot, q.call, q.rake);
  return {
    ev,
    call: ev.compare(new Rational(0)) >= 0,
    threshold: breakEven(q.pot - q.rake, q.call),
  };
}
export interface Forecast {
  id: string;
  mode: DrillMode;
  date: string;
  prediction: number;
  truth: number;
  outcome: number;
  correct: boolean;
}
export function calibration(forecasts: readonly Forecast[]) {
  return Array.from({ length: 5 }, (_, i) => {
    const data = forecasts.filter(
      (f) => Math.min(4, Math.floor(f.prediction * 5)) === i,
    );
    return {
      low: i / 5,
      high: (i + 1) / 5,
      count: data.length,
      predicted: data.length
        ? data.reduce((a, f) => a + f.prediction, 0) / data.length
        : 0,
      observed: data.length
        ? data.reduce((a, f) => a + f.outcome, 0) / data.length
        : 0,
    };
  });
}
