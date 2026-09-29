<script lang="ts">
  let {
    value,
    max,
    label,
    compact = false,
  }: {
    value: number;
    max: number;
    label: string;
    compact?: boolean;
  } = $props();
  let ratio = $derived(max > 0 ? Math.max(0, Math.min(1, value / max)) : 0);
</script>

<div class="graphic-ring decor" class:compact aria-hidden="true">
  <svg viewBox="0 0 100 100"
    ><circle cx="50" cy="50" r="42" /><circle
      class="ring-value"
      cx="50"
      cy="50"
      r="42"
      pathLength="100"
      stroke-dasharray={`${ratio * 100} 100`}
      transform="rotate(-90 50 50)"
    /><text x="50" y="54" text-anchor="middle">{value}</text></svg
  ><span class="decor-micro">{label} / {max}</span>
</div>
