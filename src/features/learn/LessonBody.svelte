<script lang="ts">
  import { untrack } from 'svelte';
  import { onMount, type Component } from 'svelte';
  import { setLesson, type LessonContextValue } from './context';
  let {
    lesson,
    seed,
    onComplete,
    onReady,
  }: LessonContextValue & { onReady: (id: string) => void } = $props();
  // The parent keys this subtree by lesson and seed; unfinished practice resets on either change.
  setLesson(untrack(() => ({ lesson, seed, onComplete })));
  const modules = import.meta.glob<{ default: Component }>(
    '../../content/lessons/*.svx',
  );
  const loading = untrack(() =>
    modules[`../../content/lessons/${lesson.id}.svx`](),
  );
  onMount(() => {
    let active = true;
    void loading.then(() => {
      if (active) onReady(lesson.id);
    });
    return () => {
      active = false;
    };
  });
</script>

{#await loading}
  <p role="status">Loading lesson…</p>
{:then { default: Content }}
  <Content />
{:catch error}
  <p role="alert">
    This lesson could not load. Reload to try again. {error instanceof Error
      ? error.message
      : ''}
  </p>
{/await}
