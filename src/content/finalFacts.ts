import { Rational } from '../engine/math';
import { shufflePaths, moduloCounts, streakChance } from '../engine/shuffleLab';
import * as math from '../engine/finalMath';
import { riverRunoutFacts } from '../engine/runTwice';
import {
  kuhnExactValue,
  kuhnEquilibrium,
  kuhnExploitability,
} from '../engine/kuhn';
import { pushToyEquilibrium } from '../engine/pushToy';
export const finalFacts = {
  ...math,
  streakChance,
  shufflePaths,
  moduloCounts,
  riverRunoutFacts,
  kuhnExactValue,
  kuhnEquilibrium,
  kuhnExploitability,
  pushToyEquilibrium,
  naiveAnchor: () => shufflePaths('naive'),
  bluffAnchor: () => math.bluffBreakEven(100, 50),
  defenseAnchor: () => math.minimumDefense(100, 50),
  mixAnchor: () => math.polarizedBluffs(100, 100),
  streakNext: (wins: number, trials: number) => {
    if (
      !Number.isInteger(wins) ||
      !Number.isInteger(trials) ||
      wins < 0 ||
      wins > trials ||
      trials < 1
    )
      throw new Error('Invalid success ratio.');
    return new Rational(wins, trials);
  },
};
