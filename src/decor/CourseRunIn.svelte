<script lang="ts">
  import { chapters, lessons } from '../content/lessons';
  import RunIn from './RunIn.svelte';
  let { chapter }: { chapter?: number } = $props();
  const groups = [
    { category: 'Foundation', entries: chapters.slice(1, 5) },
    { category: 'At the table', entries: chapters.slice(5, 9) },
    { category: 'Deeper study', entries: chapters.slice(9) },
  ];
  let items = $derived(
    chapter === undefined
      ? groups
      : [
          {
            category: `Chapter ${chapter}`,
            entries: lessons
              .filter((l) => l.chapter === chapter)
              .map((l) => l.title),
          },
        ],
  );
</script>

<div class="decor-course-run-in decor" aria-hidden="true">
  <span class="decor-micro">in this collection / a study in probability</span
  ><RunIn {items} />
</div>
