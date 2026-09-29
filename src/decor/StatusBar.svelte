<script lang="ts">
  import RingGauge from './RingGauge.svelte';
  import { lessons as courseLessons } from '../content/lessons';
  import { readouts } from './readouts';
  import { SITE_NAME } from './site';
  import { liveReadout, frameMeter } from './live';
  let {
    path = '/play',
    chips = 0,
    xp = 0,
    hands = 0,
    clock = '00:00',
    fps = '—',
    live = false,
  }: {
    path?: string;
    chips?: number;
    xp?: number;
    hands?: number;
    clock?: string;
    fps?: string;
    live?: boolean;
  } = $props();
  const spaces = [
    ['play', 'play'],
    ['learn', 'course'],
    ['arcade', 'drills'],
    ['lab', 'tools'],
    ['stats', 'progress'],
  ];
</script>

<!-- The requested workspace links are real navigation; only readouts are hidden decor. -->
<div class="decor-status decor-micro">
  <nav class="decor-workspaces" aria-label="Workspaces">
    {#each spaces as [route, label], i (route)}<a
        href={`#/${route}`}
        class:current={path.startsWith('/' + route)}
        aria-current={path.startsWith('/' + route) ? 'page' : undefined}
        >[{i + 1} {label}]</a
      >{/each}
  </nav>
  <span class="decor-status-path decor" aria-hidden="true"
    >~/{SITE_NAME}{path}</span
  >
  <div class="status-rings decor" aria-hidden="true">
    <RingGauge
      value={xp}
      max={Math.max(100, Math.ceil(xp / 100) * 100)}
      label="XP"
      compact
      live={live ? 'xp' : undefined}
    /><RingGauge
      value={readouts().lessons}
      max={courseLessons.length}
      label="lessons"
      compact
      live={live ? 'lessons' : undefined}
    />
  </div>
  <span class="decor-status-readouts decor" aria-hidden="true">
    {#if live}<b
        ><span use:liveReadout={'chips'}>{chips.toLocaleString()}</span> chips</b
      ><span
        ><span use:liveReadout={'xp'}>{xp}</span> xp ·
        <span use:liveReadout={'hands'}>{hands}</span>
        hands · <span use:liveReadout={'clock'}>{clock}</span> ·
        <span use:frameMeter>{fps}</span> fps</span
      >
    {:else}<b>{chips.toLocaleString()} chips</b><span
        >{xp} xp · {hands} hands · {clock} · {fps} fps</span
      >{/if}
  </span>
</div>
