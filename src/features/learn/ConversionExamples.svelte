<script lang="ts">
  import { fractionTex, experimentProbability } from '../../content/facts';
  import ExactValue from './ExactValue.svelte';
  import NotebookBlock from './NotebookBlock.svelte';

  let p = $derived(experimentProbability({ kind: 'suit', suit: 2 }));
</script>

<ExactValue value={p}></ExactValue><NotebookBlock
  lines={['100P', `100\\cdot${fractionTex(p)}`, String(p.toNumber() * 100)]}
></NotebookBlock><NotebookBlock
  lines={['1/P', `1\\div${fractionTex(p)}`, String(1 / p.toNumber())]}
></NotebookBlock><NotebookBlock
  lines={[
    '(1-P)/P',
    `(1-${fractionTex(p)})\\div${fractionTex(p)}`,
    String((1 - p.toNumber()) / p.toNumber()),
  ]}
></NotebookBlock>
