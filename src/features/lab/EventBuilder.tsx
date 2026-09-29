import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { parseCards, type Hand } from '../../engine/cards';
import { Rng } from '../../engine/rng';
import type { Experiment } from '../../engine/experiments';
import { modelTruth, type ModelSpec } from '../../engine/models';
import { ModelCheck } from '../learn/ModelCheck';
import { newSeed } from './state';
import { SeedInput } from '../../ui/SeedInput';
export default function EventBuilder() {
  const [params, setParams] = useSearchParams(),
    [fallback] = useState(newSeed);
  const kind = params.get('event') ?? 'pair',
    cards = params.get('cards') ?? 'Ah Kh',
    repetitions = Number(params.get('n') ?? 2),
    hits = Number(params.get('k') ?? 2),
    atLeast = params.get('atLeast') === 'true',
    seed = params.get('seed') ?? fallback;
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    next.set('seed', seed);
    setParams(next, { replace: true });
  };
  useEffect(() => {
    if (!params.has('seed')) {
      const next = new URLSearchParams(params);
      next.set('seed', fallback);
      setParams(next, { replace: true });
    }
  }, [params, fallback, setParams]);
  let model: ModelSpec | undefined,
    error = '';
  try {
    new Rng(seed);
    if (
      ![
        'pair',
        'suited',
        'ace',
        'flushDraw',
        'flush',
        'pairHole',
        'set',
      ].includes(kind)
    )
      throw new Error('Choose a supported event.');
    if (
      !Number.isInteger(repetitions) ||
      repetitions < 1 ||
      repetitions > 20 ||
      !Number.isInteger(hits) ||
      hits < 0 ||
      hits > repetitions
    )
      throw new Error(
        'Use 1–20 repeated hands and a hit count within that range.',
      );
    const parsed = parseCards(cards);
    let event: Experiment;
    if (kind === 'pair' || kind === 'suited') event = { kind };
    else if (kind === 'ace') event = { kind: 'atLeastRank', rank: 14 };
    else {
      if (parsed.length !== 2) throw new Error('Specify two hole cards.');
      event = {
        kind: 'courseDraw',
        topic: 'flop',
        hand: parsed as unknown as Hand,
        event: kind as 'flushDraw' | 'flush' | 'pairHole' | 'set',
      };
    }
    model = { type: 'repeat', event, repetitions, hits, atLeast };
    modelTruth(model);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Invalid event.';
  }
  return (
    <main className="tool-page">
      <h1>How often does it happen?</h1>
      <p>
        Choose one card event, then repeat complete independent hands. Within a
        hand cards stay out; between hands the full setup is restored.
      </p>
      <section className="panel tool-fields">
        <label>
          Event
          <select
            value={kind}
            onChange={(e) => change('event', e.target.value)}
          >
            <option value="pair">Pocket pair</option>
            <option value="suited">Suited hole cards</option>
            <option value="ace">At least one ace in hole cards</option>
            <option value="flushDraw">
              Suited hand flops exactly a flush draw
            </option>
            <option value="flush">Suited hand flops a flush</option>
            <option value="pairHole">Unpaired hand pairs a hole rank</option>
            <option value="set">Pocket pair hits its rank on the flop</option>
          </select>
        </label>
        <label>
          Fixed hole cards for flop events
          <input
            value={cards}
            onChange={(e) => change('cards', e.target.value)}
          />
        </label>
        <label>
          Number of hands
          <input
            type="number"
            min="1"
            max="20"
            value={repetitions}
            onChange={(e) => change('n', e.target.value)}
          />
        </label>
        <label>
          Successful hands
          <input
            type="number"
            min="0"
            max={repetitions}
            value={hits}
            onChange={(e) => change('k', e.target.value)}
          />
        </label>
        <label>
          Count condition
          <select
            value={String(atLeast)}
            onChange={(e) => change('atLeast', e.target.value)}
          >
            <option value="false">Exactly this many</option>
            <option value="true">At least this many</option>
          </select>
        </label>
      </section>
      <label htmlFor="seed">Experiment seed</label>
      <SeedInput key={seed} seed={seed} onCommit={(v) => change('seed', v)} />
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        model && (
          <ModelCheck
            key={JSON.stringify(model) + seed}
            model={model}
            seed={seed}
          />
        )
      )}
      <details>
        <summary>Why this answer?</summary>
        <p>
          A single hand's chance comes from physical card counting. For exactly
          k successes in n independent hands, choose their positions, multiply
          the k success probabilities and n−k failure probabilities. “At least”
          adds the disjoint exact counts. The simulator deals the card event
          afresh in every hand, rather than flipping a coin with a precomputed
          chance.
        </p>
        <Link to="/learn/10-1">Work through the binomial derivation</Link>
      </details>
      <Link to="/lab">Back to Equity Lab</Link>
    </main>
  );
}
