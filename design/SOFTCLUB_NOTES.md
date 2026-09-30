# Additive soft-club presentation

Baseline: `84f73862ceb996429a2b698f6d6700ffeab38c4e`. The previous pot-odds/tournament feature is part of this baseline. The 173 historical protected paths are checked against this task's starting bytes, not against the older visual audit's baseline. See `softclub-protected-audit.json` for the current hashes.

## Placement and scope

Only Play has a full-size hero slot. Its existing image is replaced with a terminal field, with its caption slot preserved. Course's existing compact thumbnail slots remain compact. Course, lesson, drills, tools and progress receive 24px material strips inside the masthead's existing 27px bottom padding. This intentionally avoids new page rows, movement of headings, or changes to the grid. Larger hero plates on those pages require relaxing the no-layout-change constraint.

Route URLs remain `/play`, `/learn`, `/learn/12-2`, `/arcade`, `/lab`, `/stats`. The atmosphere reads the hash and also understands the requested display-name aliases; it never writes a hash or touches the router. Titles, labels, navigation, Display choices, status data, game controls, lessons and storage remain unchanged. The Play scene also covers the existing tournament screen, without adding coaching or practice stats.

The new layer uses no runtime dependency, canvas, WebGL, fake data, independent decorative objects or text-on-path. Existing card faces and four-color suits remain intact. The scene backgrounds, bevels and reflections use only soft-club color tokens. Blue overrides those tokens using the application's existing blue steps.

## Decorative-node inventory

- A: `Atmosphere.svelte` root; base, light, haze and mesh divs; haze band and preset streak i elements. The sole loop is a transform drift, paused while the document is hidden.
- C: `Plate.svelte` in the existing Play image slot. Its procedural children, photo picture/source/img, hidden SVG filter definitions, tint, photo ghost and jewel highlight all belong to that slot.
- B: the same Plate in existing course thumbnail slots and masthead padding. `TerminalLight.svelte` supplies the exposure spans/i elements, mesh and streaks, plus a mirrored field inside the existing plate. Other plate branches contain tunnel spans, study SVG filter primitives/rect and crosshair span, skyline spans/tower i elements, or bokeh span/i elements and flutes. Every new node has `aria-hidden="true"`, no tab stop and inherited/explicit pointer-events none.
- B: empty pseudo-elements supply gel sheen, acrylic sheen, the index spine line and the plate hinge. No pseudo-element inserts words, numbers or symbols. Existing decorative captions are retained; no new visible data/labels are invented.

## Protection and deliberate omissions

- Skipped (protected): native View Transition transaction would require protected router changes. Route swaps retain their existing behavior.
- Skipped (protected): Pixi denomination-chip/deal-state rendering is not modified. Existing DOM cards receive acrylic materials; the existing pot readout receives LCD treatment. No denomination colors or deal hooks are invented.
- No optional shader package was added. No photos were supplied; procedural fields are complete fallbacks. `prepare-softclub-plate.py` is an offline Pillow utility, not an application dependency. It was exercised with an existing local artwork file; generated validation files were removed after verifying format, dimensions and byte caps.
- Full-size hero slots outside Play are omitted under the grid/structure constraint. Header strips are materially smaller than the supplied hero wireframes.
- No standalone status LED or ghost digits were added, since the existing rail has neither. No fake metrics were added.

## Accessibility and effect limits

The glass uses 98% fill rather than the example 80%, with a 2% top highlight, to retain small red text contrast. The checker composites conservative overlapping sodium, key and cyan sources before applying the fill and highlight. Thresholds remain 4.5 for small text and 3 for large text/UI. Chrome stops and the glass-title stroke are checked separately. The stroke is 85% frost to remain legible. Button labels are checked at the brightest combined hover sheen.

Reduced motion removes every new animation and interaction sweep. Reduced transparency or increased contrast makes live glass solid and removes plate overlays. Forced colors hides Atmosphere/Plate and restores system backgrounds, text and borders. The Display menu is above mastheads despite the new backdrop-filter stacking context. Focus rings remain outside button glow. Neither dimensions nor font sizes change.

