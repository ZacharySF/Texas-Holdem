import { finalPractice } from './finalPractice';
import { advancedPractice } from './advancedPractice';
import { phaseFourPractice } from './phaseFourPractice';
import { deck, formatCard } from '../../engine/cards';
import { evaluateReference } from '../../engine/evaluator';
import { Rational } from '../../engine/math';
import { Rng, shuffle } from '../../engine/rng';
import {
  experimentProbability,
  learningFacts,
  lessonDerivation,
  fractionTex,
  facts,
} from '../../content/facts';
import type { LessonId } from '../../content/lessonTypes';
export interface Problem {
  prompt: string;
  answer: Rational;
  lines: string[];
  explanation: string;
}
function numeric(
  prompt: string,
  answer: bigint | number,
  lines: string[],
  explanation: string,
): Problem {
  const value = new Rational(answer);
  return {
    prompt,
    answer: value,
    lines: [...lines, fractionTex(value)],
    explanation,
  };
}
export function makePractice(id: LessonId, seed: string): Problem[] {
  if (Number(id.split('-')[0]) >= 20) return finalPractice(id, seed);
  if (Number(id.split('-')[0]) >= 9) return advancedPractice(id, seed);
  if (Number(id.split('-')[0]) >= 5) return phaseFourPractice(id, seed);
  const rng = new Rng(seed),
    rankName = (r: number) =>
      [
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        'ten',
        'jack',
        'queen',
        'king',
        'ace',
      ][r - 2];
  return Array.from({ length: 5 }, (_, index): Problem => {
    const r = 2 + rng.int(13);
    switch (id) {
      case '0-1': {
        if (index === 0 || index === 4) {
          const paid = 5 * (1 + rng.int(6)),
            bet = paid + 5 * (1 + rng.int(8));
          return numeric(
            `You have put ${paid} chips into this round. The amount to match is ${bet}. How many more chips make the call?`,
            learningFacts.callAmount(bet, paid),
            ['C', `${bet}-${paid}`],
            'A call adds only the difference. Earlier-round chips are already in the pot and are not subtracted from this round’s call.',
          );
        }
        if (index === 1) {
          const streets = ['flop', 'turn', 'river'] as const,
            street = streets[rng.int(streets.length)];
          return numeric(
            `How many community cards are on the table after the ${street}?`,
            learningFacts.boardAfter(street),
            ['N_{\\mathrm{board}}'],
            'The flop deals three cards together; the turn and river add one each. Hole cards are private and are not part of this count.',
          );
        }
        if (index === 2) {
          const bet = rng.int(2) * 10;
          return numeric(
            `You face ${bet} chips to call. Can you check? Enter 1 for yes or 0 for no.`,
            bet === 0 ? 1 : 0,
            ['I(C=0)', `I(${bet}=0)`],
            bet === 0
              ? 'With nothing to match, checking keeps you in without adding chips.'
              : 'Facing an unmatched bet, choose a call, a legal raise, or a fold; checking is unavailable.',
          );
        }
        const seats = 2 + rng.int(5),
          seat = 1 + rng.int(seats);
        return numeric(
          `Seats run clockwise from 1 to ${seats}. The button is at seat ${seat}. Which seat gets the button next hand?`,
          learningFacts.nextButton(seat, seats),
          ['B_{\\mathrm{next}}', `${seat}\\bmod ${seats}+1`],
          'Move one seat clockwise and wrap from the final seat to seat 1. The button marks the nominal dealer.',
        );
      }
      case '0-2': {
        if (index === 4) {
          const seats = 2 + rng.int(5),
            seat = 1 + rng.int(seats);
          return numeric(
            `At a ${seats}-seat table, the button is at seat ${seat}. Number seats clockwise. Which seat is first to act after the flop if everyone is still in?`,
            learningFacts.nextButton(seat, seats),
            ['S_{\\mathrm{first}}', `${seat}\\bmod ${seats}+1`],
            'After the flop, action starts with the first active seat left of the button. With two players, that is the big blind.',
          );
        }
        const cards = shuffle(deck(), rng),
          first = cards.slice(0, 5),
          second = cards.slice(5, 10),
          a = evaluateReference(first),
          b = evaluateReference(second);
        const winner =
          a.strength === b.strength ? 0 : a.strength > b.strength ? 1 : 2;
        return numeric(
          `Hand 1: ${first.map(formatCard).join(' ')}. Hand 2: ${second.map(formatCard).join(' ')}. Which wins? Enter 1 or 2, or 0 for a tie.`,
          winner,
          ['\\operatorname{winner}(H_1,H_2)'],
          `Hand 1 is ${a.name.toLowerCase()}; hand 2 is ${b.name.toLowerCase()}. Compare category first, then the ranks that define that category, then kickers from highest to lowest. Suits never break ties. Best fives: ${a.bestFive.map(formatCard).join(' ')} and ${b.bestFive.map(formatCard).join(' ')}.`,
        );
      }
      case '1-1': {
        const count = [4, 13, 26][rng.int(3)],
          label =
            count === 4
              ? `a ${rankName(r)}`
              : count === 13
                ? ['a club', 'a diamond', 'a heart', 'a spade'][rng.int(4)]
                : 'a red card';
        return {
          prompt: `Draw one card from a fresh deck. What is P(${label})? Give a fraction.`,
          answer: new Rational(count, 52),
          lines: [
            'P(E)',
            `\\frac{${count}}{52}`,
            fractionTex(new Rational(count, 52)),
          ],
          explanation: `There are ${count} favorable physical cards among ${learningFacts.deck().cards} equally likely outcomes. Count cards, not just rank names.`,
        };
      }
      case '1-2': {
        const denominator = [2, 4, 5, 10, 20, 25, 50][rng.int(7)],
          p = new Rational(1, denominator);
        const prompts = [
          `Write ${p.toString()} as a percent. Include the % sign.`,
          `Write ${p.display().percent} as a fraction.`,
          `Write ${p.toString()} as “1 in N”.`,
          `Write ${p.toString()} as “N : 1” odds against.`,
          `Write ${p.display().against} as a probability fraction.`,
        ];
        return {
          prompt: prompts[index],
          answer: p,
          lines:
            index === 0
              ? ['100P', `100\\cdot${fractionTex(p)}`, `${100 / denominator}`]
              : index === 2
                ? ['1/P', `${denominator}`]
                : index === 3
                  ? ['(1-P)/P', `${denominator}-1`, `${denominator - 1}`]
                  : ['P', fractionTex(p)],
          explanation: `All four expressions describe ${p.display().fraction}: ${p.display().percent}; ${p.display().oneIn}; ${p.display().against}. Percent counts favorable outcomes per hundred. “One in” includes the favorable outcome; odds against count only unfavorable outcomes per favorable outcome.`,
        };
      }
      case '2-1': {
        const second = index % 2 === 0 ? r : 2 + rng.int(13),
          event = { kind: 'orderedRanks' as const, first: r, second };
        return {
          prompt: `Without replacing the first card, what is P(first a ${rankName(r)}, then a ${rankName(second)})? Give a fraction.`,
          answer: experimentProbability(event),
          lines: lessonDerivation(event),
          explanation: `The first draw has four matching cards out of the full deck. After that draw, ${second === r ? 'three' : 'four'} cards of the second requested rank remain among 51 cards. Multiply along this particular path; do not add the two stages.`,
        };
      }
      case '2-2': {
        const n = 3 + rng.int(4),
          k = index % 2 === 0 ? n : 1 + rng.int(n - 1),
          count = learningFacts.orderedSelections(n, k);
        return numeric(
          `There are ${n} distinct labeled cards. How many ways can you deal ${k} of them into an ordered row without replacement? Give an integer.`,
          count,
          [
            'N',
            `\\frac{${n}!}{(${n}-${k})!}`,
            Array.from({ length: k }, (_, i) => n - i).join('\\cdot'),
          ],
          `Each new position has one fewer available card. Stop after ${k} positions. Changing their order creates another outcome.`,
        );
      }
      case '3-1': {
        const n = 4 + rng.int(5),
          k = 2 + rng.int(Math.min(n - 1, 4) - 1);
        return numeric(
          `Choose a set of ${k} cards from ${n} distinct cards. Order does not matter. How many sets?`,
          learningFacts.combinations(n, k),
          [
            'N',
            `\\frac{${n}!}{${k}!(${n}-${k})!}`,
            `\\frac{${learningFacts.orderedSelections(n, k)}}{${learningFacts.permutations(k)}}`,
          ],
          `Each set was counted ${learningFacts.permutations(k)} times among the ordered rows. Dividing removes precisely those repeated orderings.`,
        );
      }
      case '3-2': {
        if (index < 3) {
          const kind = ['pair', 'suited', 'offsuit'] as const;
          const key = kind[(index + rng.int(3)) % 3],
            count = facts.combosPerClass()[key];
          return numeric(
            `How many physical combos belong to one particular ${key === 'pair' ? `${rankName(r)}-${rankName(r)} pair` : key + ' non-pair'} hand class?`,
            count,
            [
              'N',
              key === 'pair'
                ? '\\binom{4}{2}'
                : key === 'suited'
                  ? '4'
                  : '4\\cdot 3',
            ],
            key === 'pair'
              ? 'Choose two of the four suits for the repeated rank.'
              : key === 'suited'
                ? 'Choose the shared suit; both requested ranks are then fixed.'
                : 'Choose the first rank’s suit, then any of the other suits for the second rank. The ranks themselves identify the two cards, so do not divide by two.',
          );
        }
        const event =
          index === 3
            ? { kind: 'pair' as const }
            : { kind: 'pocketRank' as const, rank: r };
        return {
          prompt:
            index === 3
              ? 'What is the probability of any pocket pair? Give a fraction.'
              : `What is the probability of pocket ${rankName(r)}s? Give a fraction.`,
          answer: experimentProbability(event),
          lines: lessonDerivation(event),
          explanation:
            'The denominator counts all equally likely physical two-card combos. Count the favorable combos first; hand classes are not equally likely.',
        };
      }
      case '4-1': {
        const event = { kind: 'atLeastRank' as const, rank: r };
        if (index % 2 === 0)
          return {
            prompt: `Your two hole cards come from a fresh deck. What is the chance of at least one ${rankName(r)}? Give a fraction.`,
            answer: experimentProbability(event),
            lines: lessonDerivation(event),
            explanation: `No ${rankName(r)} means choosing both cards from the other 48. Subtract that probability from one. The result includes one matching card and two matching cards.`,
          };
        const p = learningFacts.complement(experimentProbability(event));
        return {
          prompt: `What is the probability that neither hole card is a ${rankName(r)}? Give a fraction.`,
          answer: p,
          lines: [
            'P(N_R=0)',
            '\\frac{\\binom{48}{2}}{\\binom{52}{2}}',
            `\\frac{${learningFacts.combinations(48, 2)}}{${facts.startingCombos()}}`,
            fractionTex(p),
          ],
          explanation:
            'Both cards must come from the nonmatching ranks. This event and “at least one” are disjoint and exhaust all possible hands.',
        };
      }
      case '4-2': {
        const s = rng.int(4),
          names = ['club', 'diamond', 'heart', 'spade'];
        const event =
          index % 2 === 0
            ? { kind: 'rankOrSuit' as const, rank: r, suit: s }
            : {
                kind: 'eitherSuit' as const,
                first: s,
                second: (s + 1 + rng.int(3)) % 4,
              };
        return {
          prompt:
            event.kind === 'rankOrSuit'
              ? `Draw one card. What is P(a ${rankName(r)} or a ${names[s]})? “Or” includes both. Give a fraction.`
              : `Draw one card. What is P(a ${names[event.first]} or a ${names[event.second]})? Give a fraction.`,
          answer: experimentProbability(event),
          lines: lessonDerivation(event),
          explanation:
            event.kind === 'rankOrSuit'
              ? `The ${rankName(r)} of ${names[s]}s belongs to both groups. Add the four cards of the rank and the thirteen cards of the suit, then subtract the shared card once.`
              : 'A physical card has only one suit. These events cannot happen together on a single draw, so the overlap is empty and you can add their counts.',
        };
      }
      default:
        throw new Error('Unknown practice lesson.');
    }
  });
}
function decimal(value: string): Rational | null {
  if (!/^-?\d+(?:\.\d+)?$/.test(value) || value.length > 40) return null;
  const [whole, part = ''] = value.split('.');
  return new Rational(BigInt(whole + part), 10n ** BigInt(part.length));
}
export function parseAnswer(text: string): Rational | null {
  const value = text.trim().toLowerCase();
  if (value.length > 100) return null;
  const oneIn = /^1\s+in\s+(.+)$/.exec(value);
  if (oneIn) {
    const n = decimal(oneIn[1]);
    return n && n.numerator > 0n
      ? new Rational(n.denominator, n.numerator)
      : null;
  }
  const odds = /^(.+?)\s*:\s*1(?:\s+against)?$/.exec(value);
  if (odds) {
    const n = decimal(odds[1]);
    return n && n.numerator >= 0n
      ? new Rational(n.denominator, n.numerator + n.denominator)
      : null;
  }
  if (value.endsWith('%')) {
    const n = decimal(value.slice(0, -1).trim());
    return n ? n.multiply(new Rational(1, 100)) : null;
  }
  const fraction = /^(-?\d+)\s*\/\s*(\d+)$/.exec(value);
  if (fraction)
    return BigInt(fraction[2]) > 0n
      ? new Rational(BigInt(fraction[1]), BigInt(fraction[2]))
      : null;
  return decimal(value);
}
export function isCorrect(answer: string, problem: Problem): boolean {
  return parseAnswer(answer)?.compare(problem.answer) === 0;
}
