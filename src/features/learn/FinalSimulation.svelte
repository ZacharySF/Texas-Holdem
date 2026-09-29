<script lang="ts">
  import { getLesson } from './context';
  import { finalRequest } from '../../content/finalLessonFacts';
  import FinalExperiment from '../../ui/FinalExperiment.svelte';

  const { lesson, seed } = getLesson();
</script>

<section data-part="simulation" class="lesson-section">
  <h2>Run the experiment</h2>
  <p>
    {lesson.experimentLabel} Trials restart the stated model. Sampled means carry
    a confidence interval and an exact reference; a full-tree CFR iteration instead
    enumerates every deal and reports a best-response bound without sampling error.
  </p>
  <FinalExperiment request={finalRequest(lesson.id, seed)}></FinalExperiment>
</section>
