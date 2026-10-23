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
