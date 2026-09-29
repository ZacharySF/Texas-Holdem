<script lang="ts">
  import { advancedFacts } from '../../content/facts';
  import { type EquityResult } from '../../engine/equity';
  import { parseCards, type Hand } from '../../engine/cards';
  import { getLesson } from './context';
  import EquityExperiment from '../../ui/EquityExperiment.svelte';
  const matchups = [
    ['Pair vs two overcards', 'Qs Qd', 'Ah Kc'],
    ['Pair vs one overcard', 'Qs Qd', 'Ah Jc'],
    ['Pair vs undercards', 'Qs Qd', 'Jh Tc'],
    ['Bigger vs smaller pair', 'As Ad', 'Ks Kd'],
    ['Domination', 'As Kd', 'Ah Qc'],
    ['Suited high cards', 'Ah Kh', 'Qs Qd'],
    ['Offsuit high cards', 'Ah Kc', 'Qs Qd'],
    ['Suited connectors', '8h 9h', 'As Kd'],
  ] as const;

  let estimate = $state.raw<EquityResult | null>(null);
  const { seed } = getLesson();
  let selected = $state.raw(0);
  let opponents = $state.raw(1);
  let random = $state.raw(false);
  let m = $derived(matchups[selected]);
  function setEstimate(
    value: typeof estimate | ((previous: typeof estimate) => typeof estimate),
  ) {
    estimate = typeof value === 'function' ? value(estimate) : value;
  }
  function setSelected(
    value: typeof selected | ((previous: typeof selected) => typeof selected),
  ) {
    selected = typeof value === 'function' ? value(selected) : value;
  }
  function setOpponents(
    value:
      typeof opponents | ((previous: typeof opponents) => typeof opponents),
  ) {
    opponents = typeof value === 'function' ? value(opponents) : value;
  }
  function setRandom(
    value: typeof random | ((previous: typeof random) => typeof random),
  ) {
    random = typeof value === 'function' ? value(random) : value;
  }
</script>

<div>
  <label
    >Matchup<select
      value={selected}
      onchange={(e) => setSelected(Number(e.currentTarget.value))}
      >{#each matchups as m, i (m[0])}<option value={i}
          >{m[0]} · {m[1]} vs {m[2]}</option
        >{/each}</select
    ></label
  ><label
    ><input
      type="checkbox"
      checked={random}
      onchange={(e) => setRandom(e.currentTarget.checked)}
    /> Replace the specified opponent with random cards</label
  ><label
    >Opponents<select
      value={opponents}
      onchange={(e) => setOpponents(Number(e.currentTarget.value))}
      >{#each [1, 2, 3, 4, 5] as n (n)}<option>{n}</option>{/each}</select
    ></label
  >
  <p>
    Additional opponents are random. Everyone reaches showdown; no future
    betting or folds. A coin-flip shortcut uses {advancedFacts
      .fairChance()
      .toString()}; compare that reference with the measured equity and its
    interval.
  </p>
  <EquityExperiment
    input={{
      players: [
        parseCards(m[1]) as unknown as Hand,
        random ? 'random' : (parseCards(m[2]) as unknown as Hand),
        ...Array.from({ length: opponents - 1 }, () => 'random' as const),
      ],
      board: [],
      seed,
      samples: 10000,
      method: 'monteCarlo',
    }}
    onResult={setEstimate}
  ></EquityExperiment>{#if estimate}<p>
      Signed gap from the {advancedFacts.fairChance().toString()} coin-flip shortcut:
      {(
        (estimate.players[0].equity.value -
          advancedFacts.fairChance().toNumber()) *
        100
      ).toFixed(3)} percentage points. This comparison belongs to the last completed
      run; run again after changing the matchup.
    </p>{/if}
</div>
