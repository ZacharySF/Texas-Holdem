import { learningFacts } from '../../content/facts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { loadHands } from '../play/storage';
import { readForecasts } from '../arcade/forecastStorage';
import { calibration } from '../../engine/decisionDrills';
import { brier, wilson, Z95 } from '../../engine/stats';
import { requiredHands } from '../../engine/inference';
import { SeriesChart } from '../../ui/SeriesChart';
import { percent } from '../../ui/Probability';
import type { StatsResponse } from '../../workers/stats.worker';
export default function Stats() {
  const [response, setResponse] = useState<StatsResponse | null>(null),
    [forecasts] = useState(() =>
      readForecasts().filter((f) => f.mode === 'guess'),
    ),
    [precision, setPrecision] = useState(5),
    [revision, setRevision] = useState(0),
    [cancelled, setCancelled] = useState(false);
  useEffect(() => {
    if (cancelled) return;
    let active = true;
    const worker = new Worker(
      new URL('../../workers/stats.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = (e: MessageEvent<StatsResponse>) => {
      if (active) setResponse(e.data);
    };
    worker.onerror = () =>
      setResponse({ type: 'error', message: 'Stats worker failed.' });
    void loadHands()
      .then((h) => {
        if (active) worker.postMessage(h);
      })
      .catch(() =>
        setResponse({
          type: 'error',
          message: 'Saved histories are unavailable.',
        }),
      );
    return () => {
      active = false;
      worker.terminate();
    };
  }, [revision, cancelled]);
  const data = response?.type === 'result' ? response : null,
    bins = calibration(forecasts);
  return (
    <main className="tool-page">
      <h1>Results and uncertainty</h1>
      <p>
        Completed saved hands only. An unfinished hand is not counted. Rates use
        each hand's own big blind, so changing stakes does not change its
        weight.
      </p>
      <div className="tool-actions">
        <button
          onClick={() => {
            setCancelled(false);
            setResponse(null);
            setRevision((n) => n + 1);
          }}
        >
          Refresh histories
        </button>
        {!data && !cancelled && (
          <button onClick={() => setCancelled(true)}>Cancel analysis</button>
        )}
      </div>
      {cancelled && <p>Analysis cancelled. Refresh to restart.</p>}
      {response?.type === 'progress' && (
        <p role="status">
          Analyzed {response.completed} / {response.total} hands.
        </p>
      )}
      {response?.type === 'error' && <p role="alert">{response.message}</p>}
      {data && (
        <>
          <section className="panel">
            <h2>{data.summary.rate.hands} hands played</h2>
            <p>
              Actual win rate: {data.summary.rate.rate.toFixed(2)} bb/100.
              Approximate {learningFacts.confidence().display().percent}{' '}
              interval:{' '}
              {data.summary.rate.interval
                ? data.summary.rate.interval
                    .map((n) => n.toFixed(2))
                    .join(' to ')
                : 'not available until two hands'}
              .
            </p>
            <p>
              Standard deviation: {data.summary.rate.sd.toFixed(2)} bb per
              100-hand block. Normal-approximation two-sided p-value against
              zero win rate:{' '}
              {data.summary.rate.pValue === null
                ? 'not estimable'
                : data.summary.rate.pValue.toPrecision(3)}
              .
            </p>
            <p>
              These calculations assume independent, similarly distributed
              hands. Small samples, changing opponents, and correlated play can
              make the interval unreliable. A p-value is not the probability
              that you are a losing player. Do not repeatedly stop sampling only
              when a result looks significant.
            </p>
            <label>
              Desired win-rate interval half-width (bb/100)
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={precision}
                onChange={(e) => setPrecision(Number(e.target.value))}
              />
            </label>
            <p>
              {precision > 0 &&
              Number.isFinite(precision) &&
              data.summary.rate.hands > 1
                ? `Estimated required hands at the observed SD: ${requiredHands(data.summary.rate.sd, precision).toLocaleString()}.`
                : 'Enter a positive precision; at least two hands are required.'}{' '}
              This is a planning estimate, not a guarantee of a stable edge.
            </p>
            <Link to="/learn/16-1">Why sample size matters</Link>
          </section>
          <section className="panel">
            <h2>Actual results versus all-in EV</h2>
            <SeriesChart
              label="Cumulative results in big blinds by completed hand"
              series={[
                { name: 'Actual', values: data.summary.actual },
                { name: 'All-in EV adjusted', values: data.summary.adjusted },
              ]}
            />
            <p>
              {data.summary.adjustedPots} pots adjusted using{' '}
              {data.summary.analysisSamples.toLocaleString()} exact or sampled
              runouts. Conservative{' '}
              {learningFacts.confidence().display().percent} numerical-error
              bound on the final adjusted total: ±
              {(Z95 * data.summary.adjustmentSE).toFixed(3)} bb.
            </p>
            <p>
              For each pot, replace its actual award with its expected award
              when contributions and eligible players first became fixed and at
              most one eligible player retained chips. Actual hole cards are
              used only after the hand ends. All other pots retain their actual
              awards. A later fold can delay this point. Exact enumeration is
              used for small runout spaces; otherwise each adjusted pot uses
              seeded simulations. The line removes only runout luck after these
              locks; it does not rate your decisions or remove earlier luck. The
              numerical-error bound excludes poker variance. For hands run
              twice, the expected award also deals two boards without
              replacement and uses the same final chip-rounding rule.
            </p>
            <Link to="/learn/14-2">Read the all-in EV lesson</Link>
          </section>
          <section className="panel">
            <h2>Decision grades by concept</h2>
            <p>
              Concepts are assigned from action and street. Gaps compare the
              chosen action with the coach's conditional model; they inherit its
              range, future-betting, and sampling limits.
            </p>
            {data.grades.length ? (
              data.grades.map((g) => (
                <p key={g.concept}>
                  {g.concept}: {g.count} graded decisions; {g.close} within half
                  a big blind of the best modeled option; mean gap{' '}
                  {g.gap.toFixed(3)} bb.
                </p>
              ))
            ) : (
              <p>No graded hero decisions yet.</p>
            )}
          </section>
        </>
      )}
      <section className="panel">
        <h2>Drill calibration</h2>
        <p>
          {forecasts.length} completed-set forecasts. Mean Brier score:{' '}
          {forecasts.length
            ? brier(
                forecasts.map((f) => f.prediction),
                forecasts.map((f) => f.outcome),
              ).toFixed(4)
            : '—'}
          .
        </p>
        <SeriesChart
          label="Calibration by prediction bin"
          series={[
            {
              name: 'Mean forecast',
              values: bins.filter((b) => b.count).map((b) => b.predicted),
            },
            {
              name: 'Observed pot-unit wins',
              values: bins.filter((b) => b.count).map((b) => b.observed),
            },
          ]}
        />
        {bins.map((b) => (
          <p key={b.low}>
            {percent(b.low)}–{percent(b.high)}: {b.count} forecasts; observed{' '}
            {b.count ? percent(b.observed) : '—'};{' '}
            {learningFacts.confidence().display().percent} Wilson interval{' '}
            {wilson(b.observed * b.count, b.count)
              .map(percent)
              .join(' to ')}
            .
          </p>
        ))}
        <SeriesChart
          label="Forecast squared errors over time"
          series={[
            {
              name: 'Brier score',
              values: forecasts.map((f) => (f.prediction - f.outcome) ** 2),
            },
          ]}
        />
        <p>
          Each forecast predicts one randomly selected pot unit, including
          seeded tie resolution. Independent trials, stable forecasts, and many
          observations are needed for useful calibration. Replay of a seed is
          not a new observation.
        </p>
        <Link to="/arcade/guess">Guess the Equity</Link>
      </section>
    </main>
  );
}
