# Visual redesign review

A dark violet editorial layer: cropped type, blurred photography, registration lines, ghost words, tiny annotations, and window chrome. The reading column and table retain clear space.

## Scope and verification

- Seven separate phase commits: tokens/fonts, primitives, home, play, course/lessons, drills/tools/progress, global status/window chrome.
- Each phase passed `npm test` (107 tests), `npm run typecheck`, and `npm run lint` before its commit. Failed draft checks were rolled back and corrected solely in decor. No tests were edited.
- Production build passed. The existing browser suite passed all 40 phone/desktop tests.
- All [173 protected files](LOGIC-LOCK.md) remain byte-for-byte identical to the starting commit. Existing page scripts retain their original code, with decor imports added.
- A Svelte AST audit confirms all 113 existing interactive/queryable elements retain their attributes and source order. The one excluded attribute is the course search placeholder, explicitly requested as `❯ try outs or 1.1`.
- Screenshot checks at 1440px and 375px: no horizontal overflow, no focusable controls in hidden decor, and no running animations with reduced motion. The live bottom bar is 26px tall.
- axe-core WCAG A/AA scans of home, course, lesson, progress, tools, and drills at both widths found no violations in real content. The intentionally faint, `aria-hidden` decorative lettering and ASCII art are excluded from contrast checks.
- A three-second headless Chromium sample of the animated home page measured 181 frames, 16.66ms average frame time (about 60fps), and 16.80ms maximum frame time. This is a measurement on this machine, not a guarantee for every device. Offscreen chevrons paused, the route wipe finished after 250ms, and additional 768px/1024px/1920px checks found no horizontal overflow.
- Home-logo navigation back from an active table was verified at both widths.
- No React runtime was added. The application remains Svelte; the existing test tooling has a transitive `react-is` utility.

## Requested exceptions and isolation

Workspace links are normal, accessible hash links, as explicitly requested. They are the only interactive additions; they have no event handlers. Decorative status readouts are hidden from accessibility APIs and ignore pointer input. Window wrappers leave their existing children accessible and interactive; only their title-bar chrome is hidden.

The development-only `/#/decor-lab` preview is selected inside `DecorShell`, around the existing route component. No router file or route table was changed. Its dynamic import is removed from the production build. Production URLs retain their existing behavior.

Live readouts use existing profile/progress parsers and XP selectors. They never write storage, dispatch, or call state-mutating APIs. FPS is local animation telemetry; the clock is local browser time. The progress-page Fetch header takes a read-only snapshot on entry.

Motion reuses the existing parallax action/config. New continuous animations change only transform and opacity, pause through IntersectionObserver, and stop under reduced motion. The decorative route wipe lasts 250ms. The light arc uses feathered radial bands instead of a large animated blur. The existing grain uses a cached normal overlay to avoid repeated backdrop blending. No backdrop filters were added; the existing card-picker dialog backdrop remains the only such effect.

The existing accessible `--haze` value is preserved. The new photographic `--cobalt` is scoped to photo/swoosh decor so the old game palette alias stays intact. Sodium and lime are limited to small editorial type. The original Syncopate logo stays in place; Michroma and Inter Tight are locally hosted with their OFL licenses.

## Screenshots

| Page                    | 1440px                                          | 375px                                        |
| ----------------------- | ----------------------------------------------- | -------------------------------------------- |
| Home                    | [Desktop](review/home-1440.png)                 | [Phone](review/home-375.png)                 |
| Active six-player table | [Desktop](review/play-1440.png)                 | [Phone](review/play-375.png)                 |
| Course                  | [Desktop](review/course-1440.png)               | [Phone](review/course-375.png)               |
| Lesson 1.1              | [Desktop](review/lesson-1440.png)               | [Phone](review/lesson-375.png)               |
| Progress                | [Desktop](review/progress-1440.png)             | [Phone](review/progress-375.png)             |
| Decor laboratory        | [Desktop, full page](review/decor-lab-1440.png) | [Phone, full page](review/decor-lab-375.png) |

[Chapter-index detail](review/course-index-1440.png). Screenshots use reduced motion for reproducible capture. The lab's inline status-bar specimen can wrap within its sample window; the global bar remains fixed at 26px.

## Replaceable artwork and copy

- Photo placeholder: [`public/art/club-overpass.png`](../../public/art/club-overpass.png). Replace it with your own photo. The thumbnail rail uses three crops of the same placeholder.
- Decorative micro-copy: [`copy.ts`](copy.ts).
- Type, colors, textures, responsive composition: [`src/styles/`](../styles/).
- Photo generated with the built-in image-generation tool using the imagegen skill, not the CLI. No image edits were made with Python.

Generation prompt:

> Use case: photorealistic-natural. Asset: replaceable photographic background for a dark violet late-1990s design magazine / soft club website. A wide horizontal grayscale photograph of a futuristic empty concrete pedestrian overpass and curving elevated road at night, viewed from below at a diagonal, sweeping steel railings, long-exposure white light ribbons and blurred architectural columns. Heavy horizontal camera-motion blur, soft double-exposure, coarse film texture, cool gray silver highlights and deep near-black shadows, moody analog magazine photograph, quietly abstract but clearly photographic architecture. Composition has a dark left third for interface text, brightest architectural detail on right half. No text, typography, logos, people, cards, or interface elements. Wide landscape 3:2 composition.
