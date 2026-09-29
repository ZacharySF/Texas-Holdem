<script lang="ts">
  import FinalShortcut from './FinalShortcut.svelte';
  import AdvancedShortcut from './AdvancedShortcut.svelte';
  import {
    formatPercent,
    learningFacts,
    experimentProbability,
    shortcutProbability,
  } from '../../content/facts';
  import { getLesson } from './context';

  const { lesson } = getLesson();
</script>

{#if lesson.chapter >= 20}<FinalShortcut
  ></FinalShortcut>{:else}{#if lesson.advanced}<AdvancedShortcut
    ></AdvancedShortcut>{:else}{@const exact = experimentProbability(
      lesson.experiment,
    )}{@const shortcut = shortcutProbability(lesson.experiment)}{@const gap =
      learningFacts.gap(shortcut, exact)}
    <aside class="shortcut">
      <h3>A shortcut, with its error measured</h3>
      <p>{lesson.shortcut}</p>
      <p>
        Shortcut: <strong>{shortcut.display().percent}</strong>. Exact:
        <strong>{exact.display().percent}</strong>. Signed error (shortcut minus
        exact):
        <strong
          >{formatPercent(gap.toNumber(), 3).slice(0, -1)} percentage points</strong
        >.
      </p>
    </aside>{/if}{/if}
