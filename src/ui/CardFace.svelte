<script lang="ts">
  import { formatCard, suit, type Card } from '../engine/cards';
  import { fourColorDeck } from '../visual/display';
  import { cardAsset } from './cardAssets';
  let {
    card,
    onclick,
    label,
  }: { card?: Card; onclick: () => void; label: string } = $props();
</script>

<button
  class="card-picker-card"
  class:empty={card === undefined}
  data-suit={card === undefined ? '' : suit(card)}
  {onclick}
  aria-label={`${label}: ${card === undefined ? 'choose a card' : formatCard(card)}`}
>
  {#if card === undefined}<span>+</span>{:else}<img
      src={cardAsset(card, $fourColorDeck)}
      alt=""
      draggable="false"
    />{/if}
</button>
