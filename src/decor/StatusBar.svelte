<script lang="ts">
  let {
    path = '/play',
    chips = 0,
    xp = 0,
    hands = 0,
    clock = '00:00',
    fps = '—',
  }: {
    path?: string;
    chips?: number;
    xp?: number;
    hands?: number;
    clock?: string;
    fps?: string;
  } = $props();
  const spaces = [
    ['play', 'play'],
    ['learn', 'course'],
    ['arcade', 'drills'],
    ['lab', 'tools'],
    ['stats', 'progress'],
  ];
</script>

<div class="decor-status decor decor-micro" aria-hidden="true">
  <div class="decor-workspaces">
    {#each spaces as [route, label], i (route)}<span
        class:current={path.startsWith('/' + route)}>[{i + 1} {label}]</span
      >{/each}
  </div>
  <span class="decor-status-path">~{path}</span>
  <span class="decor-status-readouts"
    ><b>{chips.toLocaleString()} chips</b><span
      >{xp} xp · {hands} hands · {clock} · {fps} fps</span
    ></span
  >
</div>
