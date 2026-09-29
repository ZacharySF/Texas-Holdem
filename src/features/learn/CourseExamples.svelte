<script lang="ts">
  import { courseProbability } from '../../engine/courseDraws';
  import { drawingDerivation, courseLabel } from '../../content/facts';
  import { getLesson } from './context';
  import ExactValue from './ExactValue.svelte';
  import NotebookBlock from './NotebookBlock.svelte';

  const { lesson } = getLesson();
</script>

<div>
  {#each [lesson.experiment, ...(lesson.experiments ?? [])] as e, i (i)}{#if e.kind === 'courseDraw'}{#key i}<details
        >
          <summary>{courseLabel(e)}</summary>
          <p>
            {e.topic === 'flop' || e.topic === 'showdown'
              ? 'N counts the qualifying unordered boards after removing the shown cards. Straights and suit textures are counted by testing every board once; choose this event in the simulator below to check it.'
              : 'Use the cards remaining in this event, not the original full deck.'}
          </p>
          <NotebookBlock lines={drawingDerivation(e)}
          ></NotebookBlock><ExactValue value={courseProbability(e)}
          ></ExactValue>
        </details>{/key}{:else}{/if}{/each}
</div>
