import { formatCard, type Hand } from '../../engine/cards';
import type { CourseDraw } from '../../engine/courseDraws';
import {
  courseProbability,
  fiveCardCounts,
  sevenCardCounts,
  CATEGORY_NAMES,
} from '../../engine/courseDraws';
import { Rational } from '../../engine/math';
import { Rng } from '../../engine/rng';
import { makeOutsRush } from '../../engine/outsRush';
import {
  drawingDerivation,
  courseLabel,
  drawEvent,
  flopEvent,
  outShortcut,
} from '../../content/facts';
import type { Problem } from './practice';
export function phaseFourPractice(id: string, seed: string): Problem[] {
  const rng = new Rng(seed);
  const probability = (e: CourseDraw): Problem => ({
    prompt: `${courseLabel(e)}. Give the exact probability as a fraction.`,
    answer: courseProbability(e),
    lines: drawingDerivation(e),
    explanation:
      'Count only cards left after the visible cards are removed. The numerator counts the requested event, not a stronger claim about winning. Divide by equally likely sets of the required size, then reduce the fraction.',
  });
  return Array.from({ length: 5 }, (_, i) => {
    switch (id) {
      case '5-1':
      case '5-2': {
        const rank = 2 + rng.int(13),
          removed = 1 + rng.int(3),
          known = Array.from({ length: removed }, (_, s) => 4 * (rank - 2) + s);
        return probability({
          kind: 'courseDraw',
          topic: 'removal',
          known,
          target: 'rank',
          value: rank,
          draws: id === '5-1' ? 1 : 2,
          all: i % 2 === 0,
        });
      }
      case '6-1':
      case '6-2': {
        const size = id === '6-2' ? 7 : ([5, 7] as const)[rng.int(2)],
          category = rng.int(9),
          e: CourseDraw = {
            kind: 'courseDraw',
            topic: 'category',
            size,
            category,
          };
        if (i % 2 === 0) return probability(e);
        const count = (size === 5 ? fiveCardCounts() : sevenCardCounts())[
          category
        ];
        return {
          prompt: `How many of all ${size}-card sets have best category ${CATEGORY_NAMES[category]}? Use the lesson's count table; give an integer.`,
          answer: new Rational(count),
          lines: [`N_{${category}}`, `${count}`],
          explanation:
            'Each physical set is counted once in its strongest category. Consult the derived five-card counts or the exhaustive seven-card count table; do not multiply by overlapping five-card subsets.',
        };
      }
      case '6-3':
        return probability({
          kind: 'courseDraw',
          topic: 'royal',
          size: ([5, 7] as const)[rng.int(2)],
        });
      case '7-1': {
        const r = 2 + rng.int(12),
          pair = [4 * (r - 2), 4 * (r - 2) + 1] as Hand;
        if (i === 4)
          return probability({
            kind: 'courseDraw',
            topic: 'boardRank',
            hand: pair,
          });
        const events = ['set', 'pairHole', 'flushDraw', 'flush'] as const,
          event = events[i];
        const hand =
          event === 'set'
            ? pair
            : ([
                4 * (r - 2),
                4 * (r - 1) + (event === 'pairHole' ? 1 : 0),
              ] as Hand);
        return probability({ kind: 'courseDraw', topic: 'flop', hand, event });
      }
      case '7-2': {
        if (i < 2) {
          const r = 8 + rng.int(7);
          return probability({
            kind: 'courseDraw',
            topic: 'flop',
            hand: [4 * (r - 2), 4 * (r - 2) + 1],
            event: 'overcard',
          });
        }
        return probability(
          flopEvent(
            ['Qs Qd', 'Ah Kh', 'As Kd'][rng.int(3)],
            (['monotone', 'twoTone', 'rainbow'] as const)[i - 2],
          ),
        );
      }
      case '8-1': {
        const outs = 4 + rng.int(12),
          draws = (i % 2 === 0 ? 2 : 1) as 1 | 2;
        return probability(drawEvent(outs, draws));
      }
      default: {
        if (i === 4) {
          const outs = 9 + rng.int(7),
            answer = outShortcut(outs, 2, true);
          return {
            prompt: `For ${outs} outs and two cards to come, what probability does the adjusted rule predict? Give a percent or fraction.`,
            answer,
            lines: [
              'P_{\\mathrm{shortcut}}',
              `\\frac{4\\cdot${outs}-(${outs}-8)}{100}`,
              `\\frac{${answer.numerator}}{${answer.denominator}}`,
            ],
            explanation:
              'Above eight outs, subtract one percentage point per extra out from the rule of four. This is a quick approximation; the exact complement count remains the reference.',
          };
        }
        const q = makeOutsRush(seed)[i];
        return {
          prompt: `${q.hand.map(formatCard).join(' ')} on ${q.board.map(formatCard).join(' ')}${q.opponent ? `, opponent ${q.opponent.map(formatCard).join(' ')}` : ''}. ${q.label}. How many cards qualify?`,
          answer: new Rational(q.outs.length),
          lines: ['N_E', `${q.outs.length}`],
          explanation: `Remove all shown cards and test each possible next card. Qualifying cards: ${q.outs.map(formatCard).join(', ') || 'none'}. A card meeting two conditions still appears only once. A one-card target is different from a two-card backdoor.`,
        };
      }
    }
  });
}
