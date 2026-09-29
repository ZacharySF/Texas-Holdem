<script lang="ts">
  import type { PotOddsFacts } from '../../content/potOddsFacts';
  import { formatPercent } from '../../engine/math';
  let { facts }: { facts: PotOddsFacts } = $props();
  const chips = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 2 });
</script>

<section class="pot-odds-walkthrough" aria-label="Pot odds calculation">
  <h3>Pot odds, step by step</h3>
  {#if facts.call === 0}
    <p>
      Nothing to call. Checking costs <strong>0 chips</strong>. Pot odds do not
      require you to bet.
    </p>
  {/if}
  {#if facts.multiway}
    <p>
      Several players can create separate pots. We calculate your expected share
      of each pot you can win.
    </p>
    <ol>
      <li>
        <span>Cost to stay in</span><strong>{chips(facts.call)} chips</strong>
      </li>
      <li>
        <span>Count each pot separately</span>
        {#each facts.pots as pot, i (i)}
          <div class="pot-odds-pot">
            <span>Pot {i + 1} · {chips(pot.amount)} chips</span>
            <div
              class="pot-odds-bar"
              role="img"
              aria-label={`Pot ${i + 1}: expected award ${chips(pot.heroMean)} out of ${pot.amount} chips`}
            >
              <span class="pot-odds-award" style:flex={pot.heroMean}
              ></span><span style:flex={Math.max(0, pot.amount - pot.heroMean)}
              ></span>
            </div>
            <small
              >Your estimated award: {chips(pot.heroMean)} chips. Eligible seats:
              {pot.eligible.map((s) => s + 1).join(', ')}.</small
            >
          </div>
        {/each}
      </li>
      <li>
        <span>Add your expected awards, then subtract the call</span>
        <strong
          >{chips(facts.expectedAward)} − {chips(facts.call)} = {chips(
            facts.net,
          )} chips</strong
        >
      </li>
    </ol>
    <p>
      No single equity target describes different side pots. This model assumes
      every live opponent matches the current bet up to their stack, then
      betting stops.
    </p>
  {:else}
    <ol>
      <li>
        <span>Count the chips already there</span><strong
          >{chips(facts.pot)} chips</strong
        ><small>This includes the opponent’s bet.</small>
      </li>
      <li>
        <span>Add what you must call</span><strong
          >{chips(facts.pot)} + {chips(facts.call)} = {chips(facts.total)} chips</strong
        ><small>This is the pot after you call.</small>
      </li>
      <li>
        <span>Divide your call by that total</span><strong
          >{chips(facts.call)} ÷ {chips(facts.total)} = {formatPercent(
            facts.threshold,
          )}</strong
        ><small
          >Your break-even share: the average share you need to cover the call.</small
        >
      </li>
    </ol>
    <div
      class="pot-odds-bar"
      role="img"
      aria-label={`${facts.pot} chips already in the pot plus your ${facts.call} chip call`}
    >
      <span style:flex={facts.pot}></span><span
        class="pot-odds-call"
        style:flex={facts.call}
      ></span>
    </div>
    <div class="pot-odds-legend">
      <span>Already in · {chips(facts.pot)}</span><span
        >Your call · {chips(facts.call)}</span
      >
    </div>
    {#if facts.excluded > 0}<p>
        {chips(facts.excluded)} chips are excluded: your stack cannot contest them,
        so they return to the opponent.
      </p>{/if}
    {#if facts.call > 0}
      <p>
        Your estimated share is <strong>{formatPercent(facts.equity)}</strong>;
        the call needs <strong>{formatPercent(facts.threshold)}</strong>.
      </p>
      <p class="pot-odds-result">
        {facts.net > 0
          ? 'The model favors calling over folding.'
          : facts.net < 0
            ? 'The model favors folding over calling.'
            : 'Calling and folding break even in this model.'}
      </p>
      <p>
        Average return: {formatPercent(facts.equity)} × {chips(facts.total)} − {chips(
          facts.call,
        )} = <strong>{chips(facts.net)} chips</strong>.
      </p>
    {/if}
    <p class="hint">
      Equity includes tied pots. This comparison assumes no more betting and no
      rake. It does not compare a raise, and it cannot promise a win.
    </p>
  {/if}
</section>
