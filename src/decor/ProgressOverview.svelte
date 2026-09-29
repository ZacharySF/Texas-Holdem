<script lang="ts">
  import { decodeProgress, PROGRESS_KEY } from '../features/learn/progress';
  import { lessons } from '../content/lessons';
  let { hands }: { hands?: number } = $props();
  const progress = (() => {
    try {
      return decodeProgress(localStorage.getItem(PROGRESS_KEY));
    } catch {
      return decodeProgress(null);
    }
  })();
</script>

<section class="progress-overview" aria-label="Recorded practice">
  <div class="panel-label">05 / recorded practice</div>
  <p class="progress-figure">{hands ?? '—'}<span>completed hands</span></p>
  {#if Object.keys(progress.results).length}<div class="quiz-records">
      {#each lessons as lesson (lesson.id)}{@const result =
          progress.results[lesson.id]}{#if result}<div class="quiz-record">
            <a href={`#/learn/${lesson.id}`}
              >{lesson.id.replace('-', '.')} / {lesson.title}</a
            ><span>{result.bestCorrect} / {result.total}</span>
            <div class="stripe-value" aria-hidden="true">
              <span
                style:width={`${(result.bestCorrect / result.total) * 100}%`}
              ></span>
            </div>
          </div>{/if}{/each}
    </div>{/if}
</section>
