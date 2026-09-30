# Poker math and release audit

Audited September 30, 2026 against the current Svelte application. This checks the implemented calculations and course coverage. It does not establish that every possible Hold’em question is included or that the bots play perfect poker.

## Checks actually run

| Check                                       | Result                              |
| ------------------------------------------- | ----------------------------------- |
| Unit suite, including lesson rendering      | 119 passed across 25 files          |
| Engine statements / branches                | 99.22% / 98.47%                     |
| Engine functions / lines                    | 100% / 99.34%                       |
| Coverage floor                              | 90% on each measure; passed         |
| TypeScript and Svelte                       | Passed, zero errors and warnings    |
| ESLint and Prettier                         | Passed                              |
| Production build                            | Passed                              |
| Chromium browser suite                      | 82 passed: 41 desktop, 41 phone     |
| Palette and composite contrast checks       | Passed                              |
| Exhaustive seven-card category counts       | All 133,784,560 combinations passed |
| Independent seven-card reference comparison | 1,000,000 seeded hands passed       |

Coverage measures execution, not mathematical truth. The stronger evidence comes from independent enumeration, exact identities, known answers, conservation properties, and reference implementations. Browser checks use a system Chromium locally; CI installs its own Playwright Chromium. This audit does not claim a full Firefox or Safari test run.

The standard unit suite also evaluates all 2,598,960 five-card hands with both evaluators, checks all 7,462 distinct strengths, and compares 100,000 seeded seven-card hands. Equity tests enumerate all 1,712,304 boards for a fixed AA-versus-KK matchup and compare a seeded Monte Carlo estimate with the exact result. Statistical tolerances are explicit in the tests; an estimate isn't relabeled as exact.

The slow seven-card run took 24.006 seconds for exhaustive category verification and 20.413 seconds for the million reference comparisons. These are this run's timings, not a performance benchmark. Results:

| Best five-card category | Observed seven-card hands |
| ----------------------- | ------------------------: |
| High card               |                23,294,460 |
| One pair                |                58,627,800 |
| Two pair                |                31,433,400 |
| Three of a kind         |                 6,461,620 |
| Straight                |                 6,180,020 |
| Flush                   |                 4,047,644 |
| Full house              |                 3,473,184 |
| Four of a kind          |                   224,848 |
| Straight flush          |                    41,584 |
| Total                   |               133,784,560 |

Royal flushes account for 4,324 of the straight flushes, not an additional category. See [the verifier](../scripts/verify-seven.ts) and [evaluator tests](../src/engine/evaluator.test.ts).

## What's taught and exercised

The content test mounts every one of the 53 Svelte Markdown lessons, checks the seven required lesson parts, checks formulas render, and verifies prerequisite links. Numerical lesson claims come through the tested facts modules. This verifies structure and numerical anchors; it does not automatically judge every sentence's teaching quality.

| Topic                                                                 | Course chapters | Evidence in source/tests                                                                                                         |
| --------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Rules, best five cards, blinds and action order                       | 0               | [Game](../src/engine/game.test.ts), [private views and blinds](../src/lib/table-realism.test.ts)                                 |
| Sample spaces, fractions, odds, permutations, combinations            | 1–3             | [Exact arithmetic and identities](../src/engine/core.test.ts)                                                                    |
| Complements, inclusion–exclusion, conditional probability, removal    | 4–5             | [Counting experiments](../src/engine/experiments.test.ts), [draws](../src/engine/courseDraws.test.ts)                            |
| Five/seven-card frequencies and starting-hand classes                 | 6–7             | [Evaluator](../src/engine/evaluator.test.ts), [169 classes and 1,326 hands](../src/content/handChartFacts.test.ts)               |
| Outs, overlapping/dirty outs, backdoors, rule of two/four             | 8               | [Independent draw counts](../src/engine/courseDraws.test.ts)                                                                     |
| Hypergeometric, binomial, geometric, Poisson                          | 9–10            | [Distribution normalization and known answers](../src/engine/inference.test.ts)                                                  |
| Matchup equity and split-pot credit                                   | 11              | [Exact and sampled equity](../src/engine/equity.test.ts), [coach arithmetic](../src/content/equityCoachFacts.test.ts)            |
| Expected value, call price, side pots, implied odds, rake assumptions | 12              | [Pot-odds examples](../src/content/potOddsFacts.test.ts), [multiway awards](../src/engine/multiway.test.ts)                      |
| Multi-street trees and equity realization                             | 13              | [Lesson models](../src/engine/inference.test.ts); teaching assumptions, not a full game-tree solver                              |
| Variance, all-in EV, LLN, CLT, confidence intervals, calibration      | 14–16           | [Statistics](../src/engine/core.test.ts), [inference](../src/engine/inference.test.ts), [ledger](../src/engine/multiway.test.ts) |
| Monte Carlo, exact enumeration and sampling uncertainty               | 17              | [Equity](../src/engine/equity.test.ts), [seeded models](../src/engine/inference.test.ts)                                         |
| Weighted ranges, blockers, Bayes and beta-binomial updating           | 18–19           | [Joint ranges](../src/engine/ranges.test.ts), [Bayesian anchors](../src/engine/inference.test.ts)                                |
| PRNGs, unbiased bounded draws, shuffling and streaks                  | 20              | [Known RNG vector](../src/engine/core.test.ts), [shuffle/streak enumeration](../src/engine/final.test.ts)                        |
| Running twice, covariance and insurance                               | 21              | [Two-board moments and settlement](../src/engine/final.test.ts)                                                                  |
| Fold equity, semi-bluffs, MDF and polarized betting                   | 22              | [Payoff-derived anchors and toy equilibria](../src/engine/final.test.ts)                                                         |
| Push/fold, chip versus prize value and ICM                            | 23              | [ICM conservation and push/fold toy](../src/engine/final.test.ts), [priced hand charts](../src/content/handChartFacts.test.ts)   |
| Risk of ruin, log utility and Kelly                                   | 24              | [Ruin boundaries/Kelly maximum](../src/engine/final.test.ts), [bankroll experiments](../src/engine/inference.test.ts)            |
| CFR, convergence and exploitability                                   | 25              | [Toy-game best responses](../src/engine/final.test.ts)                                                                           |

