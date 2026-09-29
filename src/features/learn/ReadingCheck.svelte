<script lang="ts">
  import { readingGuides } from '../../content/readingGuides';
  import { getLesson } from './context';
  const { lesson } = getLesson();
  const guide = readingGuides[lesson.id];
</script>

<aside class="reading-note" aria-label="Key idea">
  <h3>Key idea</h3>
  <p>{guide.takeaway}</p>
</aside>
<aside class="reading-note reading-caution" aria-label="Common mistake">
  <h3>Common mistake</h3>
  <p>{guide.mistake}</p>
</aside>
<div class="reading-check">
  <h3>Pause and explain it</h3>
  <p>{guide.question}</p>
  <p class="hint">
    Try answering in your own words before opening the explanation. This is
    practice; it does not affect your quiz score.
  </p>
  <details>
    <summary>Show explanation</summary>
    <p>{guide.answer}</p>
  </details>
</div>
