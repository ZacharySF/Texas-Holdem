import { Rational, nCr } from '../engine/math';
import {
  binomial,
  geometricMean,
  hypergeometric,
  higherPair,
  bayes,
  betaUpdate,
  betaBinomial,
  payoffMoments,
  rakedCall,
  binomialTwoSided,
  poisson,
  requiredHands,
} from '../engine/inference';
import { breakEven } from '../engine/coach';
import { modelTruth, type ModelSpec } from '../engine/models';
import { gridRange } from '../engine/rangeGrid';
import { parseCards } from '../engine/cards';
export const advancedFacts = {
  fairChance: () => new Rational(1, 2),
  realizationSetup: () => ({
    equity: new Rational(1, 4),
    capture: new Rational(4, 5),
    pot: 200,
    cost: 50,
  }),
  waitingAces: () => geometricMean(new Rational(6, nCr(52, 2))),
  fiveFavoriteWins: () => binomial(5, 5, new Rational(4, 5)),
  callThreshold: () => breakEven(150, 50),
  hypergeometric,
  higherPair,
  binomial,
  geometricMean,
  bayes,
  betaUpdate,
  betaBinomial,
  payoffMoments,
  rakedCall,
  binomialTwoSided,
  poisson,
  requiredHands,
  modelTruth,
  forecastTolerance: () => new Rational(1, 20),
  blockedAces: () => gridRange({ AA: 100 }, parseCards('As')).combos.length,
  errorRatio: (oldN: number, newN: number) => Math.sqrt(oldN / newN),
};
export interface AdvancedExample {
  title: string;
  model: ModelSpec;
  lines: string[];
  unit: string;
}
const frac = (p: Rational) => `\\frac{${p.numerator}}{${p.denominator}}`;
export function modelDerivation(m: ModelSpec): string[] {
  const truth = modelTruth(m);
  let lines: string[];
  switch (m.type) {
    case 'hypergeometric':
      lines = [
        'P(X\\ge ' + m.atLeast + ')',
        Array.from(
          { length: m.draws - m.atLeast + 1 },
          (_, i) =>
            `\\frac{\\binom{${m.successes}}{${i + m.atLeast}}\\binom{${m.population - m.successes}}{${m.draws - i - m.atLeast}}}{\\binom{${m.population}}{${m.draws}}}`,
        ).join('+'),
      ];
      break;
    case 'higherPair':
      lines = [
        'P(H_1\\cup\\cdots\\cup H_m)',
        '\\sum_{j=1}^{m}(-1)^{j+1}\\binom{m}{j}P(H_1\\cap\\cdots\\cap H_j)',
      ];
      break;
    case 'binomial':
      lines = [
        `P(X=${m.hits})`,
        `\\binom{${m.trials}}{${m.hits}}(${m.p}/${m.d})^{${m.hits}}(1-${m.p}/${m.d})^{${m.trials - m.hits}}`,
      ];
      break;
    case 'waiting':
      lines =
        m.within === undefined
          ? ['E[T]', `1/(${m.p}/${m.d})`]
          : [`P(T\\le${m.within})`, `1-(1-${m.p}/${m.d})^{${m.within}}`];
      break;
    case 'payoff':
      lines = [
        'E[X]',
        `${m.p}/${m.d}\\cdot(${m.win})+(1-${m.p}/${m.d})\\cdot(${m.lose})`,
      ];
      break;
    case 'means':
      lines = [
        'E[\\bar X]',
        `\\frac{${m.size}\\cdot(${m.p}/${m.d})}{${m.size}}`,
      ];
      break;
    case 'bayes':
      lines = [
        'P(A\\mid B)',
        `\\frac{(${m.prior}/${m.denominator})(${m.likeA}/${m.denominator})}{(${m.prior}/${m.denominator})(${m.likeA}/${m.denominator})+(1-${m.prior}/${m.denominator})(${m.likeB}/${m.denominator})}`,
      ];
      break;
    case 'predictive':
      lines = [
        `P(X=${m.hits})`,
        `\\binom{${m.trials}}{${m.hits}}\\frac{(${m.alpha})_{${m.hits}}(${m.beta})_{${m.trials - m.hits}}}{(${m.alpha + m.beta})_{${m.trials}}}`,
      ];
      break;
    case 'coverage':
      lines = [
        'P(p\\in I(X))',
        `\\sum_{x=0}^{${m.size}}\\mathbf1_{${m.p}/${m.d}\\in I(x)}\\binom{${m.size}}{x}(${m.p}/${m.d})^x(1-${m.p}/${m.d})^{${m.size}-x}`,
      ];
      break;
    case 'repeat':
      lines = ['P(X=k)', '\\binom{n}{k}p^k(1-p)^{n-k}'];
      break;
  }
  return [...lines, frac(truth)];
}
export function advancedExample(id: string): AdvancedExample {
  let model: ModelSpec;
  let title: string,
    unit = 'probability';
  switch (id) {
    case '9-1':
      model = {
        type: 'hypergeometric',
        population: 52,
        successes: 4,
        draws: 7,
        atLeast: 1,
      };
      title = 'At least one ace in seven cards';
      break;
    case '9-2':
      model = { type: 'higherPair', rank: 12, opponents: 5 };
      title = 'Pocket queens face a higher pocket pair among five opponents';
      break;
    case '10-1':
      model = { type: 'binomial', trials: 5, p: 4, d: 5, hits: 5 };
      title = 'Five independent wins as a supplied four-fifths favorite';
      break;
    case '10-2':
      model = { type: 'waiting', p: 1, d: 221 };
      title = 'Hands until pocket aces, including the successful hand';
      unit = 'hands';
      break;
    case '11-1':
    case '11-2':
      model = { type: 'payoff', p: 4, d: 5, win: 1, lose: 0 };
      title =
        'Average pot share in an illustrative supplied-equity model; actual matchups below';
      break;
    case '12-1':
    case '14-1':
    case '14-2':
      model = { type: 'payoff', p: 4, d: 5, win: 50, lose: -50 };
      title = 'Independent all-ins: gain fifty or lose fifty';
      unit = 'chips';
      break;
    case '12-2':
      model = { type: 'payoff', p: 1, d: 4, win: 146, lose: -50 };
      title = 'Pot 150, call 50, rake 4; supplied equity one quarter';
      unit = 'chips';
      break;
    case '13-1':
      model = { type: 'payoff', p: 1, d: 4, win: 250, lose: -100 };
      title =
        'Commit to calls of 50 on both streets; current pot 200 and future opposing bet 50';
      unit = 'chips';
      break;
    case '13-2': {
      const setup = advancedFacts.realizationSetup(),
        realized = setup.equity.multiply(setup.capture);
      model = {
        type: 'payoff',
        p: Number(realized.numerator),
        d: Number(realized.denominator),
        win: setup.pot - setup.cost,
        lose: -setup.cost,
      };
      title = `Toy realization: raw equity ${setup.equity.toString()}, capture ${setup.capture.toString()}, final pot ${setup.pot}`;
      unit = 'chips';
      break;
    }
    case '15-1':
    case '15-2':
    case '17-1':
    case '17-2':
      model = { type: 'means', p: 4, d: 5, size: 20 };
      title = 'Mean of twenty independent supplied-equity all-ins';
      break;
    case '16-1':
    case '16-2':
      model = { type: 'coverage', p: 4, d: 5, size: 20 };
      title =
        'Repeated twenty-trial experiments: how often does the Wilson interval cover the truth?';
      break;
    case '18-1':
      model = {
        type: 'hypergeometric',
        population: 51,
        successes: 3,
        draws: 2,
        atLeast: 2,
      };
      title = 'After As is exposed, a random opponent holds pocket aces';
      break;
    case '18-2':
      model = { type: 'means', p: 3, d: 5, size: 20 };
      title = 'Supplied range-equity average as a toy repeated-outcome model';
      break;
    case '19-1':
      model = {
        type: 'bayes',
        prior: 30,
        likeA: 80,
        likeB: 20,
        denominator: 100,
      };
      title = 'Update a strong-hand hypothesis after observing a bet';
      break;
    case '19-2':
      model = { type: 'predictive', alpha: 5, beta: 9, trials: 5, hits: 2 };
      title = 'Two successes in five future trials with updated beta counts';
      break;
    default:
      throw new Error('Unknown advanced lesson.');
  }
  return { title, model, unit, lines: modelDerivation(model) };
}
export function advancedShortcut(id: string) {
  const exact = modelTruth(advancedExample(id).model),
    approx = new Rational(Math.round(exact.toNumber() * 100), 100);
  return { exact, approx, gap: approx.add(exact.multiply(new Rational(-1))) };
}
