import { finalFacts as f, fractionTex } from './facts';
import { Rational } from '../engine/math';
import { parseCards, type Hand } from '../engine/cards';
import type { FinalRequest } from '../workers/final.worker';
export const riverExample = () => ({
  players: [
    parseCards('As Ad') as unknown as Hand,
    parseCards('Ks Kd') as unknown as Hand,
  ],
  board: parseCards('2c 3d 7h 9s'),
});
export function finalExample(id: string, n = 5) {
  const p = new Rational(n, 10),
    bet = n * 10,
    pot = 100;
  let answer: Rational, shortcut: Rational, lines: string[], label: string;
  switch (id) {
    case '20-1': {
      const rows = f.shufflePaths('naive'),
        total = rows.reduce((a, r) => a + r.count, 0);
      answer = new Rational(rows[n % rows.length].count, total);
      shortcut = new Rational(1, rows.length);
      label = `Chance of order ${rows[n % rows.length].order} with the naive shuffle`;
      lines = ['P(O)', `\\frac{${rows[n % rows.length].count}}{${total}}`];
      break;
    }
    case '20-2':
      answer = f.streakChance(1, 2, 3, n);
      shortcut = new Rational(Math.max(0, n - 2), 8);
      label = `At least one run of three wins in ${n} fair independent trials`;
      lines = [
        'P(R\\ge3)',
        `1-\\frac{${2n ** BigInt(n) - answer.numerator * (2n ** BigInt(n) / answer.denominator)}}{${2n ** BigInt(n)}}`,
      ];
      break;
    case '21-1': {
      const r = f.riverRunoutFacts(
        riverExample().players,
        riverExample().board,
      );
      answer = r.twiceVariance.multiply(new Rational(n * n));
      shortcut = r.independentVariance.multiply(new Rational(n * n));
      label = `Variance of the average of two distinct river awards for a ${n}-chip pot`;
      lines = [
        '\\operatorname{Var}((X+Y)/2)',
        `${n}^2(\\operatorname{Var}(S_1)+\\operatorname{Var}(S_2)+2\\operatorname{Cov}(S_1,S_2))/4`,
        `${n}^2(${fractionTex(r.variance)}+${fractionTex(r.covariance)})/2`,
      ];
      break;
    }
    case '21-2': {
      const r = f.insurance(p, 100, new Rational(1, 10));
      answer = r.buyerEV;
      shortcut = new Rational(0);
      label = `Insurance buyer EV: loss chance ${n}/10, benefit 100, loading one tenth`;
      lines = ['E[I-\\pi]', `(${n}/10)100-(1+1/10)(${n}/10)100`];
      break;
    }
    case '22-1':
      answer = f.bluffBreakEven(pot, bet);
      shortcut = new Rational(bet, pot);
      label = `Pure-bluff break-even fold chance: pot ${pot}, bet ${bet}`;
      lines = [
        'fP-(1-f)B=0',
        'f(P+B)=B',
        'f=B/(P+B)',
        `${bet}/(${pot}+${bet})`,
      ];
      break;
    case '22-2':
      answer = f.polarizedBluffs(pot, bet);
      shortcut = f.bluffBreakEven(pot, bet);
      label = `Balanced bluffs among bets: pot ${pot}, bet ${bet}`;
      lines = [
        'q(P+B)-(1-q)B=0',
        'q(P+2B)=B',
        'q=B/(P+2B)',
        `${bet}/(${pot}+2\\cdot${bet})`,
      ];
      break;
    case '23-1':
      answer = f.pushFold(100, 50, 50, p, new Rational(1, 4)).ev;
      shortcut = f.pushFold(
        100,
        50,
        50,
        new Rational(0),
        new Rational(1, 4),
      ).ev;
      label = `Shove EV: pot 100, risk/call 50, fold chance ${n}/10, called equity one quarter`;
      lines = ['E[X]', `(${n}/10)100+(1-${n}/10)((1/4)(100+50+50)-50)`];
      break;
    case '23-2':
      answer = f.icm([n, 10 - n], [100, 20])[0];
      shortcut = new Rational(n, 10).multiply(new Rational(120));
      label = `Seat 1 ICM prize: stacks ${n} and ${10 - n}, prizes 100 and 20`;
      lines = ['E[V_1]', `(${n}/10)100+(1-${n}/10)20`];
      break;
    case '24-1':
      answer = f.ruinChance(new Rational(1, 2), n, 10);
      shortcut = new Rational(0);
      label = `Fair fixed-unit walk: ruin before 10, starting ${n}`;
      lines = ['P(\\tau_0<\\tau_{10})', `(10-${n})/10`];
      break;
    case '24-2':
      answer = f.kelly(new Rational(5 + n, 10), new Rational(1));
      shortcut = answer.multiply(new Rational(1, 2));
      label = `Kelly fraction at even money, supplied success chance ${5 + n}/10`;
      lines = [
        'g(f)=p\\ln(1+f)+(1-p)\\ln(1-f)',
        'g\u0027(f)=p/(1+f)-(1-p)/(1-f)',
        'g\u0027(f)=0',
        'f=2p-1',
        `2(${5 + n}/10)-1`,
      ];
      break;
    default:
      answer = new Rational(n, n + 3);
      shortcut = new Rational(1, 2);
      label = `Regret matching: positive cumulative regrets ${n} and 3; probability of first action`;
      lines = [
        '\\sigma_1',
        `\\frac{\\max(0,${n})}{\\max(0,${n})+\\max(0,3)}`,
        `${n}/(${n}+3)`,
      ];
  }
  // Equation chains keep identities separate from the equal-value notebook.
  if (id === '22-1' || id === '22-2')
    lines = [
      id === '22-1' ? 'f' : 'q',
      id === '22-1' ? 'B/(P+B)' : 'B/(P+2B)',
      lines[3],
    ];
  if (id === '24-2')
    lines = ['f^*', '\\max(0,2p-1)', `\\max(0,2(${5 + n}/10)-1)`];
  return {
    answer,
    shortcut,
    label,
    lines: [...lines, fractionTex(answer)],
    gap: shortcut.add(answer.multiply(new Rational(-1))),
  };
}
export function finalRequest(id: string, seed: string): FinalRequest {
  const base = { seed, samples: 10000 };
  switch (id) {
    case '20-1':
      return { ...base, type: 'shuffle', method: 'naive' };
    case '20-2':
      return { ...base, type: 'streak', p: 1, d: 2, length: 3, trials: 5 };
    case '21-1':
      return { ...base, type: 'runouts', ...riverExample() };
    case '21-2':
      return { ...base, type: 'finite', outcomes: [45, -55], weights: [1, 1] };
    case '22-1':
      return { ...base, type: 'finite', outcomes: [100, -50], weights: [1, 2] };
    case '22-2':
      return { ...base, type: 'finite', outcomes: [150, -50], weights: [1, 3] };
    case '23-1':
      return {
        ...base,
        type: 'finite',
        outcomes: [100, 150, -50],
        weights: [4, 1, 3],
      };
    case '23-2':
      return { ...base, type: 'icm', stacks: [5, 5], prizes: [100, 20] };
    case '24-1':
      return { ...base, type: 'ruin', p: 1, d: 2, bankroll: 5, target: 10 };
    case '24-2':
      return {
        ...base,
        type: 'growth',
        p: 7,
        d: 10,
        odds: 1,
        fraction: f.kelly(new Rational(7, 10), new Rational(1)).toNumber(),
        hands: 100,
      };
    default:
      return { type: 'cfr', iterations: 10000 };
  }
}
