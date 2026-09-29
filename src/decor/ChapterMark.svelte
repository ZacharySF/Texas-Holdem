<!-- Chapter spread: L0 void; L1 small exact distribution; L2 grid baseline;
 L3 echoed chapter title; L4 vertical chapter number; L5 existing links;
 L6 distribution family/seed; L7 global grain. Accent: lime. -->
<script lang="ts">
  import { chapterBudget } from './gen/budget';
  import TypeDevice from './TypeDevice.svelte';
  import Generator from './gen/Generator.svelte';
  import { chapters } from '../content/lessons';
  let { n }: { n: number } = $props();
  const variants = ['area', 'bars', 'scope'];
  const families = ['binomial', 'hypergeometric', 'outs'];
</script>

<div class="spread-chapter-mark decor" aria-hidden="true">
  <div class="chapter-vertical">
    <TypeDevice word={String(n).padStart(2, '0')} treatment="vertical" />
  </div>
  <div class="chapter-echo">
    <span class="decor-micro"
      >chapter {n} / {families[Math.floor(n / 3) % 3]}</span
    ><TypeDevice word={chapters[n]} treatment="echo" />
  </div>
  <div class="chapter-plot" use:chapterBudget>
    <Generator
      kind="Distribution"
      seed={`chapter-${n}`}
      variant={variants[n % 3]}
      text={families[Math.floor(n / 3) % 3]}
      width={220}
      height={100}
      accent="#b4c64a"
    />
  </div>
</div>
