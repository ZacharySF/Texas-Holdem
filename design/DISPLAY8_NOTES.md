# Display and practice follow-up

- Display has Done, outside-pointer dismissal and Escape. Done/Escape restore focus to the existing summary. A native checkbox makes the selected deck state visible.
- Anime is labeled Purple; the saved `anime` identifier remains compatible.
- The deck preview reuses the real card component/store. All 26 clubs/diamonds four-color SVG assets now use distinct green/blue ink; ordinary card assets and suit geometry are unchanged. Browser tests compare rendered pixels and verify live table updates and persistence.
- Progress and other non-home routes use transparent white line art through an SVG luminance-to-alpha filter. The existing Play artwork component/filter was not changed. Firefox and Chromium screenshots confirm the paper rectangle is removed.
- Practice has 300 dots and dotted sparkles inside the table, in normal and fullscreen views. Two parallax depths and two slow drift layers are confined to this surface; reduced motion disables movement. The main site background and tournament do not receive stars.
- Fullscreen's exit button and top control row are gone. F/Escape remain, and focus is restored after rendering the normal control. The coach occupies the recovered top space.
- Last decision shows the actual recorded action/street, its saved equity and model gap, and sample count. An action made before analysis has no invented grade. Matching uses the recorded action index; controller scoring is unchanged.
- Small/big blinds are labeled from the existing configuration. The engine already deducts them, rotates the button and uses the correct turn order. Added tests verify both two- and six-player tables.
- Bots already select the highest estimated chip return among their candidate legal moves. Tests cover all personas and all six private player views; no other player's hole cards or future deck appear in those views. The estimator is not a solved GTO strategy and does not model all future bets.
- The practice table now shows opponent cards only in a contested showdown when that opponent has not folded. Post-hand history keeps other cards hidden unless the learner explicitly enables study x-ray.

## Validation

The original 173 protected files remain hash-identical, including engine/math, workers, stores, routing, lessons and original tests. Existing simulation benchmarks were not rerun. New validation uses separate tests; earlier UI tests were updated for the requested removal of fullscreen controls.

Contrast thresholds are unchanged; the new green and blue suit inks pass alongside all nine themes. The three-second fullscreen idle sample recorded no main-thread long tasks above 50 ms (`display8-performance.json`). No dependency was added.

The first browser run lost its existing preview server, producing connection-refused errors. Both project servers were restarted; final checks use the rebuilt application.

Screenshots are in `shots/display8/`: `menu-{1440,390}.png`, `progress-{1440,390}.png`, `progress-firefox-1440.png`, `fullscreen-1440.png`, `regular-table.png`, and `last-decision.png`.

Modified files include App/display themes; practice Table, Play's markup snippet, CoachSidebar, HistoryPanel and PlayViewport; atmosphere, starfield and material styles; 26 four-color SVG assets; contrast ink pairs; new DeckPreview/DecisionReview; documentation and separate regression tests. The protected game algorithms and original lesson text are unchanged.

Final result: 119 unit tests and 78 browser tests passed; typecheck has zero errors/warnings; lint, production build and all contrast checks passed. All 173 protected-file hashes match. The Play artwork component remains identical to the preceding commit.
