<script lang="ts">
  import { chapters, lessons } from '../content/lessons';
  const groups = [
    { label: 'Foundation', from: 1, to: 5 },
    { label: 'At the table', from: 5, to: 9 },
    { label: 'Deeper study', from: 9, to: chapters.length },
  ];
</script>

<!-- Accessible navigation, kept in a disclosure instead of competing with the hero. -->
<details class="home-course-directory">
  <summary
    ><span>course index</span><span
      >{chapters.length} chapters / {lessons.length} lessons <b>+</b></span
    ></summary
  >
  <nav aria-label="Chapter index">
    {#each groups as group (group.label)}<p>
        <strong>{group.label}</strong
        >{#each chapters.slice(group.from, group.to) as chapter, i (chapter)}<a
            href={`#/learn/${group.from + i}-1`}>{chapter}</a
          >{#if i < group.to - group.from - 1}<span
              class="decor"
              aria-hidden="true"
            >
              +
            </span>{/if}{/each}
      </p>{/each}<a class="directory-all" href="#/learn"
      >Open the full course →</a
    >
  </nav>
</details>
