import { learningFacts } from '../content/facts';
import type { ExperimentSnapshot } from '../engine/experiments';
import { percent } from './Probability';
export function ExperimentChart({
  points,
  exact,
}: {
  points: readonly ExperimentSnapshot[];
  exact: number;
}) {
  if (!points.length)
    return (
      <p className="chart-empty">
        Run the experiment to plot the observed frequency and its uncertainty.
      </p>
    );
  const last = points[points.length - 1],
    lo = Math.max(
      0,
      Math.min(exact, ...points.map((p) => p.interval[0])) - 0.02,
    ),
    hi = Math.min(
      1,
      Math.max(exact, ...points.map((p) => p.interval[1])) + 0.02,
    );
  const x = (n: number) => 60 + (500 * n) / last.samples,
    y = (v: number) => 175 - (145 * (v - lo)) / (hi - lo);
  const path = points.map((p) => `${x(p.samples)},${y(p.estimate)}`).join(' '),
    band = [
      ...points.map((p) => `${x(p.samples)},${y(p.interval[0])}`),
      ...[...points]
        .reverse()
        .map((p) => `${x(p.samples)},${y(p.interval[1])}`),
    ].join(' ');
  return (
    <figure>
      <svg
        viewBox="0 0 600 220"
        role="img"
        aria-label={`Observed frequency ${percent(last.estimate)} after ${last.samples} trials; exact ${percent(exact)}. Shaded area: ${learningFacts.confidence().display().percent} Wilson interval.`}
      >
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <g key={v}>
            <line x1="60" x2="560" y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x="52" y={y(v) + 4} textAnchor="end">
              {percent(v)}
            </text>
          </g>
        ))}
        <polygon points={band} fill="var(--accent)" opacity="0.18" />
        <line
          x1="60"
          x2="560"
          y1={y(exact)}
          y2={y(exact)}
          stroke="var(--gold)"
          strokeDasharray="5 5"
        />
        <polyline
          points={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <text x="60" y="205">
          0
        </text>
        <text x="560" y="205" textAnchor="end">
          {last.samples.toLocaleString()} trials
        </text>
      </svg>
      <figcaption>
        Solid line: observed frequency. Shading: uncertainty in that estimate.
        Dashed line: exact probability. The exact line need not fall inside
        every interval.
      </figcaption>
    </figure>
  );
}
