<script lang="ts">
  import katex from 'katex';
  import { notebookTex } from './NotebookBlock';
  let { lines }: { lines: readonly string[] } = $props();
  let html = $derived(
    katex.renderToString(notebookTex(lines), {
      displayMode: true,
      throwOnError: true,
      trust: false,
      output: 'htmlAndMathml',
    }),
  );
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable content must be keyboard accessible.) -->
<div class="notebook" tabindex="0" role="region" aria-label="Worked derivation">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- KaTeX renders application-authored formulas with trust disabled. -->
  {@html html}
</div>
