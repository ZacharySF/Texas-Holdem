# Dark Svelte redesign

This revision replaces the earlier light glass treatment. It uses near-black void/ink backgrounds, restrained violet surfaces, thin rules, and small cyan/red light sources. Decorative eyebrows, marketing fragments, the illustrated A/K hero, glass panels, pills, and the Light theme control are removed.

## Implementation

- CSS tokens: [`src/design-tokens.css`](../src/design-tokens.css). All theme colors, fonts, dimensions, radii, and surface paints live here. Existing proportional layout geometry and media-query breakpoints stay in layout CSS.
- Shared configuration: [`src/visual/config.ts`](../src/visual/config.ts). This mirrors the palette for Pixi and owns CRT, noise, bloom, RGB split, deal blur, frame budget, flicker, and every parallax magnitude.
- Canvas: [`src/visual/pokerScene.ts`](../src/visual/pokerScene.ts). Three depth containers hold surface, light, and card/chip presentation. Static filtered layers are baked into two reusable render textures. Flat filter passes avoid the nested-filter resize failure observed during browser checks. All gameplay text and controls remain semantic HTML.
- Motion: [`src/visual/parallax.ts`](../src/visual/parallax.ts). One shared DOM animation loop, passive listeners, visibility gating, and translate3d. Pixi uses its existing ticker. The home also has three random decorative ace/court-card/joker fades configured under `motion.heroCards`, using CSS opacity cycles without another animation-frame loop. Reduced motion stops visual animation; touch disables pointer depth and widths below 768px disable scroll depth. Fixed SVG film grain never moves.
- Photo component: [`src/ui/GradientMapImage.svelte`](../src/ui/GradientMapImage.svelte). Replace `public/art/hero.jpg` with your own photograph. The included image is a neutral placeholder, not a stock photograph. Shadows/midtones/highlights map through SVG filters to void/violet/ice. The home component contains a replacement comment.
- Svelte migration: `App.svelte`, `Home.svelte`, `Table.svelte`, the cards, image, and chapter-number components are Svelte. Existing React game controllers, hash routes, and MDX experiments remain behind the small adapters in `src/bridge/`. This is a staged migration; React has not been completely removed.

The card set is Byron Knoll’s public-domain Vector Playing Cards 1.3, with theme paint, preserved local SVG gradients, and mist rank indices. Four-color diamonds use the deeper ink face to keep ultraviolet suit shapes distinguishable; the other four-color suits use mist, glow, and signal. A custom ink/ultraviolet geometric back is included. See [`public/cards/LICENSE.md`](../public/cards/LICENSE.md). Fonts are self-hosted Syncopate (Apache 2.0), Zen Kaku Gothic New (OFL), and Departure Mono (OFL), with license files alongside them.

## Screen comparisons and screenshots

| Screen              | Earlier version                                                                        | This revision                                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                | Glass split hero, illustrated cards, fragment headline, amber pill, many entry panels. | Large plain logo, requested one-line description, two controls, replaceable mapped-photo slot, randomly fading aces/court cards/jokers, compact stats and retained course/settings entry. |
| Play                | Frosted table, reflected cards, glass chips and panels.                                | Dark Pixi slab, SVG faces and geometric backs, thin chip rims, sharp HTML readouts, narrow side coach.                                                                                    |
| Course              | Glass cards and prominent decorative labels.                                           | Wide lesson column, narrow contents rail, thin dividers and plain chapter labels. Clipped duplicate numerals were removed; four lessons now include chart/equity walkthroughs.            |
| Tools               | Light/glass cards and amber highlights.                                                | Dark flat controls, the same SVG card picker, mono readouts, cobalt-to-ice chart colors.                                                                                                  |
| Drills and progress | Rounded glass panels and decorative labels.                                            | Flat dark surfaces, plain page labels, consistent card faces and numeric typography.                                                                                                      |
| Phone               | Floating coach overlay.                                                                | Single column; the coach opens below the table and action controls. Keyboard close/focus behavior is retained.                                                                            |

| Screen | Desktop                                        | 375px                                         |
| ------ | ---------------------------------------------- | --------------------------------------------- |
| Home   | [Screenshot](screenshots/dark-home-1440.png)   | [Screenshot](screenshots/dark-home-375.png)   |
| Play   | [Screenshot](screenshots/dark-play-1440.png)   | [Screenshot](screenshots/dark-play-375.png)   |
| Course | [Screenshot](screenshots/dark-course-1440.png) | [Screenshot](screenshots/dark-course-375.png) |

Additional updated captures: [six seats](screenshots/poker-six-desktop.png), [phone six seats](screenshots/poker-six-phone.png), [coach](screenshots/coach-beside-table.png), [tools](screenshots/contemprorary-tools.png), [drills](screenshots/contemprorary-drills.png), and [progress](screenshots/contemprorary-progress.png). The obsolete light-theme screenshot was deleted.

## Validation and remaining limits

