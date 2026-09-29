import { FinalSimulation } from './FinalLesson';
import { useEffect, useRef, useState } from 'react';
import {
  courseLabel,
  formatPercent,
  lessonDerivation,
  experimentProbability,
  learningFacts,
} from '../../content/facts';
import { Rational } from '../../engine/math';
import type { ExperimentSnapshot } from '../../engine/experiments';
import type { LearnResponse } from '../../workers/learnProtocol';
import { ExperimentChart } from '../../ui/ExperimentChart';
import { percent } from '../../ui/Probability';
import { useLesson } from './context';
import { ExactValue, NotebookBlock } from './NotebookBlock';
import { AdvancedSimulation } from './AdvancedExamples';
export function SimCheck() {
  const { lesson } = useLesson();
  if (lesson.chapter >= 20) return <FinalSimulation />;
  return lesson.advanced ? <AdvancedSimulation /> : <BasicSimCheck />;
}
function BasicSimCheck() {
  const { lesson, seed } = useLesson();
  const [selected, setSelected] = useState(0);
  const choices = [lesson.experiment, ...(lesson.experiments ?? [])];
  const experiment = choices[selected],
    exact = experimentProbability(experiment);
  const [points, setPoints] = useState<ExperimentSnapshot[]>([]),
    [running, setRunning] = useState(false),
    [status, setStatus] = useState(''),
    [error, setError] = useState('');
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  function run(samples: number) {
    worker.current?.terminate();
    setPoints([]);
    setRunning(true);
    setStatus('Running the experiment…');
    setError('');
    const current = new Worker(
      new URL('../../workers/learn.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.current = current;
    current.onmessage = (event: MessageEvent<LearnResponse>) => {
      if (worker.current !== current) return;
      const message = event.data;
      if (message.type === 'error') {
        setError(message.message);
        setRunning(false);
        current.terminate();
        return;
      }
      setPoints((p) => [...p, ...message.trace]);
      if (message.type === 'result') {
        setRunning(false);
        setStatus('Experiment complete.');
        current.terminate();
      }
    };
    current.onerror = () => {
      if (worker.current === current) {
        setError('The experiment worker stopped. You can retry the same seed.');
        setRunning(false);
        current.terminate();
      }
    };
    current.postMessage({ event: experiment, seed, samples });
  }
  const last = points[points.length - 1];
  return (
    <section data-part="simulation" className="lesson-section sim-check">
      <h2>Run the experiment</h2>
      {lesson.experiments && (
        <>
          <label htmlFor="lesson-experiment">Experiment to check</label>
          <select
            id="lesson-experiment"
            value={selected}
            onChange={(e) => {
              worker.current?.terminate();
              worker.current = null;
              setRunning(false);
              setPoints([]);
              setStatus('');
              setError('');
              setSelected(Number(e.target.value));
            }}
          >
            {choices.map((event, i) => (
              <option key={i} value={i}>
                {event.kind === 'courseDraw'
                  ? courseLabel(event)
                  : lesson.experimentLabel}
              </option>
            ))}
          </select>
        </>
      )}
      <p>
        {experiment.kind === 'courseDraw'
          ? courseLabel(experiment)
          : lesson.experimentLabel}
        .
      </p>
      {experiment.kind === 'courseDraw' && (
        <>
          <p>
            N counts favorable sets by the event definition. Each unordered set
            is visited once; divide that count by all possible sets.
          </p>
          <NotebookBlock lines={lessonDerivation(experiment)} />
        </>
      )}
      <p>
        A trial means one fresh attempt at this experiment. Between trials the
        deck is restored; within a trial, drawn cards stay out. The seed above
        reproduces the same sequence.
      </p>
      <ExactValue value={exact} />
      <div className="lesson-actions">
        {[1000, 10000, 100000, 1000000].map((n) => (
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
              setStatus('Cancelled. Completed trials remain visible.');
            }}
          >
            Cancel experiment
          </button>
        )}
      </div>
      <p role="status">
        {status}
        {running && last
          ? ` ${last.samples.toLocaleString()} trials so far.`
          : ''}
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {last && (
        <>
          <ExactValue
            value={new Rational(last.successes, last.samples)}
            label={`Observed frequency · ${last.successes.toLocaleString()} successes / ${last.samples.toLocaleString()} trials`}
          />
          <p className="experiment-result">
            {learningFacts.confidence().display().percent} Wilson confidence
            interval:{' '}
            <strong>
              {percent(last.interval[0])}–{percent(last.interval[1])}
            </strong>
            . Gap from exact:{' '}
            <strong>
              {formatPercent(last.estimate - exact.toNumber(), 3).slice(0, -1)}{' '}
              percentage points
            </strong>
            .
          </p>
        </>
      )}
      <ExperimentChart points={points} exact={exact.toNumber()} />
      <details>
        <summary>What does the shaded interval mean?</summary>
        <p>
          The observed frequency is successes divided by trials. A short run can
          miss the exact probability because the dealt cards vary. A confidence
          interval is a rule for drawing a range around that estimate.
        </p>
        <p>
          Imagine repeating many whole experiments, each with a fresh seed and
          the same number of trials. A method with the stated coverage aims for
          its intervals to include the fixed true probability in that proportion
          of those experiments. This is a repeated-experiment claim, not the
          chance that this particular fixed probability moves inside today’s
          interval.
        </p>
        <p>
          We use the Wilson score method, which also gives a nonzero upper limit
          when a sample contains no successes. Its coverage is approximate for
          discrete counts. As trials accumulate, the interval tends to narrow,
          but not at every step. Looking at many chart points does not make them
          one guaranteed band. Chapter 16 will derive the interval; here it
          keeps the experiment honest about sampling noise.
        </p>
      </details>
    </section>
  );
}
