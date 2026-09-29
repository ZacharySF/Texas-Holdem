<script lang="ts">
  import Section from './Section.svelte';
  import ReadingCheck from './ReadingCheck.svelte';
  import { type Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<Section
  part="idea"
  number="02 / BUILD THE IDEA"
  title="Build the idea, step by step"
  >{@render children?.()}<ReadingCheck /></Section
>
