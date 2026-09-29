<script lang="ts">
  import StatusBar from './StatusBar.svelte';
  import RouteWipe from './RouteWipe.svelte';
  import WindowChrome from './WindowChrome.svelte';
  import { readouts } from './readouts';
  import ModeDecor from './ModeDecor.svelte';
  import type { Snippet } from 'svelte';
  import { navigation } from '../navigation.svelte';
  let { children }: { children: Snippet } = $props();
  const lab = import.meta.env.DEV ? import('./DecorLab.svelte') : undefined;
</script>

{#if import.meta.env.DEV && navigation.path === '/decor-lab'}
  {#await lab then module}{#if module}<module.default />{/if}{/await}
{:else}<ModeDecor />
  <div
    class="decor-desktop"
    class:decor-tool-window={navigation.path.startsWith('/lab') ||
      navigation.path.startsWith('/arcade')}
  >
    {#if navigation.path.startsWith('/lab') || navigation.path.startsWith('/arcade')}<WindowChrome
        title={`~/contemporary${navigation.path}`}
      />{/if}
    {@render children()}
  </div>{/if}
<StatusBar path={navigation.path} {...readouts()} live />
<RouteWipe />
