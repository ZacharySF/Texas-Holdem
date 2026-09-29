<script lang="ts">
  import Fetch from './Fetch.svelte';
  import GhostWord from './GhostWord.svelte';
  import IssueNumber from './IssueNumber.svelte';
  import { readouts } from './readouts';
</script>

<div class="decor-progress-header decor" aria-hidden="true">
  <div>
    <span class="decor-micro">05 / your field record</span><GhostWord
      word="progress"
    />
  </div>
  <Fetch {...readouts()} /><IssueNumber n="05" />
</div>
