# Roadmap

The current delivery completes the explicitly requested unfinished Phase 8 and 9 items. All local acceptance items through Phase 9 are implemented, and the earlier Phase 0 GitHub Pages publication task is complete. In every phase, update the Play coach's links to available chapters. Later anchors must become tested facts-registry functions in their teaching phase; numerical constants in this planning document are test specifications, not UI sources.

## Phase 0 — Foundation

- [x] Strict TypeScript, React/Vite/npm, Node LTS pin, ESLint, Prettier, Vitest/coverage/fast-check.
- [x] HashRouter, relative Vite base, mobile shell, dark/light and four-color settings.
- [x] Push/PR CI and main Pages deploy workflow; MIT license.
- [x] SPEC, ROADMAP, CURRICULUM, ARCHITECTURE, AGENTS saved.
- [x] Acceptance: lint, typecheck, tests, build pass from npm ci.
- [x] Connect the existing GitHub origin and confirm Pages uses Actions.
- [x] Push the application and record the verified Pages deployment URL: https://zacharysf.github.io/contemprorary/ (2026-09-28).

## Phase 1 — Engine and Equity Lab

- [x] Cards; xoshiro128**, unbiased bounded integers, Fisher–Yates; combinatorics/rationals; statistics.
- [x] Independent fast/reference evaluators, exhaustive five-card counts and 7,462 strengths, 100,000 seven-card comparisons, property/edge tests.
- [x] Exact and sampled multiway equity, card removal, random players, automatic method, worker progress/cancel, extensible player input.
- [x] Phone card picker, hero/opponents/board/dead controls, exact feasibility, four simulation sizes, random deal, seed, shared URL.
- [x] Results in four formats, win/tie/loss/equity, 95% intervals, exact reference and gap, convergence chart and why explanations.
- [x] Acceptance: engine coverage ≥90%; all required checks green; benchmark report with machine specs; README v1 with diagram and randomness explanation.
- [x] Run slow exhaustive seven-card verifier (script must include 1,000,000 reference comparisons).

### Phase 1 verification anchors

- C(52,2)=1,326; 169 classes = 13 pairs + 78 suited + 78 offsuit; 6/4/12 combos.
- Pocket pair 1/17, AA 1/221, suited 4/17, at least one ace 33/221.
- Five-card counts in ascending category order: 1,302,540; 1,098,240; 123,552; 54,912; 10,200; 5,108; 3,744; 624; 40. Total 2,598,960, including 4 royals.
- Distinct five-card strengths: 1,277; 2,860; 858; 858; 10; 1,277; 156; 156; 10. Total 7,462.
- Seven-card slow counts: 23,294,460; 58,627,800; 31,433,400; 6,461,620; 6,180,020; 4,047,644; 3,473,184; 224,848; 41,584. Total 133,784,560, including 4,324 royals.
- Same seed → same sequence; randInt bounded; four-card shuffle chi-square at α=0.001.
- AA vs KK exact over 1,712,304 boards gives AA equity between 80% and 84%; fixed-seed 200,000 samples within four standard errors.

### Final audit: exhaustive seven-card results

`npm run verify:7card` passed on 2026-09-27. Each set was visited exactly once. Royal flushes below are a subset of straight flushes, not a tenth category.

| Category           | Required anchor | Observed count | Result |
| ------------------ | --------------: | -------------: | ------ |
| High card          |      23,294,460 |     23,294,460 | Pass   |
| One pair           |      58,627,800 |     58,627,800 | Pass   |
| Two pair           |      31,433,400 |     31,433,400 | Pass   |
| Three of a kind    |       6,461,620 |      6,461,620 | Pass   |
| Straight           |       6,180,020 |      6,180,020 | Pass   |
| Flush              |       4,047,644 |      4,047,644 | Pass   |
| Full house         |       3,473,184 |      3,473,184 | Pass   |
| Four of a kind     |         224,848 |        224,848 | Pass   |
| Straight flush     |          41,584 |         41,584 | Pass   |
| Total              |     133,784,560 |    133,784,560 | Pass   |
| Royal flush subset |           4,324 |          4,324 | Pass   |

The exhaustive pass took 19.607 seconds. All 1,000,000 seeded reference comparisons also passed in 13.850 seconds. Both checks are named tests in `scripts/verify-seven.ts`; they run through the separate slow command, not the default Vitest suite.

### Delivery status

Local acceptance checks and browser interaction review are complete. The Chromium review covered a 375px viewport without horizontal overflow, disabled used cards, custom seeds, URL replay, exact and sampled worker runs, exact reference comparison, cancellation, persisted display settings, and future-mode routes. No browser errors were observed. The permanent Playwright smoke suite was assigned to Phase 9 and is now completed below.

