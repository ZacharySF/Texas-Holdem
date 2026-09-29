<script lang="ts">
  import { type Snippet } from 'svelte';

  let {
    part,
    number,
    title,
    children,
  }: {
    part: string;
    number: string;
    title: string;
    children: Snippet;
  } = $props();
</script>

<section data-part={part} data-part-label={number} class="lesson-section">
  <h2>{title}</h2>
  {@render children?.()}
</section>
