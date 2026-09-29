<script lang="ts">
  import type { Snippet } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  let {
    title,
    active = false,
    children,
  }: { title: string; active?: boolean; children: Snippet } = $props();
</script>

<!-- Only chrome is decor. Never hide or disable the existing children. -->
<div class="decor-window-frame" class:decor-window-active={active}>
  <WindowChrome {title} />
  <div class="decor-window-body">{@render children()}</div>
</div>
