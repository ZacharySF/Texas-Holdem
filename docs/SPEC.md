# contemprorary

Build a browser game that teaches probability through No-Limit Texas Hold'em: a playable game against bots, a course that derives ideas from basics and checks them through simulation, and carefully tested software. Static site; no backend, accounts, or runtime network calls. MIT, copyright Zachary Finley-Stubbs.

## Learner and writing

Assume fraction arithmetic and basic algebra, but no probability. Give the multiplication rule and combinations the slowest, most careful treatment. Introduce summation notation and all statistics at first use, e in repeated-hands lessons, and logarithms in Kelly. Use plain, concrete writing and actual cards and numbers. No filler, hype, or emojis. See CURRICULUM.md for the authoritative expanded chapter plan.

Every lesson has seven parts: (1) concrete hook; (2) thorough construction from basics with worked examples; (3) notebook derivation, aligned, one step per line, no prose inside the block; (4) live simulation with exact reference and 95% band; (5) 5–10 seeded randomized auto-graded problems with full solutions after answering; (6) application at the table, linked by the coach; (7) a 2–4 sentence quant corner. Quant connections include EV/expected P&L, variance/volatility and drawdowns, standard error/backtested edges, Monte Carlo/pricing, Bayes/new information, Kelly/position sizing, Brier/forecasting skill.

Derivation model: P(at least one ace) = 1 − P(no aces) = 1 − C(48,2)/C(52,2) = 1 − 1128/1326 = 198/1326 = 33/221, followed by computed display conversions. Teach each major idea as exact counting, simulation, a shortcut with measured error, and a table decision. Mastery requires 80%; unlock chapters in order but permit manual opening.

## Math rules (highest priority)

No hand-typed UI or lesson probabilities. Values come from engine computations or tested functions in src/content/facts.ts. Exact values use reduced BigInt rationals displayed as fraction, percent, 1 in N, and N : 1 against. Every Monte Carlo result includes sample count and a 95% confidence interval; when an exact result exists, display it and the gap. Equity is average pot share; ties divide the pot among all winners. Report win, tie, loss separately. Direct call EV relative to folding is equity × (P + C) − C, with P including the opposing bet and C the call; break-even equity is C/(P+C).

## Stack and boundaries

Strict TypeScript without any, Svelte 5 throughout, Svelte Markdown lessons compiled by mdsvex, Vite, npm, pinned Node LTS. Hash navigation and Vite base './'. Vitest, coverage-v8, fast-check; at least 90% engine coverage enforced by CI. Plain CSS variables and CSS Modules; hand-built SVG charts. Svelte Markdown and KaTeX provide the lesson presentation. All simulation runs in Web Workers via a typed protocol. ESLint and Prettier. GitHub Actions checks lint, typecheck, tests, build on pushes and PRs and deploys Pages on main.

src/engine is pure TypeScript without DOM or UI-framework dependencies: cards, RNG, shuffle, combinatorics, rational arithmetic, evaluator, equity, statistics; later game rules and bots. src/workers wraps the engine. Modes live in src/features/{learn,play,lab,arcade,stats}; shared UI in src/ui; lessons and facts in src/content. Settings and progress use localStorage; histories use IndexedDB starting Phase 3.

Mobile first, playable at 375px; targets at least 44px and no hover-only controls. Cobalt glass theme plus icy light option; four-color deck option with suit symbols always visible. Deal and chip animations respect reduced motion.

## Randomness

One documented seeded xoshiro128** or PCG32 PRNG for logic. Seed generation uses crypto.getRandomValues; never Math.random. Bounded integers use rejection sampling. Fisher–Yates shuffle. Every deal has a replayable seed. Phase 3: commit SHA-256(seed) before dealing, reveal seed afterward, and provide verification with Web Crypto.

## Modes

Learn follows the lesson contract above. Play starts heads-up, later 6-max: coach toggle with highlighted outs, exact next-card/river odds, pot odds, break-even equity, estimated-range Monte Carlo equity, and direct EV. Grades link to lessons and state that direct odds ignore future betting and depend on estimated ranges. Histories show seeds, exact replays, and 10,000 runouts from any street. Exam mode collects an estimate first. Bots cannot see hidden cards; post-hand x-ray reveals cards and reasoning. Play-money bankroll, lesson/drill XP, stakes/bot unlocks without dark patterns.

Lab supports specific and random hands, multiway, board, dead cards, exact enumeration when feasible and sampling otherwise, always method/count/error. Ranges in engine Phase 3 and range UI Phase 7. Later tools: 13×13 combos/equity grid, outs explorer, event builder, LLN/CLT visualizer, variance/bankroll simulator with downswings and ruin, Shuffle Lab with exhaustive naive bias and chi-square test. Numbers have a why explanation linked to their lesson. Encode lab cards and seed in the URL.

