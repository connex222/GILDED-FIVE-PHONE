GILDED FIVE PREMIUM - TV + PHONES
================================

Gilded Five is a living-room dice party game. Use one laptop, desktop or TV
browser for the table, with up to eight phones as private dice controllers.
You can also play alone, with friends sharing a screen, or against computer
players. No account or paid subscription is needed to play the game.

QUICK START: WINDOWS OR MAC, ALL DEVICES ON YOUR HOME WI-FI
---------------------------------------------------------
1. Install Node.js 18 or later from https://nodejs.org if it is not installed.
2. Extract the complete GILDED-FIVE-PHONE-main folder.
3. Windows: double-click start.bat. Mac: double-click start.command. If the
   launcher fails, open a terminal in this folder and enter:
       npm install
       npm start
4. In the browser on the host computer, open http://localhost:3000
5. Cast the browser to a TV, connect an HDMI cable or use your computer screen.
6. In the TV setup screen enable Play with phones. All phones must be on the
   same home Wi-Fi; each scans the QR code or types the shown joining address
   (normally http://YOUR-COMPUTER-IP:3000/play) and four-letter room code.
7. The FIRST phone to join is the TABLE CAPTAIN. On that phone select one of
   the three presets, optionally set a timer, Mirror Roll and bots, then tap
   Deal everyone in. The Captain can pass control to the next connected phone.
8. Everyone rolls on their phone. On the TV the progress strip tells you who
   has locked in. When all are ready, watch the reveal and the leaderboard.

If phones cannot connect, make sure both devices are on the same Wi-Fi, the
computer is awake, and your firewall allows Node on your private network.
Phones need the URL on the TV, not http://localhost:3000 (localhost on a phone
means the phone itself). Phone motion sensors need HTTPS, so Shake to Roll is
hidden over ordinary HTTP Wi-Fi. The regular Roll button always works.

HOW TO PLAY
-----------
You have five dice, up to three rolls and 13 scoring boxes (Classic Full game).
After your first roll you can tap a die to hold it, then roll the others.
Choose one still-empty scoring box for that turn. You may take a zero in a
box if you must. The top section scores Aces to Sixes; it gives +35 points
when its scored boxes total at least 63. The bottom section contains 3 and 4
of a Kind, Full House, Small and Large Straights, Gilded Five and Chance.
The original forced-Joker rules and +100 bonus for extra Gilded Fives remain.

THE SIGNATURE GOLD DIE
----------------------
Die FIVE is permanently gold. In Chance, 3 of a Kind and 4 of a Kind, its
number counts twice in the total. In the top section, matching the scored
face on the gold die adds +5 points to that box. Full House and Straights
keep their fixed scores. Five identical dice score 50 + 5 times the face of
the gold die. Gold die rules can be disabled under Advanced.

THREE GAME PRESETS
------------------
CLASSIC: Gilded Die; familiar straight scoring. No house cards, chips or powers.
FAMILY NIGHT: Gilded Die, house cards, helpful learner/junior seats, awards
and Gilded Five replays. No chip economy. Recommended for a mixed-age table.
HIGH STAKES: Gilded Die, house cards, chips, side bets, jackpot and Re-roll
or Nudge powers. There is no Freeze power. Chips are worth TWO final points
each, so there is ONE overall winner. High Roller is only a separate award.

Advanced lets you customise options. Simultaneous Rounds starts enabled when
playing with phones, while turn-by-turn stays available for solo or sharing
one screen. Mirror Roll gives everyone the same FIRST roll in each round.
Optional timers are Off, 45, 60 or 90 seconds. If a timer expires the house
chooses a score for each unfinished player. Short Play ends after SEVEN
scored boxes in each score column (choose any seven); the top bonus target
is 30. Triple Gilded has three score columns with x1 / x2 / x3 scoring:
39 turns in Full mode or 21 in Short mode. Once a Short column holds
seven chosen boxes, its remaining boxes cannot be selected.

