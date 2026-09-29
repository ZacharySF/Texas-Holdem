import { learningFacts } from '../../content/facts';
import './learn.css';
import { useEffect, useRef, useState } from 'react';
import {
  modelTruth,
  binaryModel,
  type ModelSpec,
  type ModelResult,
} from '../../engine/models';
import type { AnalysisResponse } from '../../workers/analysisProtocol';
import { SeriesChart, Histogram } from '../../ui/SeriesChart';
import { ExactValue } from './NotebookBlock';
export function ModelCheck({
  model,
  seed,
}: {
  model: ModelSpec;
  seed: string;
}) {
  const [result, setResult] = useState<ModelResult | null>(null),
    [trace, setTrace] = useState<ModelResult[]>([]),
    [running, setRunning] = useState(false),
    [error, setError] = useState('');
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  function run(samples: number) {
    worker.current?.terminate();
    setResult(null);
    setTrace([]);
    setRunning(true);
    setError('');
    const w = new Worker(
      new URL('../../workers/analysis.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.current = w;
    w.onmessage = (event: MessageEvent<AnalysisResponse>) => {
      if (worker.current !== w) return;
      const m = event.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        w.terminate();
      } else if (m.kind === 'model') {
        setResult(m.value);
        setTrace((t) => [...t, ...m.trace]);
        if (m.type === 'result') {
          setRunning(false);
          w.terminate();
        }
      }
    };
    w.onerror = () => {
      setError('The worker stopped. Retry the same seed.');
      setRunning(false);
      w.terminate();
    };
    w.postMessage({ kind: 'model', model, seed, samples });
  }
  const truth = modelTruth(model),
    probability = binaryModel(model) || model.type === 'means';
  return (
    <section data-part="simulation" className="lesson-section">
      <h2>Run the experiment</h2>
      <p>
        Each trial resets this model. The seed reproduces the same draws. A
        sample mean averages the numerical result of each whole trial.
      </p>
      {probability ? (
        <ExactValue
          value={truth}
          label={
            model.type === 'means'
              ? 'Exact expected sample mean'
              : 'Exact event probability'
          }
        />
      ) : (
        <p>
          Exact expected value: {truth.toString()} ={' '}
          {truth.toNumber().toFixed(4)}{' '}
          {model.type === 'waiting' ? 'hands' : 'chips'}.
        </p>
      )}
      <div className="lesson-actions">
        {[1000, 10000, 100000].map((n) => (
          <button key={n} disabled={running} onClick={() => run(n)}>
            Run {n.toLocaleString()} trials
          </button>
        ))}
        {running && (
          <button
            onClick={() => {
              worker.current?.terminate();
              worker.current = null;
              setRunning(false);
            }}
          >
            Cancel experiment
          </button>
        )}
      </div>
      <p role="status">
        {running ? 'Running…' : result ? 'Experiment complete.' : 'Ready.'}
      </p>
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <p>
            {result.samples.toLocaleString()} trials · estimate{' '}
            {result.mean.toFixed(5)} ·{' '}
            {learningFacts.confidence().display().percent}{' '}
            {binaryModel(model) ? 'Wilson' : 'normal mean'} interval [
            {result.interval.map((n) => n.toFixed(5)).join(', ')}] · gap{' '}
            {(result.mean - result.truth).toFixed(5)}.
          </p>
          <p>
            Sample variance across trial results: {result.variance.toFixed(5)}.
            Normal intervals are approximate, pointwise, and need enough
            nondegenerate trials; a single constant run does not establish a
            general law.
          </p>
          <SeriesChart
            label="Running average and uncertainty versus completed trials"
            series={[
              { name: 'Estimate', values: trace.map((p) => p.mean) },
              { name: 'Exact', values: trace.map(() => truth.toNumber()) },
              { name: 'Lower band', values: trace.map((p) => p.interval[0]) },
              { name: 'Upper band', values: trace.map((p) => p.interval[1]) },
            ]}
          />
          <Histogram
            label="Distribution of trial results"
            items={result.histogram}
          />
        </>
      )}
      <p>
        Four times as many independent trials approximately halves standard
        error. The histogram shows individual trial results; the interval
        describes uncertainty in their average. Waiting-time bars group ten
        hands, with a final overflow bin.
      </p>
    </section>
  );
}
