import { Link } from 'react-router';
import { useLesson } from './context';
import { NotebookBlock, ExactValue } from './NotebookBlock';
import { finalExample, finalRequest } from '../../content/finalLessonFacts';
import { FinalExperiment } from '../../ui/FinalExperiment';
export function FinalWorked() {
  const { lesson } = useLesson(),
    e = finalExample(lesson.id, lesson.id === '24-2' ? 2 : 5);
  return (
    <section data-part="derivation" className="lesson-section">
      <h2>One step at a time</h2>
      <p>
        {e.label}. The symbol E denotes a probability-weighted mean; Var denotes
        the mean squared distance from that mean. P denotes an event
        probability.
      </p>
      {lesson.id === '21-1' && (
        <p>
          S₁ and S₂ are unit pot shares; X and Y are chip awards. Multiplying
          shares by the pot size multiplies variance by the square of that size.
          The simulation below reports unit shares.
        </p>
      )}
      <NotebookBlock lines={e.lines} />
      {[20, 22, 24, 25].includes(lesson.chapter) ? (
        <ExactValue value={e.answer} />
      ) : null}
      <p>
        Result: {e.answer.toString()} = {e.answer.toNumber().toPrecision(6)}.
        Keep the stated units: probabilities, chips, or squared pot shares are
        different quantities.
      </p>
    </section>
  );
}
export function FinalShortcut() {
  const { lesson } = useLesson(),
    e = finalExample(lesson.id, lesson.id === '24-2' ? 2 : 5);
  return (
    <aside className="shortcut">
      <h3>A shortcut, with its error measured</h3>
      <p>{lesson.shortcut}</p>
      <p>
        Shortcut: {e.shortcut.toString()}. Exact: {e.answer.toString()}.
        Shortcut minus exact: {e.gap.toString()} (
        {e.gap.toNumber().toPrecision(5)} in the stated units).
      </p>
    </aside>
  );
}
export function FinalSimulation() {
  const { lesson, seed } = useLesson();
  return (
    <section data-part="simulation" className="lesson-section">
      <h2>Run the experiment</h2>
      <p>
        {lesson.experimentLabel} Trials restart the stated model. Sampled means
        carry a confidence interval and an exact reference; a full-tree CFR
        iteration instead enumerates every deal and reports a best-response
        bound without sampling error.
      </p>
      <FinalExperiment request={finalRequest(lesson.id, seed)} />
    </section>
  );
}
export function FinalLinks() {
  const { lesson } = useLesson();
  return (
    <p>
      <Link
        to={
          lesson.chapter === 20
            ? '/lab/shuffle'
            : lesson.chapter === 21
              ? '/lab/tools/insurance'
              : lesson.chapter === 23
                ? '/lab/tools/icm'
                : lesson.chapter === 24
                  ? '/lab/tools/sizing'
                  : '/arcade/akq'
        }
      >
        Change the model inputs in the related tool
      </Link>
    </p>
  );
}
