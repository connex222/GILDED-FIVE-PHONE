# Gilded Five Premium — implementation change log

Implementation base: attached `GILDED-FIVE.zip` and `GILDED-FIVE-PREMIUM-PLAN.md`.

## 1. Defects and consistency
- Fixed the phone room-code field overflow and host Roll Again label wrapping on small devices.
- Removed duplicate phone button identifier and changed the Triple header wording to Turn.
- Removed duplicate root `index.html` and `assets/`; `public/` is now the only app source.
- Consolidated both previously separate theme CSS files into the respective standalone HTML pages.
- Limited Shake to secure contexts; ordinary Roll always works.
- Added `tests.js` executable with `npm test`.

## 2. Simultaneous Rounds
- Private per-seat dice/held/roll count/selection/locked state is held on the authoritative host.
- Broadcasts strip unrevealed dice and choices; seat-specific state is sent through the new host-to-phone private relay.
- Each phone rolls, holds, chooses, then explicitly locks its score; lock cannot be undone.
- Live TV progress and staggered reveal, lowest score first; optional timer and auto-scored unfinished hands.
- Mirror Roll distributes the same first set of dice to all seats.
- Bot turns auto-play with staggered delays.
- Hand of the Round: +10 points in chipless games or chip pot settlement with tie splits/carry.
- Optional High Stakes early bet on winning the round at 3:1.
- Old sequential/pass-and-play mode is retained for phone-free play.

## 3. Scoring and game design
- Gold fifth die scores +5 on a matching upper box, doubles its own pips in Chance and kind totals, and increases five-of-a-kind to `50 + 5 × face`.
- Gold rules wired into authoritative shared RULES block, host/phone scoring, labels and bot positional holds.
- Upper bonus target changed to 30 in Short (7 turns), or 63 in Full (13 turns).
- Three one-click presets — Classic, Family Night and High Stakes — with Advanced customization.
- Removed Freeze from powers and interface, retaining Re-roll and Nudge.
- Final chip cash-in is 2 points per chip and only the single points ranking selects the winner; High Roller is an award.
- Lucky Sevens now affects eligible lower section totals, never Aces. Remaining eight house-rule behaviours retained.

## 4. Visual and interaction design
- Unified felt green, cream and gold identity with locally drawn SVG crown/dice logo.
- Bundled local serif and sans WOFF2 fonts, with licence notes.
- 3D CSS dice and special gold fifth die, felt rail, host current-hand presentation and race standings. The SVG logo has a crown over five dice (the centre is gold).
- Full host scorecard available on request rather than permanently covering the TV.
- First connected phone is Table Captain, with preset, timer, Mirror Roll, bots and Deal controls; captain can be passed.
- Phone Lock In interaction and per-player score selection, reconnect, Wake Lock and optional HTTPS motion support.
- Synthesised game audio retained and enriched; reduced-motion and phone/TV rules included.
- Replaced remaining award emoji with inline SVG glyphs.

## 5. Server and deployment
- Kept the Node `ws`/`qrcode` relay and existing message formats, adding only targeted private-state routing.
- 30 incoming messages/sec/socket rate guard; `/wake` and `/health` endpoints.
- Font file routes use WOFF2 MIME type and cache headers.
- `README.txt` now covers home setup, Render deployment, presets and test commands.

## 6. Validation and remaining acceptance work
- `npm test`: scoring assertions, privacy invariants and 600,000 cryptographic dice rolls.
- Headless browser simulation: host setup and classic play at 320px, 390px and 1920px; two phone seats rolling and locking privately; eight synthetic phone seats locking and settling a simultaneous round; simultaneous reveal and next-round progression.
- Live Node `ws`/`qrcode` install was not available in this workspace; full Render eight-phone session, reconnection across homes, real-device haptics/motion, QA through end of complete match and rematch remain **unverified**.
- The AI retains scoring-aware hold search, now distinguishes the fifth die's exact position, but is **not** a provably exact two-roll full-state solution with a measured sub-150ms device benchmark. Further strategy/performance QA is recommended.
- 4K TV readability and mixed Android/iOS physical devices need hands-on verification before public release.

