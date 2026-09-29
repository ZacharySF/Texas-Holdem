/// <reference lib="webworker" />
import { tableOptions } from '../engine/payouts';
import { equity, planEquity } from '../engine/equity';
import { chooseBot, estimatedRange } from '../engine/bots';
import type { PlayRequest, PlayResponse } from './playProtocol';
const scope = self as DedicatedWorkerGlobalScope;
scope.onmessage = (event: MessageEvent<PlayRequest>) => {
  try {
    const { view, persona, seed, bot, raiseTo } = event.data;
    const input = {
      players: [
        view.hand,
        ...view.players.flatMap((p, i) =>
          i === view.seat || p.folded ? [] : [estimatedRange(view, persona, i)],
        ),
      ],
      board: view.board,
      seed,
      samples: 3000,
      method: 'monteCarlo' as const,
    };
    const result = equity(input);
    const reference = planEquity(input).exactFeasible
      ? equity({ ...input, method: 'exact' })
      : undefined;
    const options =
      !bot && view.players.length > 2
        ? tableOptions(
            view,
            view.players.map((p, i) =>
              i === view.seat
                ? view.hand
                : p.folded
                  ? 'random'
                  : estimatedRange(view, persona, i),
            ),
            seed,
            raiseTo ?? Math.min(view.legal.minRaiseTo, view.legal.maxRaiseTo),
          )
        : undefined;
    const decision = bot ? chooseBot(view, persona, seed) : {};
    scope.postMessage({
      type: 'result',
      equity: result,
      reference,
      options,
      ...decision,
    } satisfies PlayResponse);
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Play analysis failed.',
    } satisfies PlayResponse);
  }
};
