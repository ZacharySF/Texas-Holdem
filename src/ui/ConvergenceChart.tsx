import { learningFacts } from '../content/facts';
import { facts } from '../content/facts';
import type { EquityResult } from '../engine/equity';
import { percent } from './Probability';
export function ConvergenceChart({
  history,
  exact,
}: {
  history: readonly EquityResult[];
  exact?: number;
}) {
  const points = history.filter((h) => h.method === 'monteCarlo');
  if (!points.length)
    return (
      <div className="chart-empty">
        Run a simulation to see the estimate settle as more boards are dealt.
      </div>
    );
  const last = points[points.length - 1];
  const low = Math.max(
    0,
    Math.min(
      ...points.map((p) => p.players[0].equity.interval[0]),
      exact ?? 1,
    ) - 0.015,
  );
  const high = Math.min(
    1,
    Math.max(
      ...points.map((p) => p.players[0].equity.interval[1]),
      exact ?? 0,
    ) + 0.015,
  );
  const x = (n: number) => 58 + (510 * n) / last.samples,
    y = (v: number) => 180 - (145 * (v - low)) / (high - low);
  const line = points
    .map((p) => `${x(p.samples)},${y(p.players[0].equity.value)}`)
    .join(' ');
  const band = [
    ...points.map(
      (p) => `${x(p.samples)},${y(p.players[0].equity.interval[0])}`,
    ),
    ...[...points]
      .reverse()
      .map((p) => `${x(p.samples)},${y(p.players[0].equity.interval[1])}`),
  ].join(' ');
  return (
    <figure>
      <svg
        viewBox="0 0 600 220"
        role="img"
        aria-label={`Hero equity converges to ${percent(last.players[0].equity.value)} after ${last.samples.toLocaleString()} samples. Shaded area is the ${learningFacts.confidence().display().percent} confidence interval.`}
      >
        {[0, 0.5, 1].map((t) => {
          const v = low + (high - low) * t;
          return (
            <g key={t}>
              <line
                x1="58"
                x2="570"
                y1={y(v)}
                y2={y(v)}
                className="chart-grid"
              />
              <text x="48" y={y(v) + 4} textAnchor="end">
                {percent(v)}
              </text>
            </g>
          );
        })}
        <polygon points={band} fill="var(--accent)" opacity="0.16" />
        {exact !== undefined && (
          <line
            x1="58"
            x2="570"
            y1={y(exact)}
            y2={y(exact)}
            stroke="var(--gold)"
            strokeDasharray="5 5"
          />
        )}
        <polyline
          points={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
        />
        <circle
          cx={x(last.samples)}
          cy={y(last.players[0].equity.value)}
          r="4"
          fill="var(--accent)"
        />
        <text x="58" y="205">
          0
        </text>
        <text x="570" y="205" textAnchor="end">
          {last.samples.toLocaleString()} samples
        </text>
      </svg>
      <figcaption>
        Solid line: estimated equity. Shading:{' '}
        {learningFacts.confidence().display().percent} interval.
        {exact !== undefined ? ' Dashed line: exact equity.' : ''} With the same
        outcome variance, 4× the samples multiplies standard error by{' '}
        {facts.errorScale(4)}: only half as much error.
      </figcaption>
    </figure>
  );
}
