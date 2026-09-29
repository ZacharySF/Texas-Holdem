<script lang="ts">
  import { chapters } from '../content/lessons';
  const groups = [
    { name: 'Foundations', start: 1, end: 5 },
    { name: 'Probability', start: 5, end: 12 },
    { name: 'Decisions', start: 12, end: chapters.length },
  ];
</script>

<nav class="index-line" aria-label="Course index line">
  {#each groups as group (group.name)}<span class="index-category"
      >{group.name}</span
    >
    {#each chapters.slice(group.start, group.end) as title, i (title)}<a
        href={`#/learn/${group.start + i}-1`}>{title}</a
      >{#if i < group.end - group.start - 1}<span
          class="index-separator"
          aria-hidden="true"
        >
          +
        </span>{/if}{/each}
  {/each}
</nav>
