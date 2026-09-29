import { Rational } from '../engine/math';
import { settlePots } from '../engine/game';
import { breakEven, contestablePot } from '../engine/coach';
import type { PlayerView } from '../engine/game';
import type { TableOptions } from '../engine/payouts';

/** Live, tested source for the coach's displayed arithmetic. */
export function potOddsFacts(
  view: PlayerView,
  equity: number,
  table?: TableOptions,
) {
  const call = view.legal.toCall;
  const pot = contestablePot(view);
  const total = pot + call;
  const threshold = breakEven(pot, call).toNumber();
  const expectedAward = table
    ? table.callPots.reduce((sum, p) => sum + p.heroMean, 0)
    : equity * total;
  return {
    call,
    pot,
    total,
    threshold,
    equity,
    excluded: view.pot - pot,
    expectedAward,
    net: expectedAward - call,
    multiway: Boolean(table),
    pots: table?.callPots ?? [],
    hero: view.seat,
    samples: table?.samples,
  };
}
export type PotOddsFacts = ReturnType<typeof potOddsFacts>;

/** Teaching assumptions, not claims about a particular starting hand. */
export function potOddsExamples() {
  const pot = 150,
    call = 50,
    total = pot + call;
  const trials = 100,
    wins = 30,
    ties = 10,
    losses = trials - wins - ties;
  const winAward = total,
    tieAward = total / 2;
  const awardSum = wins * winAward + ties * tieAward;
  const award = awardSum / trials;
  const contributions = [50, 100, 100];
  const layers = settlePots(
    contributions,
    [false, false, false],
    [3, 2, 1],
    0,
  ).pots;
  const shares = [new Rational(1, 5), new Rational(3, 5)];
  const awards = layers.map((p, i) => p.amount * shares[i].toNumber());
  return {
    pot,
    call,
    total,
    trials,
    wins,
    ties,
    losses,
    winAward,
    tieAward,
    awardSum,
    award,
    equity: new Rational(wins * 2 + ties, trials * 2).toNumber(),
    threshold: breakEven(pot, call).toNumber(),
    net: award - call,
    winNet: winAward - call,
    tieNet: tieAward - call,
    lossNet: -call,
    contributions,
    layers,
    shares: shares.map((p) => p.toNumber()),
    awards,
    sideAward: awards.reduce((a, b) => a + b, 0),
    sideNet: awards.reduce((a, b) => a + b, 0) - call,
  };
}
