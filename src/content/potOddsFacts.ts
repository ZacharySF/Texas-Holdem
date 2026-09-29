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
  };
}
export type PotOddsFacts = ReturnType<typeof potOddsFacts>;
