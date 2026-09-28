import { useState } from 'react';
import { Link } from 'react-router';
import {
  advancedExample,
  advancedShortcut,
  advancedFacts,
  fractionTex,
} from '../../content/facts';
import { Rational } from '../../engine/math';
import { type ModelSpec, modelTruth } from '../../engine/models';
import { gridRange } from '../../engine/rangeGrid';
import { type EquityResult } from '../../engine/equity';
import { parseCards, type Hand } from '../../engine/cards';
import { useLesson } from './context';
import { NotebookBlock, ExactValue } from './NotebookBlock';
import { ModelCheck } from './ModelCheck';
import { EquityExperiment } from '../../ui/EquityExperiment';
export function AdvancedWorked() {
  const { lesson } = useLesson(),
    e = advancedExample(lesson.id),
    value = modelTruth(e.model);
  return (
    <section data-part="derivation" className="lesson-section">
      <span className="eyebrow">03 / THE NOTEBOOK</span>
      <h2>One step at a time</h2>
      <p>
        {e.title}. E means expected value; P means probability. A bar over X
        denotes an average. All parameters here describe the stated model.
      </p>
      <NotebookBlock lines={e.lines} />
      {e.unit === 'probability' ? (
        <ExactValue value={value} />
      ) : (
        <p>
          Exact expected value: {value.toString()} {e.unit}.
        </p>
      )}
    </section>
  );
}
export function AdvancedShortcut() {
  const { lesson } = useLesson(),
    s = advancedShortcut(lesson.id),
    e = advancedExample(lesson.id);
  return (
    <aside className="shortcut">
      <h3>A shortcut, with its error measured</h3>
      <p>{lesson.shortcut}</p>
      <p>
        Rounded: {s.approx.toString()}. Exact: {s.exact.toString()}. Signed
        error: {s.gap.toString()} ({s.gap.toNumber().toPrecision(4)}{' '}
        {e.unit === 'probability' ? 'probability units' : e.unit}). Rounding
        reduces writing; it does not change the underlying model.
      </p>
    </aside>
  );
}
const matchups = [
  ['Pair vs two overcards', 'Qs Qd', 'Ah Kc'],
  ['Pair vs one overcard', 'Qs Qd', 'Ah Jc'],
  ['Pair vs undercards', 'Qs Qd', 'Jh Tc'],
  ['Bigger vs smaller pair', 'As Ad', 'Ks Kd'],
  ['Domination', 'As Kd', 'Ah Qc'],
  ['Suited high cards', 'Ah Kh', 'Qs Qd'],
  ['Offsuit high cards', 'Ah Kc', 'Qs Qd'],
  ['Suited connectors', '8h 9h', 'As Kd'],
] as const;
function Matchups() {
  const [estimate, setEstimate] = useState<EquityResult | null>(null);
  const { seed } = useLesson(),
    [selected, setSelected] = useState(0),
    [opponents, setOpponents] = useState(1),
    [random, setRandom] = useState(false),
    m = matchups[selected];
  return (
    <div>
      <label>
        Matchup
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {matchups.map((m, i) => (
            <option key={m[0]} value={i}>
              {m[0]} · {m[1]} vs {m[2]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={random}
          onChange={(e) => setRandom(e.target.checked)}
        />{' '}
        Replace the specified opponent with random cards
      </label>
      <label>
        Opponents
        <select
          value={opponents}
          onChange={(e) => setOpponents(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <p>
        Additional opponents are random. Everyone reaches showdown; no future
        betting or folds. A coin-flip shortcut uses{' '}
        {advancedFacts.fairChance().toString()}; compare that reference with the
        measured equity and its interval.
      </p>
      <EquityExperiment
        input={{
          players: [
            parseCards(m[1]) as unknown as Hand,
            random ? 'random' : (parseCards(m[2]) as unknown as Hand),
            ...Array.from({ length: opponents - 1 }, () => 'random' as const),
          ],
          board: [],
          seed,
          samples: 10000,
          method: 'monteCarlo',
        }}
        onResult={setEstimate}
      />
      {estimate && (
        <p>
          Signed gap from the {advancedFacts.fairChance().toString()} coin-flip
          shortcut:{' '}
          {(
            (estimate.players[0].equity.value -
              advancedFacts.fairChance().toNumber()) *
            100
          ).toFixed(3)}{' '}
          percentage points. This comparison belongs to the last completed run;
          run again after changing the matchup.
        </p>
      )}
    </div>
  );
}
export function AdvancedSimulation() {
  const { lesson, seed } = useLesson(),
    e = advancedExample(lesson.id),
    [size, setSize] = useState(20),
    [choice, setChoice] = useState(0);
  let model: ModelSpec = e.model;
  if (model.type === 'means' || model.type === 'coverage')
    model = { ...model, size };
  if (lesson.id === '10-1' && choice)
    model = { type: 'binomial', trials: 20, p: 4, d: 5, hits: 16 };
  if (lesson.id === '10-2' && choice === 1)
    model = { type: 'waiting', p: 1, d: 221, within: 221 };
  if (lesson.id === '10-2' && choice === 2)
    model = { type: 'binomial', trials: 221, p: 1, d: 221, hits: 0 };
  return (
    <>
      {(e.model.type === 'means' || e.model.type === 'coverage') && (
        <label>
          Hands inside each trial
          <select
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          >
            {[1, 5, 20, 100].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
      {lesson.chapter === 10 && (
        <label>
          Experiment
          <select
            value={choice}
            onChange={(event) => setChoice(Number(event.target.value))}
          >
            <option value={0}>{e.title}</option>
            <option value={1}>
              {lesson.id === '10-1'
                ? 'Exactly sixteen wins among twenty'
                : 'See aces within 221 fresh hands'}
            </option>
            {lesson.id === '10-2' && (
              <option value={2}>
                Zero aces across 221 hands: compare binomial with Poisson
              </option>
            )}
          </select>
        </label>
      )}
      <p>
        {model.type === 'means'
          ? `Average of ${model.size} independent binary observations, supplied chance ${model.p}/${model.d}.`
          : model.type === 'coverage'
            ? `Interval coverage over repeated sets of ${model.size} observations, supplied chance ${model.p}/${model.d}.`
            : choice === 0
              ? e.title
              : lesson.id === '10-1'
                ? `Exactly ${'hits' in model ? model.hits : 0} wins in ${'trials' in model ? model.trials : 0} independent ${'p' in model && 'd' in model ? new Rational(model.p, model.d).toString() : ''} trials`
                : choice === 1
                  ? 'At least one pocket aces within 221 independent hands'
                  : 'Zero pocket aces across 221 independent hands; compare with the Poisson approximation above.'}
      </p>
      <ModelCheck key={JSON.stringify(model)} model={model} seed={seed} />
    </>
  );
}
export function AdvancedExamples() {
  const { lesson } = useLesson(),
    chapter = lesson.chapter,
    p = new Rational(4, 5),
    moments = advancedFacts.payoffMoments(p, 50, -50),
    updated = advancedFacts.betaUpdate(2, 2, 3, 10);
  if (chapter === 11) return <Matchups />;
  if (chapter === 9)
    return (
      <>
        <ExactValue
          label="At least one ace among six opposing cards after Qs Qd are removed"
          value={new Rational(1).add(
            advancedFacts
              .hypergeometric(50, 4, 6, 0)
              .multiply(new Rational(-1)),
          )}
        />
        <table>
          <caption>
            Pocket queens: chance at least one opponent has a higher pair
          </caption>
          <thead>
            <tr>
              <th>Opponents</th>
              <th>Exact</th>
              <th>Single-seat sum upper bound</th>
              <th>Overcount</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((n) => {
              const exact = advancedFacts.higherPair(12, n),
                shortcut = advancedFacts
                  .higherPair(12, 1)
                  .multiply(new Rational(n));
              return (
                <tr key={n}>
                  <td>{n}</td>
                  <td>{exact.display().percent}</td>
                  <td>{shortcut.display().percent}</td>
                  <td>
                    {
                      shortcut.add(exact.multiply(new Rational(-1))).display()
                        .percent
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  if (chapter === 10) {
    const exact = advancedFacts.binomial(221, 0, new Rational(1, 221)),
      approx = advancedFacts.poisson(1, 0);
    return (
      <>
        <p>
          Expected wait for aces: {advancedFacts.waitingAces().toString()}{' '}
          hands.
        </p>
        <ExactValue
          label={`Win all five supplied ${p.toString()} all-ins`}
          value={advancedFacts.fiveFavoriteWins()}
        />
        <ExactValue
          label="Exactly sixteen wins among twenty"
          value={advancedFacts.binomial(20, 16, p)}
        />
        <p>
          Zero aces in 221 hands: exact binomial {exact.toNumber().toFixed(6)};
          Poisson approximation with expected count one: {approx.toFixed(6)}.
          Signed error: {(approx - exact.toNumber()).toFixed(6)}.
        </p>
        <Link to="/lab/events">Compose repeated card events</Link>
      </>
    );
  }
  if (chapter === 12)
    return (
      <>
        <ExactValue
          label="No-rake call threshold: pot 150, call 50"
          value={advancedFacts.callThreshold()}
        />
        <NotebookBlock
          lines={[
            'EV_{\\mathrm{call}}',
            `${fractionTex(advancedFacts.callThreshold())}(150+50)-50`,
            advancedFacts
              .rakedCall(advancedFacts.callThreshold(), 150, 50, 0)
              .toString(),
          ]}
        />
        <p>
          With rake four, the same supplied equity produces{' '}
          {advancedFacts
            .rakedCall(advancedFacts.callThreshold(), 150, 50, 4)
            .toString()}{' '}
          chips of call EV.
        </p>
        <Link to="/arcade/call">Practice Call or Fold</Link>
      </>
    );
  if (chapter === 13)
    return (
      <>
        <svg
          className="data-chart"
          viewBox="0 0 420 180"
          role="img"
          aria-label="Decision: fold for zero; commit to two calls, then win for plus 250 or lose for minus 100"
        >
          <path
            d="M60 80L190 30M60 80L190 125M190 125L335 90M190 125L335 155"
            fill="none"
            stroke="currentColor"
          />
          <text x="5" y="75">
            Choose
          </text>
          <text x="140" y="22">
            Fold: 0
          </text>
          <text x="115" y="145">
            Call twice
          </text>
          <text x="290" y="80">
            Win: +250
          </text>
          <text x="290" y="175">
            Lose: −100
          </text>
        </svg>
        <p>
          Branch probabilities must be conditional on the earlier path. The toy
          model uses the supplied final chance. Its complete leaf payoffs
          include both calls; the current pot is 200.
        </p>
        <Link to="/play">Inspect the coach’s direct-model limits</Link>
      </>
    );
  if (chapter === 14)
    return (
      <>
        <NotebookBlock
          lines={[
            '\\operatorname{Var}(X)',
            'E[X^2]-E[X]^2',
            `${advancedFacts.payoffMoments(p, 50, -50).variance}`,
          ]}
        />
        <p>
          Mean {moments.mean.toString()} chips; variance{' '}
          {moments.variance.toString()} squared chips; standard deviation{' '}
          {moments.sd} chips.
        </p>
        <Link to="/lab/bankroll">Simulate outcomes, drawdowns, and ruin</Link>
        <p>
          <Link to="/stats">Compare actual and all-in-EV-adjusted results</Link>
        </p>
      </>
    );
  if (chapter === 15 || chapter === 17)
    return (
      <>
        <p>
          The standard-error ratio for four times as many independent
          observations is {advancedFacts.errorRatio(1000, 4000)}. For binary
          wins the single-trial variance is p × (1 − p); divide by hands per
          trial for the variance of their mean.
        </p>
        <Link to="/lab/bankroll">Explore path variation</Link>
      </>
    );
  if (chapter === 16)
    return (
      <>
        <ExactValue
          label={`Two-sided exact p-value: eight wins in twenty, null chance ${advancedFacts.fairChance().toString()}`}
          value={advancedFacts.binomialTwoSided(
            20,
            8,
            advancedFacts.fairChance(),
          )}
        />
        <p>
          Planning example: SD 100 bb per 100-hand block and target half-width 5
          bb/100 require approximately{' '}
          {advancedFacts.requiredHands(100, 5).toLocaleString()} hands under the
          independent normal model.
        </p>
        <Link to="/stats">Inspect your sample size and interval</Link>
      </>
    );
  if (chapter === 18)
    return (
      <>
        <RangeExampleExperiment />
        <p>
          Physical AA combos after exposing As: {advancedFacts.blockedAces()}.
          Count the remaining ace pairs; do not keep the original class weight
          unchanged as if the blocked combos survived.
        </p>
        <Link to="/lab/ranges">
          Edit a weighted range and inspect its equity distribution
        </Link>
        <p>
          <Link to="/arcade/combo">Practice Combo Counter</Link>
        </p>
      </>
    );
  return (
    <>
      <p>
        Prior pseudo-counts: 2 and 2. After 3 successes in 10 trials: alpha{' '}
        {updated.alpha}, beta {updated.beta}.
      </p>
      <ExactValue label="Posterior mean tendency" value={updated.mean} />
      <ExactValue
        label="Beta-binomial predictive chance of two successes in five"
        value={advancedFacts.betaBinomial(5, 2, updated.alpha, updated.beta)}
      />
      <p>
        Plugging in the mean as if it were known gives{' '}
        {advancedFacts.binomial(5, 2, updated.mean).display().percent}; compare
        its difference from the integrated prediction. This is a model
        approximation, not a rounding error.
      </p>
    </>
  );
}

function RangeExampleExperiment() {
  const { seed } = useLesson();
  return (
    <div>
      <h3>Check a weighted range on a concrete board</h3>
      <p>
        Hero range: AA and KK at weight 100, AKs at weight 30. Opponent: Qs Qd.
        Board: 2c 3d 7h 9s. Remove blockers, condition on compatible combos,
        then enumerate each river. Compare exact weighting with a sample.
      </p>
      <EquityExperiment
        input={{
          players: [
            gridRange({ AA: 100, KK: 100, AKs: 30 }),
            parseCards('Qs Qd') as unknown as Hand,
          ],
          board: parseCards('2c 3d 7h 9s'),
          seed,
          samples: 10000,
          method: 'auto',
        }}
      />
    </div>
  );
}

export function SuppliedChance() {
  const { lesson } = useLesson(),
    model = advancedExample(lesson.id).model;
  return (
    <>
      {'p' in model && 'd' in model
        ? new Rational(model.p, model.d).toString()
        : ''}
    </>
  );
}
export function RealizationInputs() {
  const s = advancedFacts.realizationSetup();
  return (
    <>
      In the example, raw equity {s.equity.toString()} of a {s.pot}-chip pot is
      the benchmark expected award; the model captures {s.capture.toString()} of
      that award before subtracting a {s.cost}-chip cost.
    </>
  );
}
