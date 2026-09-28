import { CfrChart } from './CfrChart';
import { MeanChart, type MeanPoint } from './MeanChart';
import { useEffect, useRef, useState } from 'react';
import type {
  FinalRequest,
  FinalResponse,
  FinalResult,
} from '../workers/final.worker';
import { Histogram } from './SeriesChart';
import { finalFacts, learningFacts } from '../content/facts';
import { percent } from './Probability';
export function FinalExperiment({ request }: { request: FinalRequest }) {
  const [data, setData] = useState<FinalResult | null>(null),
    [points, setPoints] = useState<MeanPoint[]>([]),
    [trace, setTrace] = useState<{ x: number; y: number }[]>([]),
    [running, setRunning] = useState(false),
    [error, setError] = useState(''),
    [cancelled, setCancelled] = useState(false),
    worker = useRef<Worker | null>(null),
    key = JSON.stringify(request);
  useEffect(() => {
    worker.current?.terminate();
    worker.current = null;
    setData(null);
    setCancelled(false);
    setError('');
    setTrace([]);
    setPoints([]);
    setRunning(false);
    return () => worker.current?.terminate();
  }, [key]);
  function run() {
    setError('');
    setData(null);
    setCancelled(false);
    setError('');
    setTrace([]);
    setPoints([]);
    setRunning(true);
    const w = new Worker(
      new URL('../workers/final.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.current = w;
    w.onmessage = (e: MessageEvent<FinalResponse>) => {
      if (worker.current !== w) return;
      const m = e.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        w.terminate();
        return;
      }
      setData(m.data);
      setPoints((p) => [...p, ...m.trace.flatMap(meanPoint)]);
      setTrace((t) => [
        ...t,
        ...m.trace.flatMap((d) =>
          d.kind === 'cfr'
            ? [{ x: d.result.iterations, y: d.result.exploitability }]
            : [],
        ),
      ]);
      if (m.type === 'result') {
        setRunning(false);
        w.terminate();
      }
    };
    w.onerror = () => {
      setError('Worker stopped. Retry this experiment.');
      setRunning(false);
      w.terminate();
    };
    w.postMessage(request);
  }
  return (
    <div className="final-experiment">
      <div className="tool-actions">
        <button disabled={running} onClick={run}>
          Run experiment
        </button>
        {running && (
          <button
            onClick={() => {
              worker.current?.terminate();
              worker.current = null;
              setRunning(false);
              setCancelled(true);
            }}
          >
            Cancel experiment
          </button>
        )}
      </div>
      {points.length > 0 && (
        <>
          <p>
            Chart target:{' '}
            {data?.kind === 'shuffle'
              ? `frequency of ordering ${data.result.rows[0].order}`
              : data?.kind === 'icm'
                ? 'seat 1 prize'
                : data?.kind === 'runouts'
                  ? 'average pot share from two rivers'
                  : 'the stated trial outcome'}
            .
          </p>
          <MeanChart points={points} />
        </>
      )}
      <p role="status">
        {running
          ? 'Running…'
          : cancelled
            ? 'Cancelled. Completed trials remain visible.'
            : error
              ? 'Experiment stopped.'
              : data
                ? 'Experiment complete.'
                : 'Ready.'}
      </p>
      {error && <p role="alert">{error}</p>}
      {data?.kind === 'shuffle' && (
        <>
          <p>
            {data.result.samples.toLocaleString()} shuffles. Uniformity
            chi-square statistic {data.result.statistic.toFixed(3)}; five
            degrees of freedom; approximate p-value{' '}
            {data.result.pValue.toPrecision(4)}. Expected counts must be
            sufficiently large for this approximation. It tests uniformity, not
            whether a particular seed is fair.
          </p>
          <Histogram
            label="Observed ordering counts"
            items={data.result.rows.map((r, i) => ({
              value: i,
              count: r.observed,
            }))}
          />
          {data.result.rows.map((r) => (
            <p key={r.order}>
              {r.order}: exact {percent(r.exact)}, observed{' '}
              {percent(r.estimate)},{' '}
              {learningFacts.confidence().display().percent} Wilson interval{' '}
              {r.interval.map(percent).join(' to ')}; gap{' '}
              {percent(r.estimate - r.exact)}.
            </p>
          ))}
        </>
      )}
      {data?.kind === 'icm' && (
        <>
          <p>
            {data.result.samples.toLocaleString()} independent finishing orders.
          </p>
          {data.result.rows.map((r, i) => (
            <p key={i}>
              Seat {i + 1}: expected prize {r.exact.toFixed(4)}, observed{' '}
              {r.mean.toFixed(4)}, gap {(r.mean - r.exact).toFixed(4)},{' '}
              {learningFacts.confidence().display().percent}
              interval {r.interval.map((n) => n.toFixed(4)).join(' to ')}.
            </p>
          ))}
        </>
      )}
      {data?.kind === 'scalar' && (
        <p>
          {data.result.samples.toLocaleString()} trials · estimate{' '}
          {data.result.mean.toFixed(6)} ·{' '}
          {learningFacts.confidence().display().percent} interval{' '}
          {data.result.interval.map((n) => n.toFixed(6)).join(' to ')} ·
          exact/model value {data.result.exact.toFixed(6)} · gap{' '}
          {(data.result.mean - data.result.exact).toFixed(6)}. Interval is
          pointwise; it excludes model error.
        </p>
      )}
      {data?.kind === 'runouts' && (
        <>
          <p>
            {data.result.samples.toLocaleString()} paired trials, drawing two
            distinct rivers. Awards are fractional pot shares before
            integer-chip rounding.
          </p>
          <table>
            <caption>Mean share and variance</caption>
            <thead>
              <tr>
                <th>Quantity</th>
                <th>Sampled</th>
                <th>Exact</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  'single',
                  'twice',
                  'singleVariance',
                  'twiceVariance',
                  'covariance',
                ] as const
              ).map((k) => {
                const exact =
                  k === 'single' || k === 'twice'
                    ? data.result.exact.mean
                    : k === 'singleVariance'
                      ? data.result.exact.variance
                      : data.result.exact[k];
                return (
                  <tr key={k}>
                    <th>{k}</th>
                    <td>{data.result[k].toFixed(6)}</td>
                    <td>{exact.toFixed(6)}</td>
                    <td>{(data.result[k] - exact).toFixed(6)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p>
            Mean-share {learningFacts.confidence().display().percent} intervals:
            once {data.result.singleInterval.map(percent).join(' to ')}; twice{' '}
            {data.result.twiceInterval.map(percent).join(' to ')}. Variance and
            covariance are descriptive estimates; the intervals apply to the
            means.
          </p>
        </>
      )}
      {data?.kind === 'cfr' && (
        <>
          <p>
            {data.result.iterations.toLocaleString()} deterministic full-tree
            training iterations; no Monte Carlo sampling interval applies.
            Mean-strategy value {data.result.value.toFixed(6)} chips; exact
            equilibrium {finalFacts.kuhnExactValue().toString()}; gap{' '}
            {(
              data.result.value - finalFacts.kuhnExactValue().toNumber()
            ).toFixed(6)}
            . Exploitability {data.result.exploitability.toFixed(6)} chips per
            hand, computed by enumerating every pure best response.
          </p>
          <CfrChart points={trace} />
          <table>
            <caption>
              Average action frequencies: Q=0, K=1, A=2; p=check/fold,
              b=bet/call
            </caption>
            <thead>
              <tr>
                <th>Own rank: history</th>
                <th>Bet or call</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.result.strategy).map(([k, p]) => (
                <tr key={k}>
                  <th>{k || 'start'}</th>
                  <td>{percent(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function meanPoint(data: FinalResult): MeanPoint[] {
  switch (data.kind) {
    case 'scalar':
      return [data.result];
    case 'runouts':
      return [
        {
          samples: data.result.samples,
          mean: data.result.twice,
          interval: data.result.twiceInterval,
          exact: data.result.exact.mean,
        },
      ];
    case 'icm':
      return [{ samples: data.result.samples, ...data.result.rows[0] }];
    case 'shuffle':
      return [
        {
          samples: data.result.samples,
          mean: data.result.rows[0].estimate,
          interval: data.result.rows[0].interval,
          exact: data.result.rows[0].exact,
        },
      ];
    default:
      return [];
  }
}
