<script lang="ts">
  import StatusBar from './StatusBar.svelte';
  import SideIndex from './SideIndex.svelte';
  import { readouts } from './readouts';
  import type { Snippet } from 'svelte';
  import { navigation } from '../navigation.svelte';
  let { children }: { children: Snippet } = $props();
</script>

<div class="site-shell">
  <SideIndex />
  <div class="site-main">{@render children()}</div>
</div>
<StatusBar path={navigation.path} {...readouts()} live />