The later bot/coach request authorizes gameplay changes and affected test updates. The evaluator, equity sampler, and settlement remain unchanged. The requested learning follow-up adds a chart route and extends four lessons without altering their existing seven-part structure. The bot now compares sampled action returns; the coach starts with a tested, visual pot-odds derivation. The unused hand walkthrough was removed. All 105 unit tests pass, with engine coverage of 99.20% statements, 98.40% branches, 100% functions, and 99.32% lines. Lint, TypeScript/Svelte checks, the production build, pass. All 26 desktop/phone browser checks pass, including the new charts, calculator exercises, both dark palettes, and six-player entry. The checks cover live pot-odds arithmetic, full games against the revised bots, side-coach navigation, two-board settlement, saved history, course return, dark settings persistence, and 375px layout.

The requested `--haze: #776da2` has contrast 4.08:1 on ink and 3.37:1 on night. The replacement `#9287b8` achieves 5.80:1 and 4.79:1. Body labels do not depend on glow for contrast. A temporary audit found no overflow or active CSS animation under reduced motion across 19 routes at 375px. A rendered-pixel audit sampled 1,592 text regions across 14 representative routes/states and three scroll positions, with no AA failures. This is sampled evidence, not a certification of every dynamic state; canvas card details also received visual review.

A headless Chromium software-rendering run measured 16.67ms frames with cached effects enabled. Injected main-thread load triggered automatic filter removal; a reduced-motion idle sample produced zero GPU draw calls. Pixi's internal maintenance scheduler may still run without drawing. Live resizing from a 1440px viewport to 375px retained Pixi rendering with matching 343px table/canvas widths and no horizontal overflow. Integrated-GPU performance on a physical laptop remains unmeasured.

Engine benchmarks were rerun after the bot change, including new heads-up and six-seat decision timings (below). Active hands and unfinished quizzes remain session-only. A full React-controller/MDX migration to Svelte is unfinished separate work.

## Changed files

The latest follow-up also renamed the application, npm metadata, docs, and GitHub repository to `contemprorary`, and expanded the hero to random aces, court cards, and jokers with randomized fade durations and gaps.

Application/configuration/documentation files (each source file is listed):

