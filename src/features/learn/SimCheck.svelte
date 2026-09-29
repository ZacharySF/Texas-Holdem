<script lang="ts">
  import FinalSimulation from './FinalSimulation.svelte';
  import { getLesson } from './context';
  import AdvancedSimulation from './AdvancedSimulation.svelte';
  import BasicSimCheck from './BasicSimCheck.svelte';

  const { lesson } = getLesson();
</script>

{#if lesson.chapter >= 20}<FinalSimulation
  ></FinalSimulation>{:else}{#if lesson.advanced}<AdvancedSimulation
    ></AdvancedSimulation>{:else}<BasicSimCheck></BasicSimCheck>{/if}{/if}
