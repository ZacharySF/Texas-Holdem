<script lang="ts">
  import { probabilityTree, fractionTex } from '../../content/facts';
  import ExactValue from './ExactValue.svelte';
  import NotebookBlock from './NotebookBlock.svelte';
</script>

<div>
  <p>
    With As exposed, there are three remaining aces (hits) and 48 other cards
    (misses). Each row is one complete two-draw path. The second branch is
    conditional on the first.
  </p>
  {#each probabilityTree(3, 51) as b (b.path)}<details>
      <summary>{b.path}</summary><NotebookBlock
        lines={[
          'P(E)',
          `${fractionTex(b.first)}\\cdot${fractionTex(b.second)}`,
          fractionTex(b.probability),
        ]}
      ></NotebookBlock><ExactValue value={b.probability}></ExactValue>
    </details>{/each}
</div>
