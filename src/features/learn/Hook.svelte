<script lang="ts">
  import Section from './Section.svelte';
  import { type Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<Section part="hook" number="01 / THE SPOT" title="Start with a hand"
  >{@render children?.()}</Section
>
