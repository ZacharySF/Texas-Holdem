<script lang="ts">
  import { handClassFacts } from '../../content/handChartFacts';
  import { gridClass } from '../../engine/rangeGrid';
  let { mode = 'starting' }: { mode?: 'starting' | 'ranges' | 'shove' } =
    $props();
  let selected = $state('AKs');
  const classes = Array.from({ length: 9 }, (_, i) =>
    gridClass(Math.floor(i / 3), i % 3),
  );
  const hand = $derived(handClassFacts(selected));
</script>

<section class="chart-walkthrough" aria-label="Hand chart walkthrough">
  <h3>
    {mode === 'shove'
      ? 'Read a shove chart step by step'
      : 'Read a starting-hand grid step by step'}
  </h3>
  <p>
    This corner of the full chart uses ace, king, and queen. Tap AKs, then AKo,
    then AA.
  </p>
  <div
    class="chart-mini-grid"
    role="group"
    aria-label="Practice reading hand classes"
  >
    {#each classes as label (label)}<button
        aria-pressed={selected === label}
        onclick={() => (selected = label)}>{label}</button
      >{/each}
  </div>
  <p role="status">
    <strong>{selected}</strong>: {hand.kind}, {hand.combos} physical card combinations.
  </p>
  <ol>
    <li>
      Find the ranks on the two axes. The diagonal is pairs. Above it, s means
      suited; below it, o means offsuit. T means ten.
    </li>
    {#if mode === 'shove'}
      <li>
        Open Hand charts and choose Shove / fold. Read the situation first:
        small blind versus big blind, unopened pot, equal stacks, no antes or
        rake.
      </li>
      <li>
        Choose the effective stack and the big blind’s calling range. A chart
        for an early position or a different stack answers a different question.
      </li>
      <li>
        Select a hand. Shove means the estimated chip gain is positive; fold
        means negative. Close means the sampling interval includes zero.
      </li>
      <li>
        Read the two branches: win the blinds when the opponent folds, or use
        your equity against the calling range when called. Subtract your
        additional risk.
      </li>
      <li>
        Change the calling range to Every hand and rebuild. Compare the same
        cell: the fold branch disappears. The chart is conditional on those
        assumptions, not a universal instruction.
      </li>
    {:else if mode === 'ranges'}
      <li>
        A colored range-editor cell selects possible hands; its weight applies
        to each physical combination in the class. It is not that hand’s chance
        of winning.
      </li>
      <li>
        Remove combinations containing cards you can see. The remaining
        combinations and weights determine the opponent’s modeled range.
      </li>
      <li>
        Compare with Starting-hand equity in Hand charts. That chart’s color
        means estimated pot share at showdown against the displayed opponents,
        not range membership.
      </li>
      <li>
        Select AKs and AKo in both tools. Read the combination counts and labels
        before comparing their colors.
      </li>
    {:else}
      <li>
        Open Hand charts and keep Starting-hand equity selected. Choose one
        opponent and build the chart.
      </li>
      <li>
        Tap AA. Read the percentage as average pot share at showdown, including
        ties. Read its sampling interval alongside it.
      </li>
      <li>
        Tap AKs and AKo. Compare their estimates with the same number of
        opponents and the same sample count.
      </li>
      <li>
        Change the opponent count and rebuild. Your old estimates clear because
        the situation changed.
      </li>
      <li>
        Do not translate a brighter cell directly into “always play.” A decision
        also needs the price, position, opponent ranges, and future betting.
      </li>
    {/if}
  </ol>
  <a href={mode === 'shove' ? '#/lab/charts?mode=shove' : '#/lab/charts'}
    >Open the full chart and try these steps →</a
  >
</section>
