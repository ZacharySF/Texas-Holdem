<script lang="ts">
  import { facts, learningFacts } from '../../content/facts';
  import NotebookBlock from './NotebookBlock.svelte';
</script>

<NotebookBlock
  lines={[
    '\\binom{4}{2}',
    '\\frac{4\\cdot3}{2\\cdot1}',
    `\\frac{${learningFacts.orderedSelections(4, 2)}}{${learningFacts.permutations(2)}}`,
    `${learningFacts.combinations(4, 2)}`,
  ]}
></NotebookBlock><NotebookBlock
  lines={[
    '\\binom{52}{2}',
    '\\frac{52!}{2!50!}',
    '\\frac{52\\cdot51}{2\\cdot1}',
    `${facts.startingCombos()}`,
  ]}
></NotebookBlock>
