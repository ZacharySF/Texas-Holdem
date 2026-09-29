import { expect, it } from 'vitest';
import {
  equityCoachFacts,
  equityByHandExample,
  checkEquityCalculation,
} from './facts';
import { equity, type EquityInput } from '../engine/equity';
import { parseCards, type Hand } from '../engine/cards';
const hand = (text: string) => parseCards(text) as unknown as Hand;
const input: EquityInput = {
  players: [hand('2c 3c'), hand('4d 5d')],
  board: parseCards('As Ks Qs Js Ts'),
  method: 'monteCarlo',
  samples: 100,
  seed: '0123456789abcdef0123456789abcdef',
};
it('turns heads-up ties into half-pot credit instead of counting them as full wins', () => {
  expect(equityCoachFacts(equity(input))).toMatchObject({
    samples: 100,
    wins: 0,
    ties: 100,
    losses: 0,
    tieCredit: 50,
    credit: 50,
    equity: 0.5,
  });
});
it('uses the actual split for multiway ties and preserves outcome totals', () => {
  const result = equity({
    ...input,
    players: [...input.players, hand('6h 7h')],
  });
  const facts = equityCoachFacts(result);
  expect(facts.credit).toBeCloseTo(100 / 3, 12);
  expect(facts.tieCredit).toBeCloseTo(100 / 3, 12);
  expect(facts.equity).toBeCloseTo(1 / 3, 12);
  const mixed = equityCoachFacts(
    equity({ ...input, board: parseCards('As Ks Qs Js') }),
  );
  expect(mixed.wins + mixed.ties + mixed.losses).toBe(100);
  expect(mixed.credit / mixed.samples).toBeCloseTo(mixed.equity, 12);
});
it('accounts for outright wins and rejects unsupported estimate types', () => {
  const result = equity({
    ...input,
    players: [hand('Ac Ad'), hand('Kc Kd')],
    board: parseCards('Ah 7s 5d 4h 2s'),
  });
  expect(equityCoachFacts(result)).toMatchObject({
    wins: 100,
    ties: 0,
    losses: 0,
    credit: 100,
    equity: 1,
  });
  expect(() => equityCoachFacts({ ...result, method: 'exact' })).toThrow();
  expect(() => equityCoachFacts({ ...result, samples: 0 })).toThrow();
});

it('enumerates the manual river example and checks handwritten equity calculations', () => {
  const example = equityByHandExample();
  expect(example).toMatchObject({ known: 8, wins: 42, ties: 0, losses: 2 });
  expect(example.rivers).toHaveLength(44);
  expect(example.value.toString()).toBe('21/22');
  const exact = equity({
    players: [example.hero, example.opponent],
    board: example.board,
    method: 'exact',
    samples: 1,
    seed: input.seed,
  });
  expect(example.value.toNumber()).toBe(exact.players[0].equity.value);
  expect(checkEquityCalculation('95.45', example.value.toNumber())).toContain(
    'Correct',
  );
  expect(checkEquityCalculation('95.46', example.value.toNumber())).toContain(
    'Try again',
  );
  expect(checkEquityCalculation('50', example.value.toNumber())).toContain(
    'Try again',
  );
  for (const answer of ['', ' ', 'no', '-1', '101'])
    expect(checkEquityCalculation(answer, 0.5)).toContain('Enter a percentage');
});
