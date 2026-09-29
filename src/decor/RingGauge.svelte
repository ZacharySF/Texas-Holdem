<script lang="ts">
  import { liveRing } from './live';
  let {
    value,
    max,
    label,
    compact = false,
    live,
  }: {
    value: number;
    max: number;
    label: string;
    compact?: boolean;
    live?: 'xp' | 'lessons';
  } = $props();
  function ringAction(
    node: SVGCircleElement,
    key: 'xp' | 'lessons' | undefined,
  ) {
    return key ? liveRing(node, key) : {};
  }
  let ratio = $derived(max > 0 ? Math.max(0, Math.min(1, value / max)) : 0);
</script>

<div class="graphic-ring decor" class:compact aria-hidden="true">
  <svg viewBox="0 0 100 100"
    ><circle cx="50" cy="50" r="42" /><circle
      class="ring-value"
      use:ringAction={live}
      cx="50"
      cy="50"
      r="42"
      pathLength="100"
      stroke-dasharray={`${ratio * 100} 100`}
      transform="rotate(-90 50 50)"
    /><text x="50" y="54" text-anchor="middle">{value}</text></svg
  ><span class="decor-micro">{label} / {max}</span>
</div>
