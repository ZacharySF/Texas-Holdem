<script lang="ts">
  import type { Game, Action } from '../../engine/game';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  import PixiTable from './PixiTable.svelte';
  import FullscreenStars from '../../lib/FullscreenStars.svelte';
  import ChipStack from '../../lib/ChipStack.svelte';
  let {
    game,
    total,
    handLabel,
    botDescription,
    seatName,
    actionText,
    tournament = false,
  }: {
    game: Game;
    total: number;
    handLabel?: string;
    botDescription: string;
    seatName: (seat: number) => string;
    actionText: (action: Action) => string;
    tournament?: boolean;
  } = $props();
  const last = $derived(game.history.at(-1));
  const smallBlindSeat = $derived(
    game.config.tournamentBlinds
      ? game.config.tournamentBlinds.small
      : game.players.length === 2
        ? game.config.button
        : (game.config.button + 1) % game.players.length,
  );
  const bigBlindSeat = $derived(
    game.config.tournamentBlinds?.big ??
      ((smallBlindSeat ?? 0) + 1) % game.players.length,
  );
  const showdown = $derived(
    game.complete && game.players.filter((player) => !player.folded).length > 1,
  );
</script>

<section
  class={`felt-table sc-table table-${game.players.length}${game.runouts ? ' has-runouts' : ''}`}
  aria-label="Poker table"
>
  <PixiTable />
  {#if !tournament}<FullscreenStars />{/if}
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
      ><ChipStack amount={total} />{game.complete ? 'Final pot' : 'Pot'}
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
            {#if game.config.button === seat && !game.config.tournamentBlinds?.deadButton}<span
                class="dealer-button"
                title="Dealer button"
                aria-label="Dealer button">D</span
              >{/if}
            {#if seat === smallBlindSeat}<span
                class="blind-position"
                aria-label="Small blind"
                title={`Small blind: ${game.config.smallBlind}`}>SB</span
              >{/if}
            {#if seat === bigBlindSeat}<span
                class="blind-position"
                aria-label="Big blind"
                title={`Big blind: ${game.config.bigBlind}`}>BB</span
              >{/if}
          </h2>
          <span class="seat-stack">{player.stack.toLocaleString()} chips</span>
        </div>
      </div>
      <div class="seat-cards-and-chips">
        <PlayingCards
          cards={seat === 0 || (showdown && !player.folded) ? player.hand : []}
          hidden={seat !== 0 && (!showdown || player.folded) ? 2 : 0}
        />
        <ChipStack amount={player.stack} compact />
      </div>
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