The application is pushed to GitHub and Pages uses Actions. The [first deployment](https://github.com/ZacharySF/contemprorary/actions/runs/36457275849) passed all checks and published the verified [live site](https://zacharysf.github.io/contemprorary/) on 2026-09-28. Local delivery checks were rerun on that date: lint, typecheck, all 90 tests with engine coverage, production build, and all 10 Playwright smoke checks pass. Localhost startup also returned HTTP 200. Engine algorithms and measured benchmark results are unchanged.

## Phase 2 — Learn framework and chapters 0–4

- [x] MDX/KaTeX; NotebookBlock, SimCheck, PracticeSet, AtTheTable, QuantCorner.
- [x] Seven-part lessons, live worker sims, seeded practice with full solutions; persisted mastery and progression/manual access.
- [x] Acceptance: all chapters 0–4 have objectives, four lenses, tested claims, accessible practice and reproducible simulations.

### Phase 2 verification anchors

- [x] Reuse the tested starting-hand anchors: 1,326 physical combos, 169 classes, 6/4/12 combos per class; pair 1/17, aces 1/221, suited 4/17, at least one ace 33/221.
- [x] Ordered two-card outcomes 2,652; three-label permutations 6; choosing two of four labels 6; ace-or-spade 4/13 and two distinct suits 1/2.
- [x] Every lesson's event predicate is checked against independent exhaustive enumeration; seeded simulations replay and agree statistically with exact answers.
- [x] All ten MDX lessons render with seven parts and computed KaTeX; generated practice solutions and equivalent-answer grading are tested; 4/5 establishes mastery, and partial sets do not.

## Phase 3 — Play, heads-up

- [x] Range support in equity engine; game state machine with blinds/button rotation. Button is small blind, first preflop, last postflop.
- [x] Minimum raise uses largest prior raise increment; short all-in does not reopen betting for players already acting; return uncalled bets; side pots; split pots and odd chips to first eligible seat left of button.
- [x] Property checks: chips conserved, nonnegative stacks, pot equals contributions across random legal action sequences.
- [x] Seeded tight-passive, loose-aggressive, calling-station, equity-driven bots, isolated from hidden cards.
- [x] Coach, bounded direct-EV grades, histories in IndexedDB, replay, run-it-out, x-ray, exam mode, bankroll/XP.
- [x] SHA-256 seed commitment/reveal/verification before and after every deal.
- [x] Acceptance: fully playable phone heads-up hand lifecycle; replay identical; every rule and information boundary tested.
- [x] Anchor: pot 100, bet 50, call 50 → break-even 25% (also taught in Phase 5).

### Phase 3 delivery notes

Final validation passed lint, typecheck, all 50 tests, coverage, and the production build. Engine coverage is 98.83% statements, 98.41% branches, 100% functions, and 98.77% lines. A production Chromium review at 375px completed commitment, exam-mode play through showdown, verification, replay, runouts, and saved-history reload without browser errors or horizontal overflow.

The UI is heads-up only. The pure settlement engine supports additional seats so side pots, short all-ins, and odd-chip ordering can be tested meaningfully; the 6-max product remains Phase 7. Weighted ranges are engine/API support with heuristic public-action estimates for coaching and bots; the visual range editor remains Phase 7.

Coach outs are explicitly defined as cards that improve the current made-hand category, not guaranteed winning outs. Direct EV uses contestable chips, returns uncallable excess, and labels future-betting/range/fold-response assumptions. Runout spreads hold the final matched contributions fixed and simulate a showdown, including for hands originally ending in a fold.

Completed histories persist in IndexedDB. Settings, mastery, and the play-money profile persist in localStorage. An unfinished hand is session-only; leaving Play or reloading abandons it without settling the bankroll. SHA-256 commitments prove consistency of the disclosed local seed; a static browser game does not provide an independent fairness authority.

## Phase 4 — Chapters 5–8 and Outs Rush

- [x] Conditional probability, final frequencies, starting hands/flops, outs; timed accessible Outs Rush and coach links.
- [x] Anchors: 9/8/15 outs flop-to-river = 378/1081, 340/1081, 585/1081; 9 turn outs = 9/46. Rule of four gives 60% for 15 outs; adjusted 4o−(o−8) gives 53%.
- [x] Anchors: set or better on flop 144/1225; royal in seven cards 4324/133784560 = 1/30940.
- [x] Anchors: unpaired hand pairs a hole rank on flop 227/700; suited exact flush draw 429/3920; made flush 33/3920; QQ sees A/K on flop 29/70; pair rank appears on full board 47/245.
- [x] Anchor: flush plus open-ended draw has 15 distinct outs, not 17.
- [x] Acceptance: each anchor derived, tested in facts registry, simulated; coach links target available lessons.

### Phase 4 delivery notes

Nineteen lessons are available in total, with nine new lessons covering all chapter 5–8 objectives. Each new lesson has seven parts, worked derivations, five seeded practice questions, measured shortcut error, and selectable worker experiments. Every required anchor is represented in the facts registry, tests, and lesson simulations. Five-card category formulas are checked by both exhaustive evaluators; the full seven-card verifier now directly checks the cached registry counts and royal fraction.

The set-mining anchor 144/1225 counts a pocket-pair rank appearing at least once on the flop. A board of three cards of another rank can make a full house without satisfying that event; the lesson states this distinction. Fixed-out probabilities count the specified physical card set, and exposed-opponent examples distinguish completing a draw from winning. Royal-flush displays retain significant digits for nonzero rare probabilities.

Outs Rush offers five seeded questions, 20/40-second clocks, pause/resume, untimed practice, full card-based solutions, and exact next-card odds. Expiry waits for manual advancement. Only completed best scores persist; drill XP integrates with Play without awarding the same correct answers twice. Coach links now include lessons 5.1, 7.2, 8.1, and 8.2.

Validation: 60 tests across 13 files; lint, typecheck, coverage, and production build pass. Engine coverage: 98.83% statements, 98.49% branches, 100% functions, 98.97% lines. `verify:7card` passed all 133,784,560 sets and one million reference comparisons. Updated benchmarks, hardware, and prior rates appear in README.

The production Chromium review at 375px passed all nine new lessons, expanded derivations, worker simulations, event selection, seeded replay, mastery reload, a full Outs Rush set, saved scores, pause/resume, light/four-color display, Play XP, and coach links, without page errors or horizontal overflow. Component tests also verify expiry, no automatic advance, and no duplicate XP.

No Phase 4 acceptance work was deferred. The subsequent Phase 5–7 delivery is recorded below. The earlier external GitHub Pages setup item and session-only active-hand limitation remain unchanged; the permanent Playwright suite is recorded in Phase 9 below.

## Phase 5 — Chapters 9–12 and decision drills

- [x] Hypergeometric, repeated hands, preflop matchups, EV; Call or Fold, Brier-scored Guess the Equity/calibration; event builder.
- [x] Anchors: expected wait for AA = 221 hands; 80% favorite wins five straight = 0.32768; call example break-even = 25%.
- [x] Acceptance: event builder exact/sampled agreement; drills seeded and graded with worked solutions; rake assumptions visible.

## Phase 6 — Chapters 13–17, variance, Stats

- [x] Multi-street EV, variance, LLN/CLT, intervals/tests, Monte Carlo lessons and visualizers.
- [x] Variance/bankroll simulator: outcomes, downswing lengths, risk of ruin; Stats: hands, bb/100 CI, actual vs all-in EV, grades and calibration.
- [x] Acceptance: uncertainty and model limits visible; estimates tested against controlled distributions; coach links updated.

## Phase 7 — Chapters 18–19, ranges, 6-max

- [x] Ranges/blockers and Bayes/beta-binomial; Combo Counter; 13×13 range grid, hand-vs-range UI; 6-max play.
- [x] Acceptance: range weights and card removal tested; side pots and multiway coach work; equity distributions, range/nut advantage explained.

### Phases 5–7 delivery notes

- [x] 22 new lessons, 41 total, covering all chapter 9–19 objectives with seven parts, computed notebooks, seeded five-question practice, worked solutions, simulation, measured approximations, and table applications.
- [x] Registry anchors and tests: expected aces wait 221; five straight four-fifths wins 1024/3125 = 0.32768; pot 100 + opposing bet 50 + call 50 gives break-even 1/4. Each is also used in a lesson experiment or derivation.
- [x] Worker experiments check hypergeometric, repeated binomial events, geometric waits, Bayesian conditioning, beta-binomial prediction, payoff means, repeated sample means, and actual Wilson coverage against controlled distributions.
- [x] Three additional drills: seeded grading, optional clocks, pause/resume, full solutions, first-completed-set persistence, no duplicate XP, Brier scores and calibration. Rake and pot-unit tie assumptions are visible.
- [x] Event builder shares predicates, repetition counts, and seed in its URL. It compares exact composition with fresh-card simulation, including the pocket-pair and flush-draw examples.
- [x] Bankroll paths display result, drawdown, downswing-length and ruin distributions, with intervals and explicit independent-normal/block-endpoint limits.
- [x] Stats reads completed device histories, shows bb/100 and its interval, sample-size planning, actual/all-in EV, grades by concept, and calibration over time. Pot-specific locks and numerical uncertainty are documented beside results.
- [x] Weighted 13×13 range editing, blocker counts, shared state, specific-hand equity, per-class heatmaps against random or selected ranges, exact references, intervals, and a clearly labeled class-equity distribution.
- [x] Two/six-seat selection; generic replay, x-ray, and net-award runouts; pot-specific multiway coaching. Short big blinds retain the nominal multiway opening price. Six-seat generated legal sequences conserve chips and replay exactly.
- [x] Coach links now target the available EV, effective-odds, inference, preflop, range, and Bayes lessons.

Validation: 75 tests across 16 files pass, including exhaustive five-card verification and the existing exact preflop anchor. Lint, strict typecheck, production build, and enforced engine coverage pass. Engine coverage is 99.17% statements, 98.19% branches, 100% functions, and 99.25% lines. This delivery did not rerun the slow seven-card verifier because evaluator/category code is unchanged; the successful Phase 4 verification remains recorded above. README includes the new measured six-seat payout benchmark and updated existing rates.

A temporary production Chromium review at 375px exercised every new lesson and its worker, negative-EV practice and mastery, complete Call or Fold/Guess the Equity/Combo Counter sets, event URL replay, bankroll paths, weighted exact equity, all heatmap cells, and a full six-player hand through x-ray, 10,000-runout awards, and saved Stats. The review found and fixed standalone event styling and the table-size control label. Browser errors and horizontal overflow are checked; the permanent Playwright suite is now recorded in Phase 9 below.

No Phase 5–7 acceptance items are deferred. Documented model limits remain explicit: bankroll ruin is checked at block endpoints; multiway action values assume calls and no future betting; class histograms do not claim a combo-weighted range average; all-in EV adjusts only pots meeting the fixed-eligibility definition. External Pages publication and resumable active hands remain the earlier outstanding items. Phase 8 and 9 were not started in that delivery; their completion is recorded below.

## Phase 8 — Chapters 20–21, randomness and run-it-twice

- [x] Shuffle Lab, Streak Trap, randomness and insurance lessons; run-it-twice table option.
- [x] Anchor: naive three-card shuffle has 27 paths; three orders occur five times and three four times.
- [x] Acceptance: exhaustive bias experiment, chi-square and streak tests; run-it-twice preserves EV and correctly accounts for covariance; insurance priced from tested facts.

## Phase 9 — Chapters 22–25 and polish

- [x] Betting/game theory, tournaments/ICM, Kelly, optional CFR; push/fold and ICM calculators; playable AKQ.
- [x] Anchors: pot 100/bluff 50 → break-even 1/3 and MDF 2/3; pot-size river bet → balanced polarized bluffs 1/3 of betting range.
- [x] Performance pass; Playwright smoke suite; final README/screenshots; accessibility/mobile review and final coach links.
- [x] Acceptance: toy-game equilibria verified, ICM prizes conserved, assumptions displayed, complete checks and documented benchmarks.

### Phases 8–9 delivery notes

- [x] Twelve new lessons complete chapters 20–25 (53 total). Each includes the seven parts, computed notebook, worker experiment, five seeded practice questions with full solutions, a measured shortcut, and table/quant applications. Logarithms are built from powers before Kelly; CFR distinguishes average strategy from current policy and self-play value from exploitability.
- [x] Shuffle Lab enumerates every naive and Fisher–Yates path, exposes rejection sampling, and compares sampled ordering frequencies with exact counts. The registry/test anchor is 27 naive paths, with counts 4, 4, 4, 5, 5, 5. Chi-square tails and streak dynamic programming have independent checks.
- [x] Streak Trap provides seeded next-trial predictions, full conditional solutions, completed-score storage, and an overlapping-run experiment.
- [x] Run-it-twice is a pre-deal option for heads-up and six-seat tables. Both runouts, burns, side pots, combined fractional shares, odd chips, and replay are tested. Generated unequal-stack hands conserve chips. Independent ordered-river enumeration proves fractional-EV preservation and the covariance-adjusted variance. Stats uses paired-board expected awards and the same integer rounding rule.
- [x] Insurance defines outright loss, excludes ties, and computes fair premium, loading, and buyer EV from registry facts. Push/fold separates covered risk, opponent call, fold chance, and called-range equity. ICM conserves prizes, documents finishing-order assumptions, and calculates bubble factor. Ruin and Kelly expose their separate stake models.
- [x] Betting anchors: pot 100/bluff 50 gives break-even 1/3 and MDF 2/3; a pot-sized bet gives polarized bluffs 1/3. AKQ/Kuhn and the smaller ante/shove equilibrium are checked against every legal deterministic unilateral deviation. The playable bot receives only its own card and public history; CFR runs in a cancellable worker with exact exploitability checks.
- [x] Final coach links reach the randomness, two-runout, insurance, betting, tournament, sizing, and solver lessons. URL state, editable-input recovery, local display settings, reduced motion, phone layout, tap targets, and keyboard focus are covered by browser checks.
- [x] Performance pass removes repeated per-card exclusion allocations from joint dealing and uses two bounded index draws in the river experiment. README records the final machine measurements and baseline. Permanent Playwright checks run in CI after build; README includes generated desktop/phone screenshots.

Final validation: lint, strict typecheck, `npm test` (86 tests across 17 files), coverage, production build, and 10 Playwright tests across desktop and 375px phone projects pass. Engine coverage is 99.22% statements, 98.24% branches, 100% functions, and 99.31% lines. Browser tests exercise every new lesson worker, completed mastery, calculator validation and recovery, URL replay, Streak Trap, AKQ replay/CFR, run-it-twice play, saved Stats, cancellation, display persistence, focus, target sizes, and overflow. The existing exhaustive five-card and exact preflop anchors remain in the passing default suite. The slow verifier was not rerun during that phase delivery; the final audit above now records a fresh full enumeration and one million reference comparisons.

No Phase 8 or 9 acceptance item is deferred. The toy Nash policies and full-tree solver apply only to the explicitly stated small games; they are not unrestricted Hold’em solutions. Fractional-share EV preservation and integer-chip rounding are distinguished. The earlier external GitHub Pages setup and session-only active-hand limitation remain outside this request.

## Final audit: anchor-to-test index

The table covers every numerical anchor plus the explicit verification properties recorded above, including repeated anchors in later phases. Test names are the exact `it(...)` names (or `test(...)` for the standalone slow verifier). Every five-card category and distinct-strength entry in Phase 1 is asserted independently as an array entry; every seven-card category is shown against its observed count above. Phase 0 has tool/CI acceptance checks, not mathematical anchors. Coverage thresholds are enforced by `vite.config.ts`.

| Phase  | Anchor or verification claim                                                                                                                                              | Test file and exact test name                                                                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1, 2   | C(52,2) = 1,326; 169 classes = 13 pairs + 78 suited + 78 offsuit; pair/suited/offsuit classes have 6/4/12 combos.                                                         | [src/engine/core.test.ts](../src/engine/core.test.ts) — `proves every Phase 1 facts-registry entry`                                                                                              |
| 1, 2   | Pocket pair = 1/17; pocket aces = 1/221; suited = 4/17; at least one ace = 33/221.                                                                                        | [src/engine/core.test.ts](../src/engine/core.test.ts) — `proves every Phase 1 facts-registry entry`                                                                                              |
| 1      | All nine five-card counts, all nine distinct-strength counts, total 2,598,960 hands / 7,462 strengths, and 4 royals (every fast result equals the independent reference). | [src/engine/evaluator.test.ts](../src/engine/evaluator.test.ts) — `exhausts 2,598,960 five-card hands with both implementations and 7,462 strengths`                                             |
| 1      | All nine seven-card counts in the verified table above, total 133,784,560, and 4,324 royals; registry counts equal enumeration.                                           | [scripts/verify-seven.ts](../scripts/verify-seven.ts) — `exhausts all 133,784,560 seven-card sets with category and royal anchors`                                                               |
| 1      | 100,000 seeded seven-card fast/reference comparisons in the default suite.                                                                                                | [src/engine/evaluator.test.ts](../src/engine/evaluator.test.ts) — `agrees on 100,000 seeded seven-card hands`                                                                                    |
| 1      | 1,000,000 seeded seven-card fast/reference comparisons in the slow verifier.                                                                                              | [scripts/verify-seven.ts](../scripts/verify-seven.ts) — `agrees with the reference on 1,000,000 seeded seven-card hands`                                                                         |
| 1      | Card-order invariance.                                                                                                                                                    | [src/engine/evaluator.test.ts](../src/engine/evaluator.test.ts) — `is invariant to card order`                                                                                                   |
| 1      | Wheel, steel wheel, kickers, full house, counterfeited two pair, board plays, and tied strengths.                                                                         | [src/engine/evaluator.test.ts](../src/engine/evaluator.test.ts) — `handles wheels, kickers, full houses, counterfeits, board plays and names`                                                    |
| 1      | Identical seed gives identical PRNG sequence; documented output vector.                                                                                                   | [src/engine/core.test.ts](../src/engine/core.test.ts) — `matches known xoshiro128** output and replays`                                                                                          |
| 1      | Unbiased bounded draws stay in [0,n), including rejection and boundary sizes.                                                                                             | [src/engine/core.test.ts](../src/engine/core.test.ts) — `rejects bad seeds and bounds and handles rejection sampling`                                                                            |
| 1      | Four-card shuffle: all 24 orderings; fixed-seed chi-square below the df=23 upper critical value 49.7282324664 at α=0.001.                                                 | [src/engine/core.test.ts](../src/engine/core.test.ts) — `preserves a deck and is uniform over all 24 four-card permutations`                                                                     |
| 1      | AA vs KK: exact 1,712,304 boards, equity strictly between 0.80 and 0.84; fixed-seed 200,000 Monte Carlo samples within four estimated standard errors.                    | [src/engine/equity.test.ts](../src/engine/equity.test.ts) — `enumerates AA vs KK and agrees with 200,000 Monte Carlo trials within four SE`                                                      |
| 2      | Ordered two-card outcomes = 2,652; three-label permutations = 6; choosing two of four = 6; ace-or-spade = 4/13; two distinct suits = 1/2.                                 | [src/features/learn/learn.test.ts](../src/features/learn/learn.test.ts) — `proves Phase 2 anchors and all new registry counting claims`                                                          |
| 2      | Every introductory event predicate agrees exactly with independent enumeration.                                                                                           | [src/engine/experiments.test.ts](../src/engine/experiments.test.ts) — `checks every experiment against independent enumeration of its actual outcomes`                                           |
| 2      | Seeded event simulations replay and agree statistically with exact probabilities.                                                                                         | [src/engine/experiments.test.ts](../src/engine/experiments.test.ts) — `replays streamed samples and agrees with exact counting`                                                                  |
| 2, 4–9 | All lesson MDX files, including the original ten, render all seven parts and computed formulas.                                                                           | [src/features/learn/content.test.ts](../src/features/learn/content.test.ts) — `ships every lesson with all seven parts, four lenses, valid Svelte Markdown and no literal numeric probabilities` |
| 2, 4–9 | Seeded practice variants replay and full solution notebooks parse as KaTeX.                                                                                               | [src/features/learn/learn.test.ts](../src/features/learn/learn.test.ts) — `validates every notebook and seeded practice solution, including generated variants`                                  |
| 2      | Equivalent fractions, decimals, percentages, one-in and odds-against answers are graded consistently.                                                                     | [src/features/learn/learn.test.ts](../src/features/learn/learn.test.ts) — `grades equivalent representations and rejects malformed answers`                                                      |
| 2      | 4/5 establishes mastery; 3/5 does not; every partial set length 0–4 is rejected.                                                                                          | [src/features/learn/learn.test.ts](../src/features/learn/learn.test.ts) — `persists mastery, permits optional intro skipping, and sanitizes storage`                                             |
| 2      | Solutions remain hidden until answers; only a completed set is saved.                                                                                                     | [src/features/learn/PracticeSet.test.ts](../src/features/learn/PracticeSet.test.ts) — `keeps solutions hidden until each answer, grades once, and saves only a full set`                         |
| 3, 5   | Pot 100 + opposing bet 50, call 50: break-even 1/4 = 25%; call EV at that equity is zero.                                                                                 | [src/engine/game.test.ts](../src/engine/game.test.ts) — `proves the Phase 3 pot-odds anchor and bounds the coach claims`                                                                         |
| 3      | Generated legal action sequences conserve chips, keep stacks nonnegative, equate pot with contributions, and replay identically.                                          | [src/engine/game.test.ts](../src/engine/game.test.ts) — `conserves chips and contributions through random legal action sequences`                                                                |
| 4      | 47 unseen, flop to river: 9 outs = 378/1081; 8 outs = 340/1081; 15 outs = 585/1081.                                                                                       | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | 46 unseen, turn to river: 9 outs = 9/46.                                                                                                                                  | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | 15 outs: rule of four = 3/5 = 60%; adjusted rule = 53/100 = 53%.                                                                                                          | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | Pocket-pair rank appears on flop (the specified set-or-better event) = 144/1225.                                                                                          | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | Royal in seven cards = 4324/133784560 = 1/30940, checked with exact rational cross-multiplication.                                                                        | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | Unpaired hand pairs a hole rank on flop = 227/700.                                                                                                                        | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | Suited hand flops exactly two more of its suit = 429/3920; made flush = 33/3920.                                                                                          | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | Pocket queens see at least one ace or king on flop = 29/70.                                                                                                               | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | Pocket-pair rank appears on the full five-card board = 47/245.                                                                                                            | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | Flush plus open-ended draw: 9 + 8 − 2 shared physical cards = 15 distinct outs, not 17.                                                                                   | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `proves every Phase 4 numeric anchor through the facts registry`                                                           |
| 4      | Drawing formulas agree exactly with independent dealt-set enumeration, including the full board.                                                                          | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `checks closed-form drawing counts against independently dealt sets, including the full board`                             |
| 4      | All selectable lesson events, including every required drawing anchor and rare royals, are simulated against their exact answers.                                         | [src/engine/courseDraws.test.ts](../src/engine/courseDraws.test.ts) — `simulates every selectable Phase 4 event reproducibly against its exact answer`                                           |
| 5      | Expected wait for AA = 221; five straight wins at probability 4/5 = 1024/3125 = 0.32768; call threshold = 1/4.                                                            | [src/engine/inference.test.ts](../src/engine/inference.test.ts) — `proves Phase 5 anchors and independently normalizes discrete distributions`                                                   |
| 5, 6   | Event-builder composition and lesson distributions agree with controlled seeded experiments.                                                                              | [src/engine/inference.test.ts](../src/engine/inference.test.ts) — `checks every lesson model against controlled seeded experiments`                                                              |
| 6      | Controlled bankroll means, variance, drawdowns, downswing lengths, and ruin.                                                                                              | [src/engine/inference.test.ts](../src/engine/inference.test.ts) — `bankroll paths reproduce controlled means, variance, drawdowns and ruin`                                                      |
| 6      | Only eligible locked pots receive all-in EV adjustments; folds and river commitments retain actual results.                                                               | [src/engine/multiway.test.ts](../src/engine/multiway.test.ts) — `ledger adjusts locked all-in pots and leaves folds and river commitments actual`                                                |
| 7      | All physical combos map into 169 classes, with blocker removal before weighting.                                                                                          | [src/engine/multiway.test.ts](../src/engine/multiway.test.ts) — `maps all physical combos into 169 classes and removes blockers before weighting`                                                |
| 7      | Weighted joint ranges respect fixed cards and reject impossible collisions.                                                                                               | [src/engine/multiway.test.ts](../src/engine/multiway.test.ts) — `samples weighted joint ranges with fixed-card removal and detects impossible collisions`                                        |
| 7      | Six-seat order, nonnegative stacks, chip conservation, and exact replay.                                                                                                  | [src/engine/multiway.test.ts](../src/engine/multiway.test.ts) — `six seats obey action order and conserve chips through seeded legal action sequences`                                           |
| 8      | Naive three-card shuffle: 27 paths; three orderings occur 5 times and three 4 times. Fisher–Yates has one path per ordering; chi-square tail checks.                      | [src/engine/final.test.ts](../src/engine/final.test.ts) — `proves the exhaustive naive-shuffle anchor and rejection mechanism`                                                                   |
| 8      | Overlapping streak counts agree with exhaustive binary histories and seeded simulation.                                                                                   | [src/engine/final.test.ts](../src/engine/final.test.ts) — `counts overlapping streaks against independent binary enumeration`                                                                    |
| 8      | Two distinct rivers preserve expected fractional pot share and include the exact finite-deck covariance.                                                                  | [src/engine/final.test.ts](../src/engine/final.test.ts) — `preserves the two-river mean and includes finite-deck covariance`                                                                     |
| 8      | Side-pot rounding combines both boards once; two/six-seat runouts replay.                                                                                                 | [src/engine/final.test.ts](../src/engine/final.test.ts) — `settles both boards once per side pot and replays complete two/six-seat deals`                                                        |
| 8      | Unequal-stack two-board hands conserve every chip.                                                                                                                        | [src/engine/final.test.ts](../src/engine/final.test.ts) — `conserves every chip in generated unequal-stack two-board hands`                                                                      |
| 8      | Stats uses actual two-board rounding when replacing actual awards with expected awards.                                                                                   | [src/engine/final.test.ts](../src/engine/final.test.ts) — `prices integer-chip two-board awards in Stats under the actual settlement rule`                                                       |
| 8, 9   | Insurance fair premium/loading; pot 100/bluff 50 gives break-even 1/3 and MDF 2/3; pot-sized bet gives polarized bluffs 1/3.                                              | [src/engine/final.test.ts](../src/engine/final.test.ts) — `derives bluff, polarized-range and insurance anchors from payoffs`                                                                    |
| 9      | ICM exactly conserves prizes, includes zero-stack convention, and prices bubble risk.                                                                                     | [src/engine/final.test.ts](../src/engine/final.test.ts) — `conserves ICM prizes, including zero stacks, and computes bubble risk`                                                                |
| 9      | AKQ and push/fold toy equilibria resist every pure unilateral deviation; CFR approaches the known game value.                                                             | [src/engine/final.test.ts](../src/engine/final.test.ts) — `verifies AKQ and push/fold equilibria against every pure deviation`                                                                   |
| 9      | Ruin recurrence and deterministic boundaries; Kelly maximizes the specified log-growth model.                                                                             | [src/engine/final.test.ts](../src/engine/final.test.ts) — `checks ruin recurrence, boundaries and the Kelly maximum`                                                                             |

### Final audit outcome

- [x] Full seven-card enumeration: all nine categories, total, and royal subset match the anchors. One million independent reference comparisons pass. The command now exposes two named tests and prints category labels beside expected and observed counts.
- [x] Every roadmap anchor is mapped to an exact test file/name above. Tightened assertions include explicit five-card totals/distinct totals, exact method and 200,000-sample Monte Carlo count, exact rational event enumeration and royal counts, exact ICM prize conservation, exact two-river mean/variance/covariance, stated shortcut percentages, and all partial mastery-set lengths.
- [x] Audited all 53 MDX lessons plus lesson components and shared probability displays. Replaced duplicated confidence percentages, notebook probabilities, example rates, and practice likelihood labels with values from registry functions, model inputs, or Rational arithmetic. Scenario descriptions retain counts, units, and definitions; computed probabilities no longer have separately typed presentation values. The existing MDX scan now also rejects decimal percentages, written numeric “percent” labels, and vulgar-fraction characters; the new presentation scan checks JSX and string/template text.
- [x] Project-owned text contains no machine-specific home/profile/store paths or personal username references. CI installs Chromium and system dependencies with Playwright before the smoke suite; CI explicitly ignores the optional local-browser override. A regression test checks installation order and portable paths. Generated dependencies, build output, coverage, and test reports remain ignored.
- [x] Lint, typecheck, 90 tests across 18 files, coverage, production build, and all 10 Playwright checks pass. Engine coverage remains 99.22% statements, 98.24% branches, 100% functions, and 99.31% lines. No features or engine algorithms were added; benchmark measurements were retained rather than represented as rerun.

## Game experience follow-up

- [x] Open in the poker room with one-click heads-up or six-player entry.
- [x] Display named opponents, hidden cards, dealer position, bets, pot, current hand, and readable bot turns around a felt table.
- [x] Walk through the actual preflop, flop, turn, and river with optional contextual guidance. Preserve lessons, labs, drills, Stats, detailed coaching, and replay.
- [x] Show settled chip changes and continue directly to the next hand. Retain advanced manual commitments and automatic seed verification.
- [x] Keep ordinary actions available during coach calculation; retain prediction gating in exam mode.
- [x] Complete final lint, typecheck, unit tests, production build, and desktop/phone browser checks for the revised interface. All 90 unit tests and 16 browser checks pass; affected game checks were rerun after the final layout and bot-delay refinements.

No engine algorithms or benchmarks changed. Active-hand recovery remains deferred: leaving Play or reloading abandons an unfinished hand without settlement. Opponent names are table identities; every seat uses the selected persona.

## Guided course and side coach

- [x] Clear Chapter 1 entry from the poker room and course overview, with optional poker rules.
- [x] Searchable numbered chapter contents, current lesson, previous/next links, and shortcuts to lesson sections.
- [x] Separate saved reading position, explicit read status, and completed practice-hand status from quiz mastery.
- [x] Link lessons to real bot games with a practice focus and preserve the lesson/seed on return.
- [x] Keep the coach beside the table on desktop and one button away on phones, with plain-language help, optional odds, and decision feedback.
- [x] Clarify site destinations and simplify the first lesson without changing computed probabilities.
- [x] Final lint, typecheck, 92 unit tests, production build, and all 20 desktop/phone browser checks pass. Checks cover the Chapter 1/game/return round trip, distinct reading and mastery records, course search and section focus, desktop coach placement, and phone opening, closing, and focus restoration.

Partial quizzes and active hands remain session-only. Reading or playing a hand does not establish mastery. The mathematical curriculum and measured benchmarks are unchanged.

## contemprorary visual pass

- [x] Rename the app, npm package metadata, and existing GitHub repository to contemprorary while retaining history.
- [x] Centralize theme values in one CSS token file; retain the existing React/CSS stack.
- [x] Apply cobalt/ice exposure seams, LED mesh, scanlines, CSS light streaks, and blurred letterbox bands throughout the frontend.
- [x] Replace felt with a glass slab; add aria-hidden card reflections, frosted cards, glass chips, amber primary controls, and tabular mono readouts.
- [x] Bundle rounded UI and mono fonts with licenses, without runtime font requests or external images.
- [x] Preserve course content, game logic, mathematical code, simulations, saved data formats, and every test source.
- [x] Check both themes at 375px, reduced motion, and text against composited gradient backgrounds.
- [x] Final lint, typecheck, all 92 unchanged unit tests, production build, and all 20 unchanged desktop/phone browser checks pass. This was the earlier glass pass; its publication predates the current repository rename and dark redesign.

Existing measured benchmarks are unchanged and were not rerun. No additional gameplay phase was implemented. Active hands and unfinished quizzes remain session-only; the visual pass does not change those limitations.

## Dark Svelte redesign

- [x] Replace the glass theme and illustrated split hero with flat dark panels, thin rules, plain titles, and a minimal photo slot.
- [x] Move the shell and new visual components to Svelte while retaining tested React/MDX controllers through adapters.
- [x] Add a Pixi table, public-domain SVG cards, self-hosted fonts, and shared configurable filters/parallax.
- [x] Add the requested random, fading ace/court-card/joker artwork behind the home logo, with visibility and reduced-motion switches.
- [x] Preserve evaluator, equity math, and existing routes; implement the requested bot decisions, lesson additions, chart route, and authorized test updates.
- [x] Add reduced-motion/touch/mobile switches, a semantic HTML fallback, and automatic filter shedding.
- [x] Add and pass deterministic bot-action and live pot-odds tests; all 105 unit tests pass.
- [x] Update obsolete Light-theme and Explain-the-hand assertions with user approval.
- [x] Finish final verification: lint, typecheck, 105 unit tests, engine coverage, build, and all 20 browser checks.
- [x] Prepare the complete redesign and gameplay follow-up for GitHub.
- [x] Retain checked GitHub Actions publication from main to the renamed Pages path.

The staged migration was subsequently completed in the full Svelte follow-up below. The bot/coach follow-up is complete locally; benchmark results and final verification are recorded in VISUAL-DESIGN.md.

- [x] Rename the current project metadata, UI branding, documentation, and GitHub repository to `contemprorary`, as requested.

- [x] Replace random bot raise gates with sampled legal-action chip-return comparisons.
- [x] Remove Explain the hand and default the coach to a visual live pot-odds walkthrough.
- [x] Keep advanced equity analysis available in a disclosure and run the dev server on localhost.

## Reference and usability follow-up

- [x] Add starting-hand equity and conditional shove/fold matrices, selection details, reproducible workers, and resource links.
- [x] Explain the graphs in lessons 7.1, 18.1, and 23.1, preserving their seven-part contract.
- [x] Add live equity arithmetic and self-checks to the coach; add the enumerable river exercise to lesson 11.1.
- [x] Remove the separate poker dictionary and clipped decorative chapter numbers.
- [x] Make Six-player table deal immediately, and verify actual six-seat play.
- [x] Add persistent Violet/Blue dark themes and restyle the Display menu; update the Pixi surface in place.
- [x] Pass 105 unit tests, typecheck, lint, coverage, and build after these follow-ups.
- [x] Pass all 26 desktop/phone browser checks, including new chart and coaching workflows.
- [x] Prepare the final GitHub delivery with updated screenshots and measured validation.

## Full Svelte migration

- [x] Replace every remaining UI controller, page, chart, and drill with native Svelte components.
- [x] Replace React Router with lazy hash navigation, preserving public URLs and query parameters.
- [x] Compile all 53 lessons as Svelte Markdown with native contexts, snippets, experiments, and practice.
- [x] Remove React, React DOM, React Router, JSX, adapters, and their build/test dependencies.
- [x] Port component test harnesses and strengthen audits for the native stack.
- [x] Complete final lint, typecheck, all unit tests, production build, and desktop/phone browser verification.
- [x] Verify the running localhost server and prepare the migration for checked GitHub publication.

The engine, workers, lesson prose, saved-data formats, and existing measured benchmarks remain unchanged. Active hands and unfinished quizzes still reset when leaving; this migration adds no persistence feature.

## Thorough tutorial learning follow-up

- [x] Review every lesson and expand all 53 bodies with concrete reasoning and descriptive subheadings, including slower multiplication/combinations and advanced notation introductions.
- [x] Add authored introductions, specific prerequisite links, key ideas, common mistakes, and conceptual checks with revealable explanations for every lesson.
- [x] Add lesson summaries, chapter-end reading reviews, and previews of the next topic without awarding quiz credit for reading.
- [x] Add a full searchable numbered index and descriptive previous/next links; keep optional rules and capstone clear.
- [x] Preserve native Svelte, all seven lesson parts, calculated numerical claims, simulations, seeded quizzes, and existing progress formats.
- [x] Verify lint, typecheck, the complete unit suite, production build, and desktop/phone browser checks for this follow-up.

No engine or benchmark changes are included in this follow-up. Existing limitations remain: unfinished quiz answers and active hands are not restored after leaving their page.

Validation: lint and typecheck pass with no Svelte diagnostics; all 107 unit tests and all 38 desktop/phone browser checks pass. The six reading-navigation checks were rerun after the final index shortcut and pass on both viewports. Desktop and 375px phone screenshots are saved as `docs/screenshots/tutorial-{lesson,check,index}-{1280,375}.png`.

## Home-link correction

- [x] Make the top-left brand return to the lobby from an active table even when the URL is already `/play`.
- [x] Preserve stored profile/progress and native modified-click behavior; check repeated returns and keyboard activation on desktop and phone.

Home-link verification: lint, typecheck, all 107 unit tests, coverage thresholds, production build, and all 40 desktop/phone browser tests pass. Engine coverage is 99.2% statements, 98.4% branches, 100% functions, and 99.32% lines. No engine algorithms or benchmark measurements changed.
