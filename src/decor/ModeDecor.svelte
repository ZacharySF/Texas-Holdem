<script lang="ts">
  import { navigation } from '../navigation.svelte';
  import GhostWord from './GhostWord.svelte';
  import MotionPhoto from './MotionPhoto.svelte';
  import Chevrons from './Chevrons.svelte';
  import MicroBlock from './MicroBlock.svelte';
  import IssueNumber from './IssueNumber.svelte';
  import { assetUrl } from '../visual/config';
  let tools = $derived(navigation.path.startsWith('/lab'));
</script>

{#if tools || navigation.path.startsWith('/arcade')}
  <div class="decor-mode-header decor" aria-hidden="true">
    <div class="decor-mode-photo">
      <MotionPhoto src={assetUrl('art/club-overpass.png')} />
    </div>
    <div class="decor-mode-title">
      <span class="decor-micro"
        >{tools
          ? '04 / examine the possibilities'
          : '03 / repetition builds intuition'}</span
      ><GhostWord
        word={tools ? 'the laboratory' : 'practice & repeat'}
      /><Chevrons />
    </div>
    <MicroBlock /><IssueNumber n={tools ? '04' : '03'} />
  </div>
{/if}
