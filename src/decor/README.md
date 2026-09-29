# Second visual pass

Distinct, poker-native spreads share the dark violet palette and window chrome. Home now has one knockout masthead, three different thumbnail treatments, functional thumbnail navigation, and a collapsed course index below the hero. The table and reading columns keep clear space.

## Page treatments

| Page     | Generated imagery                                                                            | Type device                                 | Accent beyond violet       |
| -------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------- |
| Home     | Halftone slot 01; thumbnail Dither slot 02, RangeMatrix dots, SlitScan slot 03               | Knockout masthead                           | Sodium                     |
| Play     | DeckGrid of your visible cards; barcode of your hand                                         | Text on an arc outside the table            | Signal                     |
| Course   | Seeded Distribution per chapter, alternating area, bars and scope; at most two visible plots | Vertical chapter numbers, echoed titles     | Lime                       |
| Lesson   | NoiseField contours inside the title                                                         | Image-filled title                          | Frost                      |
| Drills   | Dither slot 02 and ASCII slot 05                                                             | Misregistered glow/violet title             | Glow; sodium caution strip |
| Tools    | 2,400 independent showdown dots; exact Distribution scope curve                              | Outline masthead                            | Signal                     |
| Progress | Stats barcode; saved starting-hand RangeMatrix when validated histories exist                | Existing heading with Fetch block and rings | Ultraviolet                |

The page decor files document their layer stacks. Image masks, cut corners, screen blends, a knockout SVG mask and overprinted type supply the compositing. Rules align with a 12-column grid. Decoration is removed or reduced when space is tight; callouts require a visible target and a safe outside gutter.

## Images and data

All ten generators live in [gen/](gen/). They rasterize on demand into cached PNGs; the cache key includes seed, dimensions, variant and input data. Resolution is capped at DPR 2, with a bounded 80-entry raster cache. Scrolling does not rerasterize images. No generator uses a per-frame drawing loop.

- RangeMatrix uses the existing 169 hand classes and exact combination counts: 1,326 possible two-card hands. This is frequency, **not estimated equity**. Recorded-progress matrices instead show counts from saved hands already validated by the stats worker.
- DeckGrid receives only the player's cards and public board. Active-hand seeds remain unrevealed.
- Distribution calls existing pure binomial, hypergeometric and outs helpers. Chapter seeds and curve families vary independently of application state.
- MonteCarloScatter uses an isolated decor RNG and the existing pure evaluator for 2,400 random two-player showdowns. It does not consume game randomness or represent the current hand's equity.
- Halftone uses a rotated 30-degree dot screen. Dither uses a Bayer 4×4 threshold matrix. SlitScan, ASCII, flow/contour noise and string-based visual barcodes complete the image system. Barcodes are Code-128-style graphic marks, not scannable encodings.

Supply your own photos at these paths. Each missing file falls back to its own generator; no slot borrows another photo. Reload after adding/replacing an image because successful and missing loads are cached for the page lifetime.

| Photo               | Treatment              | Missing-file source |
| ------------------- | ---------------------- | ------------------- |
| `public/art/01.jpg` | Halftone               | Contour field       |
| `public/art/02.jpg` | Bayer dither           | Area distribution   |
| `public/art/03.jpg` | Slit scan              | Flow field          |
| `public/art/04.jpg` | Horizontal motion blur | Showdown scatter    |
| `public/art/05.jpg` | ASCII                  | Hand-class matrix   |
| `public/art/06.jpg` | Duotone                | Bar distribution    |

The screenshots use these generated fallbacks. The previous repeated club photo is no longer used by the new compositions.

## Interaction and isolation

Artwork is `aria-hidden` and ignores pointer input. The explicitly requested thumbnail links/buttons, course-index disclosure and development preview controls are accessible UI around that artwork. Thumbnail table buttons call the existing `onplay` callback; links use existing hash routes. No application handler, store or route was changed.

