import { finalChapters, finalLessons } from './finalLessons';
import { advancedLessons, advancedChapters } from './advancedLessons';
import { phaseFourLessons } from './phaseFourLessons';
import type { Lesson } from './lessonTypes';
export const chapters = [
  'How Hold’em works',
  'Probability from one deck',
  'Counting I: ordered choices',
  'Counting II: combinations',
  '“At least one” and “or”',
  'Conditional probability and card removal',
  'Final hand frequencies',
  'Starting hands and the flop',
  'Outs and drawing odds',
  ...advancedChapters,
  ...finalChapters,
] as const;
export const lessons: readonly Lesson[] = [
  {
    id: '0-1',
    chapter: 0,
    title: 'From blinds to showdown',
    objectives: [
      'Follow a hand through all four betting rounds.',
      'Distinguish checking, calling, betting, raising, and folding.',
    ],
    experiment: { kind: 'pair' },
    experimentLabel: 'Your two hole cards form a pocket pair',
    shortcut:
      'After any first card, three of the remaining cards match its rank. This shortcut counts the same event exactly.',
  },
  {
    id: '0-2',
    chapter: 0,
    title: 'The best five and the button',
    objectives: [
      'Compare five-card hands, including kickers and ties.',
      'Locate the button and explain heads-up action order.',
    ],
    experiment: { kind: 'riverWin' },
    experimentLabel: 'As Ad beats Ks Kh on 2c 3d 7h 9s plus one river card',
    shortcut:
      'Count the two remaining kings that can beat the aces, then count every other river as a win. Here the shortcut is exact because no river ties.',
  },
  {
    id: '1-1',
    chapter: 1,
    title: 'Outcomes, events, and one deck',
    objectives: [
      'Define an outcome, an event, and a sample space.',
      'Use favorable outcomes divided by equally likely outcomes.',
    ],
    experiment: { kind: 'rank', rank: 14 },
    experimentLabel: 'One card drawn from a full deck is an ace',
    shortcut:
      'Round the exact percentage to the nearest whole percent. Check how much precision this convenient spoken estimate loses.',
  },
  {
    id: '1-2',
    chapter: 1,
    title: 'Four ways to say the same chance',
    objectives: [
      'Convert between fraction, percent, one in N, and odds against.',
      'Interpret impossible and certain events without inventing a finite waiting time.',
    ],
    experiment: { kind: 'suit', suit: 2 },
    experimentLabel: 'One card drawn from a full deck is a heart',
    shortcut:
      'Four equally sized suits divide the deck into four equal groups. Using the reciprocal of the suit count is an exact shortcut here.',
  },
  {
    id: '2-1',
    chapter: 2,
    title: 'Multiply along a path',
    objectives: [
      'Build ordered counts from a tree of successive choices.',
      'Multiply probabilities along a path using the cards left at each step.',
    ],
    experiment: { kind: 'orderedRanks', first: 14, second: 14 },
    experimentLabel:
      'The first card is an ace and the second card is also an ace',
    shortcut:
      'Pretend the first card was replaced before the second draw. This common shortcut changes the second fraction; measure its error before trusting it.',
  },
  {
    id: '2-2',
    chapter: 2,
    title: 'Factorials and ordered selections',
    objectives: [
      'Build factorials by arranging every labeled card.',
      'Count partial ordered selections and distinguish them from sets.',
    ],
    experiment: { kind: 'permutation', size: 3 },
    experimentLabel: 'Three labeled cards arrive in the exact order A, B, C',
    shortcut:
      'For one requested complete order, use one divided by the factorial of the number of cards. This is exact, not a guess about the final card alone.',
  },
  {
    id: '3-1',
    chapter: 3,
    title: 'Why divide out the order?',
    objectives: [
      'Group ordered paths that produce the same hand.',
      'Derive combinations by dividing by the orderings within each group.',
    ],
    experiment: { kind: 'subset', size: 4, take: 2 },
    experimentLabel:
      'Two cards from A, B, C, D are the set {A, B}, in either order',
    shortcut:
      'Count ordered paths, then divide by the number of orders per hand. It is exact when every hand has the same number of distinct orderings.',
  },
  {
    id: '3-2',
    chapter: 3,
    title: 'Combos are not hand classes',
    objectives: [
      'Derive the full-deck two-card count and the pair/suited/offsuit classes.',
      'Count physical combos per class and weight probabilities by combos.',
    ],
    experiment: { kind: 'pair' },
    experimentLabel: 'Your two hole cards form any pocket pair',
    shortcut:
      'Once the first card is dealt, three of the remaining cards match its rank. It gives the same probability as counting every pair combo.',
  },
  {
    id: '4-1',
    chapter: 4,
    title: 'Count what does not happen',
    objectives: [
      'Identify the complement of “at least one.”',
      'Count no aces first, then subtract from the whole sample space.',
    ],
    experiment: { kind: 'atLeastRank', rank: 14 },
    experimentLabel: 'Your two hole cards contain at least one ace',
    shortcut:
      'Add the chance of an ace in the first position to the chance of an ace in the second. It overcounts the hands with two aces.',
  },
  {
    id: '4-2',
    chapter: 4,
    title: 'Add events, subtract the overlap',
    objectives: [
      'Recognize mutually exclusive and overlapping events.',
      'Derive inclusion–exclusion from the outcomes counted twice.',
    ],
    experiment: { kind: 'rankOrSuit', rank: 14, suit: 3 },
    experimentLabel:
      'One card is an ace or a spade, including the ace of spades',
    shortcut:
      'Simply add the two probabilities. That works for disjoint events, but here it counts the ace of spades twice.',
  },
  ...phaseFourLessons,
  ...advancedLessons,
  ...finalLessons,
];
export const lessonById = (id: string): Lesson | undefined =>
  lessons.find((l) => l.id === id);
