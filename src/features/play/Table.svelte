<script lang="ts">
  import type { Game, Action } from '../../engine/game';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  import PixiTable from './PixiTable.svelte';
  let {
    game,
    total,
    handLabel,
    botDescription,
    seatName,
    actionText,
  }: {
    game: Game;
    total: number;
    handLabel?: string;
    botDescription: string;
    seatName: (seat: number) => string;
    actionText: (action: Action) => string;
  } = $props();
  const last = $derived(game.history.at(-1));
</script>

<section
  class={`felt-table table-${game.players.length}${game.runouts ? ' has-runouts' : ''}`}
  aria-label="Poker table"
>
  <PixiTable />
  <div class="table-center">
    <span class="table-street"
      >{game.complete ? 'HAND COMPLETE' : game.street.toUpperCase()}</span
    >
    <div class="community-cards">
      <PlayingCards cards={game.board} />
      {#each Array.from({ length: 5 - game.board.length }, (_, i) => i) as i (i)}<span
          class="board-slot"
          aria-hidden="true"
        ></span>{/each}
    </div>
    {#if game.runouts}<div>
        <p class="runout-label">Second runout</p>
        <PlayingCards cards={game.runouts[1]} />
      </div>{/if}
    <span class="pot-chip"
      >{game.complete ? 'Final pot' : 'Pot'}
      <strong>{total.toLocaleString()}</strong></span
    >
    <p class="table-status" role="status">
      {game.complete
        ? `Hand over. You receive ${game.awards[0]} chips from the matched pots.`
        : game.actor === 0
          ? 'Your turn'
          : `${seatName(game.actor)} is thinking…`}
    </p>
  </div>
  {#each game.players as player, seat (seat)}
    {@const latest = [...game.history].reverse().find((h) => h.seat === seat)}
    <div
      data-seat={seat}
      class={`seat ${seat === 0 ? 'hero-seat' : 'bot-seat'} ${!game.complete && game.actor === seat ? 'acting' : ''} ${player.folded ? 'folded' : ''} ${game.complete && game.awards[seat] > 0 ? 'winner' : ''}`}
    >
      <div class="seat-identity">
        <div>
          <h2>
            {seatName(seat)}
            {#if game.config.button === seat}<span
                class="dealer-button"
                title="Dealer button"
                aria-label="Dealer button">D</span
              >{/if}
          </h2>
          <span class="seat-stack">{player.stack.toLocaleString()} chips</span>
        </div>
      </div>
      <PlayingCards
        cards={seat === 0 || game.complete ? player.hand : []}
        hidden={seat !== 0 && !game.complete ? 2 : 0}
      />
      <span class="seat-action"
        >{player.folded
          ? 'Folded'
          : game.complete && game.awards[seat] > 0
            ? `Won ${game.awards[seat]}`
            : player.stack === 0
              ? 'All in'
              : latest
                ? actionText(latest.action)
                : seat === 0
                  ? 'Your hole cards'
                  : botDescription}</span
      >
      {#if player.round > 0 && !game.complete}<span class="seat-bet"
          >{player.round} in front</span
        >{/if}
    </div>
  {/each}
  <div class="table-caption">
    {#if handLabel}<span>Your hand: {handLabel}</span>{/if}{#if last}<span
        >{seatName(last.seat)} · {actionText(last.action)}</span
      >{/if}
  </div>
</section>
