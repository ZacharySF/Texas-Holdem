import { assertCards, deck, type Hand } from './cards';
import { categoryOf, evaluateFast } from './evaluator';
import { nCr, Rational } from './math';
import type { PlayerView } from './game';
function chips(...values: number[]) {
  if (values.some((n) => !Number.isSafeInteger(n) || n < 0))
    throw new Error('Use nonnegative integer chip amounts.');
}
export function breakEven(pot: number, call: number): Rational {
  chips(pot, call);
  return new Rational(call, pot + call || 1);
}
export function callEV(equity: Rational, pot: number, call: number): Rational {
  chips(pot, call);
  return equity.multiply(new Rational(pot + call)).add(new Rational(-call));
}
export function raiseEV(
  equity: Rational,
  foldChance: Rational,
  pot: number,
  risk: number,
  opponentCall: number,
): Rational {
  chips(pot, risk, opponentCall);
  if (foldChance.toNumber() < 0 || foldChance.toNumber() > 1)
    throw new Error('Fold probability must be in [0,1].');
  return foldChance
    .multiply(new Rational(pot))
    .add(
      new Rational(
        foldChance.denominator - foldChance.numerator,
        foldChance.denominator,
      ).multiply(
        equity
          .multiply(new Rational(pot + risk + opponentCall))
          .add(new Rational(-risk)),
      ),
    );
}
export function improvementOuts(hand: Hand, board: readonly number[]) {
  assertCards([...hand, ...board]);
  if (board.length !== 3 && board.length !== 4) return null;
  const known = [...hand, ...board],
    current = categoryOf(evaluateFast(known)),
    unseen = deck().filter((c) => !known.includes(c)),
    outs = unseen.filter(
      (c) => categoryOf(evaluateFast([...known, c])) > current,
    ),
    draws = 5 - board.length;
  return {
    cards: outs,
    unseen: unseen.length,
    next: new Rational(outs.length, unseen.length),
    byRiver: new Rational(
      nCr(unseen.length, draws) - nCr(unseen.length - outs.length, draws),
      nCr(unseen.length, draws),
    ),
  };
}
/** An opponent cannot win chips they have wagered beyond the hero's entire stack. */
export function contestablePot(view: PlayerView): number {
  const hero = view.players[view.seat];
  return view.players.reduce(
    (sum, p) => sum + Math.min(p.contributed, hero.contributed + hero.stack),
    0,
  );
}
export function directOptions(
  view: PlayerView,
  equity: Rational,
  raiseTo: number,
  foldChance = new Rational(0),
) {
  const player = view.players[view.seat],
    opponent = view.players.find((_, i) => i !== view.seat)!;
  const pot = contestablePot(view);
  const call = callEV(equity, pot, view.legal.toCall),
    risk = Math.min(
      Math.max(0, raiseTo - player.round),
      view.legal.toCall + opponent.stack,
    ),
    opponentCall = Math.min(
      opponent.stack,
      Math.max(0, raiseTo - opponent.round),
    );
  return {
    fold: 0,
    check: equity.toNumber() * pot,
    call: call.toNumber(),
    raise: raiseEV(equity, foldChance, pot, risk, opponentCall).toNumber(),
    breakEven: breakEven(pot, view.legal.toCall),
    contestablePot: pot,
    uncallable: view.pot - pot,
  };
}