The [curriculum](CURRICULUM.md) gives the individual lesson objectives. The [roadmap's anchor index](ROADMAP.md#final-audit-anchor-to-test-index) links named tests to the original mathematical acceptance criteria.

## The pot-odds check

A call buys eligibility for specific pots, not every chip visible on the table. A short stack cannot win another player's unmatched overbet or a side pot they never funded. Settlement therefore builds contribution layers and determines eligible winners separately.

For each sampled deal, the model awards each eligible pot, including fractional credit for ties. Averaging those awards gives the expected award: an average amount returned from the final pots, not guaranteed profit. The final pots already include the chips you would call. Net value is the expected award minus that new call, exactly once. Earlier contributions are already committed and are not subtracted a second time when comparing the current decision with folding.

The tests check this both ways: averaged net win/tie/loss outcomes equal average award minus call. They also cover uncallable overbets and separate pot eligibility. The same worked examples feed lesson 12.2 and the coach. There was no need to change the formulas or lesson content in this audit.

## Rules and hidden information

Tests cover heads-up and six-seat blind posting, preflop/postflop action order, full and short raises, cumulative short raises reopening action, uncalled returns, side pots, odd chips, all-in runouts, two-board settlement, replay and chip conservation. Generated legal hands check nonnegative stacks and contribution totals.

Every bot receives a PlayerView containing its own hand and public information. Isolation tests vary the other hands, future deck and deal seed and require the player's view to stay unchanged. The coach uses the human player's view. Post-hand study can deliberately reveal hidden hands; it isn't input to live decisions. This is a local application, not a security boundary against someone inspecting their own browser's memory.

Tournament tests cover absolute decision deadlines, timeout check/fold, level changes between hands, surviving-seat blind rotation, heads-up transitions, eliminations and chip conservation. The official [2026 Poker TDA rules](https://www.pokertda.com/view-poker-tda-rules/) separately address odd chips, side pots, new levels and heads-up play, as well as many physical procedures this app does not simulate. This review is not TDA certification.

## Limits that remain

- No full no-limit Hold’em equilibrium solver. Bots select the best sampled value from a small legal action menu. Fold/call response assumptions, finite sampling, missing re-raises and future betting can change the correct strategic choice.
- The starting-hand and shove charts are conditional models, not universal positional charts or tournament equilibrium solutions.
- The AKQ, Kuhn/CFR and push/fold games teach small abstractions. Their equilibria do not solve the full game.
- Implied odds, reverse implied odds, equity realization and rake are teaching/model inputs. The live game does not infer a complete future betting tree or reproduce every cardroom's rake rules.
- Outs that improve a hand category are not automatically winning outs against every range. The course distinguishes drawing odds from showdown equity.
- ICM uses an assumed finish-order model. It does not account for all skill, future-position, bounty, satellite or multi-table effects.
- Bankroll simulations use independent normal increments over blocks of hands. They cannot promise a real player's ruin probability or account for unknown win rate and serial dependence automatically.
- Tournament play is local and single-table, with its own published timer and blind schedule. It omits table balancing, live-floor rulings, misdeals, physical declarations and many event-specific procedures. No resumable tournament or active-hand recovery is implemented.

## Change boundary

The initial audit changed documentation and captured screenshots. Its first GitHub run then exposed a fullscreen timing bug: a second F press could be discarded while browser entry was pending. The follow-up preserves that exit intent, including Escape, in the presentation wrapper and adds deterministic browser regression checks. Existing tests and thresholds were not weakened. Failure traces are now retained by CI. Poker logic, probability algorithms, lessons, application stores and routing are unchanged. All 173 files in the [protected inventory](../src/decor/LOGIC-LOCK.md) matched their saved hashes. Engine benchmarks were retained as dated records in [BENCHMARKS.md](BENCHMARKS.md), not represented as rerun.

## Screenshot check

Fifteen fresh captures cover the six main routes, the pot-odds lesson and active practice at desktop and phone sizes, plus fullscreen practice. No JavaScript page errors or horizontal overflow were recorded in the sampled normal views. The three-second fullscreen idle sample recorded no tasks over 50 ms. See the [screenshots and capture report](screenshots/release/README.md).

## First remote run

The first GitHub run passed lint, typecheck, coverage and build, then failed two browser checks. The fullscreen failure was reproduced with a deliberately unresolved browser request; the regression failed before the fix and passed afterward. The tournament flow also hit its total test deadline while returning to practice. It passed locally again with fourfold CPU throttling in 31 seconds; no tournament rule or timer was changed to accommodate it. Retained CI traces will make any recurrence inspectable.
