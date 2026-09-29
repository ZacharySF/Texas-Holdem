export { formatPercent } from '../engine/math';
import { drawingDerivation, drawingShortcut } from './drawingFacts';
export * from './drawingFacts';
import { factorial, nCr, Rational } from '../engine/math';
/** Each function is a tested source for displayed math; later chapters extend this registry. */
export const facts = {
  startingCombos: () => nCr(52, 2),
  handClasses: () => ({
    pairs: 13,
    suited: Number(nCr(13, 2)),
    offsuit: Number(nCr(13, 2)),
    total: 13 + 2 * Number(nCr(13, 2)),
  }),
  combosPerClass: () => ({ pair: nCr(4, 2), suited: 4n, offsuit: 4n * 3n }),
  pocketPair: () => new Rational(13n * nCr(4, 2), nCr(52, 2)),
  pocketAces: () => new Rational(nCr(4, 2), nCr(52, 2)),
  suited: () => new Rational(4n * nCr(13, 2), nCr(52, 2)),
  offsuitNonPair: () => new Rational(nCr(13, 2) * 4n * 3n, nCr(52, 2)),
  atLeastOneAce: () => new Rational(nCr(52, 2) - nCr(48, 2), nCr(52, 2)),
  errorScale: (sampleMultiplier: number) => {
    if (sampleMultiplier <= 0)
      throw new Error('Sample multiplier must be positive.');
    return 1 / Math.sqrt(sampleMultiplier);
  },
};

// Chapter 0–4 claims and worked solutions have one tested source.
export { experimentProbability } from '../engine/experiments';
export const learningFacts = {
  mastery: () => new Rational(4, 5),
  confidence: () => new Rational(95, 100),
  deck: () => ({ cards: 52, ranks: 13, suits: 4, perRank: 4, perSuit: 13 }),
  orderedSelections: (n: number, k: number) => nCr(n, k) * factorial(k),
  combinations: (n: number, k: number) => nCr(n, k),
  permutations: (n: number) => factorial(n),
  complement: (p: Rational) =>
    new Rational(p.denominator - p.numerator, p.denominator),
  union: (a: number, b: number, overlap: number, total: number) => {
    if (
      ![a, b, overlap, total].every(Number.isInteger) ||
      total <= 0 ||
      Math.min(a, b, overlap) < 0 ||
      overlap > Math.min(a, b) ||
      a + b - overlap > total
    )
      throw new Error('Invalid event counts.');
    return new Rational(a + b - overlap, total);
  },
  roundPercent: (p: Rational) =>
    new Rational(Math.round(p.toNumber() * 100), 100),
  gap: (estimate: Rational, exact: Rational) =>
    new Rational(
      estimate.numerator * exact.denominator -
        exact.numerator * estimate.denominator,
      estimate.denominator * exact.denominator,
    ),
  callAmount: (bet: number, contributed: number) => {
    if (
      !Number.isSafeInteger(bet) ||
      !Number.isSafeInteger(contributed) ||
      bet < 0 ||
      contributed < 0 ||
      contributed > bet
    )
      throw new Error('Invalid bet amounts.');
    return bet - contributed;
  },
  boardAfter: (street: 'preflop' | 'flop' | 'turn' | 'river') =>
    ({ preflop: 0, flop: 3, turn: 4, river: 5 })[street],
  nextButton: (seat: number, seats: number) => {
    if (
      !Number.isInteger(seats) ||
      seats < 2 ||
      !Number.isInteger(seat) ||
      seat < 1 ||
      seat > seats
    )
      throw new Error('Invalid seats.');
    return (seat % seats) + 1;
  },
};

import {
  experimentProbability,
  experimentDeck,
  type Experiment,
} from '../engine/experiments';
export const fractionTex = (value: Rational): string =>
  value.denominator === 1n
    ? value.numerator.toString()
    : `\\frac{${value.numerator}}{${value.denominator}}`;
