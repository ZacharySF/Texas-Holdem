<script lang="ts">
  import EquityWalkthrough from './EquityWalkthrough.svelte';
  import { equityCoachFacts } from '../../content/facts';
  import PotOdds from './PotOdds.svelte';
  import { potOddsFacts } from '../../content/facts';
  import { learningFacts } from '../../content/facts';
  import { directOptions, improvementOuts } from '../../engine/coach';
  import { Rational } from '../../engine/math';
  import type { PlayerView } from '../../engine/game';

  import Probability from '../../ui/Probability.svelte';
  import { percent, exactValue } from '../../ui/Probability';
  import PlayingCards from '../../ui/PlayingCards.svelte';
  import type { Assessment } from './CoachPanel';
  let {
    topic = 'odds',
    view,
    assessment,
    raiseTo,
    foldPercent,
    onFoldPercent,
  }: {
    topic?: 'odds' | 'equity';
    view: PlayerView;
    assessment: Assessment;
    raiseTo: number;
    foldPercent: number;
    onFoldPercent: (value: number) => void;
  } = $props();
  let result = $derived(assessment.equity);
  let equity = $derived(
    new Rational(
      BigInt(result.players[0].equity.numerator),
      BigInt(result.players[0].equity.denominator),
    ),
  );
  let options = $derived(
    directOptions(view, equity, raiseTo, new Rational(foldPercent, 100)),
  );
  let outs = $derived(improvementOuts(view.hand, view.board));
</script>

