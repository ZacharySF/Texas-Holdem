<script lang="ts">
  import ChapterMark from '../../decor/ChapterMark.svelte';
  import { chapters, lessons } from '../../content/lessons';
  import { readingGuides } from '../../content/readingGuides';
  import type { Journey } from './journey.svelte';
  import { mastered, type Progress } from './progress.svelte';
  let { journey, progress }: { journey: Journey; progress: Progress } =
    $props();
  let query = $state('');
  const order = [...chapters.keys()].filter((chapter) => chapter > 0).concat(0);
  let matches = $derived(
    lessons.filter((lesson) =>
      `${lesson.id.replace('-', '.')} ${lesson.title} ${chapters[lesson.chapter]} ${lesson.objectives.join(' ')} ${readingGuides[lesson.id].introduction} ${readingGuides[lesson.id].takeaway}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    ),
  );
</script>

<section class="course-index" aria-labelledby="course-index-heading">
  <h2 id="course-index-heading">All chapters and lessons</h2>
  <p>
    Read down the list for the full course. Each lesson builds on earlier ideas;
    its “Before you begin” links help you catch up when you jump ahead. Chapter
    0 covers optional poker rules, and Chapter 25 is an optional capstone.
  </p>
  <label for="course-topic-search">Search the full course</label>
  <div class="course-search-row">
    <input
      id="course-topic-search"
      type="search"
      bind:value={query}
      placeholder="Try “calling”, “variance”, or “3.1”"
    />
    {#if query}<button onclick={() => (query = '')}>Clear search</button>{/if}
  </div>
  <p class="hint" role="status">
    {matches.length}
    {matches.length === 1 ? 'lesson' : 'lessons'}{query.trim()
      ? ' found'
      : ' in the course'}
  </p>
  {#each order as chapter (chapter)}
    {@const found = matches.filter((lesson) => lesson.chapter === chapter)}
    {#if found.length}
      <section
        class="course-index-chapter"
        aria-labelledby={`index-chapter-${chapter}`}
      >
        <ChapterMark n={chapter} />
        <h3 id={`index-chapter-${chapter}`}>
          <span
            >{chapter === 0
              ? 'Optional rules'
              : `Chapter ${chapter}${chapter === 25 ? ' · Optional' : ''}`}</span
          >{chapters[chapter]}
        </h3>
        <ol>
          {#each found as lesson (lesson.id)}
            <li>
              <a href={`#/learn/${lesson.id}`}>
                <span class="course-index-number"
                  >{lesson.id.replace('-', '.')}</span
                >
                <span
                  ><strong>{lesson.title}</strong><small
                    >{lesson.objectives[0]}</small
                  ></span
                >
                {#if mastered(progress.results[lesson.id])}<span
                    class="course-index-status">Quiz passed</span
                  >
                {:else if journey.read.includes(lesson.id)}<span
                    class="course-index-status">Read</span
                  >{/if}
              </a>
            </li>
          {/each}
        </ol>
      </section>
    {/if}
  {/each}
  {#if !matches.length}<p>
      No matching lessons. Try a broader topic, or clear the search to browse
      every chapter.
    </p>{/if}
</section>
