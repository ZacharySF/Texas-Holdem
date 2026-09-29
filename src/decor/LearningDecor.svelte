<script lang="ts">
  import GhostWord from './GhostWord.svelte';
  import MicroBlock from './MicroBlock.svelte';
  import Chevrons from './Chevrons.svelte';
  import CourseRunIn from './CourseRunIn.svelte';
  let { chapter }: { chapter?: number } = $props();
</script>

<div class="decor-learning-heading decor" aria-hidden="true">
  {#if chapter === undefined}<div class="decor-course-kicker">
      <span class="decor-micro">02 / the probability course</span><Chevrons />
    </div>
    <GhostWord word="learn by understanding" /><MicroBlock />
  {:else}<CourseRunIn {chapter} />
    <div class="decor-lesson-margin"><MicroBlock /></div>{/if}
</div>
