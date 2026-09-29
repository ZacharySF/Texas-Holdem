import { loadHands } from '../features/play/storage';
import { replay } from '../engine/game';
import { handClass } from '../engine/rangeGrid';
import { chartClasses } from '../content/handChartFacts';
/** Only IDs already validated by the existing stats worker are included. The pure replay makes an isolated historical deal. */
export async function playedClasses(ids: readonly string[]) {
  const valid = new Set(ids),
    counts = chartClasses.map(() => 0);
  for (const hand of await loadHands()) {
    if (!valid.has(hand.id)) continue;
    try {
      const historical = replay(hand.config, hand.actions, 0);
      const index = chartClasses.indexOf(handClass(historical.players[0].hand));
      if (index >= 0) counts[index]++;
    } catch {
      /* Invalid historical data contributes no invented class. */
    }
  }
  return counts.some((n) => n > 0) ? counts : undefined;
}
