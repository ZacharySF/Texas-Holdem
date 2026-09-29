<script lang="ts">
  import { gridRange } from '../../engine/rangeGrid';
  import { parseCards, type Hand } from '../../engine/cards';
  import { getLesson } from './context';
  import EquityExperiment from '../../ui/EquityExperiment.svelte';

  const { seed } = getLesson();
</script>

<div>
  <h3>Check a weighted range on a concrete board</h3>
  <p>
    Hero range: AA and KK at weight 100, AKs at weight 30. Opponent: Qs Qd.
    Board: 2c 3d 7h 9s. Remove blockers, condition on compatible combos, then
    enumerate each river. Compare exact weighting with a sample.
  </p>
  <EquityExperiment
    input={{
      players: [
        gridRange({ AA: 100, KK: 100, AKs: 30 }),
        parseCards('Qs Qd') as unknown as Hand,
      ],
      board: parseCards('2c 3d 7h 9s'),
      seed,
      samples: 10000,
      method: 'auto',
    }}
  ></EquityExperiment>
</div>
