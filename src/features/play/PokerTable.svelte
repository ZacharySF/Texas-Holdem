<script lang="ts">
  import type { Persona } from '../../engine/bots';
  import { evaluateReference } from '../../engine/evaluator';
  import { potSize, type Game } from '../../engine/game';
  import TableView from './Table.svelte';
  import { botStyles, seatName, actionText } from './Table';
  let { game, persona }: { game: Game; persona: Persona } = $props();
  let total = $derived(
    game.complete
      ? game.finalContributions.reduce((a, b) => a + b, 0)
      : potSize(game),
  );
  let handLabel = $derived(
    game.board.length >= 3 && !game.players[0].folded
      ? evaluateReference([...game.players[0].hand, ...game.board]).name
      : undefined,
  );
</script>

<div class="svelte-view">
  <TableView
    {...{
      game,
      total,
      handLabel,
      botDescription: botStyles[persona].name,
      seatName,
      actionText,
    }}
  />
</div>
