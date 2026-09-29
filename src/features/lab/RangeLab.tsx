import { learningFacts } from '../../content/facts';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { parseCards, type Hand } from '../../engine/cards';
import {
  gridRange,
  presetRange,
  rangeCounts,
  type RangeWeights,
} from '../../engine/rangeGrid';
import { Rng } from '../../engine/rng';
import { Histogram } from '../../ui/SeriesChart';
import { RangeGrid } from '../../ui/RangeGrid';
import { EquityExperiment } from '../../ui/EquityExperiment';
import { Probability, percent } from '../../ui/Probability';
import type { HeatCell, HeatResponse } from '../../workers/heatmap.worker';
import { newSeed } from './state';
const initial = {
  weights: presetRange('tight'),
  hero: 'As Ah',
  board: '',
  dead: '',
  seed: '',
  versus: 'random' as 'random' | 'range',
};
export default function RangeLab() {
  const [params, setParams] = useSearchParams(),
    [fallback] = useState(newSeed),
    [paint, setPaint] = useState(100),
    [cells, setCells] = useState<Record<string, HeatCell>>({}),
    [skipped, setSkipped] = useState<string[]>([]),
    [running, setRunning] = useState(false),
    [error, setError] = useState(''),
    [inspect, setInspect] = useState('AA');
  const worker = useRef<Worker | null>(null);
  const raw = params.get('range');
  let state = { ...initial, seed: fallback };
  try {
    if (raw) {
      const v: unknown = JSON.parse(raw);
      if (v && typeof v === 'object') {
        const a = v as Record<string, unknown>;
        if (
          typeof a.hero === 'string' &&
          typeof a.board === 'string' &&
          typeof a.dead === 'string' &&
          typeof a.seed === 'string' &&
          a.weights &&
          typeof a.weights === 'object' &&
          (a.versus === 'range' || a.versus === 'random')
        ) {
          const weights = a.weights as RangeWeights;
          gridRange(weights);
          new Rng(a.seed);
          state = {
            hero: a.hero,
            board: a.board,
            dead: a.dead,
            seed: a.seed,
            weights,
            versus: a.versus,
          };
        }
      }
    }
  } catch {
    /* Invalid shared state falls back to a valid editable setup. */
  }
  const key = JSON.stringify(state);
  useEffect(() => {
    if (!raw) setParams({ range: key }, { replace: true });
    worker.current?.terminate();
    worker.current = null;
    setCells({});
    setSkipped([]);
    setRunning(false);
    return () => worker.current?.terminate();
  }, [key, raw, setParams]);
  const update = (patch: Partial<typeof state>) =>
    setParams(
      { range: JSON.stringify({ ...state, ...patch }) },
      { replace: true },
    );
  let board: number[] = [],
    dead: number[] = [],
    hero: Hand = [0, 1],
    validation = '';
  try {
    board = parseCards(state.board);
    dead = parseCards(state.dead);
    const h = parseCards(state.hero);
    if (h.length !== 2) throw new Error('Choose two hero cards.');
    hero = h as unknown as Hand;
    if (board.length > 5) throw new Error('At most five board cards.');
    gridRange(state.weights, [...hero, ...board, ...dead]);
    if (!gridRange(state.weights, [...hero, ...board, ...dead]).combos.length)
      throw new Error('No opponent combos remain after removal.');
  } catch (e) {
    validation = e instanceof Error ? e.message : 'Invalid cards.';
  }
  const counts = !validation
    ? rangeCounts(state.weights, [...hero, ...board, ...dead])
    : null;
  function heatmap() {
    if (validation) return;
    setRunning(true);
    setCells({});
    setSkipped([]);
    setError('');
    const w = new Worker(
      new URL('../../workers/heatmap.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.current = w;
    w.onmessage = (e: MessageEvent<HeatResponse>) => {
      if (worker.current !== w) return;
      const m = e.data;
      if (m.type === 'cell')
        setCells((c) => ({ ...c, [m.cell.label]: m.cell }));
      else if (m.type === 'skipped')
        setSkipped((s) => [...s, `${m.label}: ${m.message}`]);
      else {
        setRunning(false);
        w.terminate();
        if (m.type === 'error') setError(m.message);
      }
    };
    w.onerror = () => {
      setError('Heatmap worker stopped.');
      setRunning(false);
    };
    w.postMessage({
      weights: state.weights,
      versus: state.versus,
      board,
      dead,
      seed: state.seed,
      samples: 1000,
    });
  }
  const selected = cells[inspect];
  return (
    <main className="tool-page">
      <h1>Range editor</h1>
      <p>
        <Link to="/lab/charts">Starting-hand charts & reference →</Link>
      </p>
      <p>
        Pairs lie on the diagonal, suited hands above it, offsuit below it. Each
        cell is a hand class, not one equally likely outcome. The numbers show
        available physical combos and relative weight. Tap with the chosen
        weight to add or remove a class.
      </p>
      <section className="panel">
        <div className="tool-fields">
          <label>
            Hero cards
            <input
              value={state.hero}
              onChange={(e) => update({ hero: e.target.value })}
            />
          </label>
          <label>
            Board cards
            <input
              value={state.board}
              onChange={(e) => update({ board: e.target.value })}
            />
          </label>
          <label>
            Dead cards
            <input
              value={state.dead}
              onChange={(e) => update({ dead: e.target.value })}
            />
          </label>
          <label>
            Paint weight
            <input
              type="number"
              min="1"
              max="100"
              value={paint}
              onChange={(e) =>
                setPaint(
                  Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                )
              }
            />
          </label>
        </div>
        <div className="tool-actions">
          {(['all', 'pairs', 'tight', 'polarized'] as const).map((p) => (
            <button key={p} onClick={() => update({ weights: presetRange(p) })}>
              {p} preset
            </button>
          ))}
          <button onClick={() => update({ weights: {} })}>Clear range</button>
        </div>
        <RangeGrid
          weights={state.weights}
          paint={paint}
          onChange={(weights) => update({ weights })}
          known={validation ? [] : [...board, ...dead]}
          equities={Object.fromEntries(
            Object.entries(cells).map(([k, c]) => [
              k,
              c.result.players[0].equity.value,
            ]),
          )}
        />
        {counts && (
          <p>
            {counts.after} opponent combos remain from {counts.before};{' '}
            {counts.removed} removed by hero, board, and dead cards. Remaining
            relative weight: {counts.weight}.
          </p>
        )}
        {validation && <p role="alert">{validation}</p>}
      </section>
      <section className="panel">
        <h2>Specific hand versus this range</h2>
        <p>
          Seed: <code>{state.seed}</code>. Copy this address to reproduce cards,
          weights, and seed.
        </p>
        {!validation && (
          <EquityExperiment
            input={{
              players: [hero, gridRange(state.weights)],
              board,
              dead,
              seed: state.seed,
              samples: 10000,
              method: 'auto',
            }}
          />
        )}
      </section>
      <section className="panel">
        <h2>Equity heatmap and distribution across hand classes</h2>
        <p>
          Here each grid cell is the hero range for that class, with the board
          and dead cards removed. The specific hero cards above do not restrict
          this experiment. Each cell reports 1,000 samples; individual intervals
          are not a simultaneous guarantee over the whole grid.
        </p>
        <label>
          Heatmap opponent
          <select
            value={state.versus}
            onChange={(e) =>
              update({ versus: e.target.value as 'random' | 'range' })
            }
          >
            <option value="random">Random available hand</option>
            <option value="range">Selected weighted range</option>
          </select>
        </label>
        <button disabled={running || !!validation} onClick={heatmap}>
          Simulate 13 × 13 heatmap
        </button>
        {running && (
          <button
            onClick={() => {
              worker.current?.terminate();
              worker.current = null;
              setRunning(false);
            }}
          >
            Cancel heatmap
          </button>
        )}
        <p role="status">
          {Object.keys(cells).length} classes evaluated
          {running ? ' · running' : ''}.
        </p>
        {error && <p role="alert">{error}</p>}
        <label>
          Inspect a computed cell
          <select value={inspect} onChange={(e) => setInspect(e.target.value)}>
            {[...new Set([inspect, ...Object.keys(cells)])].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        {selected && (
          <>
            <p>
              {inspect} · {selected.result.samples} samples
            </p>
            <Probability
              label="CELL EQUITY"
              value={selected.result.players[0].equity}
              sampled
            />
            {selected.reference && (
              <p>
                Exact reference{' '}
                {percent(selected.reference.players[0].equity.value)} · gap{' '}
                {percent(
                  selected.result.players[0].equity.value -
                    selected.reference.players[0].equity.value,
                )}
                .
              </p>
            )}
          </>
        )}
        <Histogram
          label="Distribution of class-average equities (one count per class)"
          items={Object.values(cells).map((c) => ({
            value: Math.round(100 * c.result.players[0].equity.value),
            count: 1,
          }))}
        />
        <p>
          This histogram weights classes equally to show their spread. It is not
          a range-equity average: that requires the physical-combo weights, with
          incompatible joint hands removed. Suit-specific variation inside a
          class is averaged within its cell.
        </p>
        {skipped.length > 0 && (
          <details>
            <summary>Classes that could not be sampled</summary>
            {skipped.map((s) => (
              <p key={s}>{s}</p>
            ))}
          </details>
        )}
        <details>
          <summary>Every computed class and its uncertainty</summary>
          {Object.values(cells).map((c) => (
            <p key={c.label}>
              {c.label}: {percent(c.result.players[0].equity.value)} ·{' '}
              {c.result.samples} samples ·{' '}
              {learningFacts.confidence().display().percent} CI [
              {c.result.players[0].equity.interval
                .map((x) => percent(x))
                .join(', ')}
              ]
            </p>
          ))}
        </details>
      </section>
      <details>
        <summary>
          Why weights, range advantage, and nut advantage differ
        </summary>
        <p>
          Weights are relative frequencies per physical combo. Card removal
          happens before normalizing. Jointly sampled overlapping ranges reject
          the entire colliding assignment. The distribution across cells shows
          variation in hand strength; a larger average equity is range
          advantage, while more of the very strongest hands is nut advantage.
          One does not imply the other. A polarized range combines strong value
          hands and weak bluffs; a merged range includes many medium-strength
          hands.
        </p>
        <Link to="/learn/18-1">Combos and blockers</Link> ·{' '}
        <Link to="/learn/18-2">Range and nut advantage</Link>
      </details>
      <Link to="/lab">Back to Equity Lab</Link>
    </main>
  );
}
