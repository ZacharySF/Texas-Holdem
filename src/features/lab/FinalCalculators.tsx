import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { finalFacts } from '../../content/facts';
import { Rational } from '../../engine/math';
import { parseCards, type Hand } from '../../engine/cards';
import { EquityExperiment } from '../../ui/EquityExperiment';
import { FinalExperiment } from '../../ui/FinalExperiment';
import { ExactValue } from '../learn/NotebookBlock';
import { SeriesChart } from '../../ui/SeriesChart';
import { newSeed } from './state';
export default function FinalCalculators() {
  const { calculator } = useParams(),
    [params, setParams] = useSearchParams(),
    [fallback] = useState(newSeed),
    seed = params.get('seed') ?? fallback;
  useEffect(() => {
    if (!params.has('seed')) {
      const next = new URLSearchParams(params);
      next.set('seed', seed);
      setParams(next, { replace: true });
    }
  }, [params, seed, setParams]);
  const text = (key: string, initial: string) => params.get(key) ?? initial,
    num = (key: string, initial: number) => Number(text(key, String(initial)));
  let body;
  try {
    if (calculator === 'icm') {
      const stacks = text('stacks', '50,30,20').split(',').map(Number),
        prizes = text('prizes', '50,30,20').split(',').map(Number),
        values = finalFacts.icm(stacks, prizes),
        risk = num('risk', 10),
        bubble = finalFacts.bubbleFactor(stacks, prizes, 0, 1, risk);
      body = (
        <>
          {values.map((p, i) => (
            <p key={i}>
              Seat {i + 1}: expected prize {p.toString()} ={' '}
              {p.toNumber().toFixed(4)}.
            </p>
          ))}
          <p>
            Seat 1 prize loss on losing {risk} chips:{' '}
            {bubble.loss.toNumber().toFixed(4)}; gain on winning them:{' '}
            {bubble.gain.toNumber().toFixed(4)}. Bubble factor (loss/gain):{' '}
            {bubble.ratio?.toNumber().toFixed(4) ?? 'undefined'}.
          </p>
          {bubble.breakEven && (
            <ExactValue
              label="Break-even chance for this equal chip swing"
              value={bubble.breakEven}
            />
          )}
          <FinalExperiment
            request={{ type: 'icm', stacks, prizes, seed, samples: 10000 }}
          />
          <p>
            Malmuth–Harville ICM assigns each next finish in proportion to
            remaining chips. It ignores skill, positions, blinds, and future
            strategy. Zero stacks split the remaining lower prizes; the
            finishing-order simulator requires strictly positive stacks.
          </p>
          <Link to="/learn/23-2">Derive ICM and prize-risk asymmetry</Link>
        </>
      );
    } else if (calculator === 'sizing') {
      const p = new Rational(num('wins', 55), 100),
        odds = new Rational(num('odds', 1)),
        fraction = num('fraction', 0.1),
        kelly = finalFacts.kelly(p, odds),
        growth = finalFacts.logGrowth(p.toNumber(), odds.toNumber(), fraction),
        start = num('bankroll', 10),
        target = num('target', 20),
        ruin = finalFacts.ruinChance(p, start, target);
      body = (
        <>
          <p>
            Full Kelly fraction: {kelly.toString()}. Expected natural-log growth
            at the selected fraction: {growth.toFixed(6)} per trial. This sizing
            model assumes independent repeatable payoffs, correct probabilities,
            no costs, and divisible wealth. Overestimating an edge can make this
            sizing harmful; this is a teaching model, not a recommended wager.
          </p>
          <SeriesChart
            label="Expected log growth versus fraction from zero through nine tenths"
            series={[
              {
                name: 'Growth',
                values: Array.from({ length: 19 }, (_, i) =>
                  finalFacts.logGrowth(p.toNumber(), odds.toNumber(), i / 20),
                ),
              },
            ]}
          />
          <FinalExperiment
            request={{
              type: 'growth',
              p: num('wins', 55),
              d: 100,
              odds: num('odds', 1),
              fraction,
              hands: 100,
              seed,
              samples: 10000,
            }}
          />
          <ExactValue
            label="Ruin before target: fixed one-unit even-money steps"
            value={ruin}
          />
          <p>
            This ruin calculation uses fixed even-money stakes, independently of
            the odds and fraction above. It stops at zero or the target; it is
            not the fractional-Kelly process.
          </p>
          <FinalExperiment
            request={{
              type: 'ruin',
              p: num('wins', 55),
              d: 100,
              bankroll: start,
              target,
              seed,
              samples: 10000,
            }}
          />
          <Link to="/learn/24-2">
            Build logarithms and Kelly from multipliers
          </Link>
        </>
      );
    } else if (calculator === 'insurance') {
      const players = [
          parseCards('As Ad') as unknown as Hand,
          parseCards('Ks Kd') as unknown as Hand,
        ],
        board = parseCards('2c 3d 7h 9s'),
        facts = finalFacts.riverRunoutFacts(players, board),
        benefit = num('benefit', 100),
        loading = new Rational(num('loading', 10), 100),
        price = finalFacts.insurance(facts.loss, benefit, loading);
      body = (
        <>
          <p>
            You hold As Ad against Ks Kd on 2c 3d 7h 9s. Insurance pays only
            when your final pot share is zero. Ties do not trigger it. Enumerate
            every possible river to price this contract.
          </p>
          <ExactValue label="Insured-event chance" value={facts.loss} />
          <p>
            Fair premium: {price.fair.toString()} chips; charged premium:{' '}
            {price.premium.toString()}; buyer EV: {price.buyerEV.toString()}{' '}
            chips. A margin reduces expected wealth even when insurance reduces
            uncertainty.
          </p>
          <EquityExperiment
            input={{ players, board, seed, samples: 10000, method: 'auto' }}
          />
          <FinalExperiment
            request={{ type: 'runouts', players, board, seed, samples: 10000 }}
          />
          <p>
            Running twice preserves expected fractional pot share. The second
            river is drawn without replacement; its covariance with the first is
            included in the exact variance. Table awards round fractional chips
            only after combining both boards.
          </p>
          <Link to="/learn/21-2">Insurance derivation</Link>
        </>
      );
    } else {
      const pot = num('pot', 150),
        risk = num('risk', 50),
        call = num('call', 50),
        f = new Rational(num('fold', 30), 100),
        e = new Rational(num('equity', 40), 100),
        r = finalFacts.pushFold(pot, risk, call, f, e),
        toy = finalFacts.pushToyEquilibrium();
      body = (
        <>
          <p>
            EV(fold) = 0 additional chips. EV(shove) = {r.ev.toString()} chips.
            Conditional called EV = {r.called.toString()} chips. The opponent
            can only call or fold; equity is against the calling range, not the
            original range. Exclude uncallable excess from risk. No rake or
            future streets are modeled.
          </p>
          <FinalExperiment
            request={{
              type: 'finite',
              outcomes: [pot, pot + call, -risk],
              weights: [
                num('fold', 30) * 100,
                (100 - num('fold', 30)) * num('equity', 40),
                (100 - num('fold', 30)) * (100 - num('equity', 40)),
              ],
              seed,
              samples: 10000,
            }}
          />
          <h2>An exact small-game Nash range</h2>
          <p>
            Three cards Q, K, A, one per player without replacement; each antes
            one. First player folds or shoves one additional chip; second folds
            or calls. These are ranges for this toy game, not a Hold’em chart.
            No player improves by changing only their own range.
          </p>
          <table>
            <caption>Conditional action frequencies by private rank</caption>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Push</th>
                <th>Call</th>
              </tr>
            </thead>
            <tbody>
              {['Q', 'K', 'A'].map((label, i) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{toy.push[i].toString()}</td>
                  <td>{toy.call[i].toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            First-player equilibrium payoff including the ante:{' '}
            {toy.value.toString()} chips per deal. Actual Hold’em push/fold
            ranges depend on every legal combo, stack, position, and payout
            model; these supplied-equity calculations do not solve that larger
            game.
          </p>
          <Link to="/learn/23-1">Push/fold assumptions and Nash ranges</Link>
        </>
      );
    }
  } catch (error) {
    body = (
      <>
        <p role="alert">
          {error instanceof Error ? error.message : 'Invalid parameters.'}
        </p>
        <button onClick={() => setParams({ seed })}>Reset inputs</button>
      </>
    );
  }
  return (
    <main className="tool-page">
      <span className="eyebrow">LAB / {calculator?.toUpperCase()}</span>
      <h1>
        {calculator === 'icm'
          ? 'ICM and bubble factor'
          : calculator === 'sizing'
            ? 'Risk of ruin and Kelly'
            : calculator === 'insurance'
              ? 'Insurance and running twice'
              : 'Push or fold'}
      </h1>
      <p>
        Seed: <code>{seed}</code>. Inputs are retained in this URL.
      </p>
      <form
        key={calculator + params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget),
            next = new URLSearchParams();
          for (const [k, v] of data.entries()) next.set(k, String(v));
          next.set('seed', seed);
          setParams(next, { replace: true });
        }}
      >
        <div className="tool-fields">
          {(fields[calculator ?? 'push'] ?? fields.push).map(
            ([key, label, initial]) => (
              <label key={key}>
                {label}
                <input name={key} defaultValue={text(key, initial)} required />
              </label>
            ),
          )}
        </div>
        <button>Apply inputs</button>
      </form>
      {body}
    </main>
  );
}

const fields: Record<string, string[][]> = {
  icm: [
    ['stacks', 'Chip stacks, seat order', '50,30,20'],
    ['prizes', 'Prizes, highest first', '50,30,20'],
    ['risk', 'Equal chip swing between seats 1 and 2', '10'],
  ],
  sizing: [
    ['wins', 'Supplied win chance, percent', '55'],
    ['odds', 'Net win per unit risked (integer)', '1'],
    ['fraction', 'Fraction of wealth risked each trial', '0.1'],
    ['bankroll', 'Fixed-unit ruin model: starting units', '10'],
    ['target', 'Fixed-unit ruin model: target units', '20'],
  ],
  insurance: [
    ['benefit', 'Payout on the insured loss', '100'],
    ['loading', 'Seller loading, percent of fair premium', '10'],
  ],
  push: [
    ['pot', 'Pot before your shove', '150'],
    ['risk', 'Additional chips you risk', '50'],
    ['call', 'Additional opponent call', '50'],
    ['fold', 'Assumed opponent fold chance, percent', '30'],
    ['equity', 'Supplied equity when called, percent', '40'],
  ],
};
