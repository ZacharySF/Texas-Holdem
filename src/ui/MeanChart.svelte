<script lang="ts">
  import { learningFacts } from '../content/facts';
  import type { MeanPoint } from './MeanChart';
  let { points }: { points: MeanPoint[] } = $props();
</script>

{#if !points.length}{:else}{@const last =
    points[points.length - 1]}{@const low = Math.min(
    last.exact,
    ...points.map((p) => p.interval[0]),
  )}{@const high = Math.max(
    last.exact,
    ...points.map((p) => p.interval[1]),
  )}{@const padding = Math.max((high - low) * 0.1, 0.0001)}{@const x = (
    n: number,
  ) => 60 + (490 * n) / last.samples}{@const y = (v: number) =>
    180 -
    (145 * (v - low + padding)) / (high - low + 2 * padding)}{@const band = [
    ...points.map((p) => `${x(p.samples)},${y(p.interval[0])}`),
    ...[...points].reverse().map((p) => `${x(p.samples)},${y(p.interval[1])}`),
  ].join(' ')}
  <figure>
    <svg
      viewBox="0 0 600 220"
      role="img"
      aria-label={`Mean versus samples with ${learningFacts.confidence().display().percent} pointwise confidence band and exact reference`}
      ><polygon points={band} fill="var(--accent)" opacity=".18"></polygon><line
        x1="60"
        x2="550"
        y1={y(last.exact)}
        y2={y(last.exact)}
        stroke="var(--gold)"
        stroke-dasharray="5 5"
      ></line><polyline
        points={points.map((p) => `${x(p.samples)},${y(p.mean)}`).join(' ')}
        fill="none"
        stroke="var(--accent)"
        stroke-width="2"
      ></polyline>{#each [low, high] as v, i (i)}<text
          x="3"
          y={y(v)}
          font-size="11">{v.toPrecision(3)}</text
        >{/each}<text x="60" y="208">0</text><text
        x="550"
        y="208"
        text-anchor="end">{last.samples} samples</text
      ></svg
    >
    <figcaption>
      Solid: observed mean. Shading: pointwise confidence interval. Dashed:
      exact/model value. Units match the result above. Quadrupling independent
      trials roughly halves standard error; inspecting many points does not give
      simultaneous coverage.
    </figcaption>
  </figure>{/if}
