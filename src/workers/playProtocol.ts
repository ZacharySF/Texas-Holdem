import type { PlayerView, Action } from '../engine/game';
import type { Persona } from '../engine/bots';
import type { EquityResult } from '../engine/equity';
export interface PlayRequest {
  view: PlayerView;
  persona: Persona;
  seed: string;
  bot: boolean;
  raiseTo?: number;
}
export type PlayResponse =
  | {
      type: 'result';
      equity: EquityResult;
      reference?: EquityResult;
      options?: import('../engine/payouts').TableOptions;
      action?: Action;
      reason?: string;
    }
  | { type: 'error'; message: string };
