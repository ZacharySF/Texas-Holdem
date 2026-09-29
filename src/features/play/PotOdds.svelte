<script lang="ts">
  import PotOddsGuide from '../learn/PotOddsGuide.svelte';
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
      A pot is a group of chips with the same eligible winners. More players do
      not automatically mean more pots: different contribution amounts create
      layers, usually when someone is all in. You cannot win a layer you did not
      match. Folded players’ chips stay in the pots, but they cannot win them.
    </p>
    <ol>
      <li>
        <span>Cost to stay in</span><strong>{chips(facts.call)} chips</strong>
      </li>
      <li>
        <span>Count each pot separately</span>
        {#each facts.pots as pot, i (i)}
          <div class="pot-odds-pot">
            <span
              >{i === 0 ? 'Main pot' : `Side pot ${i}`} · {chips(pot.amount)} chips</span
            >
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
            <p>
              {pot.eligible.includes(facts.hero)
                ? `You can win this pot. Its average award includes full wins, split wins, and zero when you lose.`
                : 'You cannot win this pot. Its contribution to your estimated award is zero, regardless of how strong your hand is.'}
            </p>
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
      The model samples possible opponent hands and remaining board cards, then
      awards each pot to its eligible winner or splits a tie. For each pot, it
      adds the chips awarded to you across {facts.samples?.toLocaleString()}
      simulated deals and divides by that number of deals. That average is your
      <strong>estimated award</strong>, not a guaranteed reward or pure profit.
      A side pot can be easier to win because fewer opponents are eligible.
    </p>
    <p>
      The total above includes the chips you put in by calling. Subtract your
      {chips(facts.call)}-chip call once because you pay it in every outcome,
      even the losing ones. We subtract the call
      <em>from the expected award</em>, not the other way around. The result is
      the estimated net change in your stack from this decision. Folding adds no
      new cost, so its comparison value is zero; earlier contributions are
      already committed either way.
    </p>
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
  <details>
    <summary
      >Why this arithmetic works — pots, awards, and the cost of calling</summary
    >
    <PotOddsGuide />
  </details>
  <p>
    <a href="#/learn/12-2">Study pot odds and side pots in lesson 12.2 →</a>
  </p>
</section>
