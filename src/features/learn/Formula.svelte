<script lang="ts">
  import katex from 'katex';
  let { tex }: { tex: string } = $props();
</script>

<span
  ><!-- eslint-disable-next-line svelte/no-at-html-tags -- KaTeX renders application-authored formulas with trust disabled. -->
  {@html katex.renderToString(tex, {
    throwOnError: true,
    trust: false,
    output: 'htmlAndMathml',
  })}</span
>
