import type { EquityResult } from '../../engine/equity';
export interface Assessment {
  equity: EquityResult;
  seed: string;
  reference?: EquityResult;
  options?: import('../../engine/payouts').TableOptions;
}
