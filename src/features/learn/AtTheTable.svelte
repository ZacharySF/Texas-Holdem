<script lang="ts">
  import { getLesson } from './context';
  import { lessonGameLink } from './journey.svelte';
  import Section from './Section.svelte';
  import { type Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  const { lesson, seed } = getLesson();
</script>

<Section
  part="table"
  number="06 / AT THE TABLE"
  title="The decision it supports"
  >{@render children?.()}
  <p>
    <a href={'#' + lessonGameLink(lesson.id, seed)}
      >Play a hand with this lesson’s coach →</a
    >
  </p>
  <p class="hint">
    Finish any unanswered quiz first; partial answers reset when you leave.
  </p>
  <p><a href="#/lab">Explore specific cards in the odds tools →</a></p></Section
>
