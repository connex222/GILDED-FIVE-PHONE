# Gilded Five — UI refresh (21 October 2026)

New emerald-and-gold visual identity for both TV and phone controller. Includes a gold logo in scalable SVG form, a matching five-pip crown dice emblem, responsive layouts, refined scoreboard and setup screens, modern joining and waiting screens, focus and reduced-motion rules.

## Code and compatibility

No game rules, scoring logic or multiplayer protocol changes. New files under `public/assets/` are exposed by an exact route allowlist in `server.js`; root `assets/` is mirrored for standalone HTML use. The new logo is a scalable SVG artwork designed for crisp rendering on small and large screens.

## Checks

Previous preview was smoke-tested at desktop/phone widths for setup, dice, scorecard and phone join views. Live end-to-end multiplayer tests remain outstanding. Verify production Render deployment after merging.
