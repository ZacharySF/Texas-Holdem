<script lang="ts">
  let {
    items,
    label,
  }: {
    items: { value: number; count: number }[];
    label: string;
  } = $props();
  let combined = $derived.by(() => {
    // A temporary accumulator rebuilt in this derived computation.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const grouped = new Map<number, number>();
    for (const item of items)
      grouped.set(item.value, (grouped.get(item.value) ?? 0) + item.count);
    return [...grouped]
      .sort((a, b) => a[0] - b[0])
      .map(([value, count]) => ({ value, count }));
  });
  let max = $derived(Math.max(1, ...combined.map((i) => i.count)));
  let selected = $derived(
    combined.length <= 40
      ? combined
      : Array.from({ length: 30 }, (_, index) => {
          const low = Math.min(...combined.map((i) => i.value)),
            high = Math.max(...combined.map((i) => i.value)),
            step = (high - low || 1) / 30;
          return {
            value: low + index * step,
            count: combined
              .filter(
                (i) =>
                  Math.min(29, Math.floor((i.value - low) / step)) === index,
              )
              .reduce((a, b) => a + b.count, 0),
          };
        }),
  );
  let peak = $derived(
    combined.length > 40 ? Math.max(1, ...selected.map((i) => i.count)) : max,
  );
</script>

<figure class="data-chart">
  <svg viewBox="0 0 375 190" role="img" aria-label={label}
    ><title>{label}</title>{#each selected as item, i (i)}<g
        ><rect
          x={30 + (i * 330) / selected.length}
          y={160 - (140 * item.count) / peak}
          width={Math.max(1, 320 / selected.length)}
          height={(140 * item.count) / peak}
          fill="var(--accent)"
          ><title>{item.value.toFixed(2)}: {item.count}</title></rect
        >{#if i % Math.max(1, Math.ceil(selected.length / 5)) === 0}<text
            x={30 + (i * 330) / selected.length}
            y="180"
            font-size="9"
            fill="currentColor">{item.value.toFixed(1)}</text
          >{/if}</g
      >{/each}</svg
  >
  <details>
    <summary>Chart data</summary>
    <ul>
      {#each selected as i, n (n)}<li>
          {i.value.toFixed(2)}: {i.count}
        </li>{/each}
    </ul>
  </details>

  <figcaption>
    {label}. Bars show counts. Open Chart data for the numerical values.
  </figcaption>
</figure>
