import type { Lesson } from './lessonTypes';
export const advancedChapters = [
  'The hypergeometric distribution',
  'Repeated hands',
  'Preflop matchups',
  'Expected value',
  'Multi-street decisions',
  'Variance and standard deviation',
  'Law of large numbers and the central limit theorem',
  'Confidence intervals and hypothesis tests',
  'Monte Carlo methods',
  'Ranges, combos, and blockers',
  'Bayes and hand reading',
] as const;
export const advancedLessons: readonly Lesson[] = [
  {
    id: '9-1',
    chapter: 9,
    title: 'Draw a count from a finite deck',
    objectives: [
      'Derive the hypergeometric count from two combination choices.',
      'Count at least one target by adding disjoint counts or using a complement.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Draw a count from a finite deck',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '9-2',
    chapter: 9,
    title: 'More seats, more chances to face a higher pair',
    objectives: [
      'Count higher pocket pairs across dependent opponent seats.',
      'Introduce summation notation and measure the overcount from adding single-seat probabilities.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'More seats, more chances to face a higher pair',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '10-1',
    chapter: 10,
    title: 'Count wins across independent hands',
    objectives: [
      'Derive binomial counts from independent Bernoulli paths.',
      'Distinguish one ordering of wins from every ordering with the same win count.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Count wins across independent hands',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '10-2',
    chapter: 10,
    title: 'Waiting for aces and counting rare events',
    objectives: [
      'Derive geometric waiting time, including the successful attempt.',
      'Introduce e and compare a Poisson rare-event approximation with an exact binomial count.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Waiting for aces and counting rare events',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '11-1',
    chapter: 11,
    title: 'A matchup is an average over runouts',
    objectives: [
      'Compute pot-share equity from winning, tied, and losing runouts.',
      'Compare pairs against two overcards, one overcard, undercards, and smaller pairs.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'A matchup is an average over runouts',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '11-2',
    chapter: 11,
    title: 'Domination, suits, and more opponents',
    objectives: [
      'Measure domination, suitedness, and connectedness with specific cards.',
      'Compare heads-up and multiway showdown equity while stating the range assumptions.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Domination, suits, and more opponents',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '12-1',
    chapter: 12,
    title: 'Expected value is a weighted average',
    objectives: [
      'Define a random variable and derive its weighted mean.',
      'Distinguish expected chip profit from the result of one all-in.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Expected value is a weighted average',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '12-2',
    chapter: 12,
    title: 'Call price, future money, and rake',
    objectives: [
      'Derive call EV and the break-even equity from incremental chip risk.',
      'Include rake and explain the limits of implied and reverse implied odds.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Call price, future money, and rake',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '13-1',
    chapter: 13,
    title: 'Paying to see two streets',
    objectives: [
      'Work backward through decision and chance nodes.',
      'Price a policy that pays for both future streets.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Paying to see two streets',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '13-2',
    chapter: 13,
    title: 'Raw equity and the money you capture',
    objectives: [
      'Distinguish raw equity from the value a strategy captures.',
      'Measure how an assumed realization factor changes EV and explain its dependence on position.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Raw equity and the money you capture',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '14-1',
    chapter: 14,
    title: 'Measure spread around the average',
    objectives: [
      'Derive variance and standard deviation from deviations around a mean.',
      'Distinguish chip units, squared-chip units, and uncertainty in a sample average.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Measure spread around the average',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '14-2',
    chapter: 14,
    title: 'Separate all-in runout luck from earlier luck',
    objectives: [
      'Compute an expected pot award at a fixed all-in commitment.',
      'Explain what actual-versus-adjusted results can and cannot say about decisions.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Separate all-in runout luck from earlier luck',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '15-1',
    chapter: 15,
    title: 'A stable average from unstable hands',
    objectives: [
      'Explain convergence of sample averages without a compensating-streak claim.',
      'Distinguish more repeated experiments from more hands inside each experiment.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'A stable average from unstable hands',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '15-2',
    chapter: 15,
    title: 'Why averages often look bell-shaped',
    objectives: [
      'Describe the central limit theorem and its finite-variance conditions.',
      'Compare repeated sample-mean histograms and recognize small-sample limits.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Why averages often look bell-shaped',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '16-1',
    chapter: 16,
    title: 'Intervals and how many hands you need',
    objectives: [
      'Interpret interval coverage through repeated experiments.',
      'Solve for a planning sample size at a stated precision and SD.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Intervals and how many hands you need',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '16-2',
    chapter: 16,
    title: 'A p-value answers a limited question',
    objectives: [
      'Compute an exact two-sided p-value under a supplied null model.',
      'Distinguish hypothesis tests, Brier scores, calibration, and decision quality.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'A p-value answers a limited question',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '17-1',
    chapter: 17,
    title: 'Estimate by dealing the experiment',
    objectives: [
      'Build a Monte Carlo estimate from a precisely defined experiment.',
      'Check exact agreement and derive square-root sample-size error scaling.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Estimate by dealing the experiment',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '17-2',
    chapter: 17,
    title: 'Reproducibility and what an error bar omits',
    objectives: [
      'Reproduce a calculation from its seed and inputs.',
      'Separate sampling error, model error, and pointwise interval coverage.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Reproducibility and what an error bar omits',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '18-1',
    chapter: 18,
    title: 'A range contains weighted physical combos',
    objectives: [
      'Expand hand classes into weighted physical combos and remove blockers.',
      'Condition compatible multiway range assignments without changing their intended weights.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'A range contains weighted physical combos',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '18-2',
    chapter: 18,
    title: 'Range advantage, nut advantage, and shape',
    objectives: [
      'Distinguish an equity distribution from uncertainty in its mean.',
      'Explain range advantage, nut advantage, and polarized versus merged shapes.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Range advantage, nut advantage, and shape',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '19-1',
    chapter: 19,
    title: 'An action updates a prior range',
    objectives: [
      'Derive a posterior from a prior and conditional action likelihoods.',
      'Simulate conditioning while keeping likelihood assumptions visible.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'An action updates a prior range',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
  {
    id: '19-2',
    chapter: 19,
    title: 'Learn a tendency from a small sample',
    objectives: [
      'Update beta pseudo-counts with comparable observed opportunities.',
      'Derive beta-binomial prediction and distinguish it from plugging in a fixed mean.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel: 'Learn a tendency from a small sample',
    shortcut:
      'Round the computed quantity to two decimal places and measure the signed rounding error. Use the specialized approximations in the examples only under their stated conditions.',
    advanced: true,
  },
];