<section class="panel coach-panel">
  <div class="section-head"><h2>Coach · your visible information</h2></div>
  {#if topic === 'equity'}<div class="svelte-view">
      <EquityWalkthrough
        {...{
          facts: equityCoachFacts(result),
          hand: view.hand,
          board: view.board,
          multiway: Boolean(assessment.options),
        }}
      />
    </div>{:else}<div class="svelte-view">
      <PotOdds
        {...{
          facts: potOddsFacts(view, equity.toNumber(), assessment.options),
        }}
      />
    </div>{/if}
  <details class="coach-analysis">
    <summary>Equity, raises, and deeper analysis</summary>
    <p>
      Equity means your average share of the pot over possible outcomes,
      including ties. I estimate it from your cards, the board, and the hands
      each opponent might hold. I cannot see their hidden cards.
    </p>
    <Probability
      label={`YOUR EQUITY · MONTE CARLO · ${result.samples.toLocaleString()} SAMPLES`}
      value={result.players[0].equity}
      sampled
    ></Probability>
    <details>
      <summary>Win, tie, and lose separately</summary>
      <div class="runout-spread">
        {#each ['win', 'tie', 'loss'] as const as key (key)}<Probability
            label={key}
            value={result.players[0][key]}
            sampled
          ></Probability>{/each}
      </div>
    </details>
    {#if assessment.reference}<p>
        Exact range equity: {percent(
          assessment.reference.players[0].equity.value,
        )} · gap {(
          (result.players[0].equity.value -
            assessment.reference.players[0].equity.value) *
          100
        ).toFixed(3)} percentage points.
      </p>{/if}{#if assessment.options}<h3>Pot-by-pot call and raise model</h3>
      <p>
        Each pot is awarded only among its eligible seats, including ties and
        odd chips. All live opponents are assumed to call the chosen amount up
        to their stacks; no subsequent betting or folds are modeled. These are
        conditional values, not optimal-action claims. Whole-table equity above
        is descriptive and is not multiplied by the whole pot.
      </p>
      <table>
        <caption
          >{assessment.options.samples} sampled joint deals · net chips relative to
          folding · {learningFacts.confidence().display().percent} sampling intervals</caption
        ><thead><tr><th>Action</th><th>EV</th><th>Interval</th></tr></thead
        ><tbody
          ><tr><th>Fold</th><td>0</td><td>0</td></tr><tr
            ><th>{view.legal.canCheck ? 'Check' : 'Call'}</th><td
              >{assessment.options.call.toFixed(2)}</td
            ><td
              >{assessment.options.callInterval
                .map((n) => n.toFixed(2))
                .join(' to ')}</td
            ></tr
          >{#if view.legal.canRaise}<tr
              ><th>Raise to {raiseTo}</th><td
                >{assessment.options.raise.toFixed(2)}</td
              ><td
                >{assessment.options.raiseInterval
                  .map((n) => n.toFixed(2))
                  .join(' to ')}</td
              ></tr
            >{/if}</tbody
        >
      </table>
      <ul>
        {#each assessment.options.callPots as p, i (i)}<li>
            Pot {i + 1}: {p.amount} chips; eligible seats {p.eligible
              .map((s) => s + 1)
              .join(', ')}. Your expected award: {p.heroMean.toFixed(2)} chips.
          </li>{/each}
      </ul>
      <p>
        Call EV = expected total award − {view.legal.toCall} chips at risk. Side pots
        generally have different equities, so there is no single break-even equity
        for all of them.
      </p>{:else}<p>
        EV means expected value: the average net chip change in this model.
        Positive values mean an average gain; negative values mean an average
        loss. A single hand can turn out differently.
      </p>
      <label for="fold-estimate"
        >Assumed chance the bot folds to your raise: {percent(
          foldPercent / 100,
        )}</label
      ><input
        id="fold-estimate"
        type="range"
        min="0"
        max="100"
        step="1"
        value={foldPercent}
        oninput={(e) => onFoldPercent(Number(e.currentTarget.value))}
      />
      <p class="hint">
        This is your assumption, not a measured bot frequency. Called-raise
        equity is held equal to the current range estimate.
      </p>
      <table class="ev-table">
        <caption
          >Direct EV relative to folding; chips already in the pot are sunk</caption
        ><thead><tr><th>Option</th><th>Estimated net chips</th></tr></thead
        ><tbody
          ><tr><th>Fold</th><td>{options.fold.toFixed(2)}</td></tr
          >{#if view.legal.canCheck}<tr
              ><th>Check to showdown</th><td>{options.check.toFixed(2)}</td></tr
            >{:else}<tr><th>Call</th><td>{options.call.toFixed(2)}</td></tr
            >{/if}{#if view.legal.canRaise}<tr
              ><th>Raise to {raiseTo}</th><td>{options.raise.toFixed(2)}</td
              ></tr
            >{/if}</tbody
        >
      </table>
      <p class="model-limit">
        Direct odds ignore future betting and depend on the range estimate. The
        raise model allows only a fold or call, assumes no re-raise, and caps
        risk at the effective stack. Close differences can be sampling noise;
        grades are comparisons within this model, not claims of optimal play.
      </p>{/if}{#if outs}<h3>{outs.cards.length} category-improvement outs</h3>
      <PlayingCards cards={outs.cards} highlight={outs.cards}></PlayingCards>
      <div class="coach-metrics">
        <Probability
          label="HIT ON THE NEXT CARD"
          value={exactValue(outs.next)}
          sampled={false}
        ></Probability><Probability
          label="HIT THIS FIXED SET BY THE RIVER"
          value={exactValue(outs.byRiver)}
          sampled={false}
        ></Probability>
      </div>
      <p class="hint">
        These highlighted cards improve your current made-hand category. They
        are not guaranteed winning outs; kickers, dirty outs, and an opponent’s
        stronger draw can change the winner. River odds mean hitting at least
        one card from this currently highlighted set, with your cards and the
        board removed.
      </p>{:else}<p>Improvement-card odds appear on the flop and turn.</p>{/if}
    <div class="coach-links">
      <a href="#/learn/1-2">Convert odds · lesson 1.2</a><a href="#/learn/3-1"
        >Count card combinations · lesson 3.1</a
      ><a href="#/learn/5-1">Known and dead cards · lesson 5.1</a><a
        href="#/learn/7-2">Read board texture · lesson 7.2</a
      ><a href="#/learn/8-1">Next-card and river odds · lesson 8.1</a><a
        href="#/learn/8-2">Overlap and dirty outs · lesson 8.2</a
      >
    </div>
    <div class="coach-links">
      <a href="#/learn/9-2">Table size and higher pairs</a><a
        href="#/learn/11-1">Preflop matchups</a
      ><a href="#/learn/12-2">Call EV and rake</a><a href="#/learn/13-1"
        >Multi-street decisions</a
      ><a href="#/learn/14-2">Actual versus all-in EV</a><a href="#/learn/16-1"
        >Intervals and sample size</a
      ><a href="#/learn/17-1">Monte Carlo error</a><a href="#/learn/18-1"
        >Ranges and blockers</a
      ><a href="#/learn/19-1">Updating a range</a><a href="#/learn/20-2"
        >Streaks and independence</a
      ><a href="#/learn/21-1">Two runouts and covariance</a><a
        href="#/learn/21-2">Insurance premiums</a
      ><a href="#/learn/22-1">Fold equity and semi-bluffs</a><a
        href="#/learn/22-2">Balanced river bets</a
      ><a href="#/learn/23-1">Push/fold assumptions</a><a href="#/learn/23-2"
        >Tournament prize value</a
      ><a href="#/learn/24-2">Kelly and uncertain edges</a><a
        href="#/learn/25-2">What a solver bound proves</a
      >
    </div>
    <details>
      <summary>Reproduce this estimate</summary><code class="seed-code"
        >{assessment.seed}</code
      >
      <p>
        Same visible cards, persona model, public action history, and seed
        reproduce this estimate. The deal seed remains hidden until the hand
        ends.
      </p>
    </details>
  </details>
</section>
