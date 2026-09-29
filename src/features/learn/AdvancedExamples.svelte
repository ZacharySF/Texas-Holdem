<script lang="ts">
  import { advancedFacts, fractionTex } from '../../content/facts';
  import { Rational } from '../../engine/math';
  import { getLesson } from './context';
  import NotebookBlock from './NotebookBlock.svelte';
  import ExactValue from './ExactValue.svelte';
  import Matchups from './Matchups.svelte';
  import RangeExampleExperiment from './RangeExampleExperiment.svelte';

  const { lesson } = getLesson();
  let chapter = $derived(lesson.chapter);
  let p = $derived(new Rational(4, 5));
  let moments = $derived(advancedFacts.payoffMoments(p, 50, -50));
  let updated = $derived(advancedFacts.betaUpdate(2, 2, 3, 10));
</script>

{#if chapter === 11}<Matchups></Matchups>{:else}{#if chapter === 9}<ExactValue
      label="At least one ace among six opposing cards after Qs Qd are removed"
      value={new Rational(1).add(
        advancedFacts.hypergeometric(50, 4, 6, 0).multiply(new Rational(-1)),
      )}
    ></ExactValue>
    <table>
      <caption
        >Pocket queens: chance at least one opponent has a higher pair</caption
      ><thead
        ><tr
          ><th>Opponents</th><th>Exact</th><th>Single-seat sum upper bound</th
          ><th>Overcount</th></tr
        ></thead
      ><tbody
        >{#each [1, 2, 3, 4, 5] as n, entryIndex (entryIndex)}{@const exact =
            advancedFacts.higherPair(12, n)}{@const shortcut = advancedFacts
            .higherPair(12, 1)
            .multiply(new Rational(n))}{#key n}<tr
              ><td>{n}</td><td>{exact.display().percent}</td><td
                >{shortcut.display().percent}</td
              ><td
                >{shortcut.add(exact.multiply(new Rational(-1))).display()
                  .percent}</td
              ></tr
            >{/key}{/each}</tbody
      >
    </table>{:else}{#if chapter === 10}{@const exact = advancedFacts.binomial(
        221,
        0,
        new Rational(1, 221),
      )}{@const approx = advancedFacts.poisson(1, 0)}
      <p>
        Expected wait for aces: {advancedFacts.waitingAces().toString()} hands.
      </p>
      <ExactValue
        label={`Win all five supplied ${p.toString()} all-ins`}
        value={advancedFacts.fiveFavoriteWins()}
      ></ExactValue><ExactValue
        label="Exactly sixteen wins among twenty"
        value={advancedFacts.binomial(20, 16, p)}
      ></ExactValue>
      <p>
        Zero aces in 221 hands: exact binomial {exact.toNumber().toFixed(6)};
        Poisson approximation with expected count one: {approx.toFixed(6)}.
        Signed error: {(approx - exact.toNumber()).toFixed(6)}.
      </p>
      <a href="#/lab/events">Compose repeated card events</a
      >{:else}{#if chapter === 12}<ExactValue
          label="No-rake call threshold: pot 150, call 50"
          value={advancedFacts.callThreshold()}
        ></ExactValue><NotebookBlock
          lines={[
            'EV_{\\mathrm{call}}',
            `${fractionTex(advancedFacts.callThreshold())}(150+50)-50`,
            advancedFacts
              .rakedCall(advancedFacts.callThreshold(), 150, 50, 0)
              .toString(),
          ]}
        ></NotebookBlock>
        <p>
          With rake four, the same supplied equity produces {advancedFacts
            .rakedCall(advancedFacts.callThreshold(), 150, 50, 4)
            .toString()} chips of call EV.
        </p>
        <a href="#/arcade/call">Practice Call or Fold</a
        >{:else}{#if chapter === 13}<svg
            class="data-chart"
            viewBox="0 0 420 180"
            role="img"
            aria-label="Decision: fold for zero; commit to two calls, then win for plus 250 or lose for minus 100"
            ><path
              d="M60 80L190 30M60 80L190 125M190 125L335 90M190 125L335 155"
              fill="none"
              stroke="currentColor"
            ></path><text x="5" y="75">Choose</text><text x="140" y="22"
              >Fold: 0</text
            ><text x="115" y="145">Call twice</text><text x="290" y="80"
              >Win: +250</text
            ><text x="290" y="175">Lose: −100</text></svg
          >
          <p>
            Branch probabilities must be conditional on the earlier path. The
            toy model uses the supplied final chance. Its complete leaf payoffs
            include both calls; the current pot is 200.
          </p>
          <a href="#/play">Inspect the coach’s direct-model limits</a
          >{:else}{#if chapter === 14}<NotebookBlock
              lines={[
                '\\operatorname{Var}(X)',
                'E[X^2]-E[X]^2',
                `${advancedFacts.payoffMoments(p, 50, -50).variance}`,
              ]}
            ></NotebookBlock>
            <p>
              Mean {moments.mean.toString()} chips; variance {moments.variance.toString()}
              squared chips; standard deviation {moments.sd} chips.
            </p>
            <a href="#/lab/bankroll">Simulate outcomes, drawdowns, and ruin</a>
            <p>
              <a href="#/stats">Compare actual and all-in-EV-adjusted results</a
              >
            </p>{:else}{#if chapter === 15 || chapter === 17}<p>
                The standard-error ratio for four times as many independent
                observations is {advancedFacts.errorRatio(1000, 4000)}. For
                binary wins the single-trial variance is p × (1 − p); divide by
                hands per trial for the variance of their mean.
              </p>
              <a href="#/lab/bankroll">Explore path variation</a
              >{:else}{#if chapter === 16}<ExactValue
                  label={`Two-sided exact p-value: eight wins in twenty, null chance ${advancedFacts.fairChance().toString()}`}
                  value={advancedFacts.binomialTwoSided(
                    20,
                    8,
                    advancedFacts.fairChance(),
                  )}
                ></ExactValue>
                <p>
                  Planning example: SD 100 bb per 100-hand block and target
                  half-width 5 bb/100 require approximately {advancedFacts
                    .requiredHands(100, 5)
                    .toLocaleString()} hands under the independent normal model.
                </p>
                <a href="#/stats">Inspect your sample size and interval</a
                >{:else}{#if chapter === 18}<RangeExampleExperiment
                  ></RangeExampleExperiment>
                  <p>
                    Physical AA combos after exposing As: {advancedFacts.blockedAces()}.
                    Count the remaining ace pairs; do not keep the original
                    class weight unchanged as if the blocked combos survived.
                  </p>
                  <a href="#/lab/ranges"
                    >Edit a weighted range and inspect its equity distribution</a
                  >
                  <p>
                    <a href="#/arcade/combo">Practice Combo Counter</a>
                  </p>{:else}<p>
                    Prior pseudo-counts: 2 and 2. After 3 successes in 10
                    trials: alpha {updated.alpha}, beta {updated.beta}.
                  </p>
                  <ExactValue
                    label="Posterior mean tendency"
                    value={updated.mean}
                  ></ExactValue><ExactValue
                    label="Beta-binomial predictive chance of two successes in five"
                    value={advancedFacts.betaBinomial(
                      5,
                      2,
                      updated.alpha,
                      updated.beta,
                    )}
                  ></ExactValue>
                  <p>
                    Plugging in the mean as if it were known gives {advancedFacts
                      .binomial(5, 2, updated.mean)
                      .display().percent}; compare its difference from the
                    integrated prediction. This is a model approximation, not a
                    rounding error.
                  </p>{/if}{/if}{/if}{/if}{/if}{/if}{/if}{/if}{/if}
