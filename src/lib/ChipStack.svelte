<script lang="ts">
  let { amount, compact = false }: { amount: number; compact?: boolean } =
    $props();
  const denominations = [1000, 100, 25, 5, 1];
  const stacks = $derived.by(() => {
    let remaining = Math.max(0, Math.floor(amount));
    return denominations.flatMap((value, tone) => {
      const count = Math.floor(remaining / value);
      remaining %= value;
      return count ? [{ value, count, tone, shown: Math.min(count, 8) }] : [];
    });
  });
</script>

<svg
  class="chip-stack"
  class:chip-stack--compact={compact}
  data-chip-amount={amount}
  viewBox={compact
    ? `0 0 64 ${48 + Math.max(0, Math.ceil(stacks.length / 2) - 1) * 22}`
    : `0 0 ${Math.max(stacks.length, 1) * 30 + 4} 48`}
  aria-hidden="true"
  focusable="false"
>
  {#each stacks as stack, index (stack.value)}
    <g
      transform={compact
        ? `translate(${(index % 2) * 30} ${Math.floor(index / 2) * 22})`
        : `translate(${index * 30} 0)`}
      class={`chip-tone-${stack.tone}`}
      data-denomination={stack.value}
      data-count={stack.count}
    >
      {#each Array.from({ length: stack.shown }, (_, i) => i) as level (level)}
        <g transform={`translate(18 ${39 - level * 4})`}>
          <path d="M-13-3v4c0 7 26 7 26 0v-4" class="chip-side" />
          <ellipse rx="13" ry="6" class="chip-face" />
          <ellipse rx="11.5" ry="5" class="chip-inlay" />
          <ellipse rx="7.5" ry="3.3" class="chip-disc" />
        </g>
      {/each}
    </g>
  {/each}
</svg>
