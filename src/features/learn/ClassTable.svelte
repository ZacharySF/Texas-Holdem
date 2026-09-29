<script lang="ts">
  import { facts } from '../../content/facts';
  import NotebookBlock from './NotebookBlock.svelte';

  let classes = $derived(facts.handClasses());
  let combos = $derived(facts.combosPerClass());
</script>

<div class="lesson-table">
  <table>
    <caption>Hand classes and equally likely physical combos</caption><thead
      ><tr
        ><th>Type</th><th>Classes</th><th>Combos per class</th><th
          >All combos</th
        ></tr
      ></thead
    ><tbody
      >{#each ['pairs', 'suited', 'offsuit'] as const as kind, i (i)}{@const per =
          [combos.pair, combos.suited, combos.offsuit][i]}{#key kind}<tr
            ><th>{kind}</th><td>{classes[kind]}</td><td>{String(per)}</td><td
              >{String(BigInt(classes[kind]) * per)}</td
            ></tr
          >{/key}{/each}<tr
        ><th>Total</th><td>{classes.total}</td><td>—</td><td
          >{String(facts.startingCombos())}</td
        ></tr
      ></tbody
    >
  </table>
</div>
<NotebookBlock
  lines={[
    'N_{\\mathrm{classes}}',
    '13+2\\binom{13}{2}',
    `${classes.pairs}+${classes.suited}+${classes.offsuit}`,
    `${classes.total}`,
  ]}
></NotebookBlock>
