<script lang="ts">
  import {
    checkEquityCalculation,
    type EquityCoachFacts,
  } from '../../content/equityCoachFacts';
  import EquityByHand from '../learn/EquityByHand.svelte';
  let answer = $state(''),
    feedback = $state('');
  import { formatPercent } from '../../engine/math';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  let {
    facts,
    hand,
    board,
    multiway,
  }: {
    facts: EquityCoachFacts;
    hand: readonly number[];
    board: readonly number[];
    multiway: boolean;
  } = $props();
  const number = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 3 });
</script>

<section class="equity-walkthrough" aria-label="Equity calculation">
  <h3>How your equity is calculated</h3>
  <p>
    Equity is your average share of the pot if these hands reach showdown. A tie
    counts as a share of a win.
  </p>
  <ol>
    <li>
      <h4>Keep the cards you can see</h4>
      <PlayingCards cards={hand} />
      <p>Your two cards stay fixed.</p>
      {#if board.length}<PlayingCards cards={board} />
        <p>The exposed board stays fixed too.</p>{:else}<p>
          The board has not been dealt yet.
        </p>{/if}
    </li>
    <li>
      <h4>Try possible hidden cards</h4>
      <div class="equity-deal-flow" aria-hidden="true">
        <span>Your cards<br />stay</span><span>Unknown cards<br />sample</span
        ><span>Best five<br />compare</span>
      </div>
      <p>
        Give each of the {facts.opponents}
        {facts.opponents === 1 ? 'opponent' : 'opponents'} a possible hand from the
        range model. Fill the undealt board from the remaining deck. No card can appear
        twice.
      </p>
      <p>
        The coach guesses possible holdings from public information. It never
        reads their actual hidden cards.
      </p>
    </li>
    <li>
      <h4>Count what happened</h4>
      <p>
        This estimate ran <strong>{number(facts.samples)}</strong> possible deals.
      </p>
      <div
        class="equity-outcomes"
        role="img"
        aria-label={`${number(facts.wins)} wins, ${number(facts.ties)} ties, ${number(facts.losses)} losses`}
      >
        <span class="equity-wins" style:flex={facts.wins}></span><span
          class="equity-ties"
          style:flex={facts.ties}
        ></span><span class="equity-losses" style:flex={facts.losses}></span>
      </div>
      <dl class="equity-counts">
        <div>
          <dt>Wins</dt>
          <dd>{number(facts.wins)}</dd>
        </div>
        <div>
          <dt>Ties</dt>
          <dd>{number(facts.ties)}</dd>
        </div>
        <div>
          <dt>Losses</dt>
          <dd>{number(facts.losses)}</dd>
        </div>
      </dl>
    </li>
    <li>
      <h4>Give ties their share</h4>
      <p>
        A sole winner gets one whole pot. Tied winners divide it equally. Losing
        gets no share.
      </p>
      {#if facts.opponents === 1}<p>
          Each heads-up tie contributes half a pot: {number(facts.ties)} ÷ 2 =
          <strong>{number(facts.tieCredit)}</strong>.
        </p>{:else}<p>
          Some ties split between two players, others between more. The
          simulation adds each actual split; it does not treat every tie as half
          a win.
        </p>{/if}
      <p>
        {number(facts.wins)} whole pots + {number(facts.tieCredit)} shared-pot credit
        = <strong>{number(facts.credit)}</strong> pot shares.
      </p>
    </li>
    <li>
      <h4>Divide by all the deals</h4>
      <p class="equity-equation">
        {number(facts.credit)} ÷ {number(facts.samples)} =
        <strong>{formatPercent(facts.equity)}</strong>
      </p>
      <p>
        That is your estimated equity. It is different from just counting
        outright wins.
      </p>
    </li>
  </ol>
  <section class="equity-self-check" aria-label="Calculate your current equity">
    <h4>Now calculate it yourself</h4>
    <p>
      ({number(facts.wins)} + {number(facts.tieCredit)}) ÷ {number(
        facts.samples,
      )} × 100
    </p>
    <label
      >Your calculation (%)<input
        type="number"
        min="0"
        max="100"
        step="any"
        bind:value={answer}
        oninput={() => (feedback = '')}
      /></label
    >
    <button
      onclick={() =>
        (feedback = checkEquityCalculation(String(answer ?? ''), facts.equity))}
      >Check my calculation</button
    >
    <p role="status">{feedback}</p>
  </section>
  <details>
    <summary>Practice counting the possible cards yourself</summary
    ><EquityByHand />
  </details>
  <p><a href="#/learn/11-1">Worked equity lesson →</a></p>
  <p>
    Sampling interval: {facts.interval
      .map((n) => formatPercent(n))
      .join(' to ')}. Another sample can move the number; a different opponent
    range can change it more.
  </p>
  <p>
    {multiway
      ? 'With side pots, this whole-table share is descriptive. Use Pot odds to see the awards from each pot you can win.'
      : 'Use Pot odds to compare this share with the cost of calling. Equity alone does not choose between a check, bet, or fold.'}
  </p>
  <a href="#/lab/charts">Compare all starting hands →</a>
</section>
