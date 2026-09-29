<script lang="ts">
  import Section from './Section.svelte';
  import { type Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<Section
  part="quant"
  number="07 / QUANT CORNER"
  title="The same idea outside poker">{@render children?.()}</Section
>
