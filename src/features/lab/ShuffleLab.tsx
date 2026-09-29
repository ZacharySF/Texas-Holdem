import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { finalFacts } from '../../content/facts';
import { FinalExperiment } from '../../ui/FinalExperiment';
import { newSeed } from './state';
import type { ShuffleMethod } from '../../engine/shuffleLab';
export default function ShuffleLab() {
  const [params, setParams] = useSearchParams(),
    [fallback] = useState(newSeed),
    seed = params.get('seed') ?? fallback,
    method: ShuffleMethod =
      params.get('method') === 'fisherYates' ? 'fisherYates' : 'naive',
    counts = finalFacts.shufflePaths(method),
    total = counts.reduce((a, b) => a + b.count, 0),
    modulo = finalFacts.moduloCounts();
  useEffect(() => {
    if (!params.has('seed')) {
      const next = new URLSearchParams(params);
      next.set('seed', seed);
      setParams(next, { replace: true });
    }
  }, [params, seed, setParams]);
  return (
    <main className="tool-page">
      <h1>Shuffle Lab</h1>
      <p>
        Three labeled cards, 0, 1, and 2. Each random index has equally likely
        choices. Exhaustive enumeration visits every possible index sequence.
      </p>
      <label>
        Shuffle method
        <select
          aria-label="Shuffle method"
          value={method}
          onChange={(e) => setParams({ method: e.target.value, seed })}
        >
          <option value="naive">Swap each position with any position</option>
          <option value="fisherYates">Fisher–Yates shrinking choices</option>
        </select>
      </label>
      <p>
        Seed: <code>{seed}</code>
      </p>
      <button onClick={() => setParams({ method, seed: newSeed() })}>
        New seed
      </button>
      <table>
        <caption>{total} equally likely paths</caption>
        <thead>
          <tr>
            <th>Final ordering</th>
            <th>Paths</th>
            <th>Exact chance</th>
          </tr>
        </thead>
        <tbody>
          {counts.map((r) => (
            <tr key={r.order}>
              <th>{r.order}</th>
              <td>{r.count}</td>
              <td>
                {r.count}/{total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <FinalExperiment
        request={{ type: 'shuffle', method, seed, samples: 10000 }}
      />
      <details>
        <summary>Why rejection sampling?</summary>
        <p>
          An eight-outcome source reduced modulo three produces counts{' '}
          {modulo.biased.join(', ')}. Reject the incomplete final block (
          {modulo.discarded} source outcomes) and the remaining counts are{' '}
          {modulo.rejected.join(', ')}. Our generator uses the same construction
          with its full integer output space.
        </p>
      </details>
      <p>
        A small p-value is evidence against the uniform-ordering model for this
        fixed-size test, not a diagnosis of a gambling site. Avoid selecting
        only surprising seeds.
      </p>
      <Link to="/learn/20-1">Derive the shuffle counts and the test</Link>
    </main>
  );
}
