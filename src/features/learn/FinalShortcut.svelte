<script lang="ts">
  import { getLesson } from './context';
  import { finalExample } from '../../content/finalLessonFacts';

  const { lesson } = getLesson();
  let e = $derived(finalExample(lesson.id, lesson.id === '24-2' ? 2 : 5));
</script>

<aside class="shortcut">
  <h3>A shortcut, with its error measured</h3>
  <p>{lesson.shortcut}</p>
  <p>
    Shortcut: {e.shortcut.toString()}. Exact: {e.answer.toString()}. Shortcut
    minus exact: {e.gap.toString()} ({e.gap.toNumber().toPrecision(5)} in the stated
    units).
  </p>
</aside>
