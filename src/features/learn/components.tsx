import EquityByHandView from './EquityByHand.svelte';
import ChartWalkthroughView from './ChartWalkthrough.svelte';
import { SvelteView } from '../../bridge/SvelteView';
import { FinalWorked, FinalShortcut, FinalLinks } from './FinalLesson';
import {
  AdvancedWorked,
  AdvancedShortcut,
  AdvancedExamples,
  SuppliedChance,
  RealizationInputs,
} from './AdvancedExamples';
import {
  CourseExamples,
  FrequencyCounts,
  ProbabilityTree,
  OutsExamples,
} from './CourseExamples';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  facts,
  formatPercent,
  learningFacts,
  fractionTex,
  lessonDerivation,
  experimentProbability,
  shortcutProbability,
  orderedLabels,
  rankingExamples,
} from '../../content/facts';
import { Rational } from '../../engine/math';
import { useLesson } from './context';
import { ExactValue, Formula, NotebookBlock } from './NotebookBlock';
import { SimCheck } from './SimCheck';
import { PracticeSet } from './PracticeSet';
import { lessonGameLink } from './journey';
function Section({
  part,
  number,
  title,
  children,
}: {
  part: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      data-part={part}
      data-part-label={number}
      className="lesson-section"
    >
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function Hook({ children }: { children: ReactNode }) {
  return (
    <Section part="hook" number="01 / THE SPOT" title="Start with a hand">
      {children}
    </Section>
  );
}
export function Idea({ children }: { children: ReactNode }) {
  return (
    <Section
      part="idea"
      number="02 / BUILD THE IDEA"
      title="Work from the cards"
    >
      {children}
    </Section>
  );
}
export function AtTheTable({ children }: { children: ReactNode }) {
  const { lesson, seed } = useLesson();
  return (
    <Section
      part="table"
      number="06 / AT THE TABLE"
      title="The decision it supports"
    >
      {children}
      <p>
        <Link to={lessonGameLink(lesson.id, seed)}>
          Play a hand with this lesson’s coach →
        </Link>
      </p>
      <p className="hint">
        Finish any unanswered quiz first; partial answers reset when you leave.
      </p>
      <p>
        <Link to="/lab">Explore specific cards in the odds tools →</Link>
      </p>
    </Section>
  );
}
export function QuantCorner({ children }: { children: ReactNode }) {
  return (
    <Section
      part="quant"
      number="07 / QUANT CORNER"
      title="The same idea outside poker"
    >
      {children}
    </Section>
  );
}
export function WorkedDerivation() {
  const { lesson } = useLesson();
  if (lesson.chapter >= 20) return <FinalWorked />;
  if (lesson.advanced) return <AdvancedWorked />;
  const legend =
    lesson.experiment.kind === 'atLeastRank'
      ? 'N with a subscript R counts cards of the requested rank; ≥ means “at least.”'
      : lesson.experiment.kind === 'rankOrSuit' ||
          lesson.experiment.kind === 'eitherSuit'
        ? 'R names the rank event, S a suit event. The cup-shaped union symbol means “or”; the cap-shaped intersection means “both.”'
        : lesson.experiment.kind === 'riverWin'
          ? 'H₁ and H₂ stand for the two final hand strengths. The > symbol asks whether the first hand wins outright.'
          : lesson.experiment.kind === 'orderedRanks'
            ? 'R₁ and R₂ name the requested ranks at the first and second draw. The comma here means that both stages occur, in that order.'
            : 'The symbol P means probability. The expression inside the parentheses names the event being counted.';
  return (
    <Section
      part="derivation"
      number="03 / THE NOTEBOOK"
      title="One step at a time"
    >
      <p>{legend} Each equals sign below preserves the same quantity.</p>
      <NotebookBlock lines={lessonDerivation(lesson.experiment)} />
      <ExactValue value={experimentProbability(lesson.experiment)} />
    </Section>
  );
}
export function Shortcut() {
  const { lesson } = useLesson();
  if (lesson.chapter >= 20) return <FinalShortcut />;
  if (lesson.advanced) return <AdvancedShortcut />;
  const exact = experimentProbability(lesson.experiment),
    shortcut = shortcutProbability(lesson.experiment),
    gap = learningFacts.gap(shortcut, exact);
  return (
    <aside className="shortcut">
      <h3>A shortcut, with its error measured</h3>
      <p>{lesson.shortcut}</p>
      <p>
        Shortcut: <strong>{shortcut.display().percent}</strong>. Exact:{' '}
        <strong>{exact.display().percent}</strong>. Signed error (shortcut minus
        exact):{' '}
        <strong>
          {formatPercent(gap.toNumber(), 3).slice(0, -1)} percentage points
        </strong>
        .
      </p>
    </aside>
  );
}
export function Orders({
  size = 3,
  take = 2,
}: {
  size?: number;
  take?: number;
}) {
  const paths = orderedLabels(size, take);
  return (
    <div className="counting-example">
      <p>
        {paths.length} ordered paths, generated by taking a different remaining
        card at each branch:
      </p>
      <ul className="order-paths">
        {paths.map((p) => (
          <li key={p.join('')}>{p.join(' → ')}</li>
        ))}
      </ul>
    </div>
  );
}
export function CountingExamples() {
  return (
    <>
      <NotebookBlock
        lines={[
          'N_{\\mathrm{ordered}}',
          '52\\cdot51',
          `${learningFacts.orderedSelections(52, 2)}`,
        ]}
      />
      <NotebookBlock
        lines={[
          'N_{\\mathrm{ordered}}',
          '4\\cdot3\\cdot2',
          `${learningFacts.orderedSelections(4, 3)}`,
        ]}
      />
      <NotebookBlock
        lines={['3!', '3\\cdot2\\cdot1', `${learningFacts.permutations(3)}`]}
      />
    </>
  );
}
export function CombinationExamples() {
  return (
    <>
      <NotebookBlock
        lines={[
          '\\binom{4}{2}',
          '\\frac{4\\cdot3}{2\\cdot1}',
          `\\frac{${learningFacts.orderedSelections(4, 2)}}{${learningFacts.permutations(2)}}`,
          `${learningFacts.combinations(4, 2)}`,
        ]}
      />
      <NotebookBlock
        lines={[
          '\\binom{52}{2}',
          '\\frac{52!}{2!50!}',
          '\\frac{52\\cdot51}{2\\cdot1}',
          `${facts.startingCombos()}`,
        ]}
      />
    </>
  );
}
export function ClassTable() {
  const classes = facts.handClasses(),
    combos = facts.combosPerClass();
  return (
    <>
      <div className="lesson-table">
        <table>
          <caption>Hand classes and equally likely physical combos</caption>
          <thead>
            <tr>
              <th>Type</th>
              <th>Classes</th>
              <th>Combos per class</th>
              <th>All combos</th>
            </tr>
          </thead>
          <tbody>
            {(['pairs', 'suited', 'offsuit'] as const).map((kind, i) => {
              const per = [combos.pair, combos.suited, combos.offsuit][i];
              return (
                <tr key={kind}>
                  <th>{kind}</th>
                  <td>{classes[kind]}</td>
                  <td>{String(per)}</td>
                  <td>{String(BigInt(classes[kind]) * per)}</td>
                </tr>
              );
            })}
            <tr>
              <th>Total</th>
              <td>{classes.total}</td>
              <td>—</td>
              <td>{String(facts.startingCombos())}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <NotebookBlock
        lines={[
          'N_{\\mathrm{classes}}',
          '13+2\\binom{13}{2}',
          `${classes.pairs}+${classes.suited}+${classes.offsuit}`,
          `${classes.total}`,
        ]}
      />
    </>
  );
}
export function StartingFacts() {
  return (
    <div className="fact-list">
      <ExactValue label="Any pocket pair" value={facts.pocketPair()} />
      <ExactValue label="Pocket aces" value={facts.pocketAces()} />
      <ExactValue label="Two cards of the same suit" value={facts.suited()} />
      <ExactValue
        label="Unpaired cards of different suits"
        value={facts.offsuitNonPair()}
      />
    </div>
  );
}
export function ConversionExamples() {
  const p = experimentProbability({ kind: 'suit', suit: 2 });
  return (
    <>
      <ExactValue value={p} />
      <NotebookBlock
        lines={[
          '100P',
          `100\\cdot${fractionTex(p)}`,
          String(p.toNumber() * 100),
        ]}
      />
      <NotebookBlock
        lines={['1/P', `1\\div${fractionTex(p)}`, String(1 / p.toNumber())]}
      />
      <NotebookBlock
        lines={[
          '(1-P)/P',
          `(1-${fractionTex(p)})\\div${fractionTex(p)}`,
          String((1 - p.toNumber()) / p.toNumber()),
        ]}
      />
    </>
  );
}
export function Endpoints() {
  return (
    <>
      <ExactValue
        label="Impossible: a fifth suit in this deck"
        value={new Rational(0)}
      />
      <ExactValue
        label="Certain: the card has one of the four suits"
        value={new Rational(1)}
      />
    </>
  );
}
export function RankingTable() {
  return (
    <div className="lesson-table">
      <table>
        <caption>
          Categories, strongest first. Compare ranks within a category.
        </caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Example</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {rankingExamples()
            .reverse()
            .map((row) => (
              <tr key={row.category}>
                <th>{row.category}</th>
                <td className="card-text">{row.cards}</td>
                <td>{row.name}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
export function EquityByHand() {
  return <SvelteView component={EquityByHandView} props={{}} />;
}
export function ChartWalkthrough({
  mode = 'starting',
}: {
  mode?: 'starting' | 'ranges' | 'shove';
}) {
  return <SvelteView component={ChartWalkthroughView} props={{ mode }} />;
}
export const mdxComponents = {
  EquityByHand,
  ChartWalkthrough,
  FinalLinks,
  AdvancedExamples,
  SuppliedChance,
  RealizationInputs,
  CourseExamples,
  FrequencyCounts,
  ProbabilityTree,
  OutsExamples,
  Hook,
  Idea,
  WorkedDerivation,
  SimCheck,
  PracticeSet,
  AtTheTable,
  QuantCorner,
  Shortcut,
  NotebookBlock,
  Formula,
  Orders,
  CountingExamples,
  CombinationExamples,
  ClassTable,
  StartingFacts,
  ConversionExamples,
  Endpoints,
  RankingTable,
};
