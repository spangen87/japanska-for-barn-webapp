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

- Follow-up request: also add simple words under "Lär dig", unlocked per alphabet when all groups are completed.
- Added learn-unit support (`group`/`words`) in learn state and actions.
- Added katakana word list for the learn word lesson.
- Added locked "Enkla ord" card in learn group grid; unlock condition is all groups completed for current alphabet.
- Added word-learning card flow (word, romaji, meaning, speak) and word-specific mini quiz in Learn view.
- Added completion flag for word lesson per alphabet (`completedWordLessons`) when quiz score is >= 80%.
- Updated Learn quiz result text/button labels to be context-aware for word lesson vs group lesson.
- Re-ran checks after changes: `node --check src/main.js` and `npm test` (7/7 pass).

- New request: split word lesson into smaller groups and add Japanese greeting on app entry.
- Updated initial app view to `intro` and added intro screen with Japanese greeting `こんにちは` plus start button.
- Added word grouping logic in Learn (`WORD_GROUP_SIZE = 4`) and split each alphabet's 12 words into 3 groups.
- Replaced single "Enkla ord" card with sequentially unlocked `Ordgrupp` cards (4 words each).
- Added `learn.wordGroupIndex` and changed word quiz completion tracking to per-word-group arrays in `completedWordLessons`.
- Updated Learn flow/labels/navigation to use selected word group for cards and quizzes.
- Ran `node --check src/main.js` (pass).
- Ran `npm test` (7/7 pass).
- Skill validation: started local server and ran `$WEB_GAME_CLIENT`; still fails with `ERR_MODULE_NOT_FOUND` for package `playwright`.
- Ensured intro view appears on each app load by overriding loaded state view to `intro` in `loadState()`.
- New request: increase word training content to 10 groups with 5 words each, graded from easier to harder.
- Changed `WORD_GROUP_SIZE` from 4 to 5.
- Expanded `SIMPLE_WORDS` to 50 hiragana words ordered by increasing difficulty.
- Expanded `SIMPLE_WORDS_KATAKANA` to 50 katakana loanwords ordered by increasing difficulty.
- Updated `completedWordLessons` initialization to use `WORD_GROUP_SIZE` dynamically.
- Verified word entry counts: hiragana=50, katakana=50.
- Re-ran checks: `node --check src/main.js` and `npm test` (7/7 pass).
- Validation request: audited kana->romaji mappings and full word lists for correctness.
- Found a pronunciation issue: kana audio was spoken from romaji text for character drills (`shi`, `tsu`, etc.), which can produce incorrect TTS pronunciation.
- Fixed kana audio playback to speak the actual kana character in Learn and Practice sound mode.
- Refined two Swedish meanings for clarity: `ひる` -> `mitt på dagen`, `よる` -> `natt`.
- Re-ran checks: `node --check src/main.js` and `npm test` (7/7 pass).
