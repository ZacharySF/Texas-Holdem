import { rank, suit, parseCards, formatCard, type Hand } from '../engine/cards';
import { nCr, Rational } from '../engine/math';
import {
  CATEGORY_NAMES,
  courseProbability,
  courseDeck,
  courseDrawCount,
  fiveCardCounts,
  sevenCardCounts,
  outChance,
  outShortcut,
  targetOuts,
  type CourseDraw,
} from '../engine/courseDraws';
export {
  CATEGORY_NAMES,
  fiveCardCounts,
  sevenCardCounts,
  outChance,
  outShortcut,
  targetOuts,
};
const hand = (text: string) => parseCards(text) as unknown as Hand;
export const drawEvent = (
  outs: number,
  draws: 1 | 2 = 2,
  unseen = draws === 2 ? 47 : 46,
): CourseDraw => ({ kind: 'courseDraw', topic: 'outs', outs, draws, unseen });
export const flopEvent = (
  cards: string,
  event: Extract<CourseDraw, { topic: 'flop' }>['event'],
): CourseDraw => ({
  kind: 'courseDraw',
  topic: 'flop',
  hand: hand(cards),
  event,
});
export const drawingFacts = {
  flopPair: () => courseProbability(flopEvent('As Kd', 'pairHole')),
  flopSet: () => courseProbability(flopEvent('Qs Qd', 'set')),
  flopFlushDraw: () => courseProbability(flopEvent('As Ks', 'flushDraw')),
  flopFlush: () => courseProbability(flopEvent('As Ks', 'flush')),
  queensOvercards: () => courseProbability(flopEvent('Qs Qd', 'overcard')),
  boardSet: () =>
    courseProbability({
      kind: 'courseDraw',
      topic: 'boardRank',
      hand: hand('Qs Qd'),
    }),
  royal: (size: 5 | 7) =>
    courseProbability({ kind: 'courseDraw', topic: 'royal', size }),
  combo: () => {
    const hole = hand('8h 9h'),
      board = parseCards('6h 7h Kc');
    const flush = targetOuts(hole, board, 'flush'),
      straight = targetOuts(hole, board, 'straight');
    return {
      hole,
      board,
      flush,
      straight,
      overlap: flush.filter((c) => straight.includes(c)),
      union: targetOuts(hole, board, 'either'),
    };
  },
  dirty: () => {
    const hole = hand('Ah Jh'),
      opponent = hand('7s 7d'),
      board = parseCards('Kh 7h 2c');
    const flush = targetOuts(hole, board, 'flush', opponent),
      ahead = targetOuts(hole, board, 'ahead', opponent);
    return {
      hole,
      opponent,
      board,
      flush,
      clean: flush.filter((c) => ahead.includes(c)),
      dirty: flush.filter((c) => !ahead.includes(c)),
    };
  },
};
const f = (n: bigint | number, d: bigint | number) => `\\frac{${n}}{${d}}`;
export const FIVE_COUNT_FORMULAS = [
  '(\\binom{13}{5}-10)(4^5-4)',
  '13\\binom{4}{2}\\binom{12}{3}4^3',
  '\\binom{13}{2}\\binom{4}{2}^2\\cdot11\\cdot4',
  '13\\binom{4}{3}\\binom{12}{2}4^2',
  '10(4^5-4)',
  '4(\\binom{13}{5}-10)',
  '13\\binom{4}{3}12\\binom{4}{2}',
  '13\\cdot48',
  '4\\cdot10',
];
export function drawingDerivation(e: CourseDraw): string[] {
  const p = courseProbability(e),
    reduced = f(p.numerator, p.denominator),
    draws = courseDrawCount(e);
  let expression: string;
  switch (e.topic) {
    case 'outs':
      expression = `1-\\frac{\\binom{${e.unseen - e.outs}}{${draws}}}{\\binom{${e.unseen}}{${draws}}}`;
      break;
    case 'category': {
      const counts = e.size === 5 ? fiveCardCounts() : sevenCardCounts();
      return [
        'P(E)',
        e.size === 5
          ? `\\frac{${FIVE_COUNT_FORMULAS[e.category]}}{\\binom{52}{5}}`
          : `\\frac{N_{${e.category}}}{\\binom{52}{7}}`,
        f(counts[e.category], nCr(52, e.size)),
        reduced,
      ];
    }
    case 'royal':
      expression = `\\frac{4\\binom{47}{${e.size - 5}}}{\\binom{52}{${e.size}}}`;
      break;
    case 'boardRank':
      expression = '1-\\frac{\\binom{48}{5}}{\\binom{50}{5}}';
      break;
    case 'removal': {
      const pool = courseDeck(e),
        hits = pool.filter(
          (c) => (e.target === 'rank' ? rank(c) : suit(c)) === e.value,
        ).length;
      expression = e.all
        ? `\\frac{\\binom{${hits}}{${draws}}}{\\binom{${pool.length}}{${draws}}}`
        : `1-\\frac{\\binom{${pool.length - hits}}{${draws}}}{\\binom{${pool.length}}{${draws}}}`;
      break;
    }
    case 'flop':
      switch (e.event) {
        case 'pairHole':
          expression = '1-\\frac{\\binom{44}{3}}{\\binom{50}{3}}';
          break;
        case 'set':
          expression = '1-\\frac{\\binom{48}{3}}{\\binom{50}{3}}';
          break;
        case 'twoPair':
          expression = '\\frac{3\\cdot3\\cdot44}{\\binom{50}{3}}';
          break;
        case 'flushDraw':
          expression = '\\frac{\\binom{11}{2}39}{\\binom{50}{3}}';
          break;
        case 'flush':
          expression = '\\frac{\\binom{11}{3}}{\\binom{50}{3}}';
          break;
        case 'overcard':
          expression = `1-\\frac{\\binom{${50 - 4 * (14 - rank(e.hand[0]))}}{3}}{\\binom{50}{3}}`;
          break;
        default:
          expression = `\\frac{N_E}{\\binom{50}{3}}`;
      }
      break;
    case 'showdown':
      expression = `\\frac{N_{H>V}}{\\binom{${courseDeck(e).length}}{${draws}}}`;
      break;
  }
  const total = nCr(courseDeck(e).length, draws),
    count = (p.numerator * total) / p.denominator;
  return ['P(E)', expression, f(count, total), reduced];
}
export function drawingShortcut(e: CourseDraw): Rational {
  if (e.topic === 'outs') return outShortcut(e.outs, e.draws);
  if (e.topic === 'removal' && e.all && e.draws === 2) {
    const pool = courseDeck(e),
      count = pool.filter(
        (c) => (e.target === 'rank' ? rank(c) : suit(c)) === e.value,
      ).length;
    return new Rational(count, pool.length).multiply(
      new Rational(count, pool.length),
    );
  }
  const p = courseProbability(e);
  return new Rational(Math.round(p.toNumber() * 1000), 1000);
}
export function courseLabel(e: CourseDraw): string {
  switch (e.topic) {
    case 'outs':
      return `Hit at least one of ${e.outs} fixed outs in ${e.draws} draw(s) from ${e.unseen} unseen cards`;
    case 'category':
      return `${e.size}-card best hand: ${CATEGORY_NAMES[e.category]}`;
    case 'royal':
      return `Royal flush within ${e.size} cards`;
    case 'boardRank':
      return `A ${formatCard(e.hand[0])[0]} appears on the full board with ${e.hand.map(formatCard).join(' ')}`;
    case 'removal':
      return `${e.all ? 'Every draw matches' : 'At least one match'}: ${e.target === 'rank' ? ['twos', 'threes', 'fours', 'fives', 'sixes', 'sevens', 'eights', 'nines', 'tens', 'jacks', 'queens', 'kings', 'aces'][e.value - 2] : ['clubs', 'diamonds', 'hearts', 'spades'][e.value]}, ${e.draws} draw(s), known ${e.known.map(formatCard).join(' ') || 'none'}`;
    case 'showdown':
      return `${e.hero.map(formatCard).join(' ')} wins outright against ${e.opponent.map(formatCard).join(' ')} on ${e.board.map(formatCard).join(' ')}`;
    case 'flop':
      return `${e.hand.map(formatCard).join(' ')}: ${{ pairHole: 'pair at least one hole rank', set: 'flop a set or quads', twoPair: 'exactly pair both hole ranks', flushDraw: 'exactly two more cards of your suit', flush: 'three more cards of your suit', straightDraw: 'one-card straight draw, no made straight', straight: 'made straight', overcard: 'at least one overcard', pairedBoard: 'paired board, including trips', monotone: 'monotone flop', twoTone: 'two-tone flop', rainbow: 'rainbow flop' }[e.event]}`;
  }
}
export function probabilityTree(hits: number, total: number) {
  if (
    !Number.isInteger(hits) ||
    !Number.isInteger(total) ||
    total < 2 ||
    hits < 1 ||
    hits >= total
  )
    throw new Error('Use a nonempty hit and miss branch.');
  const misses = total - hits;
  return [
    {
      path: 'Hit → hit',
      first: new Rational(hits, total),
      second: new Rational(hits - 1, total - 1),
    },
    {
      path: 'Hit → miss',
      first: new Rational(hits, total),
      second: new Rational(misses, total - 1),
    },
    {
      path: 'Miss → hit',
      first: new Rational(misses, total),
      second: new Rational(hits, total - 1),
    },
    {
      path: 'Miss → miss',
      first: new Rational(misses, total),
      second: new Rational(misses - 1, total - 1),
    },
  ].map((branch) => ({
    ...branch,
    probability: branch.first.multiply(branch.second),
  }));
}
