<script lang="ts">
  import './PlayingCards.css';
  import { formatCard, suit, type Card } from '../engine/cards';
  import { fourColorDeck } from '../visual/display';
  import { cardAsset } from './cardAssets';
  let {
    cards,
    hidden = 0,
    highlight = [],
  }: {
    cards: readonly Card[];
    hidden?: number;
    highlight?: readonly Card[];
  } = $props();
  const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
</script>

<div class="playing-cards">
  {#each cards as c (c)}
    <span
      class:out-card={highlight.includes(c)}
      class="playing-card sc-acrylic"
      data-suit={suit(c)}
      aria-label={`${formatCard(c)}, ${suits[suit(c)]}`}
    >
      <img src={cardAsset(c, $fourColorDeck)} alt="" draggable="false" />
    </span>
  {/each}
  {#each Array.from({ length: hidden }, (_, i) => i) as i (i)}
    <span
      class="playing-card card-back sc-acrylic"
      aria-label="Hidden opponent card"
      ><img src={cardAsset()} alt="" draggable="false" /></span
    >
  {/each}
</div>
