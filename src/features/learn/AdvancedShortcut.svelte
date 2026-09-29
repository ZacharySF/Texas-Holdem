<script lang="ts">
  import { advancedExample, advancedShortcut } from '../../content/facts';
  import { getLesson } from './context';

  const { lesson } = getLesson();
  let s = $derived(advancedShortcut(lesson.id));
  let e = $derived(advancedExample(lesson.id));
</script>

<aside class="shortcut">
  <h3>A shortcut, with its error measured</h3>
  <p>{lesson.shortcut}</p>
  <p>
    Rounded: {s.approx.toString()}. Exact: {s.exact.toString()}. Signed error: {s.gap.toString()}
    ({s.gap.toNumber().toPrecision(4)}
    {e.unit === 'probability' ? 'probability units' : e.unit}). Rounding reduces
    writing; it does not change the underlying model.
  </p>
</aside>
