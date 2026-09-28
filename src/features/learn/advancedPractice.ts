import { Rng } from '../../engine/rng';
import { Rational } from '../../engine/math';
import { advancedFacts, modelDerivation } from '../../content/facts';
import { modelTruth, type ModelSpec } from '../../engine/models';
import type { Problem } from './practice';
export function advancedPractice(id: string, seed: string): Problem[] {
  const rng = new Rng(seed),
    chapter = Number(id.split('-')[0]);
  return Array.from({ length: 5 }, (_, index) => {
    const p = 1 + rng.int(8),
      n = 3 + rng.int(5),
      capture = advancedFacts.realizationSetup().capture,
      fair = advancedFacts.fairChance();
    let model: ModelSpec, prompt: string;
    switch (chapter) {
      case 9:
        model =
          id === '9-2'
            ? {
                type: 'higherPair',
                rank: 10 + rng.int(5),
                opponents: 1 + rng.int(5),
              }
            : {
                type: 'hypergeometric',
                population: 52,
                successes: 4,
                draws: n,
                atLeast: 1,
              };
        prompt =
          model.type === 'higherPair'
            ? `With a pocket pair of rank ${model.rank} (ace=14), ${model.opponents} random opponents: probability someone has a higher pair?`
            : `Draw ${n} cards from a full deck. Probability of at least one ace?`;
        break;
      case 10:
        model =
          id === '10-2'
            ? { type: 'waiting', p: 1, d: 10 + n }
            : { type: 'binomial', trials: n, p, d: 10, hits: index % n };
        prompt =
          model.type === 'waiting'
            ? `Success chance 1/${10 + n} each independent attempt. Expected attempts including the first success?`
            : `In ${n} independent trials with success chance ${p}/10, probability of exactly ${index % n} successes?`;
        break;
      case 11: {
        const wins = 10 + p,
          ties = n,
          total = 40,
          answer = new Rational(2 * wins + ties, 2 * total);
        return {
          prompt: `A tiny enumerated matchup has ${total} equally likely runouts: ${wins} wins, ${ties} two-way ties, and the rest losses. What is hero equity?`,
          answer,
          lines: [
            'e',
            `(${wins}+${ties}/2)/${total}`,
            `${answer.numerator}/${answer.denominator}`,
          ],
          explanation:
            'Each outright win earns one pot, a two-way tie earns half, and a loss earns none. Add those shares and divide by all equally likely runouts. Win frequency alone omits ties.',
        };
      }
      case 12: {
        const pot = 20 * n,
          call = 10,
          rake = index;
        model = { type: 'payoff', p, d: 10, win: pot - rake, lose: -call };
        prompt = `Pot including bet ${pot}, call ${call}, fixed rake ${rake}, supplied equity ${p}/10. No future betting. What is call EV in chips?`;
        break;
      }
      case 13: {
        const pot = 20 * n,
          first = 10,
          later = 10 + index,
          other = 20,
          answer =
            id === '13-1'
              ? advancedFacts.rakedCall(
                  new Rational(p, 10),
                  pot + other,
                  first + later,
                  0,
                )
              : new Rational(p, 10)
                  .multiply(capture)
                  .multiply(new Rational(pot))
                  .add(new Rational(-first));
        return {
          prompt:
            id === '13-1'
              ? `Current pot ${pot}; commit to a first call ${first}, later call ${later}, and later opposing contribution ${other}. Supplied final win chance ${p}/10. Find whole-policy EV.`
              : `Raw equity ${p}/10, assumed capture factor ${capture.toString()}, final benchmark pot ${pot}, cost ${first}. Find the toy realized EV.`,
          answer,
          lines:
            id === '13-1'
              ? [
                  'E[X]',
                  `(${p}/10)(${pot}+${other}+${first}+${later})-(${first}+${later})`,
                  `${answer.numerator}/${answer.denominator}`,
                ]
              : [
                  'E[X]',
                  `(${p}/10)(${capture.toString()})${pot}-${first}`,
                  `${answer.numerator}/${answer.denominator}`,
                ],
          explanation:
            'Keep the entire policy in one accounting frame. Include both future calls when pricing two streets; a realization factor is a supplied sensitivity assumption, not a property of the cards alone.',
        };
      }
      case 14: {
        const m = advancedFacts.payoffMoments(new Rational(p, 10), 20, -20),
          answer = id === '14-1' ? m.variance : m.mean;
        return {
          prompt: `Win 20 or lose 20, success chance ${p}/10. Find the ${id === '14-1' ? 'population variance in squared chips' : 'all-in expected net chips'}.`,
          answer,
          lines:
            id === '14-1'
              ? [
                  '\\operatorname{Var}(X)',
                  `400-(${m.mean.numerator}/${m.mean.denominator})^2`,
                  `${answer.numerator}/${answer.denominator}`,
                ]
              : [
                  'E[X]',
                  `(${p}/10)20+(1-${p}/10)(-20)`,
                  `${answer.numerator}/${answer.denominator}`,
                ],
          explanation:
            'Use population-weighted outcomes. Variance subtracts the square of the mean from the expected square; the adjusted payoff uses the mean itself.',
        };
      }
      case 15:
      case 17:
        model = { type: 'means', p, d: 10, size: n };
        prompt = `Average ${n} independent binary observations with success chance ${p}/10. What is the exact expected average?`;
        break;
      case 16: {
        const answer = advancedFacts.binomialTwoSided(n, index % n, fair);
        return {
          prompt: `For ${index % n} wins among ${n} trials, null success chance ${fair.toString()}, find the exact two-sided binomial p-value (sum masses no larger than the observed mass).`,
          answer,
          lines: [
            'p_{\\mathrm{test}}',
            Array.from({ length: n + 1 }, (_, k) =>
              advancedFacts.binomial(n, k, fair),
            )
              .filter(
                (m) =>
                  m.compare(advancedFacts.binomial(n, index % n, fair)) <= 0,
              )
              .map((m) => `(${m.numerator}/${m.denominator})`)
              .join('+'),
            `${answer.numerator}/${answer.denominator}`,
          ],
          explanation:
            'Enumerate all counts, retain those at least as surprising by the probability-ordering rule, and add their disjoint probabilities. This is not the probability the null is true.',
        };
      }
      case 18:
        model = {
          type: 'hypergeometric',
          population: 52 - index,
          successes: 4 - index,
          draws: 2,
          atLeast: 2,
        };
        prompt = `After ${index} aces are exposed and removed, a random two-card hand is dealt. Probability of pocket aces?`;
        break;
      default:
        model =
          id === '19-1'
            ? { type: 'bayes', prior: p, likeA: 8, likeB: 2, denominator: 10 }
            : {
                type: 'predictive',
                alpha: 2 + p,
                beta: 2 + 10 - p,
                trials: n,
                hits: index % n,
              };
        prompt =
          model.type === 'bayes'
            ? `Prior strong chance ${model.prior}/${model.denominator}; bet likelihood strong ${model.likeA}/${model.denominator}, weak ${model.likeB}/${model.denominator}. Posterior strong chance after a bet?`
            : `Prior beta(2,2), observe ${p} successes in 10 trials. Predict exactly ${index % n} successes in ${n} future trials using beta-binomial.`;
    }
    return {
      prompt: prompt + ' Give an exact fraction or integer.',
      answer: modelTruth(model),
      lines: modelDerivation(model),
      explanation:
        'Apply the stated model and its sample space. Substitute the supplied parameters, perform the products and sums, then reduce. Each notebook line preserves the same probability or expected value; negative chip values are allowed.',
    };
  });
}
