<script lang="ts">
  import { sitePath } from '../../decor/site';
  import WindowChrome from '../../decor/WindowChrome.svelte';
  import { chapters, lessons } from '../../content/lessons';
  import { mastered, type Progress } from './progress.svelte';
  import type { Journey } from './journey.svelte';

  let {
    chapter = 1,
    current,
    progress,
    journey,
  }: {
    chapter?: number;
    current?: string;
    progress: Progress;
    journey: Journey;
  } = $props();
  let search = $state.raw('');
  let open = $state.raw(false);
  let matches = $derived(
    lessons.filter((l) =>
      `${l.id.replace('-', '.')} ${l.title} ${chapters[l.chapter]} ${l.objectives.join(' ')}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ),
  );
  function setSearch(
    value: typeof search | ((previous: typeof search) => typeof search),
  ) {
    search = typeof value === 'function' ? value(search) : value;
  }
  function setOpen(
    value: typeof open | ((previous: typeof open) => typeof open),
  ) {
    open = typeof value === 'function' ? value(open) : value;
  }
</script>

<aside class="course-contents" aria-label="Course contents">
  <WindowChrome title={sitePath('course/index')} />
  <div class="contents-heading">
    <h2>Course contents</h2>
    <a href="#/learn">Overview</a>
  </div>
  <button
    class="contents-toggle"
    aria-expanded={open}
    aria-controls="course-contents-list"
    onclick={() => setOpen(!open)}
    >{open ? 'Hide chapter list' : 'Browse chapters & lessons'}</button
  >
  <div
    id="course-contents-list"
    class={`contents-body ${open ? 'contents-open' : ''}`}
  >
    <label for="find-lesson">Find a lesson</label><input
      id="find-lesson"
      type="search"
      value={search}
      oninput={(e) => setSearch(e.currentTarget.value)}
      placeholder="❯ try outs or 1.1"
    />{#each [...chapters.keys()]
      .filter((c) => c > 0)
      .concat(0) as c, entryIndex (entryIndex)}{@const found = matches.filter(
        (l) => l.chapter === c,
      )}{#if found.length}{#key `${c}-${chapter}-${!!search}`}<details
            open={!!search || c === chapter}
          >
            <summary class="chapter-title-row"
              >{c === 0
                ? 'Optional: poker basics'
                : `${c}. ${chapters[c]}`}</summary
            >{#each found as l (l.id)}<a
                href={'#' + `/learn/${l.id}`}
                aria-current={current === l.id ? 'page' : undefined}
                onclick={() => {
                  setOpen(false);
                  setSearch('');
                }}
                ><span>{l.id.replace('-', '.')} · {l.title}</span><small
                  >{mastered(progress.results[l.id])
                    ? 'Quiz passed'
                    : journey.read.includes(l.id)
                      ? 'Read'
                      : ''}{journey.played.includes(l.id)
                    ? ' · Hand played'
                    : ''}</small
                ></a
              >{/each}
          </details>{/key}{:else}{/if}{/each}{#if !matches.length}<p>
        No lessons match. Try another word.
      </p>{/if}
    <p class="hint">
      Read in order, or open any lesson. You can always come back.
    </p>
  </div>
</aside>