export function lessonDerivation(event: Experiment): string[] {
  if (event.kind === 'courseDraw') return drawingDerivation(event);
  const p = experimentProbability(event),
    reduced = fractionTex(p);
  switch (event.kind) {
    case 'rank':
      return ['P(R)', '\\frac{4}{52}', reduced];
    case 'suit':
      return ['P(S)', '\\frac{13}{52}', reduced];
    case 'pair':
      return [
        'P(\\mathrm{pair})',
        '\\frac{13\\binom{4}{2}}{\\binom{52}{2}}',
        `\\frac{${13n * nCr(4, 2)}}{${nCr(52, 2)}}`,
        reduced,
      ];
    case 'suited':
      return [
        'P(\\mathrm{suited})',
        '\\frac{4\\binom{13}{2}}{\\binom{52}{2}}',
        `\\frac{${4n * nCr(13, 2)}}{${nCr(52, 2)}}`,
        reduced,
      ];
    case 'pocketRank':
      return [
        'P(R,R)',
        '\\frac{\\binom{4}{2}}{\\binom{52}{2}}',
        `\\frac{${nCr(4, 2)}}{${nCr(52, 2)}}`,
        reduced,
      ];
    case 'orderedRanks': {
      const second = event.first === event.second ? 3 : 4;
      return [
        'P(R_1,R_2)',
        `\\frac{4}{52}\\cdot\\frac{${second}}{51}`,
        `\\frac{${4 * second}}{${52 * 51}}`,
        reduced,
      ];
    }
    case 'atLeastRank':
      return [
        'P(N_R\\geq 1)',
        '1-P(N_R=0)',
        '1-\\frac{\\binom{48}{2}}{\\binom{52}{2}}',
        `1-\\frac{${nCr(48, 2)}}{${nCr(52, 2)}}`,
        `\\frac{${nCr(52, 2) - nCr(48, 2)}}{${nCr(52, 2)}}`,
        reduced,
      ];
    case 'rankOrSuit':
      return [
        'P(R\\cup S)',
        'P(R)+P(S)-P(R\\cap S)',
        '\\frac{4}{52}+\\frac{13}{52}-\\frac{1}{52}',
        `\\frac{${4 + 13 - 1}}{52}`,
        reduced,
      ];
    case 'eitherSuit':
      return [
        'P(S_1\\cup S_2)',
        'P(S_1)+P(S_2)',
        '\\frac{13}{52}+\\frac{13}{52}',
        reduced,
      ];
    case 'permutation':
      return [
        'P(\\mathrm{order})',
        `\\frac{1}{${event.size}!}`,
        `\\frac{1}{${Array.from({ length: event.size }, (_, i) => event.size - i).join('\\cdot')}}`,
        reduced,
      ];
    case 'subset':
      return [
        'P(\\mathrm{target})',
        `\\frac{1}{\\binom{${event.size}}{${event.take}}}`,
        `\\frac{${event.take}!(${event.size}-${event.take})!}{${event.size}!}`,
        reduced,
      ];
    case 'riverWin': {
      const n = experimentDeck(event).length;
      return ['P(H_1>H_2)', `\\frac{${p.toNumber() * n}}{${n}}`, reduced];
    }
  }
}
export function shortcutProbability(event: Experiment): Rational {
  if (event.kind === 'courseDraw') return drawingShortcut(event);
  const exact = experimentProbability(event);
  switch (event.kind) {
    case 'rank':
      return learningFacts.roundPercent(exact);
    case 'orderedRanks':
      return new Rational(4, 52).multiply(new Rational(4, 52));
    case 'atLeastRank':
      return new Rational(2 * 4, 52);
    case 'rankOrSuit':
      return new Rational(4 + 13, 52);
    default:
      return exact;
  }
}
export function orderedLabels(size: number, take = size): string[][] {
  // Small teaching trees only; avoid factorial work from unbounded author parameters.
  if (
    !Number.isInteger(size) ||
    size < 1 ||
    size > 6 ||
    !Number.isInteger(take) ||
    take < 0 ||
    take > size
  )
    throw new Error('Use at most six labeled cards.');
  const labels = Array.from({ length: size }, (_, i) =>
    String.fromCharCode(65 + i),
  );
  const paths = (left: string[], chosen: string[]): string[][] =>
    chosen.length === take
      ? [chosen]
      : left.flatMap((label, i) =>
          paths(
            left.filter((_, j) => i !== j),
            [...chosen, label],
          ),
        );
  return paths(labels, []);
}

import { parseCards, formatCard } from '../engine/cards';
import { evaluateReference } from '../engine/evaluator';
export function rankingExamples() {
  const examples = [
    'As Jd 9c 6h 3s',
    'Qs Qd Ac 9h 3s',
    'Qs Qd 9c 9h 3s',
    'Qs Qd Qc 9h 3s',
    'As 2d 3c 4h 5s',
    'As Js 9s 6s 3s',
    'Qs Qd Qc 4h 4s',
    'Qs Qd Qc Qh 3s',
    'As 2s 3s 4s 5s',
  ];
  return examples.map((text) => {
    const cards = parseCards(text);
    return {
      ...evaluateReference(cards),
      cards: cards.map(formatCard).join(' '),
    };
  });
}

// Phase 3 coaching math; teaching derivations remain in their planned later chapters.
export { breakEven, callEV, raiseEV, improvementOuts } from '../engine/coach';

export {
  advancedFacts,
  advancedExample,
  advancedShortcut,
  modelDerivation,
} from './advancedFacts';
export { finalFacts } from './finalFacts';

export { finalExample, finalRequest, riverExample } from './finalLessonFacts';

export { potOddsFacts } from './potOddsFacts';

export { handChartCell, handClassFacts, shoveScenario } from './handChartFacts';
export {
  equityCoachFacts,
  equityByHandExample,
  checkEquityCalculation,
} from './equityCoachFacts';
