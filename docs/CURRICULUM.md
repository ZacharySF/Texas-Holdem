# Curriculum

The expanded chapter plan below replaces the original 18-chapter plan. Each bullet is a lesson objective; split a bullet into more lessons when worked examples need room. Every lesson follows the seven-part template in SPEC.md and uses all four lenses. Mastery is 80%; manual access remains available. Chapters 0–4 are implemented in Phase 2. Chapters 5–8 are implemented in Phase 4, bringing the course to nineteen lessons. Chapters 9–19 were delivered in Phases 5–7. Chapters 20–25 are now delivered in Phases 8–9, bringing the total to 53 lessons. Later additions still require an explicit scope request.

## 0. How Hold’em works (skippable)

- Lesson 0.1: Follow a hand from blinds to showdown and identify legal betting actions.
- Lesson 0.2: Compare hand rankings, identify positions, and explain the button’s role.

## 1. Probability from one deck

- Lesson 1.1: Name outcomes and sample spaces; count favorable outcomes over total equally likely outcomes.
- Lesson 1.2: Convert a reduced fraction to percent, one in N, and odds against; interpret impossible and certain events.

## 2. Counting I

- Lesson 2.1: Build the multiplication rule slowly with branching card examples and probability trees.
- Lesson 2.2: Distinguish ordered draws, factorials, and permutations; explain each factor before multiplying.

## 3. Counting II

- Lesson 3.1: List ordered selections and divide out repeated orderings to derive combinations.
- Lesson 3.2: Derive n choose k and the 1,326 combos, 169 classes, and 6/4/12 pair/suited/offsuit counts.

## 4. “At least one” and “or”

- Lesson 4.1: Use complements to count at least one ace.
- Lesson 4.2: Distinguish mutually exclusive events; derive addition and inclusion–exclusion by counting overlap.

## 5. Conditional probability and card removal

- Lesson 5.1: Update the sample space for known and dead cards.
- Lesson 5.2: Show dependence without replacement with labeled probability trees.

## 6. Final hand frequencies

- Lesson 6.1: Count every five-card and seven-card category using disjoint cases and verify by exhaustive evaluation.
- Lesson 6.2: Explain why seven-card no-pair hands are rarer than pairs and two pair but rank last: rankings follow five-card frequencies.
- Lesson 6.3: Calculate rare events including royal flushes.

## 7. Starting hands and the flop

- Lesson 7.1: Derive starting-hand probabilities and flop pairs, sets, two pair, flush/straight draws, and made flushes/straights.
- Lesson 7.2: Count overcards against a pocket pair and classify paired, monotone, two-tone, and rainbow boards.

## 8. Outs and drawing odds

- Lesson 8.1: Count next-card and two-card improvement probabilities.
- Lesson 8.2: Measure rule-of-2/4 error; identify dirty, overlapping, backdoor outs, and drawing dead.

## 9. The hypergeometric distribution

- Lesson 9.1: Derive the general without-replacement counting model and connect it to earlier card problems.
- Lesson 9.2: Calculate whether anyone has an ace and how larger table sizes change the chance of a higher pocket pair; introduce summation notation before its first inclusion–exclusion use.

## 10. Repeated hands

- Lesson 10.1: Define Bernoulli trials and derive binomial counts, including wins in 20 all-ins as an 80% favorite.
- Lesson 10.2: Use geometric waiting times and Poisson rare-event counts; introduce e from scratch.

## 11. Preflop matchups

- Lesson 11.1: Compare pairs against two overcards, one overcard, undercards, and lower pairs.
- Lesson 11.2: Measure domination (AK/AQ), suitedness, connectedness, and equity loss with additional players.

## 12. Expected value

- Lesson 12.1: Define random variables and revisit summation notation for weighted averages.
- Lesson 12.2: Derive call EV, pot odds, break-even equity, implied/reverse implied odds, and rake effects.

## 13. Multi-street decisions

- Lesson 13.1: Build EV trees with chance nodes and effective odds across two streets.
- Lesson 13.2: Explain equity realization and why position changes the value captured from raw equity.

## 14. Variance and standard deviation

- Lesson 14.1: Derive variance and standard deviation from deviations around the mean.
- Lesson 14.2: Separate decision quality from downswings and actual results from all-in EV.

## 15. Law of large numbers and central limit theorem

- Lesson 15.1: Distinguish convergence of averages from the distribution of repeated sample means.
- Lesson 15.2: Run experiments showing scope and limits of both theorems.

## 16. Confidence intervals, sample size, and hypothesis tests

- Lesson 16.1: Derive standard error, repeated-sample interval coverage, and sample-size planning.
- Lesson 16.2: Introduce hypotheses and p-values from scratch; distinguish running bad from playing bad and measure forecast calibration.

## 17. Monte Carlo methods

- Lesson 17.1: Implement estimation by repeated seeded experiments; compare exact and sampled results.
- Lesson 17.2: Derive square-root sample-size error scaling and show reproducible confidence intervals.

## 18. Ranges, combos, and blockers

- Lesson 18.1: Count weighted range combos after card removal and examine equity distributions.
- Lesson 18.2: Distinguish range advantage, nut advantage, polarized ranges, and merged ranges.

## 19. Bayes’ theorem and hand reading

- Lesson 19.1: Update a prior range through action likelihoods into a posterior range.
- Lesson 19.2: Use a beta-binomial model to estimate tendencies with small samples and express uncertainty.

## 20. Randomness itself

- Lesson 20.1: Explain seeded PRNGs, rejection sampling, modulo bias, Fisher–Yates, naive shuffle bias, and chi-square tests.
- Lesson 20.2: Test streak claims, gambler’s fallacy, and “is the site rigged?” using favorite losses across many all-ins and confirmation bias.

## 21. Running it twice and insurance

- Lesson 21.1: Show why splitting runouts preserves EV while changing variance; account for dependence without replacement.
- Lesson 21.2: Price all-in insurance and separate a fair premium from the seller’s margin.

## 22. Betting math and game theory

- Lesson 22.1: Derive fold equity, semi-bluff EV, bluff break-even, and minimum defense frequency.
- Lesson 22.2: Derive B/(P+2B) bluffs in a balanced polarized betting range; solve mixed strategies and indifference in AKQ and river toy games.

## 23. Short stacks and tournaments

- Lesson 23.1: Calculate push/fold EV and interpret Nash push/fold ranges with model assumptions.
- Lesson 23.2: Derive Malmuth–Harville ICM, compare chip/prize EV, and explain bubble factor.

## 24. Bankroll and Kelly

- Lesson 24.1: Model risk of ruin and distinguish model assumptions from guarantees.
- Lesson 24.2: Introduce logarithms from scratch and derive Kelly sizing and its sensitivity to estimated edges.

## 25. Capstone (optional)

- Lesson 25.1: Implement counterfactual regret minimization on a toy game.
- Lesson 25.2: Track convergence toward equilibrium and explain the limits of a toy solver.
