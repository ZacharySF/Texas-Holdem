<script lang="ts">
  let {
    series,
    label,
  }: {
    series: { name: string; values: readonly number[] }[];
    label: string;
  } = $props();
  let finite = $derived(
    series.flatMap((s) => s.values).filter(Number.isFinite),
  );
  let low = $derived(finite.reduce((a, b) => Math.min(a, b), 0));
  let high = $derived(finite.reduce((a, b) => Math.max(a, b), 1));
  const x = (i: number, n: number) => 40 + (310 * i) / Math.max(1, n - 1);
  const y = (v: number) => 180 - (150 * (v - low)) / (high - low);
</script>

<figure class="data-chart">
  <svg viewBox="0 0 375 215" role="img" aria-label={label}
    ><title>{label}</title><line
      x1="40"
      x2="350"
      y1={y(0)}
      y2={y(0)}
      stroke="var(--border)"
    ></line>{#each series as s, j (s.name)}<polyline
        fill="none"
        stroke={[
          'var(--accent)',
          'var(--gold)',
          'var(--chart-third)',
          'var(--chart-fourth)',
        ][j % 4]}
        stroke-width="2"
        stroke-dasharray={j % 2 ? '5 3' : undefined}
        points={s.values
          .filter(
            (_, i) =>
              i % Math.max(1, Math.ceil(s.values.length / 150)) === 0 ||
              i === s.values.length - 1,
          )
          .map((v, i, a) => `${x(i, a.length)},${y(v)}`)
          .join(' ')}
      ></polyline>{/each}<text x="2" y="27" fill="currentColor" font-size="10"
      >{high.toFixed(1)}</text
    ><text x="2" y="182" fill="currentColor" font-size="10"
      >{low.toFixed(1)}</text
    ><text x="40" y="204" fill="currentColor" font-size="10">Start</text><text
      x="315"
      y="204"
      fill="currentColor"
      font-size="10">Finish</text
    ></svg
  >
  <figcaption>
    {label}. {series
      .map((s, i) => `${s.name} (${i % 2 ? 'dashed' : 'solid'})`)
      .join('; ')}.
  </figcaption>
</figure>
