import { learningFacts } from '../../content/facts';
import { Link } from 'react-router';
import { directOptions, improvementOuts } from '../../engine/coach';
import { Rational } from '../../engine/math';
import type { PlayerView } from '../../engine/game';
import type { EquityResult } from '../../engine/equity';
import { Probability, percent, exactValue } from '../../ui/Probability';
import { PlayingCards } from '../../ui/PlayingCards';
export interface Assessment {
  equity: EquityResult;
  seed: string;
  reference?: EquityResult;
  options?: import('../../engine/payouts').TableOptions;
}
export function CoachPanel({
  view,
  assessment,
  raiseTo,
  foldPercent,
  onFoldPercent,
}: {
  view: PlayerView;
  assessment: Assessment;
  raiseTo: number;
  foldPercent: number;
  onFoldPercent: (value: number) => void;
}) {
  const result = assessment.equity,
    equity = new Rational(
      BigInt(result.players[0].equity.numerator),
      BigInt(result.players[0].equity.denominator),
    ),
    options = directOptions(
      view,
      equity,
      raiseTo,
      new Rational(foldPercent, 100),
    ),
    outs = improvementOuts(view.hand, view.board);
  return (
    <section className="panel coach-panel">
      <div className="section-head">
        <h2>Coach · your visible information</h2>
        <span className="eyebrow">DIRECT ODDS MODEL</span>
      </div>
      <p>
        Equity means your average share of the pot over possible outcomes,
        including ties. I estimate it from your cards, the board, and the hands
        each opponent might hold. I cannot see their hidden cards.
      </p>
      <Probability
        label={`YOUR EQUITY · MONTE CARLO · ${result.samples.toLocaleString()} SAMPLES`}
        value={result.players[0].equity}
        sampled
      />
      <details>
        <summary>Win, tie, and lose separately</summary>
        <div className="runout-spread">
          {(['win', 'tie', 'loss'] as const).map((key) => (
            <Probability
              key={key}
              label={key}
              value={result.players[0][key]}
              sampled
            />
          ))}
        </div>
      </details>
      {assessment.reference && (
        <p>
          Exact range equity:{' '}
          {percent(assessment.reference.players[0].equity.value)} · gap{' '}
          {(
            (result.players[0].equity.value -
              assessment.reference.players[0].equity.value) *
            100
          ).toFixed(3)}{' '}
          percentage points.
        </p>
      )}
      {assessment.options ? (
        <>
          <h3>Pot-by-pot call and raise model</h3>
          <p>
            Each pot is awarded only among its eligible seats, including ties
            and odd chips. All live opponents are assumed to call the chosen
            amount up to their stacks; no subsequent betting or folds are
            modeled. These are conditional values, not optimal-action claims.
            Whole-table equity above is descriptive and is not multiplied by the
            whole pot.
          </p>
          <table>
            <caption>
              {assessment.options.samples} sampled joint deals · net chips
              relative to folding ·{' '}
              {learningFacts.confidence().display().percent} sampling intervals
            </caption>
            <thead>
              <tr>
                <th>Action</th>
                <th>EV</th>
                <th>Interval</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Fold</th>
                <td>0</td>
                <td>0</td>
              </tr>
              <tr>
                <th>{view.legal.canCheck ? 'Check' : 'Call'}</th>
                <td>{assessment.options.call.toFixed(2)}</td>
                <td>
                  {assessment.options.callInterval
                    .map((n) => n.toFixed(2))
                    .join(' to ')}
                </td>
              </tr>
              {view.legal.canRaise && (
                <tr>
                  <th>Raise to {raiseTo}</th>
                  <td>{assessment.options.raise.toFixed(2)}</td>
                  <td>
                    {assessment.options.raiseInterval
                      .map((n) => n.toFixed(2))
                      .join(' to ')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <ul>
            {assessment.options.callPots.map((p, i) => (
              <li key={i}>
                Pot {i + 1}: {p.amount} chips; eligible seats{' '}
                {p.eligible.map((s) => s + 1).join(', ')}. Your expected award:{' '}
                {p.heroMean.toFixed(2)} chips.
              </li>
            ))}
          </ul>
          <p>
            Call EV = expected total award − {view.legal.toCall} chips at risk.
            Side pots generally have different equities, so there is no single
            break-even equity for all of them.
          </p>
        </>
      ) : (
        <>
          <div className="coach-metrics">
            <Probability
              label="BREAK-EVEN CALL EQUITY"
              value={exactValue(options.breakEven)}
              sampled={false}
            />
            <div>
              <h3>What does calling cost?</h3>
              <p>
                Chips you could win, including the current bet:{' '}
                {options.contestablePot} chips.
                <br />
                Call: {view.legal.toCall} chips.
              </p>
              <p>Call EV = equity × (pot + call) − call.</p>
              {options.uncallable > 0 && (
                <p>
                  {options.uncallable} uncallable chips are excluded because
                  they will be returned to the opponent.
                </p>
              )}
            </div>
          </div>
          <p>
            EV means expected value: the average net chip change in this model.
            Positive values mean an average gain; negative values mean an
            average loss. A single hand can turn out differently.
          </p>
          <label htmlFor="fold-estimate">
            Assumed chance the bot folds to your raise:{' '}
            {percent(foldPercent / 100)}
          </label>
          <input
            id="fold-estimate"
            type="range"
            min="0"
            max="100"
            step="1"
            value={foldPercent}
            onChange={(e) => onFoldPercent(Number(e.target.value))}
          />
          <p className="hint">
            This is your assumption, not a measured bot frequency. Called-raise
            equity is held equal to the current range estimate.
          </p>
          <table className="ev-table">
            <caption>
              Direct EV relative to folding; chips already in the pot are sunk
            </caption>
            <thead>
              <tr>
                <th>Option</th>
                <th>Estimated net chips</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Fold</th>
                <td>{options.fold.toFixed(2)}</td>
              </tr>
              {view.legal.canCheck ? (
                <tr>
                  <th>Check to showdown</th>
                  <td>{options.check.toFixed(2)}</td>
                </tr>
              ) : (
                <tr>
                  <th>Call</th>
                  <td>{options.call.toFixed(2)}</td>
                </tr>
              )}
              {view.legal.canRaise && (
                <tr>
                  <th>Raise to {raiseTo}</th>
                  <td>{options.raise.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="model-limit">
            Direct odds ignore future betting and depend on the range estimate.
            The raise model allows only a fold or call, assumes no re-raise, and
            caps risk at the effective stack. Close differences can be sampling
            noise; grades are comparisons within this model, not claims of
            optimal play.
          </p>
        </>
      )}
      {outs ? (
        <>
          <h3>{outs.cards.length} category-improvement outs</h3>
          <PlayingCards cards={outs.cards} highlight={outs.cards} />
          <div className="coach-metrics">
            <Probability
              label="HIT ON THE NEXT CARD"
              value={exactValue(outs.next)}
              sampled={false}
            />
            <Probability
              label="HIT THIS FIXED SET BY THE RIVER"
              value={exactValue(outs.byRiver)}
              sampled={false}
            />
          </div>
          <p className="hint">
            These highlighted cards improve your current made-hand category.
            They are not guaranteed winning outs; kickers, dirty outs, and an
            opponent’s stronger draw can change the winner. River odds mean
            hitting at least one card from this currently highlighted set, with
            your cards and the board removed.
          </p>
        </>
      ) : (
        <p>Improvement-card odds appear on the flop and turn.</p>
      )}
      <div className="coach-links">
        <Link to="/learn/1-2">Convert odds · lesson 1.2</Link>
        <Link to="/learn/3-1">Count card combinations · lesson 3.1</Link>
        <Link to="/learn/5-1">Known and dead cards · lesson 5.1</Link>
        <Link to="/learn/7-2">Read board texture · lesson 7.2</Link>
        <Link to="/learn/8-1">Next-card and river odds · lesson 8.1</Link>
        <Link to="/learn/8-2">Overlap and dirty outs · lesson 8.2</Link>
      </div>
      <div className="coach-links">
        <Link to="/learn/9-2">Table size and higher pairs</Link>
        <Link to="/learn/11-1">Preflop matchups</Link>
        <Link to="/learn/12-2">Call EV and rake</Link>
        <Link to="/learn/13-1">Multi-street decisions</Link>
        <Link to="/learn/14-2">Actual versus all-in EV</Link>
        <Link to="/learn/16-1">Intervals and sample size</Link>
        <Link to="/learn/17-1">Monte Carlo error</Link>
        <Link to="/learn/18-1">Ranges and blockers</Link>
        <Link to="/learn/19-1">Updating a range</Link>
        <Link to="/learn/20-2">Streaks and independence</Link>
        <Link to="/learn/21-1">Two runouts and covariance</Link>
        <Link to="/learn/21-2">Insurance premiums</Link>
        <Link to="/learn/22-1">Fold equity and semi-bluffs</Link>
        <Link to="/learn/22-2">Balanced river bets</Link>
        <Link to="/learn/23-1">Push/fold assumptions</Link>
        <Link to="/learn/23-2">Tournament prize value</Link>
        <Link to="/learn/24-2">Kelly and uncertain edges</Link>
        <Link to="/learn/25-2">What a solver bound proves</Link>
      </div>
      <details>
        <summary>Reproduce this estimate</summary>
        <code className="seed-code">{assessment.seed}</code>
        <p>
          Same visible cards, persona model, public action history, and seed
          reproduce this estimate. The deal seed remains hidden until the hand
          ends.
        </p>
      </details>
    </section>
  );
}
