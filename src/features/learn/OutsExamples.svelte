<script lang="ts">
  import { Rational } from '../../engine/math';
  import {
    drawingFacts,
    formatPercent,
    outChance,
    outShortcut,
    fractionTex,
  } from '../../content/facts';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  import ExactValue from './ExactValue.svelte';
  import NotebookBlock from './NotebookBlock.svelte';

  let combo = $derived(drawingFacts.combo());
  let dirty = $derived(drawingFacts.dirty());
</script>

<div>
  <h3>A combo draw counts cards, not labels</h3>
  <PlayingCards cards={combo.hole}></PlayingCards><PlayingCards
    cards={combo.board}
  ></PlayingCards>
  <p>
    Flush completions: {combo.flush.length}. Straight completions: {combo
      .straight.length}. Shared cards: {combo.overlap.length}.
  </p>
  <PlayingCards cards={combo.overlap} highlight={combo.overlap}
  ></PlayingCards><NotebookBlock
    lines={[
      'N_{F\\cup S}',
      'N_F+N_S-N_{F\\cap S}',
      `${combo.flush.length}+${combo.straight.length}-${combo.overlap.length}`,
      `${combo.union.length}`,
    ]}
  ></NotebookBlock>
  <p>The complete union:</p>
  <PlayingCards cards={combo.union} highlight={combo.union}></PlayingCards>
  <h3>Shortcut error for the combined draw</h3>
  {#each [false, true] as adjusted, entryIndex (entryIndex)}{@const shortcut =
      outShortcut(combo.union.length, 2, adjusted)}{@const exact = outChance(
      47,
      combo.union.length,
      2,
    )}{@const gap = shortcut.add(
      exact.multiply(new Rational(-1)),
    )}{#key String(adjusted)}<div>
        <h4>
          {adjusted
            ? 'Adjusted rule: subtract one percentage point for each out above eight'
            : 'Rule of four'}
        </h4>
        <NotebookBlock
          lines={[
            'P_{\\mathrm{shortcut}}',
            `\\frac{4\\cdot${combo.union.length}${adjusted ? `-(${combo.union.length}-8)` : ''}}{100}`,
            fractionTex(shortcut),
          ]}
        ></NotebookBlock><ExactValue value={shortcut}></ExactValue>
        <p>
          Signed error: {formatPercent(gap.toNumber(), 3).slice(0, -1)} percentage
          points.
        </p>
      </div>{/key}{/each}
  <h3>A flush card can be dirty</h3>
  <p>You:</p>
  <PlayingCards cards={dirty.hole}></PlayingCards>
  <p>Opponent:</p>
  <PlayingCards cards={dirty.opponent}></PlayingCards>
  <p>Flop:</p>
  <PlayingCards cards={dirty.board}></PlayingCards>
  <p>
    {dirty.flush.length} cards make your flush on the turn, but {dirty.dirty
      .length} of them also give the opponent a full house:
  </p>
  <PlayingCards cards={dirty.dirty} highlight={dirty.dirty}></PlayingCards>
  <p>
    {dirty.clean.length} flush cards put you ahead on the turn. Even those allow a
    river redraw. This calculation removes the exposed opponent’s cards; Play cannot
    use hidden cards this way.
  </p>
  <a href="#/arcade">Practice these distinctions in Outs Rush →</a>
</div>