SIMULTANEOUS ROUNDS: ROLL, CHOOSE, LOCK IN
-----------------------------------------
All phone players roll at the same time, choose an available box and tap
LOCK IN. Until everyone locks, other players cannot see your dice or your
choice. The TV reveals each hand from lowest to highest score, then gives
Hand of the Round to the highest single-box score. In Classic and Family
Night it is worth +10 extra points; in High Stakes the winners split the
round pot, with any leftover chips carrying over. Optional early side bets
are offered in High Stakes. The game advances to the next round together.

PHONES
------
Play tab: your dice, Roll button and scoring choices; your fifth die is gold.
My Card: your full scored card. Table: standings and other players' progress.
Your phone can lock, unlock or lose its Wi-Fi connection: it reconnects to
the saved room automatically when possible. For Shake to Roll on compatible
phones, use your secure HTTPS hosted game rather than a local HTTP address.

WITHOUT PHONES / OFFLINE ANDROID
--------------------------------
You can play Classic turn-by-turn on the host alone, with other people
sharing the host screen, and with bots. The offline browser/Android build is
PASS & PLAY, not online multiplayer. Internet phone controllers need the
Node service running. The host HTML is public/index.html; the duplicate
root index.html has deliberately been removed.

DEPLOY ON RENDER FOR GAMES ACROSS HOMES
-------------------------------------
1. Upload this folder's contents to your GitHub repository, preserving the
   public/ directory. Do not upload node_modules/.
2. On Render choose a Node Web Service connected to the GitHub repository.
3. Build command: npm ci
   Start command: npm start
   Node version: 18 or later (22 recommended).
4. When the service has deployed, open the secure HTTPS address supplied by
   Render (normally ending in .onrender.com) on the TV. Players join using
   the QR code or the same HTTPS host and /play.
5. Before hosting you can open YOUR-RENDER-ADDRESS/wake or /health to wake a
   free-tier service. Free services may need time to wake; a paid always-on
   service avoids this delay. Recheck Render's current plan details.
6. The TV browser must remain open and online: it is the sole authority on
   the dice and scores. The Node server only passes messages to phones.

TO CHECK THE BUILD
------------------
In a terminal in this folder:
    npm test
The Node regression tests check all scoring categories, Gilded Die and
house card interactions, forced-Joker rules, chip conversions, Hand of the
Round settlement, private-state routing and a 600,000-roll dice distribution.
These checks do NOT substitute for an eight-phone, full-match live test.
Test real phone join, reconnect, timers, finishing and rematching on your
actual Render service before a public release.

SETTINGS AND GAME DATA
----------------------
Profiles, preferences, game resume and records are stored in the host
browser's local storage. For a game you want to resume, use the same browser
profile and the Resume control. Clearing site data loses local records.
Phones use local storage for their rejoin tokens. Storage failures are
ignored rather than crashing the table. Respect players' permissions when
using voice, audio and phone motion sensors.

The UI uses no third-party scripts or web fonts. Fonts are bundled as
WOFF2 in public/assets; see public/assets/FONT-LICENCES.txt. All game
sounds are synthesised locally, with optional device announcer voices.

VERIFICATION AND QA
-------------------
To check the scoring and architecture from the project folder, run npm test.
For the phone controller, test a round with a timer and verify an already chosen
box is locked unchanged if time runs out. In High Stakes, confirm that a seat
with no chips contributes nothing to the round pot. These cases are covered by
regression checks in tests.js and can also be checked in an automated browser.
Automated simulation does NOT replace the November physical eight-phone test.

REFRESH / RECONNECT
-------------------
If the TV browser reloads during a game, click Resume saved game on the host.
Simultaneous games restart any incomplete reveal so scores cannot be lost. A
previously settled round continues to the next round without re-paying the pot.
Keep the same browser/profile for saved games; a different host has no copy of
the saved TV state.

OPTIONAL BROWSER TEST (for developers)
--------------------------------------
If Python is installed, install the separate Playwright testing tool and its
Chromium browser, then run: python qa-browser.py. This checks timeout choice,
chip-pool accounting, eight private hands and reveal recovery. Playwright is
only a test tool, never an app dependency.

