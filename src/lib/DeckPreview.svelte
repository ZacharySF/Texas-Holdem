<script lang="ts">
  import PlayingCards from '../ui/PlayingCards.svelte';
  import { parseCards } from '../engine/cards';
  import { fourColorDeck } from '../visual/display';
  const cards = parseCards('Ac Ad Ah As');
</script>

<div class="deck-preview" role="group" aria-label="Deck preview">
  <PlayingCards {cards} />
  <p aria-live="polite">
    {$fourColorDeck
      ? 'Green clubs · blue diamonds · red hearts · dark spades'
      : 'Dark clubs and spades · red diamonds and hearts'}
  </p>
</div>
