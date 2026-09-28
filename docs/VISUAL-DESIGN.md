# neo-gospel visual pass

The reference is a cold, quiet transit terminal: cobalt shadows, an icy overexposed right side, fine screen texture, and occasional warm light. The app recreates that scene with CSS and keeps readable surfaces between the scenery and the content. The visual pass changes presentation and project branding only.

## Theme and implementation

[`src/design-tokens.css`](../src/design-tokens.css) is the single theme file. It contains palette values, semantic foreground/background colors, typography, spacing/layout scales, radii, blur, shadows, gradient paints, and motion timings. Its light-theme overrides preserve an icy alternative. Structural percentages, SVG geometry, and media-query breakpoints remain in layout code; custom properties do not work in media conditions.

[`src/softclub.css`](../src/softclub.css) builds the scene and shared surfaces. The background has a hard vertical exposure seam, a bright column, horizontal light trails, CSS silhouettes, a reflected floor, fine mesh, and blurred top/bottom bands. Streaks drift over 32 seconds. Cards slide horizontally; button highlights sweep with transform. Reduced motion disables all of these animations. Only the table needs backdrop blur during play; the two scene bands occupy separate edges. No canvas loop or external image is used.

Nunito provides rounded UI lettering; JetBrains Mono supplies tabular readouts. Both are bundled Latin WOFF2 fonts, with SIL Open Font License files in `src/assets/fonts/`. Mathematical notation retains KaTeX's fonts. Headings and small chrome labels use lowercase styling without changing lesson wording or accessible control names.

## Screen comparisons

| Screen                                                                     | Before                                                                | After                                                                                                                                                                                        |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Play lobby                                                                 | Green room, cream cards, circular felt preview, serif headline.       | Dark cobalt left panel and bright icy right panel, vertical seam, glass preview slab, reflected light, rounded lowercase headline, glass chips, amber entry button.                          |
| Live poker table and results                                               | Oval green felt, warm chip outlines, cream cards.                     | Frosted rectangular glass slab with inner rim, cobalt and dark amber card ink, masked community-card reflections, mono stacks/pot, glass seat panels and result surfaces.                    |
| Side coach                                                                 | Green panels with separate study styling.                             | A cold glass companion panel with an amber top edge and clear selected tab; mobile retains the fixed coach button and close/focus behavior.                                                  |
| Course contents and lessons                                                | Green cards and serif headings; numbered sidebar and lesson sections. | Split cobalt exposures with a visible sidebar seam, mono labels, rounded headings, glass notebook/quiz panels, and amber practice links. Content and mathematical derivations are unchanged. |
| Equity Lab                                                                 | Separate green setup and result cards.                                | Shared split-panel workspace, clear vertical seam, frosted card picker, mono equity readouts, and icy charts. Mobile turns the seam horizontal.                                              |
| Event builder, bankroll, ranges, Shuffle Lab                               | Green utility panels and charts.                                      | Glass controls, cobalt/ice chart bars, amber reference values, and readable range-cell overlays. Tool behavior and numerical chart data are unchanged.                                       |
| Insurance, push/fold, ICM, Kelly                                           | Green forms and numeric tables.                                       | The same forms on cold glass surfaces, pill controls, mono table values, and clear separators.                                                                                               |
| Outs Rush, Call or Fold, Guess the Equity, Combo Counter, Streak Trap, AKQ | Warm/green drill panels and playing cards.                            | Shared frosted cards, glass panels, rounded UI, and amber actions; all scoring and progression remain unchanged.                                                                             |
| Progress                                                                   | Green history, forecast and chart panels.                             | Cobalt glass panels, mono numeric tables, icy chart accents, and the same saved-hand history.                                                                                                |
| Display settings and phone layouts                                         | Dark felt/light cream options, dropdown card picker, stacked layouts. | Cobalt/ice theme options, matching glass settings/picker, horizontal mobile seams, visible focus outlines, and motion-free rendering when requested.                                         |

## Screenshots

- [Lobby — desktop](screenshots/poker-lobby-desktop.png), [phone](screenshots/poker-lobby-phone.png)
- [Table — desktop](screenshots/poker-table-desktop.png), [phone](screenshots/poker-table-phone.png)
- [Six seats — desktop](screenshots/poker-six-desktop.png), [phone](screenshots/poker-six-phone.png)
- [Coach — desktop](screenshots/coach-beside-table.png), [phone](screenshots/coach-phone.png)
- [Course contents](screenshots/course-contents.png)
- [Equity tools](screenshots/neo-gospel-tools.png), [Shuffle Lab](screenshots/shuffle-lab.png)
- [Drills](screenshots/neo-gospel-drills.png), [AKQ on phone](screenshots/akq-phone.png)
- [Progress](screenshots/neo-gospel-progress.png)
- [Light theme](screenshots/neo-gospel-light.png)

## Validation and limits

The existing test sources are unchanged. Final lint, typecheck, all 92 unit tests, the production build, and all 20 existing desktop/phone browser checks pass. Browser checks exercise actual bot games, course/game/return navigation, coach placement, run-it-twice geometry, touch targets, settings, tools, and persisted results.

A separate temporary browser audit inspected 19 routes in dark and light themes at 375px: no horizontal overflow and no active animations under reduced motion. Automated contrast inspection reported no violations, but marked gradient backgrounds for manual review. A supplementary rendered-pixel check sampled 3,106 text regions across 14 representative routes/states in both themes at three scroll positions; all met the applicable AA text threshold after correcting table-status and empty-chart contrast. This samples rendered states rather than certifying every possible dynamic state or browser. Focus outlines, suit symbols, chart data disclosures, and explicit text labels remain available.

The theme uses dark amber card ink to meet text contrast on pale cards; bright sodium amber is reserved for lights and primary backgrounds. Foreground text never relies on glow for legibility. Older browsers without backdrop filtering retain the static gradient surface. The engine and benchmark measurements are unchanged. Active hands and unfinished quiz answers remain session-only.

## Changed files

- Theme: `src/design-tokens.css`, `src/softclub.css`, `src/styles.css`, `src/main.tsx`.
- Feature styles: `src/features/play/play.css`, `src/features/learn/learn.css`, `src/features/lab/Lab.module.css`, `src/features/arcade/OutsRush.module.css`.
- Shared component styles: `src/ui/PlayingCards.css`, `src/ui/Cards.module.css`, `src/ui/RangeGrid.module.css`.
- Presentation markup: `src/App.tsx`, `src/features/play/Play.tsx`, `src/features/play/Table.tsx`, `src/ui/SeriesChart.tsx`.
- Bundled fonts/licenses: `src/assets/fonts/nunito-latin.woff2`, `src/assets/fonts/jetbrains-mono-latin.woff2`, `src/assets/fonts/nunito-OFL.txt`, `src/assets/fonts/jetbrainsmono-OFL.txt`.
- Project identity: `index.html`, `package.json`, `package-lock.json`, `AGENTS.md`, `README.md`, `docs/SPEC.md`.
- Documentation: `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/VISUAL-DESIGN.md`.
- Screenshot files listed above in `docs/screenshots/`.

The GitHub repository was renamed to [ZacharySF/neo-gospel](https://github.com/ZacharySF/neo-gospel); the local remote and Pages links use the new name. Relative Vite assets and hash routes continue to work under the renamed Pages path.
