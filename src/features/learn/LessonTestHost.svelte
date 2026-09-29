<script lang="ts">
  import { untrack } from 'svelte';
  import type { Component } from 'svelte';
  import { setLesson, type LessonContextValue } from './context';
  let {
    value,
    content: Content,
  }: { value: LessonContextValue; content: Component } = $props();
  setLesson(untrack(() => value));
</script>

<Content />
