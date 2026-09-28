import { learningFacts } from '../content/facts';
export interface MeanPoint {
  samples: number;
  mean: number;
  interval: readonly [number, number];
  exact: number;
}
export function MeanChart({ points }: { points: MeanPoint[] }) {
  if (!points.length) return null;
  const last = points[points.length - 1],
    low = Math.min(last.exact, ...points.map((p) => p.interval[0])),
    high = Math.max(last.exact, ...points.map((p) => p.interval[1])),
    padding = Math.max((high - low) * 0.1, 0.0001),
    x = (n: number) => 60 + (490 * n) / last.samples,
    y = (v: number) =>
      180 - (145 * (v - low + padding)) / (high - low + 2 * padding),
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
        aria-label={`Mean versus samples with ${learningFacts.confidence().display().percent} pointwise confidence band and exact reference`}
      >
        <polygon points={band} fill="var(--accent)" opacity=".18" />
        <line
          x1="60"
          x2="550"
          y1={y(last.exact)}
          y2={y(last.exact)}
          stroke="var(--gold)"
          strokeDasharray="5 5"
        />
        <polyline
          points={points.map((p) => `${x(p.samples)},${y(p.mean)}`).join(' ')}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        {[low, high].map((v, i) => (
          <text key={i} x="3" y={y(v)} fontSize="11">
            {v.toPrecision(3)}
          </text>
        ))}
        <text x="60" y="208">
          0
        </text>
        <text x="550" y="208" textAnchor="end">
          {last.samples} samples
        </text>
      </svg>
      <figcaption>
        Solid: observed mean. Shading: pointwise confidence interval. Dashed:
        exact/model value. Units match the result above. Quadrupling independent
        trials roughly halves standard error; inspecting many points does not
        give simultaneous coverage.
      </figcaption>
    </figure>
  );
}
