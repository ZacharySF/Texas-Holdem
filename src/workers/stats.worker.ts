/// <reference lib="webworker" />
import {
  handResult,
  summarizeResults,
  conceptGrades,
  type LedgerHand,
  type HandResult,
} from '../engine/ledger';
export type StatsResponse =
  | {
      type: 'result';
      summary: ReturnType<typeof summarizeResults>;
      grades: ReturnType<typeof conceptGrades>;
      results: HandResult[];
    }
  | { type: 'progress'; completed: number; total: number }
  | { type: 'error'; message: string };
const scope = self as DedicatedWorkerGlobalScope;
scope.onmessage = async (e: MessageEvent<LedgerHand[]>) => {
  try {
    const hands = [...e.data].sort((a, b) => a.date.localeCompare(b.date)),
      results: HandResult[] = [];
    for (const hand of hands) {
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`${hand.config.seed}:stats`),
      );
      const seed = [...new Uint8Array(digest)]
        .slice(0, 16)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      results.push(
        handResult(
          hand,
          5000,
          /^0+$/.test(seed) ? '00000000000000000000000000000001' : seed,
        ),
      );
      scope.postMessage({
        type: 'progress',
        completed: results.length,
        total: hands.length,
      } satisfies StatsResponse);
      await new Promise<void>((r) => setTimeout(r, 0));
    }
    scope.postMessage({
      type: 'result',
      summary: summarizeResults(results),
      grades: conceptGrades(hands),
      results,
    } satisfies StatsResponse);
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message:
        error instanceof Error ? error.message : 'History analysis failed.',
    } satisfies StatsResponse);
  }
};