QUALITY CHECKS (OPTIONAL, FOR TECHNICAL HOSTS)
----------------------------------------------
From the project folder, after installing the Node packages with npm ci:
    npm run test:all
This runs the offline scoring / 600,000-dice fairness checks AND a real local
HTTP + WebSocket test. The relay test starts its own disposable server,
creates a temporary room, connects eight simulated phones, checks the ninth
phone is refused, tests private dice messages, disconnection/rejoining, and
verifies that a returning TV host retains the room and its connected phones.
Nothing connects to your live Render games or anyone else's rooms.

The same automated tests run in GitHub Actions on updates to the main branch.
Open the repository's Actions tab to check the green passing tick before a
real game night. Test failures prevent a clean QA sign-off but do not by
themselves stop automatic Render deployments; configure branch protections
separately if you want that extra safeguard.

Optional offline browser checks (require Python Playwright and Chromium):
    python qa-browser.py
    python qa-responsive.py
    python qa-complete.py
    python qa-usability.py
These check screens at 320, 390, 768, 1920 and 3840 pixels; five complete
Classic/Short/Triple/High Stakes match configurations including rematch;
accessibility of keyboard/dialog navigation; malformed saved-game recovery;
and the private-state/reveal simulation. They never join a live room.
If Chromium is already installed but Playwright cannot find it, use the
GILDED_CHROMIUM environment variable to give its full executable path.
Browser checks are not part of the default GitHub workflow because they
require separate Chromium installation. The scoring/relay tests are CI checks.

ROOM PRIVACY
------------
New four-letter room codes and host recovery keys use secure Node random
numbers. The server binds each connection to one role and one room; a phone
cannot promote itself into the TV host, or join another seat without first
opening a fresh connection. Only the host can route an individual player's
private dice to that player's registered phone. Room codes are for informal
private party play; they are not a substitute for account authentication.

PRE-NOVEMBER READINESS (23 OCTOBER 2026)
----------------------------------------
The following can be checked before the physical multiplayer session:
- Offline scoring, fair randomness and original Joker rules: npm test.
- Server HTTP/WebSocket relay: npm run test:integration (requires npm ci).
- Complete turn-by-turn games and High Stakes cash-in: qa-complete.py.
- Small screens, 4K sizing and reduced motion: qa-responsive.py.
- Short Triple: 21 turns maximum, 7 selectable boxes per column.
- Saved matches, malformed settings and keyboard dialogs: qa-usability.py.
- Source and automation: push to GitHub main; check GitHub Actions and Render.

NOVEMBER MULTIPLAYER ACCEPTANCE (NOT YET PERFORMED)
-------------------------------------------------
Run this on real phones; do not mistake synthetic browser tests for a pass.
1. Open the live HTTPS game on a TV/PC; leave the host browser awake.
2. Join with up to eight real phones (include Android and iOS if possible).
   Try two different home internet connections as well as one shared Wi-Fi.
3. First phone controls Table Captain; add bots, change preset, transfer the
   crown to another connected phone and start the game.
4. Test Classic and Family Night simultaneous rounds, Mirror Roll, the
   optional 45-second timer, secret hands, tie reveal and next-round advance.
5. Test High Stakes betting, chip pot conservation and +2 points per remaining
   chip on the final scoreboard; only ONE winner may be announced.
6. Lock/unlock a phone mid-turn, disconnect/reconnect Wi-Fi, then verify its
   dice, selected box and original seat are restored without double scoring.
7. Refresh the TV during a round, during the reveal and after settlement;
   use Resume to confirm there is no duplicate Hand of the Round payout.
8. Finish a full game, inspect awards and all scorecards, start a rematch,
   then verify every player is present and every scorecard is empty.
9. Check legibility from the sofa, sound/mute, keyboard-only operation,
   reduced-motion devices, portrait phones and landscape TV layout.
10. Record pass/fail, phone models, operating systems, connection type and
    exact steps to reproduce any defect before approving wider release.

The November session has deliberately not been counted as a completed test.