The displayed site name and document title use [SITE_NAME](site.ts). The existing home link and home heading retain their legacy accessible names to preserve the protected labels and existing test queries. All visible brand text reads “contemporary.” The app remains Svelte, with no React runtime.

Readouts and rings only read existing profile/progress parsers. The XP ring's next hundred is a display scale, not a new level or award. Lesson completion uses the actual lesson count. Historical class counts replay isolated saved deals with an existing pure function; they never modify the active game or stored histories. The optional matrix is omitted when recorded data is unavailable.

Callouts observe existing DOM text and bounds with ResizeObserver. They display actual equity/sample counts, pot-odds calculations and individual worked numbers. They hide below 1700px or when targets are offscreen, clipped or lack a safe gutter. The lab has a standalone callout example.

The development-only `/#/decor-lab` includes all ten generators with seed/variant controls, six photo slots, nine type devices, rulers, crop marks, stickers, caution tape, callouts, rings, Fetch and window chrome. Selection stays inside decor; the original router remains untouched. The lab is excluded from production builds.

## Verification

Seven phase commits follow the requested sequence. Each phase passed the existing 107 tests, typecheck and lint before commit. Failed drafts were rolled back and corrected in decor/styles; the existing tests were not edited.

- [173 protected files](LOGIC-LOCK.md) remain byte-for-byte identical to baseline `65619d107c2c7ec466a175147ff9283bb7829cdb`.
- All 92 original non-decor Svelte scripts retain their application code, excluding decor imports. A Svelte AST audit preserves attributes and source order for 106 existing interactive/queryable elements in changed page files.
- Production build and all 40 existing desktop/phone browser tests passed, including active-table home navigation, course progress, gameplay, tools and quizzes.
- Dedicated browser checks cover thumbnail artwork clicks, keyboard six-max entry, disclosure navigation, saved-hand graphics, storage isolation in the lab, missing-photo fallbacks, cache reuse and DPR limits.
- Screenshots check 1440px and 375px layouts. Additional 768px, 1024px and 1920px route checks report no horizontal overflow. The existing 1280px browser suite also covers transitions between home and lessons.
- axe-core WCAG A/AA checks cover real content on home, course, lesson, drills, tools and progress at both screenshot widths, with no violations. Decorative `aria-hidden` art is excluded; this automated scan is not a full manual accessibility audit.
- Reduced motion disables animation. Tickers pause offscreen; home layers reuse the existing parallax action/config. No new backdrop filters were added. A three-second sample measured 181 frames, 16.63ms average frame time and 16.80ms maximum; headless measurements describe this machine, not every device.

Review evidence: [source audit](review/source-audit.txt), [layout](review/layout-audit.json), [functional and cache checks](review/functional-audit.json), [accessibility](review/accessibility-audit.json), [motion and variants](review/motion-audit.json), [callouts](review/callout-audit.json), [phase checks](review/checks.txt), and [git diff --stat](review/diff-stat.txt).

## Screenshots

| Page             | 1440px                                          | 375px                                        |
| ---------------- | ----------------------------------------------- | -------------------------------------------- |
| Home             | [Desktop](review/home-1440.png)                 | [Phone](review/home-375.png)                 |
| Six-player table | [Desktop](review/play-1440.png)                 | [Phone](review/play-375.png)                 |
| Course           | [Desktop](review/course-1440.png)               | [Phone](review/course-375.png)               |
| Lesson           | [Desktop](review/lesson-1440.png)               | [Phone](review/lesson-375.png)               |
| Drills           | [Desktop](review/drills-1440.png)               | [Phone](review/drills-375.png)               |
| Tools            | [Desktop](review/tools-1440.png)                | [Phone](review/tools-375.png)                |
| Progress         | [Desktop](review/progress-1440.png)             | [Phone](review/progress-375.png)             |
| Decor lab        | [Desktop, full page](review/decor-lab-1440.png) | [Phone, full page](review/decor-lab-375.png) |

[Chapter-row detail](review/course-index-1440.png). Captures use reduced motion; progress shows one hand completed through the existing game controls in an isolated browser profile.
