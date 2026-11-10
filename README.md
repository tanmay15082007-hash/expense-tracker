# Expense Tracker (PWA)

A private, offline expense tracker. No Firebase, no accounts: all data is stored in your browser's localStorage.

## Features
- Add, edit, delete (with undo) income and expenses; search and month filters
- Category donut chart, six-month income/expense trend, monthly history
- Monthly budgets per category with progress bars
- Smart Advisor (summary, food, transport, budgets, 50/30/20, saving tips) running on-device
- Export to JSON (full backup), CSV, Excel; import from all three (duplicates skipped)
- Installable PWA with offline support (service worker)
- INR, USD, EUR, GBP labels

## Deploy on GitHub Pages
1. Create a repo and upload everything in this folder (keep the structure).
2. Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.
3. Open `https://<username>.github.io/<repo>/`.

## Run locally
Service workers need http, so serve the folder: `python3 -m http.server 8000` and open http://localhost:8000.

## Updating after you change files
Bump `CACHE` in `sw.js` (for example `expense-tracker-v2`) so installed copies refresh.

## Structure
`index.html`, `manifest.json`, `sw.js`; `css/` (variables, base, layout, components, effects, nexus-ui); `js/` (store, charts, advisor, io, app); `assets/icons/`; `generate-icons.py`.

## Notes
- Data is per browser and device. Use Export/Import to move it.
- The Excel library loads from a CDN the first time you're online, then is cached for offline use. CSV and JSON never need it.
