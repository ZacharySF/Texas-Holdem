import { Link } from 'react-router';
import { courseProbability, type CourseDraw } from '../../engine/courseDraws';
import { nCr, Rational } from '../../engine/math';
import {
  drawingFacts,
  formatPercent,
  CATEGORY_NAMES,
  fiveCardCounts,
  sevenCardCounts,
  drawingDerivation,
  courseLabel,
  outChance,
  outShortcut,
  probabilityTree,
  fractionTex,
} from '../../content/facts';
import { PlayingCards } from '../../ui/PlayingCards';
import { useLesson } from './context';
import { ExactValue, NotebookBlock } from './NotebookBlock';
export function FrequencyCounts({ selected }: { selected?: number[] }) {
  const five = fiveCardCounts(),
    seven = sevenCardCounts();
  return (
    <div className="frequency-counts">
      <p>
        All five-card sets: {String(nCr(52, 5))}. All seven-card sets:{' '}
        {String(nCr(52, 7))}. Categories below are mutually exclusive; straight
        flush includes royal flush.
      </p>
      {CATEGORY_NAMES.map((name, c) =>
        !selected || selected.includes(c) ? (
          <details key={name}>
            <summary>
              {name} · five cards {five[c].toLocaleString()} · seven cards{' '}
              {seven[c].toLocaleString()}
            </summary>
            {([5, 7] as const).map((size) => {
              const event: CourseDraw = {
                kind: 'courseDraw',
                topic: 'category',
                size,
                category: c,
              };
              return (
                <div key={size}>
                  <h3>
                    {size} cards · {name}
                  </h3>
                  <NotebookBlock lines={drawingDerivation(event)} />
                  <ExactValue value={courseProbability(event)} />
                </div>
              );
            })}
          </details>
        ) : null,
      )}
    </div>
  );
}
export function ProbabilityTree() {
  return (
    <div>
      <p>
        With As exposed, there are three remaining aces (hits) and 48 other
        cards (misses). Each row is one complete two-draw path. The second
        branch is conditional on the first.
      </p>
      {probabilityTree(3, 51).map((b) => (
        <details key={b.path}>
          <summary>{b.path}</summary>
          <NotebookBlock
            lines={[
              'P(E)',
              `${fractionTex(b.first)}\\cdot${fractionTex(b.second)}`,
              fractionTex(b.probability),
            ]}
          />
          <ExactValue value={b.probability} />
        </details>
      ))}
    </div>
  );
}
export function CourseExamples() {
  const { lesson } = useLesson();
  return (
    <div>
      {[lesson.experiment, ...(lesson.experiments ?? [])].map((e, i) =>
        e.kind === 'courseDraw' ? (
          <details key={i}>
            <summary>{courseLabel(e)}</summary>
            <p>
              {e.topic === 'flop' || e.topic === 'showdown'
                ? 'N counts the qualifying unordered boards after removing the shown cards. Straights and suit textures are counted by testing every board once; choose this event in the simulator below to check it.'
                : 'Use the cards remaining in this event, not the original full deck.'}
            </p>
            <NotebookBlock lines={drawingDerivation(e)} />
            <ExactValue value={courseProbability(e)} />
          </details>
        ) : null,
      )}
    </div>
  );
}
export function OutsExamples() {
  const combo = drawingFacts.combo(),
    dirty = drawingFacts.dirty();
  return (
    <div>
      <h3>A combo draw counts cards, not labels</h3>
      <PlayingCards cards={combo.hole} />
      <PlayingCards cards={combo.board} />
      <p>
        Flush completions: {combo.flush.length}. Straight completions:{' '}
        {combo.straight.length}. Shared cards: {combo.overlap.length}.
      </p>
      <PlayingCards cards={combo.overlap} highlight={combo.overlap} />
      <NotebookBlock
        lines={[
          'N_{F\\cup S}',
          'N_F+N_S-N_{F\\cap S}',
          `${combo.flush.length}+${combo.straight.length}-${combo.overlap.length}`,
          `${combo.union.length}`,
        ]}
      />
      <p>The complete union:</p>
      <PlayingCards cards={combo.union} highlight={combo.union} />
      <h3>Shortcut error for the combined draw</h3>
      {[false, true].map((adjusted) => {
        const shortcut = outShortcut(combo.union.length, 2, adjusted),
          exact = outChance(47, combo.union.length, 2),
          gap = shortcut.add(exact.multiply(new Rational(-1)));
        return (
          <div key={String(adjusted)}>
            <h4>
              {adjusted
                ? 'Adjusted rule: subtract one percentage point for each out above eight'
                : 'Rule of four'}
            </h4>
            <NotebookBlock
              lines={[
                'P_{\\mathrm{shortcut}}',
                `\\frac{4\\cdot${combo.union.length}${adjusted ? `-(${combo.union.length}-8)` : ''}}{100}`,
                fractionTex(shortcut),
              ]}
            />
            <ExactValue value={shortcut} />
            <p>
              Signed error: {formatPercent(gap.toNumber(), 3).slice(0, -1)}{' '}
              percentage points.
            </p>
          </div>
        );
      })}
      <h3>A flush card can be dirty</h3>
      <p>You:</p>
      <PlayingCards cards={dirty.hole} />
      <p>Opponent:</p>
      <PlayingCards cards={dirty.opponent} />
      <p>Flop:</p>
      <PlayingCards cards={dirty.board} />
      <p>
        {dirty.flush.length} cards make your flush on the turn, but{' '}
        {dirty.dirty.length} of them also give the opponent a full house:
      </p>
      <PlayingCards cards={dirty.dirty} highlight={dirty.dirty} />
      <p>
        {dirty.clean.length} flush cards put you ahead on the turn. Even those
        allow a river redraw. This calculation removes the exposed opponent’s
        cards; Play cannot use hidden cards this way.
      </p>
      <Link to="/arcade">Practice these distinctions in Outs Rush →</Link>
    </div>
  );
}
