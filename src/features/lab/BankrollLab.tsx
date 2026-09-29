import { learningFacts } from '../../content/facts';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { BankrollResult } from '../../engine/bankroll';
import type { AnalysisResponse } from '../../workers/analysisProtocol';
import { newSeed } from './state';
import { Histogram, SeriesChart } from '../../ui/SeriesChart';
import { percent } from '../../ui/Probability';
export default function BankrollLab() {
  const [params, setParams] = useSearchParams(),
    [seed] = useState(() => params.get('seed') ?? newSeed()),
    [result, setResult] = useState<BankrollResult | null>(null),
    [running, setRunning] = useState(false),
    [error, setError] = useState('');
  const worker = useRef<Worker | null>(null);
  const values = {
    rate: Number(params.get('rate') ?? 5),
    sd: Number(params.get('sd') ?? 80),
    hands: Number(params.get('hands') ?? 10000),
    bankroll: Number(params.get('bankroll') ?? 1000),
    runs: Number(params.get('runs') ?? 1000),
  };
  const key = JSON.stringify(values);
  useEffect(() => {
    worker.current?.terminate();
    worker.current = null;
    setResult(null);
    setRunning(false);
    return () => worker.current?.terminate();
  }, [key]);
  function run() {
    setRunning(true);
    setError('');
    const next = new URLSearchParams(params);
    next.set('seed', seed);
    setParams(next, { replace: true });
    const w = new Worker(
      new URL('../../workers/analysis.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.current = w;
    w.onmessage = (e: MessageEvent<AnalysisResponse>) => {
      if (worker.current !== w) return;
      const m = e.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        w.terminate();
      } else if (m.kind === 'bankroll') {
        setResult(m.value);
        if (m.type === 'result') {
          setRunning(false);
          w.terminate();
        }
      }
    };
    w.onerror = () => {
      setError('Worker stopped. Retry this seed.');
      setRunning(false);
    };
    w.postMessage({ kind: 'bankroll', input: { ...values, seed } });
  }
  return (
    <main className="tool-page">
      <h1>The spread around a win rate</h1>
      <section className="panel tool-fields">
        {(Object.keys(values) as (keyof typeof values)[]).map((k) => (
          <label key={k}>
            {
              {
                rate: 'Win rate (bb/100)',
                sd: 'Standard deviation (bb per 100-hand block)',
                hands: 'Hands per path',
                bankroll: 'Starting bankroll (bb)',
                runs: 'Independent paths',
              }[k]
            }
            <input
              type="number"
              value={values[k]}
              onChange={(e) => {
                const p = new URLSearchParams(params);
                p.set(k, e.target.value);
                setParams(p, { replace: true });
              }}
            />
          </label>
        ))}
      </section>
      <p>
        Seed: <code>{seed}</code>
      </p>
      <p>
        Independent normal increments per 100-hand block; a shorter final block
        scales its mean and variance. Ruin means the bankroll touches zero at a
        block endpoint. Paths continue to measure unconstrained results after
        ruin. Within-block losses, serial dependence, changing stakes, and
        uncertain win rates are not modeled.
      </p>
      <button disabled={running} onClick={run}>
        Simulate bankroll paths
      </button>
      {running && (
        <button
          onClick={() => {
            worker.current?.terminate();
            worker.current = null;
            setRunning(false);
          }}
        >
          Cancel paths
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <p role="status">
            {result.runs.toLocaleString()} paths · mean {result.mean.toFixed(2)}{' '}
            bb · {learningFacts.confidence().display().percent} mean interval [
            {result.meanInterval.map((x) => x.toFixed(2)).join(', ')}].
          </p>
          <p>
            Model mean {result.expected.toFixed(2)} bb; gap{' '}
            {(result.mean - result.expected).toFixed(2)} bb. Model standard
            deviation {result.theoreticalSD.toFixed(2)} bb. This spread of
            outcomes is different from the uncertainty in their estimated mean.
          </p>
          <p>
            Ruin frequency {percent(result.ruin)} ·{' '}
            {learningFacts.confidence().display().percent} Wilson interval [
            {result.ruinInterval.map((x) => percent(x)).join(', ')}].
          </p>
          <SeriesChart
            label="First eight simulated cumulative results in big blinds"
            series={result.paths.map((values, i) => ({
              name: `Path ${i + 1}`,
              values,
            }))}
          />
          <Histogram
            label="Final results in big blinds"
            items={result.endings.map((value) => ({ value, count: 1 }))}
          />
          <Histogram
            label="Maximum peak-to-trough drawdown in big blinds"
            items={result.drawdowns.map((value) => ({ value, count: 1 }))}
          />
          <Histogram
            label="Longest time below a previous peak, in hands"
            items={result.longestDownswings.map((value) => ({
              value,
              count: 1,
            }))}
          />
        </>
      )}
      <details>
        <summary>Why these scales?</summary>
        <p>
          Mean grows with the number of independent blocks. Variance adds across
          blocks, so standard deviation grows with the square root of that
          count. Ruin is counted separately by inspecting the entire sampled
          path, not only the ending balance.
        </p>
        <Link to="/learn/14-1">Variance</Link> ·{' '}
        <Link to="/learn/15-2">Sample means and the central limit theorem</Link>
      </details>
      <Link to="/lab">Back to Equity Lab</Link>
    </main>
  );
}
