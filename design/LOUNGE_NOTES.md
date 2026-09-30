# Gen X Soft Club / Ambient Lounge

Baseline: `bcdf28d0c5bd332f957b0e2e8ba4781495b17260`. The user's latest reference images and explicit soft-club brief determine this pass. The rejected generated portrait is removed from the project, manifest, style URLs and review screenshots. No new character or replacement artwork is generated.

## Composition and implementation

The supplied lounge collage contributes the airport-seat region as a cropped, hazy background and the existing lobby image plate. The supplied flat 2D drawing appears as a large, faint screened ink silhouette inside the existing aria-hidden atmosphere. It is quieter on lesson pages and mobile, and hidden with reduced transparency/forced colors. The original source images are retained as format-only AVIF/WebP exports; CSS supplies the crop/tone treatments.

The palette is deep slate/muted navy with icy off-white text, cool gray secondary text, silver borders and desaturated blue highlights. Pale buttons have dark text. No hot pink, magenta, purple-city imagery or neon accent is introduced. Warm colors remain only for existing error/warning/success semantics. The existing Blue/Violet Display controls remain functional token-based variants; neither palette becomes saturated cyberpunk.

Michroma supplies wide, restrained technical headings; Outfit supplies reading and controls; Plex remains for aligned figures. New fonts are self-hosted Latin subsets with licenses and font-display swap; only the display font is preloaded. The existing grid, source order, labels, text content and interactive attributes stay intact. No React, Tailwind or other runtime dependency is added.

Existing SVG card assets receive opaque pale frosted faces and dark ink suits for instant legibility. Two-color mode retains its two groups; four-color mode uses muted red, blue, green and slate. Only color literals change: all rank/suit shapes, geometry, filenames and the protected asset selector remain untouched. Fully opaque faces are retained to keep the art from interfering with ranks.

## Effects and contrast

Desktop content panels use static 12px backdrop blur. Mobile content panels use translucent fills without blur; shared thin chrome retains live blur. The request's all-panel glass direction supersedes the earlier three-surface cap on desktop. Counts include mounted offscreen course chapters, not all simultaneously visible areas. Blanket will-change/translateZ promotion and hover blur animation are deliberately avoided; no extra perpetual animation is introduced.

Reading surfaces use 88% fill rather than the suggested 40% so secondary text remains legible against the artwork. The checker conservatively starts with a white photo pixel, applies the full-screen veil, both light sources and a white character pixel at peak opacity, then composites glass and both tint peaks. It checks all text tokens, unpanelled body text, headings, pale action labels, focus and card inks. Existing thresholds remain unchanged.

Reduced motion removes loops and transitions. Reduced transparency/increased contrast makes reading surfaces solid and hides the character layer. Forced colors removes both artwork layers and restores system text/borders. Artwork stays aria-hidden and pointer-inert inside the existing atmosphere/plate; no new state, game event or decorative text is added.

## Verification

All 173 protected files remain frozen. The full unit/browser suites, typecheck, lint, production build and contrast script are run for this phase. Protected-file hashes and card-geometry comparison are recorded in `lounge-protected-audit.json`. Browser measurements and captures are in `lounge-audit.json` and `shots/lounge/`: six routes at 1440 and 390, active table at both widths, plus reduced-effects Play. Existing tests and screenshots are not modified; test-suite documentation screenshots are suppressed externally and captured separately for this pass.

The optional Firefox capture is skipped if Playwright Firefox is absent. Existing evaluator/simulation benchmark figures are unchanged and are not rerun for presentation-only work. No medical or eye-strain outcome is claimed.

## Final measured results

- Unit tests: 116 passed across 24 files. Browser tests: 46 passed across desktop and phone, including tournament timing and course examples. Typecheck, lint, production build and contrast checks passed.
- Lowest new glass/text contrast: 4.60:1 (Blue secondary text). Lowest pale-action contrast, including its shaded gradient endpoint: 5.01:1. Lowest card ink contrast: 5.32:1. Large heading checks: at least 3.57:1. Thresholds are unchanged.
- All 173 protected hashes match the baseline. All 105 card SVGs match baseline structure after removing color literals.
- Six routes at both widths have no horizontal overflow or decorative accessibility violations. Fifteen screenshots include the active table at both widths and reduced-effects Play.
- No task over 50 ms was observed during either three-second Play sample (lobby and active table). These short samples do not establish a universal frame-rate guarantee.
- Reduced effects: zero loops, no backdrop blur, plate overlays disabled. Forced colors hides the atmosphere/plate and uses system title colors. Playwright Firefox is unavailable, so its optional capture is skipped.

| Page     | Retained scene / plate                 | Heading finish | Mounted desktop blur surfaces | Mobile blur surfaces | Loops |
| -------- | -------------------------------------- | -------------- | ----------------------------: | -------------------: | ----: |
| Play     | terminal / supplied airport-seat photo | icy silver     |                             5 |                    2 |     1 |
| Course   | study / quiet header strip             | icy silver     |                            30 |                    2 |     1 |
| Lesson   | study-quiet / quiet header strip       | pale blue      |                            11 |                    2 |     1 |
| Drills   | tunnel / light-row header strip        | pale blue      |                             5 |                    2 |     2 |
| Tools    | skyline / horizon header strip         | icy silver     |                             6 |                    2 |     1 |
| Progress | nightwindow / soft bokeh header strip  | icy silver     |                             7 |                    2 |     1 |

All pages use slate/ice/silver atmosphere tokens. Counts include offscreen mounted panels; opening Display adds one blur surface. Every route has zero WebGL canvases and zero SVG text filters. No new decorative DOM node was added: the supplied drawing reuses the existing hidden atmosphere mesh element (A); new photo/veil pseudo-elements belong to Atmosphere (A); material pseudo-elements belong to existing surfaces (B); the supplied plate replaces the existing photo slot (C). No banned diagram, barcode, ASCII art, ring, ruler, sticker, badge, logo, fake data or halftone band was added.

The grid, oversized-title crop behavior, plate slots and mobile navigation scroll behavior are preserved. Desktop blur follows the latest all-panel glass request rather than the earlier three-surface limit; the course contains many mounted chapter surfaces. Mobile avoids those extra panel filters.

Captures: `design/shots/lounge/{play,course,lesson,drills,tools,progress}-{1440,390}.png`, `table-{1440,390}.png`, and `play-1440-reduced.png`.
