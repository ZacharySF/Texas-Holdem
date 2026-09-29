<script lang="ts">
  import { facts } from '../../content/facts';
  import ExactValue from './ExactValue.svelte';
</script>

<div class="fact-list">
  <ExactValue label="Any pocket pair" value={facts.pocketPair()}
  ></ExactValue><ExactValue label="Pocket aces" value={facts.pocketAces()}
  ></ExactValue><ExactValue
    label="Two cards of the same suit"
    value={facts.suited()}
  ></ExactValue><ExactValue
    label="Unpaired cards of different suits"
    value={facts.offsuitNonPair()}
  ></ExactValue>
</div>
