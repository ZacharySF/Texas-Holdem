<script lang="ts">
  import { advancedExample } from '../../content/facts';
  import { modelTruth } from '../../engine/models';
  import { getLesson } from './context';
  import NotebookBlock from './NotebookBlock.svelte';
  import ExactValue from './ExactValue.svelte';

  const { lesson } = getLesson();
  let e = $derived(advancedExample(lesson.id));
  let value = $derived(modelTruth(e.model));
</script>

<section data-part="derivation" class="lesson-section">
  <h2>One step at a time</h2>
  <p>
    {e.title}. E means expected value; P means probability. A bar over X denotes
    an average. All parameters here describe the stated model.
  </p>
  <NotebookBlock lines={e.lines}
  ></NotebookBlock>{#if e.unit === 'probability'}<ExactValue {value}
    ></ExactValue>{:else}<p>
      Exact expected value: {value.toString()}
      {e.unit}.
    </p>{/if}
</section>