Arcade: Outs Rush, Call or Fold, Guess the Equity (Brier and calibration), Combo Counter, Streak Trap. Stats: hands, actual vs all-in EV adjusted results, bb/100 and CI/sample-size explanation, grades by concept, drill calibration.

## Phase 1 contract

Cards are integers with documented parse/format (As, Td, 7c). Factorial, nCr, rational reduction/add/multiply/compare/four displays. Fast comparable 7-card integer strength, no more than 2 MB of lookup tables; independent readable reference with best five/category/English name. Exhaust all five-card hands and distinct strengths through both implementations; compare 100,000 seeded seven-card hands, and 1,000,000 in verify:7card. verify:7card also exhausts all seven-card categories. Cover wheel, steel wheel, kickers, counterfeit two pair, board playing, ties, and order invariance.

Equity API: equity({players: (Hand | 'random')[], board, dead, method: 'exact' | 'monteCarlo' | 'auto', samples, seed}). Preserve an extension point for ranges. Auto chooses exact for work estimated at about a second; exact buttons explain disabled work. Card removal throughout. Sampling progress about every 50 ms and cancellation. Welford mean/variance, SE, normal and Wilson intervals, chi-square, Brier. Benchmark evaluations and Monte Carlo throughput and document machine specs.

Lab shell has all five modes; future modes name their phase. Phone card picker disables used cards. Edit hero/opponents/random/board/dead, support adding opponents; Exact and Simulate 1k/10k/100k/1M plus Deal random; display seed. Results show win/tie/loss/equity in four formats. Convergence chart plots estimate, narrowing 95% interval, and exact reference; explain why quadrupling samples halves standard error.

The initial request authorized Phases 0 and 1. Subsequent explicit requests authorized Phases 2–4, then Phases 5–7 together. The latest explicit request authorizes completion of the unfinished Phase 8 and 9 items. The delivery scope ends at Phase 9. Resolve ambiguity and record tradeoffs in ARCHITECTURE.md. Priority: engine correctness/tests, Lab UI, docs polish. Finish with passing lint, typecheck, tests, build, and explicit outstanding roadmap entries.

## Game experience follow-up

The subsequent user request authorizes making Play the default experience and teaching through actual bot games. Keep all completed Phases 0–9 learning tools. Add a poker-room entry, one-click dealing, a spatial table with named bots and readable turns, optional street-by-street guidance, and clear results with immediate next-hand play. Keep detailed math and verification available on demand. The existing engine, bot information boundaries, seeded randomness, and saved-history rules remain authoritative.

## Guided navigation follow-up

The latest request authorizes a simpler course path inspired by numbered tutorial sites, beginning at Chapter 1 and interleaving lessons with real games. Put accessible coaching beside play on desktop and behind an obvious phone control. Preserve the mathematical curriculum, simulations, practice questions, and game rules. Track reading and game participation separately from quiz mastery, and make returning from a completed practice hand to the same lesson straightforward.

## contemprorary visual pass

The visual-only follow-up renames the project and GitHub repository to contemprorary. Use a CSS-built transit-terminal scene, mesh, cold glass, sparse amber lighting, rounded UI typography, and tabular mono readouts. Centralize theme values in one CSS token file, preserve 375px layouts and reduced motion, and maintain readable contrast in both themes. Game rules, engine math, workers, lesson content, and test sources remain unchanged.

## Dark Svelte redesign and current name

The later visual request supersedes the light/glass theme above. Use Svelte for the shell and new presentation, a flat void/ink/violet theme, a Pixi table, public-domain SVG playing cards, and configurable sparse motion. Preserve existing React/MDX controllers through an adapter during this migration so game logic, math, lesson content, routing, and tests remain unchanged. Add randomly fading aces, court cards, and jokers behind the home logo; jokers are decorative only. The requested project and GitHub name is `contemprorary` (spelled as requested).

## Complete Svelte migration

The latest request supersedes the staged adapter approach above: remove every React component, dependency, router, test renderer, and build plugin. Keep the game engine, probability functions, workers, lesson content, route paths, and saved-data formats unchanged. Use native Svelte components and snippets, keyed lesson subtrees, and Svelte Markdown for all 53 lessons. Migrate component test harnesses and source audits while retaining their behavioral assertions.

## Thorough tutorial learning follow-up

The latest request authorizes a complete teaching and navigation pass inspired by LearnCpp’s gradual tutorial approach. Review and expand every lesson, explain new terms and notation through concrete examples, add conceptual questions with revealable explanations and summaries, and make prerequisites and the numbered course path easier to find. Retain the original probability curriculum, native Svelte implementation, tested computed values, seven-part lesson contract, simulations, and independent quiz mastery.
