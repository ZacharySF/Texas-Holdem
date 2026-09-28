import type { Lesson } from './lessonTypes';
export const finalChapters = [
  'Randomness itself',
  'Running it twice and insurance',
  'Betting math and game theory',
  'Short stacks and tournaments',
  'Bankroll and Kelly',
  'Capstone: a tiny solver',
];
export const finalLessons: readonly Lesson[] = [
  {
    id: '20-1',
    chapter: 20,
    title: 'From random words to a shuffled deck',
    objectives: [
      'Trace rejection sampling and Fisher\u2013Yates.',
      'Enumerate naive-shuffle paths and interpret a chi-square test.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Enumerate three-card naive swaps, then simulate their frequencies and test the uniform-order null.',
    shortcut:
      'Pretend every final order is equally likely. Compare that shortcut with the actual number of paths into the displayed order.',
    advanced: true,
  },
  {
    id: '20-2',
    chapter: 20,
    title: 'Streaks and the next hand',
    objectives: [
      'Count overlapping streaks without double counting.',
      'Separate an independent next trial from selection and confirmation bias.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Check the chance of at least one three-win run in five independent fair trials.',
    shortcut:
      'Add the probability of a three-win run at each possible starting point. Overlapping runs make this union bound an overestimate.',
    advanced: true,
  },
  {
    id: '21-1',
    chapter: 21,
    title: 'Two runouts, one expectation',
    objectives: [
      'Derive the mean and variance of two pot shares.',
      'Account for removal of cards between runouts.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Draw two distinct rivers per trial, measuring both mean shares, variances, and covariance.',
    shortcut:
      'Assume independent runouts and halve the single-board variance. Compare it with the variance that includes actual card-removal covariance.',
    advanced: true,
  },
  {
    id: '21-2',
    chapter: 21,
    title: 'Price an all-in insurance contract',
    objectives: [
      'Compute fair premium from a precisely defined insured event.',
      'Separate insurance cost from variance reduction.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Check the net insurance cash flow for a fair binary loss chance, benefit 100, and one-tenth loading.',
    shortcut:
      'Ignore the loading and call the insurance fair. Measure the expected cost omitted by that shortcut.',
    advanced: true,
  },
  {
    id: '22-1',
    chapter: 22,
    title: 'Fold equity and semi-bluffs',
    objectives: [
      'Derive pure-bluff break-even and minimum defense.',
      'Include showdown equity when a semi-bluff is called.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Run a zero-equity bluff exactly at its computed break-even fold chance.',
    shortcut:
      'Divide the bet by the original pot and forget that a successful bluff avoids losing the bet. Compare with the correct break-even frequency.',
    advanced: true,
  },
  {
    id: '22-2',
    chapter: 22,
    title: 'Indifference and a playable AKQ game',
    objectives: [
      'Derive the bluff fraction within a polarized betting range.',
      'Verify mixed-strategy equilibrium by best responses.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'At the balanced mix, simulate the bluff-catcher\u2019s incremental call payoff.',
    shortcut:
      'Use the bluff\u2019s break-even fold frequency as the bluff fraction among bets. The measured gap shows why those quantities cannot be interchanged.',
    advanced: true,
  },
  {
    id: '23-1',
    chapter: 23,
    title: 'Push or fold under stated ranges',
    objectives: [
      'Build a shove EV tree from fold chance and called equity.',
      'Interpret a Nash push/fold range within its exact game.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Simulate the three shove outcomes: immediate fold, called win, and called loss.',
    shortcut:
      'Ignore folds and use only the called branch. Compare that omission with the full shove tree.',
    advanced: true,
  },
  {
    id: '23-2',
    chapter: 23,
    title: 'From chips to tournament prizes',
    objectives: [
      'Compute Malmuth\u2013Harville ICM by finishing-order recursion.',
      'Compare chip EV, prize EV, and bubble factor.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Sample finishing orders under ICM and compare each seat\u2019s average prize with exact recursion.',
    shortcut:
      'Allocate the entire prize pool directly by chip share. Compare this with assigning each finishing position its own prize.',
    advanced: true,
  },
  {
    id: '24-1',
    chapter: 24,
    title: 'Ruin is a model and a stopping rule',
    objectives: [
      'Derive absorbing-barrier ruin for a fixed-unit random walk.',
      'Distinguish fixed stakes, fractional stakes, and finite-horizon drawdowns.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Follow fair fixed-unit walks until zero or ten, starting at five.',
    shortcut:
      'Assume eventual recovery makes ruin impossible. Compare that claim with the finite-barrier event actually being counted.',
    advanced: true,
  },
  {
    id: '24-2',
    chapter: 24,
    title: 'Logarithms and the Kelly fraction',
    objectives: [
      'Build logarithms from multiplication and inverse powers.',
      'Derive growth-optimal sizing and test sensitivity to the estimated edge.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Simulate repeated fractional bets and average log growth per trial at the computed Kelly fraction.',
    shortcut:
      'Risk half the computed Kelly fraction. The displayed gap compares fractions; the growth curve measures the different growth objective.',
    advanced: true,
  },
  {
    id: '25-1',
    chapter: 25,
    title: 'Counterfactual regret on a tiny game',
    objectives: [
      'Construct information sets and regret-matched policies.',
      'Distinguish cumulative regret, average policy, and current policy.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Train full-tree CFR, displaying average policies, game value, and exact best-response exploitability.',
    shortcut:
      'Choose both actions equally despite unequal positive regrets. Measure the action-probability difference from regret matching.',
    advanced: true,
  },
  {
    id: '25-2',
    chapter: 25,
    title: 'Measure the remaining exploitability',
    objectives: [
      'Enumerate legal best responses to an average strategy.',
      'Explain what a convergence plot proves and what it leaves open.',
    ],
    experiment: {
      kind: 'pair',
    },
    experimentLabel:
      'Inspect the exact best-response gap as full-tree CFR accumulates an average strategy.',
    shortcut:
      'Use an equal action mixture instead of the positive-regret mixture. This local probability gap is distinct from the independently computed exploitability bound.',
    advanced: true,
  },
];
