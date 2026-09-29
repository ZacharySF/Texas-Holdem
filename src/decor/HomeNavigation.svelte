<script lang="ts">
  import Generator from './gen/Generator.svelte';
  import CropMarks from './CropMarks.svelte';
  let {
    onplay,
    disabled = false,
  }: { onplay: (seats: number) => void; disabled?: boolean } = $props();
</script>

<!-- Requested functional navigation: only artwork is hidden/inert. Table buttons delegate existing actions. -->
<nav class="home-graphic-nav" aria-label="Explore poker">
  <div class="home-graphic-tile tile-play">
    <div class="tile-visual">
      <Generator
        kind="Dither"
        seed="tables-02"
        photo={2}
        width={240}
        height={150}
        accent="#b1b7d0"
      /><CropMarks n="01" />
    </div>
    <div class="tile-starts">
      <button {disabled} onclick={() => onplay(2)}
        >heads-up <span>↗</span></button
      ><button {disabled} onclick={() => onplay(6)}
        >six-max <span>↗</span></button
      >
    </div>
    <span class="tile-caption decor decor-micro" aria-hidden="true"
      >two seats / six seats</span
    >
  </div>
  <a class="home-graphic-tile" href="#/arcade"
    ><div class="tile-visual">
      <Generator
        kind="RangeMatrix"
        seed="outs-03"
        variant="dots"
        width={220}
        height={220}
        accent="#b1b7d0"
      /><CropMarks n="02" />
    </div>
    <span class="tile-name">outs <span>↗</span></span><span class="tile-caption"
      >Practice counting cards</span
    ></a
  >
  <a class="home-graphic-tile" href="#/lab"
    ><div class="tile-visual">
      <Generator
        kind="SlitScan"
        seed="equity-04"
        photo={3}
        variant="horizontal"
        width={240}
        height={150}
        accent="#b1b7d0"
      /><CropMarks n="03" />
    </div>
    <span class="tile-name">equity <span>↗</span></span><span
      class="tile-caption">Explore possible hands</span
    ></a
  >
</nav>
