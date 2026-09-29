# Visual rebuild

## Phase 0 — audit

Baseline: `b7d7cf385e8ec197f1e03ff2f06940bf8c912836`.

`design/refs/`, `design/refs/NOTES.md`, and `design/photos/` are absent from this checkout. No visual comparison with unseen references will be claimed. The written wireframes and six-device rules are the available composition reference. The previous uncommitted continuation was abandoned when this replacement brief arrived.

The application uses the following existing addresses. Renaming them would change routing, which is prohibited. Displayed section names will follow the brief, while links retain working addresses.

| Brief address       | Existing address                      |
| ------------------- | ------------------------------------- |
| `#/play`            | `#/play` (lobby and active table)     |
| `#/course`          | `#/learn`                             |
| `#/course/<lesson>` | `#/learn/<lesson>`                    |
| `#/drills`          | `#/arcade` and its existing subroutes |
| `#/tools`           | `#/lab` and its existing subroutes    |
| `#/progress`        | `#/stats`                             |

The screenshot audit covers the lobby, active table, course index, all 53 lessons, all ten tool routes, all six drill routes and progress: 73 views per size. Before and removal captures use 1440×900 and 390×844. Final review also includes 1024×768.

### Rendered decorative inventory

Paths below are relative to `src/`.

| File / component or element                                                                                          | Routes                                           | Purpose / disposition                                                                                |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `App.svelte` / `.page-atmosphere`, tunnel and corner lights                                                          | All                                              | Parallax lighting; remove                                                                            |
| `App.svelte` / `.film-grain`                                                                                         | All                                              | Global SVG grain; retain as the one constrained overlay                                              |
| `App.svelte` / `#chart-ink` SVG definition                                                                           | Data charts                                      | Existing data fill, preserve                                                                         |
| `decor/Foundation.svelte`                                                                                            | All                                              | Styles and document title                                                                            |
| `decor/DecorShell.svelte`                                                                                            | All                                              | Window wrapper and old dev laboratory                                                                |
| `decor/StatusBar.svelte`                                                                                             | All                                              | Workspace links, actual chips/XP/hands, local clock, FPS and rings; replace with real-data rail      |
| `decor/RouteWipe.svelte`                                                                                             | All                                              | Full-screen blur wipe; remove                                                                        |
| `decor/WindowChrome.svelte`, `WindowFrame.svelte`                                                                    | Table, coach, course sidebar, tools, drills, lab | Fake terminal path and glyphs; remove                                                                |
| `decor/HomeDecor.svelte`                                                                                             | Lobby                                            | Halftone band, knockout title, grid, rules, marks, sticker, micro-copy; remove                       |
| `decor/HomeNavigation.svelte`                                                                                        | Lobby                                            | Dither, range dots, slit-scan tiles around real navigation; remove artwork, retain useful navigation |
| `features/play/Home.svelte` / hero photo                                                                             | Lobby                                            | Existing gradient-mapped photo; remove                                                               |
| `features/play/AmbientCards.svelte`                                                                                  | Lobby                                            | Floating SVG cards; remove                                                                           |
| `decor/CourseDirectory.svelte`                                                                                       | Lobby                                            | Collapsible run-in chapter navigation; move index use to course only                                 |
| `decor/PlayDecor.svelte`                                                                                             | Active table                                     | Deck grid, sticker, ruler, micro-data, callouts; remove                                              |
| `decor/TableEdge.svelte`                                                                                             | Active table                                     | Text on arc and hand barcode; remove                                                                 |
| `decor/LearningDecor.svelte`                                                                                         | Course / lessons                                 | Sticker, image-filled duplicate heading, run-in, ruler, callout; remove                              |
| `decor/ChapterMark.svelte`                                                                                           | Course index                                     | Echoed titles, vertical chapter numbers, distributions; remove                                       |
| `decor/ModeDecor.svelte`                                                                                             | Tools / drills                                   | Decorative scatter/distributions, dither/ASCII, overprint type, caution strip, marks; remove         |
| `decor/ProgressDecor.svelte`                                                                                         | Progress                                         | ASCII Fetch, rings, barcode and decorative historical matrix; remove                                 |
| `decor/TypeDevice.svelte`                                                                                            | Above compositions and dev lab                   | Knockout, image fill, outline, echo, overprint, vertical, text path, split and ticker; remove        |
| `decor/Ruler.svelte`, `Sticker.svelte`, `CropMarks.svelte`, `ModularGrid.svelte`, `Caution.svelte`, `Callout.svelte` | Above compositions and dev lab                   | Rules, marks, sticker/caution/callout system; remove                                                 |
| `decor/Fetch.svelte`, `RingGauge.svelte`                                                                             | Progress, status and dev lab                     | ASCII art and ring gauges; remove                                                                    |
| `decor/gen/Generator.svelte`, `PhotoSlot.svelte`, all canvas generators                                              | Above compositions and dev lab                   | Generated decorative charts/images; remove                                                           |
| `decor/RunIn.svelte`                                                                                                 | Lesson header                                    | Old decorative run-in; remove                                                                        |
| `decor/DecorLab.svelte`, `GeneratorLab.svelte`                                                                       | Development `#/decor-lab`                        | Previous device gallery; remove                                                                      |
| `ui/GradientMapImage.svelte`                                                                                         | Old home photo                                   | Photo-only adapter, remove with its sole use                                                         |
| `visual/pokerScene.ts` / Pixi table layer                                                                            | Active table                                     | Decorative rendering behind real cards; suppress visually through CSS; do not edit renderer or game  |

