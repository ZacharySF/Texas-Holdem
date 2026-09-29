<script lang="ts">
  import { parallax } from '../visual/parallax';
  import { visualConfig } from '../visual/config';
  let { word }: { word: string } = $props();
</script>

<div class="decor-masthead decor" aria-hidden="true">
  <div use:parallax={visualConfig.motion.heroTitle}>{word}</div>
</div>
