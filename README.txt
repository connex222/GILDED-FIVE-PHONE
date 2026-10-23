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
scored boxes per person (choose any seven); the top bonus target is 30. Triple
Gilded is a longer game with three columns and x1 / x2 / x3 scoring.

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
