#!/bin/bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js from nodejs.org first"; open https://nodejs.org; exit 1; }
[ -d node_modules ] || npm install --omit=dev
(sleep 2; open http://localhost:3000) &
node server.js
