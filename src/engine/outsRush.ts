import { deck, parseCards, type Hand } from './cards';
import { Rng, shuffle } from './rng';
import { targetOuts, outChance, type OutGoal } from './courseDraws';
const templates: {
  hole: string;
  board: string;
  goal: OutGoal;
  opponent?: string;
  label: string;
}[] = [
  {
    hole: 'Ah Jh',
    board: '2h 7h Kc',
    goal: 'flush',
    label: 'Complete a flush on the next card',
  },
  {
    hole: '8c 9d',
    board: '6h 7s Kc',
    goal: 'straight',
    label: 'Complete a straight on the next card',
  },
  {
    hole: '8c 9d',
    board: '5h 7s Kc',
    goal: 'straight',
    label: 'Complete a straight on the next card',
  },
  {
    hole: '8h 9h',
    board: '6h 7h Kc',
    goal: 'either',
    label:
      'Complete a straight or a flush on the next card; count each card once',
  },
  {
    hole: 'Ah Jh',
    board: '2h 7c Ks',
    goal: 'flush',
    label: 'Complete a flush on the next card (not by the river)',
  },
  {
    hole: 'Ah Ad',
    opponent: 'Kc Kd',
    board: 'Ks Kh 2c 3d',
    goal: 'ahead',
    label: 'Beat the exposed opponent on the river; ties do not count',
  },
  {
    hole: 'Ah Jh',
    opponent: '7s 7d',
    board: 'Kh 7h 2c',
    goal: 'ahead',
    label:
      'Be ahead of the exposed opponent after the next card; this is not a guarantee on the river',
  },
  {
    hole: '8h 9h',
    board: '6h 7h Kc 2s',
    goal: 'either',
    label: 'Complete a straight or a flush on the river; count each card once',
  },
];
export interface OutsQuestion {
  hand: Hand;
  board: number[];
  opponent?: Hand;
  goal: OutGoal;
  label: string;
  outs: number[];
  unseen: number;
}
export function makeOutsRush(seed: string): OutsQuestion[] {
  const rng = new Rng(seed);
  return shuffle(templates, rng)
    .slice(0, 5)
    .map((t) => {
      const suits = shuffle([0, 1, 2, 3], rng),
        transform = (text: string) =>
          parseCards(text).map((c) => 4 * Math.floor(c / 4) + suits[c % 4]);
      const hand = transform(t.hole) as unknown as Hand,
        board = transform(t.board),
        opponent = t.opponent
          ? (transform(t.opponent) as unknown as Hand)
          : undefined;
      return {
        hand,
        board,
        opponent,
        goal: t.goal,
        label: t.label,
        outs: targetOuts(hand, board, t.goal, opponent),
        unseen:
          deck().length - hand.length - board.length - (opponent?.length ?? 0),
      };
    });
}
export function scoreOuts(
  question: OutsQuestion,
  answer: string,
  elapsedMs: number,
  limitMs: number | null,
): boolean {
  return (
    /^\d+$/.test(answer.trim()) &&
    Number(answer) === question.outs.length &&
    (limitMs === null || elapsedMs < limitMs)
  );
}
export function outsSolution(question: OutsQuestion) {
  return {
    count: question.outs.length,
    chance: outChance(question.unseen, question.outs.length, 1),
  };
}
