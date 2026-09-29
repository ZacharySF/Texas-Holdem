<script lang="ts">
  import { learningFacts } from '../../content/facts';
  import NotebookBlock from './NotebookBlock.svelte';
</script>

<NotebookBlock
  lines={[
    'N_{\\mathrm{ordered}}',
    '52\\cdot51',
    `${learningFacts.orderedSelections(52, 2)}`,
  ]}
></NotebookBlock><NotebookBlock
  lines={[
    'N_{\\mathrm{ordered}}',
    '4\\cdot3\\cdot2',
    `${learningFacts.orderedSelections(4, 3)}`,
  ]}
></NotebookBlock><NotebookBlock
  lines={['3!', '3\\cdot2\\cdot1', `${learningFacts.permutations(3)}`]}
></NotebookBlock>
