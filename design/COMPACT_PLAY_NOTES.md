# Compact practice and fullscreen

The practice coach remains beside the table at widths of 900px and above. Practice uses the full shell width, with a 272–360px coach column and an independently scrolling coach body. Phones retain the existing coach toggle. Tournament has no coach and is not wrapped by the fullscreen component.

Text changes apply across routes: body/controls 14px, headings 16–18px, page titles 36–72px, lesson titles 30–56px. Existing 11px labels remain readable, betting actions retain 44px minimum targets, and mobile text inputs remain 16px to avoid automatic input zoom. No zoom/transform is applied to the page or card geometry.

`PlayViewport.svelte` keeps the original table, actions, coach, worker and game mounted. It requests browser fullscreen from a user click and supports an expanded-window fallback if the API is missing or denied. Exit fullscreen and Escape restore the view. Background siblings are temporarily inert; scrolling and prior inert values are restored on exit/unmount. Browser fullscreen exits synchronize the button. This component has presentation state only, and never receives the game object.

The existing practice component only gains an import and wrapper; its prior code and markup match after removing that wrapper/import and whitespace. All 173 protected-file hashes remain unchanged. Existing tests were not edited; the new browser file exercises fullscreen, fallback, rejection, hand continuity, keyboard isolation, cleanup, coach placement and tournament isolation.

Screenshots and measurements: `shots/compact-play/`, `compact-play-audit.json`. Code boundary: `compact-play-protected-audit.json`. The active six-player table is captured at 1440, 1024 and 390px, both in-page and fullscreen. Course, lesson, drills, tools and progress also have desktop captures. Mobile coach placement intentionally stacks instead of squeezing beside the cards. Native fullscreen is browser-dependent; the fallback keeps equivalent table controls inside the current window.

## Validation

The final run passed 116 unit tests and all 54 browser tests (27 each at phone and desktop widths), plus typecheck with zero warnings, lint, production build and contrast checks. The added native-fullscreen scroll assertion verifies that the coach stays below the exit toolbar. An initial preview-server connection failure was resolved by restarting the server; a two-pixel sticky-coach overlap was fixed by reducing its maximum height. No tests were weakened or removed.

Final captures show no horizontal overflow at 1440, 1024 or 390px in either normal practice or fullscreen. Native fullscreen, missing API, rejected requests, Escape, focus restoration, inert cleanup, live betting and tournament isolation are covered by the new tests. Browser test documentation screenshots were suppressed externally; the final layout captures are kept separately under `shots/compact-play/`. Existing math/evaluator benchmarks are unchanged.
