<script lang="ts">
  import { onMount } from 'svelte';
  import { createRoot } from 'react-dom/client';
  import { createElement } from 'react';
  import { App as Routes } from '../App';
  let target: HTMLDivElement;
  onMount(() => {
    const root = createRoot(target);
    root.render(createElement(Routes));
    return () => root.unmount();
  });
</script>

<div bind:this={target} class="legacy-routes"></div>
