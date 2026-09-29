<script lang="ts">
  import StatusBar from './StatusBar.svelte';
  import { readouts } from './readouts';
  import type { Snippet } from 'svelte';
  import { navigation } from '../navigation.svelte';
  let { children }: { children: Snippet } = $props();
</script>

<div class="site-body">{@render children()}</div>
<StatusBar path={navigation.path} {...readouts()} live />
