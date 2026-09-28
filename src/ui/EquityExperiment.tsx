import { useEffect, useRef, useState } from 'react';
import {
  planEquity,
  type EquityInput,
  type EquityResult,
} from '../engine/equity';
import type { WorkerResponse } from '../workers/protocol';
import { Probability, percent } from './Probability';
export function EquityExperiment({
  input,
  onResult,
}: {
  input: EquityInput;
  onResult?: (r: EquityResult) => void;
}) {
  const [result, setResult] = useState<EquityResult | null>(null),
    [reference, setReference] = useState<EquityResult | null>(null),
    [running, setRunning] = useState(false),
    [error, setError] = useState('');
  const worker = useRef<Worker | null>(null),
    key = JSON.stringify(input);
  useEffect(() => {
    worker.current?.terminate();
    worker.current = null;
    setResult(null);
    setReference(null);
    setRunning(false);
    setError('');
    return () => worker.current?.terminate();
  }, [key]);
  let feasible = false;
  try {
    feasible = planEquity(input).exactFeasible;
  } catch {
    /* The worker returns a readable input error on run. */
  }
  function run(exact: boolean) {
    worker.current?.terminate();
    setResult(null);
    setReference(null);
    setError('');
    setRunning(true);
    const w = new Worker(
      new URL('../workers/equity.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.current = w;
    w.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (worker.current !== w) return;
      const m = e.data;
      if (m.type === 'error') {
        setError(m.message);
        setRunning(false);
        w.terminate();
      } else if (m.type === 'reference') setReference(m.result);
      else {
        setResult(m.result);
        if (m.type === 'result') {
          setRunning(false);
          onResult?.(m.result);
          w.terminate();
        }
      }
    };
    w.onerror = () => {
      setError('Worker failed; retry the same seed.');
      setRunning(false);
      w.terminate();
    };
    w.postMessage({
      type: 'run',
      input: { ...input, method: exact ? 'exact' : 'monteCarlo' },
    });
  }
  return (
    <div>
      <div className="tool-actions">
        <button disabled={running} onClick={() => run(false)}>
          Simulate equity · {input.samples.toLocaleString()}
        </button>
        <button disabled={running || !feasible} onClick={() => run(true)}>
          Count exact equity
        </button>
        {running && (
          <button
            onClick={() => {
              worker.current?.terminate();
              worker.current = null;
              setRunning(false);
            }}
          >
            Cancel equity
          </button>
        )}
      </div>
      {!feasible && (
        <p className="hint">
          Exact enumeration exceeds the interactive budget. Monte Carlo reports
          its sampling error; adding board cards can make exact counting
          feasible.
        </p>
      )}
      <p role="status">
        {running
          ? 'Calculating…'
          : result?.complete
            ? 'Equity complete.'
            : 'Ready.'}
      </p>
      {error && <p role="alert">{error}</p>}
      {result && (result.method === 'monteCarlo' || result.complete) && (
        <>
          <p>
            {result.method === 'exact' ? 'Exact enumeration' : 'Monte Carlo'} ·{' '}
            {result.samples.toLocaleString()} deals.
          </p>
          <div className="tool-fields">
            {(['equity', 'win', 'tie', 'loss'] as const).map((k) => (
              <Probability
                key={k}
                label={k}
                value={result.players[0][k]}
                sampled={result.method === 'monteCarlo'}
              />
            ))}
          </div>
          {reference && (
            <>
              <Probability
                label="EXACT REFERENCE EQUITY"
                value={reference.players[0].equity}
                sampled={false}
              />
              <p>
                Gap:{' '}
                {percent(
                  result.players[0].equity.value -
                    reference.players[0].equity.value,
                )}
                .
              </p>
            </>
          )}
        </>
      )}
      <p className="hint">
        Equity is average pot share. The estimate treats each tied winner as an
        equal share, and removes every specified board and dead card.
      </p>
    </div>
  );
}
