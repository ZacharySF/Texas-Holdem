# Display, chips and artwork refinements

- The supplied line art has its own home column (stacked on mobile), with the complete drawing visible and controls clear of it.
- An SVG luminance-to-alpha filter removes its paper background, tints the ink with the text token, and clips to source alpha. Screen blending belongs to the parallax wrapper, preserving transparent white line art in Firefox and Chromium.
- The lounge photo opens Display settings by click or keyboard. Settings moved from the top rail to a small footer dock so other routes retain access.
- Nine persistent themes: Violet, Blue, Grey, Dark, Darker, Green, Anime, Amber, Ocean. Surprise me chooses another. Original artwork is retained in all themes.
- F toggles practice fullscreen, excluding editable fields, open settings, modifier shortcuts and key repeats. The hand stays mounted.
- Every player has themed denomination piles beside their cards; pot piles follow the live total. Piles are compressed to at most eight visible discs per denomination; existing numbers remain exact.
- Two drifting star fields and pointer parallax exist only in the expanded practice terminal. Hidden documents pause drift; reduced motion stops drift/parallax. The site background is unchanged by this effect.
- Last decision's existing computed assessment and next-hand reset are covered by new browser tests; grading logic is unchanged.
- Directly importing compact CSS from Foundation and restarting the affected Vite process fixed the stale missing-stylesheet error. Dev checks return HTTP 200 with no error overlay.

## Files

Added: `src/lib/{ChipStack,DisplayPlate,FullscreenStars,LoungeArtwork}.svelte`, `src/lib/themes.ts`, `src/styles/{theme-options,lounge-refinements,fullscreen-terminal}.css`, `e2e/{display-plate,theme-chips}.spec.ts`, audit JSON and screenshots here.

Modified: `src/App.svelte`, `src/decor/Foundation.svelte`, `src/features/play/{Home,Table}.svelte`, `src/lib/PlayViewport.svelte`, `src/lib/softclub/Atmosphere.svelte`, `src/styles/decor.css`, `scripts/lounge-contrast.mjs`, README and architecture/roadmap documentation.

The original 173 protected files match their recorded SHA-256 hashes. No engine, probability, lesson, router, store, original test or runtime dependency changes. Theme selection changes are confined to App's existing display UI.

## Verification

Geometry audit: all six chip piles remain beside their cards and inside their seats at 1440, 1024 and 390 pixels; no horizontal overflow. Heads-up seats and board occupy separate areas.

Contrast passes all nine themes with unchanged thresholds. Worst-case glass/dim-text ratios: Violet 5.13, Blue 4.60, Grey 6.05, Dark 7.29, Darker 7.55, Green 6.95, Anime 6.59, Amber 6.68, Ocean 6.82 (AA requires 4.5).

The three-second fullscreen idle sample recorded no main-thread long tasks over 50 ms (`terminal-performance.json`). Engine benchmarks were not rerun. No new canvas or backdrop blur; two fullscreen-only CSS animation loops.

Screenshots: `shots/refinements/play-{1440,390}.png`, `display-{1440,390}.png`, `table-{1440,1024,390}.png`, `fullscreen-1440.png`, `play-firefox-1440.png`. Firefox was checked using its native headless screenshot command; the automated Playwright suite uses Chromium.

Final checks: 116 unit tests and 70 browser tests passed; typecheck reported zero errors/warnings; lint, production build and all contrast checks passed. No protected files changed. The final browser suite includes the heads-up spacing and transparent-artwork corrections.
