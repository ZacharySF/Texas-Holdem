import { parseCards } from '../engine/cards';
import type { CourseDraw } from '../engine/courseDraws';
import type { Lesson } from './lessonTypes';
import { drawEvent, flopEvent, courseLabel } from './drawingFacts';
const category = (size: 5 | 7, category: number): CourseDraw => ({
  kind: 'courseDraw',
  topic: 'category',
  size,
  category,
});
const royal = (size: 5 | 7): CourseDraw => ({
  kind: 'courseDraw',
  topic: 'royal',
  size,
});
export const phaseFourLessons: readonly Lesson[] = [
  {
    id: '5-1',
    chapter: 5,
    title: 'Condition on the cards you know',
    objectives: [
      'Replace the full-deck sample space with the remaining physical cards.',
      'Distinguish known dead cards from unknown folded cards.',
    ],
    experiment: {
      kind: 'courseDraw',
      topic: 'removal',
      known: parseCards('As Kd 7c'),
      target: 'rank',
      value: 14,
      draws: 1,
      all: false,
    },
    experimentLabel: 'An ace comes next after As, Kd, and 7c are exposed',
    shortcut:
      'Round the exact probability to the nearest tenth of a percent, then measure the signed error.',
    experiments: [
      {
        kind: 'courseDraw',
        topic: 'removal',
        known: parseCards('As Ad 7c'),
        target: 'rank',
        value: 14,
        draws: 1,
        all: false,
      },
    ],
  },
  {
    id: '5-2',
    chapter: 5,
    title: 'Follow a probability tree',
    objectives: [
      'Multiply conditional probabilities along a path and add disjoint paths.',
      'Explain how the second draw changes after a hit or a miss.',
    ],
    experiment: {
      kind: 'courseDraw',
      topic: 'removal',
      known: parseCards('As'),
      target: 'rank',
      value: 14,
      draws: 2,
      all: true,
    },
    experimentLabel: 'After As is exposed, both next cards are aces',
    shortcut:
      'Pretend the first drawn card was replaced. Squaring the first branch probability overstates the chance of two hits.',
    experiments: [
      {
        kind: 'courseDraw',
        topic: 'removal',
        known: parseCards('As'),
        target: 'rank',
        value: 14,
        draws: 2,
        all: false,
      },
    ],
  },
  {
    id: '6-1',
    chapter: 6,
    title: 'Count every final hand',
    objectives: [
      'Derive all nine disjoint five-card category counts.',
      'Classify seven-card sets by their best five without counting overlapping subsets twice.',
    ],
    experiment: category(5, 3),
    experimentLabel: 'A five-card hand is exactly three of a kind',
    shortcut:
      'Round to the nearest tenth of a percent. This is convenient for common categories but can erase rare events.',
    experiments: [
      ...Array.from({ length: 9 }, (_, c) => category(5, c)),
      ...Array.from({ length: 9 }, (_, c) => category(7, c)),
    ],
  },
  {
    id: '6-2',
    chapter: 6,
    title: 'Frequency does not change the ranking',
    objectives: [
      'Compare five-card and seven-card category frequencies.',
      'Explain why a rare seven-card high-card hand still loses to a pair.',
    ],
    experiment: category(7, 0),
    experimentLabel: 'Seven cards have no pair, straight, or flush',
    shortcut:
      'Round to the nearest tenth of a percent; a rounded population frequency still cannot decide a particular showdown.',
    experiments: [category(7, 1), category(7, 2), category(5, 0)],
  },
  {
    id: '6-3',
    chapter: 6,
    title: 'Count a royal without counting it twice',
    objectives: [
      'Count royal flushes in five and seven cards.',
      'Interpret a rare-event simulation that may record no successes.',
    ],
    experiment: royal(7),
    experimentLabel: 'Your seven cards contain a royal flush',
    shortcut:
      'Rounding a rare event to the nearest tenth of a percent can turn a positive chance into zero. The error below exposes that loss.',
    experiments: [royal(5)],
  },
  {
    id: '7-1',
    chapter: 7,
    title: 'From a starting hand to the flop',
    objectives: [
      'Count pairs, sets, two pair, flush draws, and made flushes from fixed hole cards.',
      'Distinguish made straights from one-card straight draws, and flopping a set from hitting its rank anywhere on the board.',
    ],
    experiment: flopEvent('Qs Qd', 'set'),
    experimentLabel: 'A pocket pair hits its rank at least once on the flop',
    shortcut:
      'Round to the nearest tenth of a percent. Use the exact event definition before rounding.',
    experiments: [
      flopEvent('As Kd', 'pairHole'),
      flopEvent('As Kd', 'twoPair'),
      flopEvent('Ah Kh', 'flushDraw'),
      flopEvent('Ah Kh', 'flush'),
      flopEvent('8h 9h', 'straight'),
      flopEvent('8h 9h', 'straightDraw'),
      {
        kind: 'courseDraw',
        topic: 'boardRank',
        hand: [...parseCards('Qs Qd')] as [number, number],
      },
    ],
  },
  {
    id: '7-2',
    chapter: 7,
    title: 'Overcards and board textures',
    objectives: [
      'Count overcards against pocket queens using the complement.',
      'Distinguish rank pairing from monotone, two-tone, and rainbow suit patterns after card removal.',
    ],
    experiment: flopEvent('Qs Qd', 'overcard'),
    experimentLabel: 'Pocket queens see at least one ace or king on the flop',
    shortcut:
      'Round to the nearest tenth of a percent. An overcard is information, not proof that an opponent has paired it.',
    experiments: ['pairedBoard', 'monotone', 'twoTone', 'rainbow'].map(
      (event) =>
        flopEvent(
          'Qs Qd',
          event as 'pairedBoard' | 'monotone' | 'twoTone' | 'rainbow',
        ),
    ),
  },
  {
    id: '8-1',
    chapter: 8,
    title: 'One card, two cards, and a fixed set of outs',
    objectives: [
      'Derive next-card and flop-to-river hit rates without replacement.',
      'Distinguish hitting a fixed set from winning the pot and from paying for both cards.',
    ],
    experiment: drawEvent(9),
    experimentLabel: courseLabel(drawEvent(9)),
    shortcut:
      'The rule of four multiplies the out count by four percent for two cards; the rule of two uses two percent for one card. These are approximations, not counting formulas.',
    experiments: [
      drawEvent(8),
      drawEvent(15),
      drawEvent(9, 1),
      drawEvent(9, 1, 47),
    ],
  },
  {
    id: '8-2',
    chapter: 8,
    title: 'Overlap, dirty outs, and backdoor draws',
    objectives: [
      'Count a combo draw as a union of physical cards and measure shortcut error.',
      'Identify dirty outs, two-card backdoors, and drawing dead against an exposed hand.',
    ],
    experiment: drawEvent(15),
    experimentLabel: courseLabel(drawEvent(15)),
    shortcut:
      'The unadjusted rule of four overstates a large draw. Compare its measured error with the adjusted rule shown in the worked examples.',
    experiments: [
      {
        kind: 'courseDraw',
        topic: 'removal',
        known: parseCards('Ah Jh 2h 7c Ks'),
        target: 'suit',
        value: 2,
        draws: 2,
        all: true,
      },
      {
        kind: 'courseDraw',
        topic: 'showdown',
        hero: parseCards('Ah Ad') as [number, number],
        opponent: parseCards('Kc Kd') as [number, number],
        board: parseCards('Ks Kh 2c 3d'),
      },
    ],
  },
];
