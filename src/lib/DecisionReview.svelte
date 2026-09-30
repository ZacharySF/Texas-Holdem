<script lang="ts">
  import type { Game } from '../engine/game';
  import type { DecisionNote } from '../features/play/storage';
  import { actionText } from '../features/play/Table';
  let {
    game,
    readNotes,
  }: { game: Game; readNotes: () => readonly DecisionNote[] } = $props();
  const last = $derived.by(() => {
    const index = game.history.map((record) => record.seat).lastIndexOf(0);
    if (index < 0) return null;
    return {
      record: game.history[index],
      index,
      note: readNotes().find((note) => note.seat === 0 && note.index === index),
    };
  });
</script>

{#if last}
  <section
    class="decision-review"
    aria-label="Last decision details"
    aria-live="polite"
  >
    <p class="decision-action">
      <strong>{actionText(last.record.action)}</strong> · {last.record.street}
    </p>
    {#if last.note}
      <dl>
        <div>
          <dt>Equity when you acted</dt>
          <dd>
            {(last.note.equity.players[0].equity.value * 100).toFixed(1)}%
          </dd>
        </div>
        {#if last.note.gap !== undefined}<div>
            <dt>Gap from best modeled choice</dt>
            <dd>{last.note.gap.toFixed(2)} chips</dd>
          </div>{/if}
        <div>
          <dt>
            {last.note.equity.method === 'exact'
              ? 'Outcomes evaluated'
              : 'Simulation samples'}
          </dt>
          <dd>{last.note.equity.total.toLocaleString()}</dd>
        </div>
      </dl>
      <p class="hint">
        These numbers belong to that decision. The gap compares expected
        returns; it is not the chips you actually won or lost.
      </p>
    {:else}
      <p>
        No estimate was ready for this action. Your choice is recorded, but
        there is no model score for it.
      </p>
    {/if}
  </section>
{/if}
