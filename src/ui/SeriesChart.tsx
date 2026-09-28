export function SeriesChart({
  series,
  label,
}: {
  series: { name: string; values: readonly number[] }[];
  label: string;
}) {
  const finite = series.flatMap((s) => s.values).filter(Number.isFinite),
    low = finite.reduce((a, b) => Math.min(a, b), 0),
    high = finite.reduce((a, b) => Math.max(a, b), 1),
    x = (i: number, n: number) => 40 + (310 * i) / Math.max(1, n - 1),
    y = (v: number) => 180 - (150 * (v - low)) / (high - low);
  return (
    <figure className="data-chart">
      <svg viewBox="0 0 375 215" role="img" aria-label={label}>
        <title>{label}</title>
        <line x1="40" x2="350" y1={y(0)} y2={y(0)} stroke="var(--border)" />
        {series.map((s, j) => (
          <polyline
            key={s.name}
            fill="none"
            stroke={
              [
                'var(--accent)',
                'var(--gold)',
                'var(--chart-third)',
                'var(--chart-fourth)',
              ][j % 4]
            }
            strokeWidth="2"
            strokeDasharray={j % 2 ? '5 3' : undefined}
            points={s.values
              .filter(
                (_, i) =>
                  i % Math.max(1, Math.ceil(s.values.length / 150)) === 0 ||
                  i === s.values.length - 1,
              )
              .map((v, i, a) => `${x(i, a.length)},${y(v)}`)
              .join(' ')}
          />
        ))}
        <text x="2" y="27" fill="currentColor" fontSize="10">
          {high.toFixed(1)}
        </text>
        <text x="2" y="182" fill="currentColor" fontSize="10">
          {low.toFixed(1)}
        </text>
        <text x="40" y="204" fill="currentColor" fontSize="10">
          Start
        </text>
        <text x="315" y="204" fill="currentColor" fontSize="10">
          Finish
        </text>
      </svg>
      <figcaption>
        {label}.{' '}
        {series
          .map((s, i) => `${s.name} (${i % 2 ? 'dashed' : 'solid'})`)
          .join('; ')}
        .
      </figcaption>
    </figure>
  );
}
export function Histogram({
  items,
  label,
}: {
  items: { value: number; count: number }[];
  label: string;
}) {
  const grouped = new Map<number, number>();
  for (const item of items)
    grouped.set(item.value, (grouped.get(item.value) ?? 0) + item.count);
  items = [...grouped]
    .sort((a, b) => a[0] - b[0])
    .map(([value, count]) => ({ value, count }));
  const max = Math.max(1, ...items.map((i) => i.count)),
    selected =
      items.length <= 40
        ? items
        : Array.from({ length: 30 }, (_, index) => {
            const low = Math.min(...items.map((i) => i.value)),
              high = Math.max(...items.map((i) => i.value)),
              step = (high - low || 1) / 30;
            return {
              value: low + index * step,
              count: items
                .filter(
                  (i) =>
                    Math.min(29, Math.floor((i.value - low) / step)) === index,
                )
                .reduce((a, b) => a + b.count, 0),
            };
          });
  const peak =
    items.length > 40 ? Math.max(1, ...selected.map((i) => i.count)) : max;
  return (
    <figure className="data-chart">
      <svg viewBox="0 0 375 190" role="img" aria-label={label}>
        <title>{label}</title>
        {selected.map((item, i) => (
          <g key={i}>
            <rect
              x={30 + (i * 330) / selected.length}
              y={160 - (140 * item.count) / peak}
              width={Math.max(1, 320 / selected.length)}
              height={(140 * item.count) / peak}
              fill="var(--accent)"
            >
              <title>
                {item.value.toFixed(2)}: {item.count}
              </title>
            </rect>
            {i % Math.max(1, Math.ceil(selected.length / 5)) === 0 && (
              <text
                x={30 + (i * 330) / selected.length}
                y="180"
                fontSize="9"
                fill="currentColor"
              >
                {item.value.toFixed(1)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption>
        {label}. Bars show counts. Open Chart data for the numerical values.
      </figcaption>
      <details>
        <summary>Chart data</summary>
        <ul>
          {selected.map((i, n) => (
            <li key={n}>
              {i.value.toFixed(2)}: {i.count}
            </li>
          ))}
        </ul>
      </details>
    </figure>
  );
}