Only the top rail and Display popover have live backdrop blur (14px); the menu disables it on very short viewports. There are no SVG text filters or animated filter/blend layers. Loops are atmosphere drift (one) and the visible tunnel plane (one extra only on Drills), paused for hidden documents and offscreen plates. Mobile atmosphere mesh and plate LED mesh are off. Terminal streak sources total six desktop and three mobile, including the plate; reflection repeats the same source field. All new plate pixels are clipped to their existing slot.

## Validation and screenshots

Each phase runs the unchanged unit suite, typecheck, lint, production build, contrast script and full desktop/phone browser suite. Browser-test screenshot calls are suppressed externally during these runs to honor the user's capture cap; test assertions and repository test files are untouched. Deliverable screenshots are captured separately only in phases 2 and 4.

Phase 2: `shots/softclub/phase-2/play-{1440,390}.png`.
Phase 4: `shots/softclub/phase-4/{play,course,lesson,drills,tools,progress}-{1440,390}.png`, plus `play-1440-reduced.png`. Optional Firefox capture is made only if Playwright's Firefox is installed. Browser measurements (both theme tokens, effect counts, overflow, decorative inertness, reduced preferences, forced colors and a three-second Play idle long-task sample) are recorded in `softclub-phase-4-audit.json`.

No game/evaluator/simulation benchmark changed or was rerun. No reference files or user photos are present in `design/refs/` or `design/photos/`.

## Final measured results

All four phases pass 116 unit tests, 46 desktop/phone browser tests, typecheck (zero Svelte diagnostics), lint, production build and contrast checks. Original test/snapshot files and all 173 protected paths remain unchanged. The edited application scripts are unchanged except the additional presentational import in Learn. `softclub-validation.json` records the phase results.

Glass contrast, Violet / Blue: body 9.32 / 9.27; cyan 15.46 / 15.38; red 4.61 / 4.59; orange 8.05 / 8.01; lime 9.81 / 9.77. Every pair passes 4.5:1. The minimum chrome stop is 3.44:1 and the outline stroke is 7.64:1, both passing 3:1. Unselected hover labels reach a minimum 4.78:1; selected hover labels reach 5.81:1.

Every captured route has one primary plate/strip, zero WebGL canvases, zero SVG text filters, one live-glass surface (two with Display open), and one looping animation. Drills has a second loop for the visible tunnel plane. Animated targets have no filter or blend mode. No overflow or non-inert decorative node was found at either width. Mobile mesh is off; reduced motion/transparency yields zero loops, no backdrop blur and no plate overlays. Forced colors hides both atmosphere and plate. No long task over 50ms occurred in the three-second Play idle sample.

Fifteen screenshots were saved: two in phase 2, twelve route/width captures in phase 4, and the combined reduced-effects capture. Playwright Firefox is not installed; its optional screenshot was skipped. No banned object was added. The remaining visual compromise is the small header treatment on pages without an existing full-size plate slot.

| Page     | Scene       | Masthead | Plate material                   | Scene light accents | WebGL / live glass max / SVG text filters / loops |
| -------- | ----------- | -------- | -------------------------------- | ------------------- | ------------------------------------------------- |
| Play     | terminal    | chrome   | split exposure + reflected field | sodium, cyan        | 0 / 2 / 0 / 1                                     |
| Course   | study       | glass    | motion-blurred header strip      | frost, cyan         | 0 / 2 / 0 / 1                                     |
| Lesson   | study-quiet | glow     | quiet study header strip         | frost, cyan         | 0 / 2 / 0 / 1                                     |
| Drills   | tunnel      | glow     | perspective-light header strip   | cyan, red           | 0 / 2 / 0 / 2                                     |
| Tools    | skyline     | glass    | cropped skyline header strip     | cobalt, frost       | 0 / 2 / 0 / 1                                     |
| Progress | nightwindow | chrome   | fluted-bokeh header strip        | lime, sodium        | 0 / 2 / 0 / 1                                     |

These accents describe new scene lighting. Existing semantic deck, focus, success and error colors remain unchanged. For exact file additions/modifications and totals, see `softclub-change-stat.txt`.
