<script lang="ts">
  import { panelLabels } from './panelLabels';
  import PageMasthead from './PageMasthead.svelte';
  import StatusBar from './StatusBar.svelte';
  import SideIndex from './SideIndex.svelte';
  import { readouts } from './readouts';
  import type { Snippet } from 'svelte';
  import { navigation } from '../navigation.svelte';
  let { children }: { children: Snippet } = $props();
</script>

<div
  class="site-shell"
  class:course-shell={navigation.path.startsWith('/learn')}
>
  <SideIndex />
  <div class="site-main" use:panelLabels>
    {#if !navigation.path.startsWith('/learn')}<PageMasthead
        path={navigation.path}
      />{/if}{@render children()}
  </div>
</div>
{#if navigation.path !== '/play/tournament'}<StatusBar
    path={navigation.path}
    {...readouts()}
    live
  />{/if}