Legacy `Hairlines`, `Chevrons`, `GhostWord`, `Masthead`, `MicroBlock`, `Stripes`, `Swoosh`, `MotionPhoto`, `ThumbStack`, `IssueNumber`, and `CourseRunIn` remain as unused files from older passes. They will also be deleted so banned devices are not left as a dormant second design system.

### Protected behavior and blocked changes

- Engine, probability/equity math, workers, lesson content, router, navigation state, stores/storage, tests and public application signatures remain unchanged. The existing 173-file hash inventory is checked after each phase; its font/config entries may only change if explicitly allowed by this newer presentation brief, with every exception listed here.
- A cross-application overall accuracy and a session-hands counter do not exist as selectors. The design must not invent them. The status rail will label the existing lifetime hand count accurately. Existing quiz scores and stats stay in their original content.
- The requested new keyboard 1–4 behavior can only be added if already supported by a drill. New input handlers would change behavior and are out of scope.
- References are missing, so the reference-match item in the final review must remain unresolved.

## Phase 1 — removal

Removed the old device components, generators, associated styles/fonts, old artwork and obsolete review assets. Useful home navigation remains as ordinary links/buttons. The original data charts and interactive range tools remain. The real-data status readouts remain; fake window paths, FPS telemetry and workspace polybar are gone. Pixi decoration is hidden through presentation CSS; its implementation remains unchanged.

## Phase 2 — tokens

All new palette, type, spacing and grid tokens are in `src/styles/tokens.css`. Latin Archivo variable (width 62.5–125, weight 100–900) and IBM Plex Mono 400/500 are self-hosted: 119,700 bytes total. The optional LED font is omitted. Font resources and licenses are assets supporting that single token file; the required contrast verifier lives in `scripts/contrast-check.mjs`.

Contrast exposes two conflicts in the brief: ink-4 on ink-0 is only 2.35:1, so it cannot be the sole essential control boundary. Essential input boundaries use text color; decorative rules retain ink-2/ink-4. Ink-3 is also too dim for meaningful masthead text, so mastheads use ink-5. Body text is never placed on ink-4/ink-5 fills (text on ink-4 is only 4.45:1). These exceptions preserve AA rather than changing the supplied colors.

## Phase 3 — shell

The top rail uses the five numbered sections. The shell is left-anchored on a 12-column grid; the existing course contents occupy columns 1–2 on course pages. Other pages get an index built from existing tool/drill links or visible section headings. Mobile indices scroll horizontally; the existing course-contents disclosure retains its behavior.

The 28px status rail shows current route code, existing lifetime hands, chips, XP and local time. No overall accuracy, session-only count, or streak is fabricated. Side-index buttons only scroll existing headings; cloned tool links use their existing URLs. No application state or routing is changed.
