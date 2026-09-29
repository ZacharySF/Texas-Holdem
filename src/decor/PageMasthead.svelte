<script lang="ts">
  import Plate from '../lib/softclub/Plate.svelte';
  import { sceneFor } from '../lib/softclub/scenes';
  import { sectionFor } from './sections';
  let { path }: { path: string } = $props();
  let section = $derived(sectionFor(path));
</script>

<header class="page-masthead sc-masthead-surface">
  <div class="panel-label">{section.code} / {section.name}</div>
  <h1
    data-masthead={path.startsWith('/lab')
      ? 'glass'
      : path.startsWith('/arcade')
        ? 'glow'
        : 'chrome'}
  >
    {path === '/play/tournament' ? 'tournament' : section.name}
    {#if !path.startsWith('/play')}<Plate scene={sceneFor(path)} header />{/if}
  </h1>
</header>
