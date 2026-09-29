<script lang="ts">
  import type { Component } from 'svelte';
  import type { Writable } from 'svelte/store';
  let {
    component: View,
    source,
  }: {
    component: Component<Record<string, unknown>>;
    source: Writable<Record<string, unknown>>;
  } = $props();
</script>

<View {...$source} />
