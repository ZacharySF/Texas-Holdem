<script lang="ts">
  import {
    equityByHandExample,
    checkEquityCalculation,
  } from '../../content/equityCoachFacts';
  import { formatCard } from '../../engine/cards';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  const example = equityByHandExample();
  let answer = $state(''),
    feedback = $state(''),
    revealed = $state(false);
</script>

<section class="equity-by-hand" aria-label="Calculate equity by hand">
  <h3>Work out one river by hand</h3>
  <p>
    This separate practice example exposes both hands. Every possible river is
    equally likely.
  </p>
  <div class="equity-example-hands">
    <div>
      <h4>Your hand</h4>
      <PlayingCards cards={example.hero} />
    </div>
    <div>
      <h4>Opponent</h4>
      <PlayingCards cards={example.opponent} />
    </div>
  </div>
  <h4>Board · one card to come</h4>
  <PlayingCards cards={example.board} />
  <ol>
    <li>
      Remove all visible cards: {example.deck} − {example.known} =
      <strong>{example.rivers.length}</strong> possible rivers.
    </li>
    <li>
      Compare the best five cards for each river. The remaining kings give the
      opponent three kings. Every other river leaves your aces ahead.
    </li>
    <li>
      Count: <strong>{example.wins} wins</strong>, {example.ties} ties, {example.losses}
      losses.
    </li>
    <li>
      Your equity is wins plus half of ties, divided by all possible rivers.
      Multiply by 100 to write it as a percentage.
    </li>
  </ol>
  <div
    class="equity-river-grid"
    role="img"
    aria-label={`${example.rivers.length} river cards: ${example.wins} wins, ${example.ties} ties, ${example.losses} losses`}
  >
    {#each example.rivers as river (river.card)}<span
        class:river-loss={river.outcome === 'loss'}
        >{formatCard(river.card)}<small>{river.outcome}</small></span
      >{/each}
  </div>
  <label
    >Your answer (%)<input
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
      (feedback = checkEquityCalculation(
        String(answer ?? ''),
        example.value.toNumber(),
      ))}>Check calculation</button
  >
  <button onclick={() => (revealed = !revealed)} aria-expanded={revealed}
    >Show worked answer</button
  >
  <p role="status">{feedback}</p>
  {#if revealed}<div class="equity-manual-lines" aria-label="Equity arithmetic">
      <div>({example.wins} + {example.ties} ÷ 2) ÷ {example.rivers.length}</div>
      <div>= {example.value.toString()}</div>
      <div>= {example.value.display().percent}</div>
    </div>{/if}
  <p>
    At a real table, you usually do not know the opponent’s cards. Repeat this
    calculation for the hands you think they can have, weight those
    possibilities, and average. The coach estimates that larger calculation by
    sampling.
  </p>
</section>