Keep the roadmap's unverified items on the launch checklist: test rather than silently assuming success.

## Verification follow-up — 23 October 2026
- Verified the premium commit is live on the connected Render service, with a successful Node start and automatic deployment on `main`.
- Fixed timer auto-lock overwriting a valid player-selected scoring box: it now locks the existing choice unchanged.
- Fixed High Stakes round pot inflation when some seats have no chips: pot contributions now match actual debits.
- Corrected timeout AI to use the active house-rule roll limit (two, three, or four rolls).
- Fixed host-refresh recovery in simultaneous rounds: unfinished dramatic reveals are replayed, already-settled rounds progress without a second payout, and bot timers restart only after an explicit Resume action.
- Prevented expired round timers from scoring in the background behind the Resume confirmation screen.
- Extended the local test suite with guards for these fixes; a headless browser round test is documented separately.
- Full physical eight-phone testing, multi-home reconnection, full-match rematching and end-device benchmarking remain outstanding.
- Added optional repeatable `qa-browser.py` test covering selected-box timeout,
  honest pot accounting, eight-seat private-state simulation and recovered reveal.

## Next quality phase — 23 October 2026
- Added automated real-network HTTP and WebSocket integration coverage for
  eight phones, full-room rejection, host recovery, phone rejoining,
  private-dice isolation, and unauthorized role-switch attempts.
- New `.github/workflows/quality.yml` executes scoring and network tests on
  `main` and pull requests, making these checks repeatable beyond one session.
- Strengthened `server.js` room-code and host-secret generation with Node's
  `crypto.randomInt`, avoiding predictable `Math.random` for credentials.
- Prevented a connected host/phone from switching role or joining a second
  seat on the same WebSocket, which previously left stale room references.
- Added `qa-responsive.py` covering five screen widths and roll-button fit,
  including 320px phones and 4K TV sizes; preserved reduced-motion testing.
- Physical eight-phone/multi-home tests still require a real games-night run.

## Pre-November offline QA and reliability — 23 October 2026
- Ran the current local Node scoring suite; added stronger Short/Triple and
  secure phone-token checks (76 passing checks including 600,000 dice rolls).
- Found and fixed a genuine **Short + Triple** defect: after seven boxes in a
  column, the engine formerly allowed more scores, making a 21-turn game
  continue to 33 turns in an automated case. Every column now closes at 7.
  The shared phone rules and both host/phone scorecards enforce the same cap.
- Fixed Short bonus threshold text (30 instead of 63) and visual completion
  indicators for the seven filled boxes; improved setup/resume descriptions
  of 7, 13, 21 and 39-turn variants.
- Validated saved-state structure before loading; invalid browser settings,
  records or profiles no longer crash setup. Valid saves can still Resume.
- Improved focus/Tab/Escape management for dialog keyboard accessibility.
- Prevented delayed result callbacks from reopening an old result after a
  rematch has already started.
- New phone rejoin credentials now use cryptographically secure Web Crypto
  randomness; existing saved phone tokens continue to work.
- Added `qa-complete.py` browser tests that finish real local Classic, Short,
  Triple, Short Triple and High Stakes game flows and exercise rematch,
  one-winner conversion and results. 26 checks passed locally.
- Added `qa-usability.py` checking keyboard dialogs, saved-game resume and
  malformed browser storage. 22 checks passed locally.
- Re-ran the existing 36 responsive checks and private eight-seat browser
  simulation without page errors. These are **not** physical multiplayer tests.
- Added a plain-English November real-phone acceptance checklist to README.
- Network integration could not be run in this container because npm
  dependencies were not available and the package install timed out;
  GitHub Actions is the intended CI environment for this suite. Its remote
  check status must be inspected separately rather than claimed as passing.
- Physical phone tests, mixed Wi-Fi/mobile networks, end-device performance,
  long matches across devices and hosted rematches remain for November.
