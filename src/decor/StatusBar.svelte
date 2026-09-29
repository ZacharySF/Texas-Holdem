<script lang="ts">
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
  <span>{path}</span>
  {#if live}
    <span>hands <span use:liveReadout={'hands'}>{hands}</span></span>
    <span>chips <span use:liveReadout={'chips'}>{chips}</span></span>
    <span>XP <span use:liveReadout={'xp'}>{xp}</span></span>
    <span use:liveReadout={'clock'}>{clock}</span>
  {:else}<span>hands {hands}</span><span>chips {chips}</span><span>XP {xp}</span
    ><span>{clock}</span>{/if}
</footer>
