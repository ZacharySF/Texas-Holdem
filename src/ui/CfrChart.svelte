<script lang="ts">
  let { points }: { points: { x: number; y: number }[] } = $props();
</script>

{#if !points.length}{:else}{@const last =
    points[points.length - 1]}{@const peak = Math.max(
    ...points.map((p) => p.y),
    0.000001,
  )}{@const x = (v: number) => 55 + (495 * v) / last.x}{@const y = (
    v: number,
  ) => 180 - (150 * v) / peak}
  <figure>
    <svg
      viewBox="0 0 600 220"
      role="img"
      aria-label={`Exploitability versus training iterations; final ${last.y.toFixed(6)} chips at ${last.x} iterations`}
      ><polyline
        points={points.map((p) => `${x(p.x)},${y(p.y)}`).join(' ')}
        fill="none"
        stroke="var(--accent)"
        stroke-width="2"
      ></polyline><text x="2" y="30" font-size="11">{peak.toPrecision(3)}</text
      ><text x="2" y="180" font-size="11">0</text><text x="55" y="210">0</text
      ><text x="550" y="210" text-anchor="end">{last.x} iterations</text></svg
    >
    <details>
      <summary>Training data</summary>
      <table>
        <thead><tr><th>Iteration</th><th>Exploitability, chips</th></tr></thead
        ><tbody
          >{#each points as p (p.x)}<tr
              ><td>{p.x}</td><td>{p.y.toPrecision(6)}</td></tr
            >{/each}</tbody
        >
      </table>
    </details>

    <figcaption>
      Exact best-response exploitability in chips for the average policy. Lower
      means less opportunity to improve by deviating alone. The horizontal axis
      is training iterations, not simulated hands.
    </figcaption>
  </figure>{/if}
