<script lang="ts">
  import { advancedExample } from '../../content/facts';
  import { Rational } from '../../engine/math';
  import { getLesson } from './context';

  const { lesson } = getLesson();
  let model = $derived(advancedExample(lesson.id).model);
</script>

{'p' in model && 'd' in model ? new Rational(model.p, model.d).toString() : ''}
