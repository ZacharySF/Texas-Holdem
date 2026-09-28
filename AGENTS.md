# Working agreement

neo-gospel teaches probability through a real poker game and reproducible experiments. Learners know fractions and algebra, but are new to probability. Read [SPEC](docs/SPEC.md), [ROADMAP](docs/ROADMAP.md), [CURRICULUM](docs/CURRICULUM.md), and [ARCHITECTURE](docs/ARCHITECTURE.md).

## Commands

- Install: `nvm use && npm ci`
- Dev: `npm run dev`
- Test: `npm test`
- Coverage: `npm run coverage`
- Browser smoke tests: `npm run build && npx playwright install chromium && npm run test:smoke` (set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when using a system browser)
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Benchmarks: `npm run bench`
- Exhaustive seven-card verification: `npm run verify:7card`
- Format: `npm run format`

## Rules

- Implement only the requested phase. Record decisions and tradeoffs in ARCHITECTURE.md.
- Keep the engine pure and tested, without DOM or React. Enforce at least 90% engine coverage.
- No Math.random in logic. Use the seeded PRNG and unbiased bounded integers.
- Never hand-type probabilities in lessons or UI. Every new math claim needs a facts-registry function and a test.
- Lessons use the seven-part template and notebook-style derivations, one step per line without prose in the block.
- Write plainly and concretely. Build probability from basics; introduce notation and statistics when first used.
- Before finishing run lint, typecheck, tests, and build, and fix every failure. Run coverage for engine changes.
- Update ROADMAP checkboxes and README, including unfinished work and measured benchmark changes.
- Do not claim a check ran when it did not. Avoid putting generated dependencies or build output in version control.
