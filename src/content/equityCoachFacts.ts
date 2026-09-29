import type { EquityResult } from '../engine/equity';
import { Rational } from '../engine/math';
import { deck, parseCards, type Hand } from '../engine/cards';
import { evaluateFast } from '../engine/evaluator';

/** Reconstruct counts and shared-pot credit from the actual Monte Carlo result. */
export function equityCoachFacts(result: EquityResult) {
  if (result.method !== 'monteCarlo' || result.samples < 1)
    throw new Error('The walkthrough needs a nonempty Monte Carlo estimate.');
  const hero = result.players[0];
  const count = (p: typeof hero.equity) =>
    new Rational(BigInt(p.numerator), BigInt(p.denominator)).multiply(
      new Rational(result.samples),
    );
  const wins = count(hero.win),
    ties = count(hero.tie),
    losses = count(hero.loss),
    credit = count(hero.equity);
  return {
    samples: result.samples,
    wins: wins.toNumber(),
    ties: ties.toNumber(),
    losses: losses.toNumber(),
    tieCredit: credit.add(wins.multiply(new Rational(-1))).toNumber(),
    credit: credit.toNumber(),
    equity: hero.equity.value,
    opponents: result.players.length - 1,
    interval: hero.equity.interval,
  };
}
export type EquityCoachFacts = ReturnType<typeof equityCoachFacts>;

export function checkEquityCalculation(answer: string, equity: number) {
  const value = Number(answer);
  if (!answer.trim() || !Number.isFinite(value) || value < 0 || value > 100)
    return 'Enter a percentage from 0 to 100.';
  return Math.abs(value - equity * 100) <= 0.0050001
    ? 'Correct. You counted shared pots as well as wins.'
    : 'Try again: add wins and shared-pot credit, divide by the number of deals, then multiply by 100.';
}

/** A small, fully enumerable example; independent of the user's current deal. */
export function equityByHandExample() {
  const hero = parseCards('As Ad') as unknown as Hand;
  const opponent = parseCards('Ks Kh') as unknown as Hand;
  const board = parseCards('2c 3d 7h 9s');
  const known = [...hero, ...opponent, ...board];
  const rivers = deck()
    .filter((card) => !known.includes(card))
    .map((card) => {
      const a = evaluateFast([...hero, ...board, card]);
      const b = evaluateFast([...opponent, ...board, card]);
      return { card, outcome: a > b ? 'win' : a < b ? 'loss' : 'tie' };
    });
  const wins = rivers.filter((r) => r.outcome === 'win').length;
  const ties = rivers.filter((r) => r.outcome === 'tie').length;
  const losses = rivers.length - wins - ties;
  const value = new Rational(2 * wins + ties, 2 * rivers.length);
  return {
    hero,
    opponent,
    board,
    known: known.length,
    deck: deck().length,
    rivers,
    wins,
    ties,
    losses,
    value,
  };
}
