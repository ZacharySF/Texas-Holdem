<script lang="ts">
  import { getLesson } from './context';

  const { lesson } = getLesson();
</script>

<p>
  <a
    href={'#' +
      (lesson.chapter === 20
        ? '/lab/shuffle'
        : lesson.chapter === 21
          ? '/lab/tools/insurance'
          : lesson.chapter === 23
            ? '/lab/tools/icm'
            : lesson.chapter === 24
              ? '/lab/tools/sizing'
              : '/arcade/akq')}>Change the model inputs in the related tool</a
  >
</p>
