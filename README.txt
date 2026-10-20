GILDED FIVE - TV + PHONES

PLAY AT HOME (same Wi-Fi)
1. Install Node.js (LTS) from nodejs.org, once.
2. Double-click start.bat (Windows) or start.command (Mac).
   The game opens in your browser. Leave the black window open.
3. Cast or plug that browser tab into your TV, press TV in the game.
4. On the setup screen switch on "Play with phones".
5. Everyone scans the QR code (or opens the address shown and types the code).
6. Add computer players if you like, then press "Deal everyone in".

PLAY ONLINE (any Wi-Fi)
Put this folder on GitHub and deploy it as a Render "Web Service":
  Build command: npm install      Start command: node server.js
Open your Render address on the TV; phones join the same way.

The original single-file game still works on its own: public/index.html
opened without the server simply hides the phone option.

WHAT'S NEW - FAMILY EXTRAS
- House rule cards: switch on in setup. A new twist is dealt every round
  (Lucky Sevens, Double Down, Hot Hand, Tight Table, Full House Party,
  Straight Shooter, Underdog, Safety Net). Tap the rule bar to see the card again.
- Learner and Junior seats: pick them instead of "Person" (or next to a phone
  player's name). The best box glows after each roll, lucky rolls give an extra
  roll when the normal ones run out, and Juniors start 25 points up.
- Awards: everyone gets one at the end, read out from last place to the winner.
- Chips, side bets and jackpot: everyone starts with 10 chips. Bet on other
  players' turns from your phone, spend chips on power moves (Re-roll, Nudge,
  Freeze), and roll a Gilded Five to scoop the jackpot. Most chips at the end
  is crowned High Roller. Switch off in setup if you want the classic game.
- Teams of two: partners share a scorecard and take turns to roll. Neighbours
  in the player list are paired (1+2, 3+4). "Shuffle teams" mixes them up.
- Instant replay: every Gilded Five is shown again in slow motion on the TV.
- Shake to roll: tap "Shake" on a phone. Phones only allow motion sensors on
  https addresses, so this works on the online (Render) version, not over
  home Wi-Fi.