- `.prettierrc.json`
- `AGENTS.md`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/SPEC.md`
- `docs/VISUAL-DESIGN.md`
- `eslint.config.js`
- `index.html`
- `package-lock.json`
- `package.json`
- `public/art/hero.jpg`
- `src/App.svelte`
- `src/App.tsx`
- `src/bridge/ComponentHost.svelte`
- `src/bridge/LegacyRoutes.svelte`
- `src/bridge/SvelteView.tsx`
- `src/design-tokens.css`
- `src/features/arcade/Akq.tsx`
- `src/features/arcade/DecisionDrills.tsx`
- `src/features/arcade/OutsRush.module.css`
- `src/features/arcade/OutsRush.tsx`
- `src/features/lab/BankrollLab.tsx`
- `src/features/lab/EventBuilder.tsx`
- `src/features/lab/FinalCalculators.tsx`
- `src/features/lab/Lab.module.css`
- `src/features/lab/Lab.tsx`
- `src/features/lab/RangeLab.tsx`
- `src/features/lab/ShuffleLab.tsx`
- `src/features/learn/AdvancedExamples.tsx`
- `src/features/learn/CourseContents.tsx`
- `src/features/learn/FinalLesson.tsx`
- `src/features/learn/Learn.tsx`
- `src/features/learn/ModelCheck.tsx`
- `src/features/learn/PracticeSet.tsx`
- `src/features/learn/SimCheck.tsx`
- `src/features/learn/components.tsx`
- `src/features/play/CoachPanel.tsx`
- `src/features/play/CoachSidebar.tsx`
- `src/features/play/HandGuide.tsx` (deleted)
- `src/features/play/AmbientCards.svelte`
- `src/features/play/Home.svelte`
- `src/features/play/PixiTable.svelte`
- `src/features/play/Play.tsx`
- `src/features/play/Table.svelte`
- `src/features/play/Table.tsx`
- `src/features/play/play.css`
- `src/features/stats/Stats.tsx`
- `src/main.ts`
- `src/main.tsx` (deleted)
- `src/night.css`
- `src/softclub.css` (deleted)
- `src/styles.css`
- `src/ui/Card.tsx`
- `src/ui/CardFace.svelte`
- `src/ui/GradientMapImage.svelte`
- `src/ui/PlayingCards.svelte`
- `src/ui/PlayingCards.tsx`
- `src/ui/Probability.tsx`
- `src/ui/cardAssets.ts`
- `src/visual/config.ts`
- `src/visual/display.ts`
- `src/visual/parallax.ts`
- `src/visual/pokerScene.ts`
- `svelte.config.js`
- `vite.config.ts`

Asset sets:

- `public/cards/`: all 52 `{ace,2,3,4,5,6,7,8,9,10,jack,queen,king}_of_{clubs,diamonds,hearts,spades}.svg` faces, their 52 `-four.svg` variants, `back.svg`, and `LICENSE.md`; `public/cards/art/` adds the four aces, 12 illustrated court faces, and `black_joker.svg` / `red_joker.svg` for the home animation.
- `src/assets/fonts/`: added `departure-mono.woff2`, `syncopate-400.woff2`, `zen-kaku-400.woff2`, `zen-kaku-500.woff2`, `zen-kaku-700.woff2`, `Departure-Mono-OFL.txt`, `Syncopate-LICENSE.txt`, and `Zen-Kaku-LICENSE.txt`; deleted the previous Nunito/JetBrains Mono font and license files.
- `docs/screenshots/`: the six `dark-{home,play,course}-{1440,375}.png` captures above; refreshed poker lobby/table/six-seat, coach, course-contents, tools, drills, progress, Shuffle Lab, and AKQ captures; deleted the obsolete `neo-gospel-light.png`.

Additional follow-up files:

- `src/engine/bots.ts`, `src/engine/bots.test.ts`, `src/engine/game.test.ts`
- `src/workers/play.worker.ts`
- `src/content/facts.ts`, `src/content/potOddsFacts.ts`, `src/content/potOddsFacts.test.ts`
- `src/features/play/PotOdds.svelte`
- `e2e/play.spec.ts`, `e2e/course.spec.ts`, `e2e/smoke.spec.ts`
- `scripts/bench.ts`

## Bot follow-up benchmark

Measured September 28, 2026 local time (September 29 UTC), Node 24.20.0, Intel Core Ultra 7 256V, 8 logical CPUs, 15.2 GiB RAM, Linux 7.2.5 x64. The browser checks were stopped for this run. Each bot measurement averages 20 repeated preflop decisions after warmup, 800 shared samples per decision; worker startup and UI delay are excluded.

| Workload                         |                Measured |
| -------------------------------- | ----------------------: |
| Fast seven-card evaluation       |  4,735,221 hands/second |
| Monte Carlo, one random opponent |   933,869 trials/second |
| Monte Carlo, weighted range      |   194,785 trials/second |
| Lesson category experiment       | 2,756,477 trials/second |
| Six-seat side-pot awards         |   115,809 trials/second |
| Bot decision, heads-up           |        4.34 ms/decision |
| Bot decision, six seats          |       10.81 ms/decision |

The previous evaluator/equity/payout algorithms remain unchanged. Relative to the September 27 measurement, throughput was +1.8% evaluation, +1.7% random equity, −0.4% weighted equity, −1.9% lesson trials, and +1.5% payouts. These small differences are single-run timing variation, not evidence of an algorithmic change. Bot decision timings are new workloads with no earlier comparable baseline.

## Latest requested additions

The separate dictionary is removed. Pot odds and Equity are the main coach tabs. Equity shows real simulation counts and tie credit, a user-entered calculation check, and an optional manual river enumeration. The dark Blue palette is available in Display; its settings persist and its Pixi surface updates without restarting a hand. Six-player table now starts a deal immediately. Chapter rows have plain unique labels, with no clipped background copies.

New screenshots:

- [Starting-hand chart](screenshots/hand-charts-desktop.png) / [phone](screenshots/hand-charts-phone.png)
- [Shove chart](screenshots/shove-chart-desktop.png) / [phone](screenshots/shove-chart-phone.png)
- [Equity coach](screenshots/equity-coach-desktop.png) / [phone](screenshots/equity-coach-phone.png)
- [Blue six-player table](screenshots/blue-six-desktop.png) / [phone](screenshots/blue-six-phone.png)

Additional changed source files:

- `src/content/handChartFacts.ts`, `src/content/handChartFacts.test.ts`
- `src/content/equityCoachFacts.ts`, `src/content/equityCoachFacts.test.ts`
- `src/content/lessons/7-1.mdx`, `src/content/lessons/11-1.mdx`, `src/content/lessons/18-1.mdx`, `src/content/lessons/23-1.mdx`
- `src/features/lab/HandCharts.svelte`, `src/features/lab/HandCharts.tsx`
- `src/features/play/EquityWalkthrough.svelte`
- `src/features/learn/EquityByHand.svelte`, `src/features/learn/ChartWalkthrough.svelte`
- `src/workers/handCharts.worker.ts`
- `e2e/charts.spec.ts`

New math is registered and tested. The chart is a model with stated assumptions rather than a universal playability or solved tournament chart. The full React/MDX controller migration remains separate work.

The final rendered-background contrast check measured 1,338 text samples across the new chart, equity coach, and manual exercise in Violet and Blue, with no AA failures. A separate 433-sample coach check also passed. Native chart and six-seat layouts were reviewed at 375px and 1440px with no horizontal page overflow; the wide hand matrix deliberately scrolls inside its own labeled region. The narrower chart retains full-sized tap targets instead of shrinking the entire grid.
