Original prompt: Build a classic Snake game in this repo.

- Initialized repo scan: only .git exists.
- Decided to create a minimal static web app with no external dependencies.
- Will implement deterministic Snake core logic in a standalone module and add Node built-in tests.

- Added minimal static app scaffold: index.html, styles.css, src/main.js, src/snake-core.js.
- Implemented deterministic core logic: direction resolution, movement, growth, food placement, wall/self collision, win/game-over states.
- Added keyboard + on-screen controls, pause toggle, restart flow, score/status display.
- Exposed window.render_game_to_text and window.advanceTime(ms) for deterministic automation support.
- Added Node built-in tests in test/snake-core.test.js for movement, collisions, growth, food placement, and reverse-direction behavior.

- Ran `npm test`: 5/5 tests passed.
- Attempted Playwright validation via skill client; blocked because `playwright` package is not installed in this repo/environment.
- Started local server successfully (required escalated permission due sandbox port bind restrictions), then stopped it after automation attempt.
- Remaining TODO: optional manual browser validation for controls and visual checks.

- New request: add a practice level for simple words.
- Added `practice.level` (`chars`/`words`) in `src/main.js`.
- Added `SIMPLE_WORDS` list with beginner Japanese words and Swedish meanings.
- Updated `startPracticeSession()` to create dedicated word sessions when level=`words`.
- Added word question builder (`buildWordQuestions` + `createWordQuestion`) with 4-choice meaning options.
- Updated practice UI with level toggle buttons and word-level instructional text.
- Updated session question rendering to show Japanese word + romaji for word mode and reuse sound replay.
- Kept existing character SRS progress logic untouched; word answers do not alter kana level data.
- Ran syntax check: `node --check src/main.js` (pass).
- Ran unit tests: `npm test` (7/7 pass).
- Tried Playwright skill loop again after change, but it still fails with `ERR_MODULE_NOT_FOUND` for package `playwright` from `$CODEX_HOME/skills/develop-web-game/scripts/web_game_playwright_client.js`.
