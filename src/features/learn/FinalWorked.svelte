<script lang="ts">
  import { getLesson } from './context';
  import NotebookBlock from './NotebookBlock.svelte';
  import ExactValue from './ExactValue.svelte';
  import { finalExample } from '../../content/finalLessonFacts';

  const { lesson } = getLesson();
  let e = $derived(finalExample(lesson.id, lesson.id === '24-2' ? 2 : 5));
</script>

<section data-part="derivation" class="lesson-section">
  <h2>One step at a time</h2>
  <p>
    {e.label}. The symbol E denotes a probability-weighted mean; Var denotes the
    mean squared distance from that mean. P denotes an event probability.
  </p>
  {#if lesson.id === '21-1'}<p>
      S₁ and S₂ are unit pot shares; X and Y are chip awards. Multiplying shares
      by the pot size multiplies variance by the square of that size. The
      simulation below reports unit shares.
    </p>{/if}<NotebookBlock lines={e.lines}
  ></NotebookBlock>{#if [20, 22, 24, 25].includes(lesson.chapter)}<ExactValue
      value={e.answer}
    ></ExactValue>{:else}{/if}
  <p>
    Result: {e.answer.toString()} = {e.answer.toNumber().toPrecision(6)}. Keep
    the stated units: probabilities, chips, or squared pot shares are different
    quantities.
  </p>
</section>
