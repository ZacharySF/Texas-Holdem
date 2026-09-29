<script lang="ts">
  import { sectionFor } from './sections';
  import { liveReadout } from './live';
  let {
    path = '/play',
    chips = 0,
    xp = 0,
    hands = 0,
    clock = '00:00',
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
</script>

<footer class="status-rail">
  <span>{sectionFor(path).code} / {sectionFor(path).name}</span>
  {#if live}
    <span>hands <span use:liveReadout={'hands'}>{hands}</span></span>
    <span class="status-secondary"
      >chips <span use:liveReadout={'chips'}>{chips}</span></span
    >
    <span class="status-secondary"
      >XP <span use:liveReadout={'xp'}>{xp}</span></span
    >
    <span use:liveReadout={'clock'}>{clock}</span>
  {:else}<span>hands {hands}</span><span class="status-secondary"
      >chips {chips}</span
    ><span class="status-secondary">XP {xp}</span><span>{clock}</span>{/if}
</footer>
