<script lang="ts">
  let {
    chips = 0,
    xp = 0,
    hands = 0,
    lessons = 0,
  }: {
    chips?: number;
    xp?: number;
    hands?: number;
    lessons?: number;
  } = $props();
  const spade =
    '       /\\\n      /  \\\n    /      \\\n  /          \\\n (    /\\    )\n  \\__/  \\__/\n      /__\\';
</script>

<div class="decor-fetch decor" aria-hidden="true">
  <pre>{spade}</pre>
  <div class="decor-micro">
    <strong>player@contemporary</strong><span>──────────────────────</span><span
      ><b>chips</b> {chips.toLocaleString()}</span
    ><span><b>xp</b> {xp.toLocaleString()} &nbsp; <b>hands</b> {hands}</span
    ><span><b>lessons</b> {lessons} complete</span><span
      class="decor-fetch-swatches">■ ■ ■ ■ ■ ■</span
    >
  </div>
</div>
