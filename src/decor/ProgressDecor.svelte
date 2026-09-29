<!-- Progress: L0 void; L1 recorded starting-hand matrix, only if valid histories exist;
 L2 ruled baseline; L3 existing heading; L4 rings; L5 existing analysis untouched;
 L6 neofetch + actual-stat barcode; L7 grain. Accent: ultraviolet. -->
<script lang="ts">
  import Fetch from './Fetch.svelte';
  import Generator from './gen/Generator.svelte';
  import RingGauge from './RingGauge.svelte';
  import Ruler from './Ruler.svelte';
  import { readouts } from './readouts';
  import { lessons } from '../content/lessons';
  import { playedClasses } from './playedClasses';
  let { results }: { results?: readonly { id: string }[] } = $props();
  let counts = $state<readonly number[]>();
  const stats = readouts();
  $effect(() => {
    if (!results?.length) {
      counts = undefined;
      return;
    }
    let active = true;
    void playedClasses(results.map((r) => r.id))
      .then((v) => {
        if (active) counts = v;
      })
      .catch(() => {
        if (active) counts = undefined;
      });
    return () => {
      active = false;
    };
  });
</script>

<div class="spread-progress decor" aria-hidden="true">
  <div class="progress-terminal">
    <span class="decor-micro">05 / your recorded practice</span><Fetch
      {...stats}
    />
  </div>
  <div class="progress-gauges">
    <RingGauge
      value={stats.xp}
      max={Math.max(100, Math.ceil(stats.xp / 100) * 100)}
      label="XP · display scale"
    /><RingGauge
      value={stats.lessons}
      max={lessons.length}
      label="lessons completed"
    />
  </div>
  <div class="progress-barcode">
    <Generator
      kind="Barcode"
      text={`H${stats.hands}-XP${stats.xp}-L${stats.lessons}`}
      width={230}
      height={70}
      accent="#9287b8"
    />
  </div>
  <Ruler />
  {#if counts}<div class="progress-hands">
      <Generator
        kind="RangeMatrix"
        variant="filled"
        seed="recorded-hands"
        values={counts}
        width={260}
        height={260}
        accent="#9287b8"
      /><span class="decor-micro"
        >your saved starting hands / count by class</span
      >
    </div>{/if}
</div>
