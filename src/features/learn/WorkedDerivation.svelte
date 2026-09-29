<script lang="ts">
  import FinalWorked from './FinalWorked.svelte';
  import AdvancedWorked from './AdvancedWorked.svelte';
  import { lessonDerivation, experimentProbability } from '../../content/facts';
  import { getLesson } from './context';
  import ExactValue from './ExactValue.svelte';
  import NotebookBlock from './NotebookBlock.svelte';
  import Section from './Section.svelte';

  const { lesson } = getLesson();
</script>

{#if lesson.chapter >= 20}<FinalWorked
  ></FinalWorked>{:else}{#if lesson.advanced}<AdvancedWorked
    ></AdvancedWorked>{:else}{@const legend =
      lesson.experiment.kind === 'atLeastRank'
        ? 'N with a subscript R counts cards of the requested rank; ≥ means “at least.”'
        : lesson.experiment.kind === 'rankOrSuit' ||
            lesson.experiment.kind === 'eitherSuit'
          ? 'R names the rank event, S a suit event. The cup-shaped union symbol means “or”; the cap-shaped intersection means “both.”'
          : lesson.experiment.kind === 'riverWin'
            ? 'H₁ and H₂ stand for the two final hand strengths. The > symbol asks whether the first hand wins outright.'
            : lesson.experiment.kind === 'orderedRanks'
              ? 'R₁ and R₂ name the requested ranks at the first and second draw. The comma here means that both stages occur, in that order.'
              : 'The symbol P means probability. The expression inside the parentheses names the event being counted.'}<Section
      part="derivation"
      number="03 / THE NOTEBOOK"
      title="One step at a time"
      ><p>{legend} Each equals sign below preserves the same quantity.</p>
      <NotebookBlock lines={lessonDerivation(lesson.experiment)}
      ></NotebookBlock><ExactValue
        value={experimentProbability(lesson.experiment)}
      ></ExactValue></Section
    >{/if}{/if}
