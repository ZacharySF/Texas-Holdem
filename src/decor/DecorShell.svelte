<script lang="ts">
  import type { Snippet } from 'svelte';
  import { navigation } from '../navigation.svelte';
  let { children }: { children: Snippet } = $props();
  const lab = import.meta.env.DEV ? import('./DecorLab.svelte') : undefined;
</script>

{#if import.meta.env.DEV && navigation.path === '/decor-lab'}
  {#await lab then module}{#if module}<module.default />{/if}{/await}
{:else}{@render children()}{/if}
