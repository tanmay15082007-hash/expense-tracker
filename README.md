# Expense Tracker (PWA)

A private, offline-first expense tracker. No Firebase, no accounts, no servers: all data is stored in your browser's localStorage. Installable on phone and desktop, deployable to GitHub Pages.

## Features

**Tracking**
- Add, edit and delete income and expenses (delete has a 5-second Undo)
- Search by category or note, filter by month
- Category donut chart and a six-month income vs expense trend
- Monthly history with per-month totals
- Monthly budgets per category with progress bars (turn red when exceeded)
- Currency labels: INR, USD, EUR, GBP

**Smart Advisor** (runs on your device)
- Ask for a summary, food or transport spending, budget status, the 50/30/20 rule, or saving tips
- **Bank statement analysis:** upload a statement PDF to see
  - where you spent the most (payees ranked by amount)
  - which payees you paid most often
  - average spend per day, highest-spend day and weekday, biggest payment
  - how many small payments (under 50) you made and what they add up to
  - one-tap "Add to my tracker" to import all rows (duplicates are skipped)

**Data and privacy**
- Export to JSON (full backup, includes budgets and profile), CSV or Excel
- Import from JSON, CSV or Excel (duplicates are skipped)
- Statement PDFs are read in the browser and are never uploaded

**PWA**
- Installable (Chrome, Edge, Android; iPhone via Share, then Add to Home Screen)
- Works offline after the first load (service worker)

## Project structure

```
index.html            App shell
manifest.json         PWA manifest (name, icons, theme)
sw.js                 Service worker (offline cache)
generate-icons.py     Regenerates the PNG icons (needs Pillow)
css/
  variables.css       Colors, fonts, radii
  base.css            Reset, typography, form controls
  layout.css          Page layout, header, nav, grids
  components.css      Cards, chips, lists, dialogs, charts
  effects.css         Glow, grid background, reduced-motion
  nexus-ui.css        Imports all layers in order
js/
  store.js            localStorage data layer and helpers
  charts.js           SVG donut and trend charts
  advisor.js          Rule-based advisor answers
  io.js               Export and import (JSON, CSV, Excel)
  statement.js        Bank statement PDF parser and analysis
  app.js              UI, tabs, forms, budgets, PWA install
assets/icons/         App icons (192, 512, maskable, apple-touch, favicon)
```

Script load order in `index.html` matters: `store`, `charts`, `advisor`, `io`, `statement`, `app`.

## Deploy on GitHub Pages

1. Create a repository and upload everything in this folder, keeping the structure.
2. Go to Settings, then Pages, then Deploy from a branch, choose `main` and `/ (root)`, and Save.
3. Open `https://<username>.github.io/<repo>/` and use Install in your browser.

## Run locally

Service workers need a web server (opening `index.html` directly works, but install and offline do not).

- VS Code: install the Live Server extension, right-click `index.html`, Open with Live Server
- Python: `python -m http.server 8000` (on Windows try `py -m http.server 8000`)
- Node: `npx serve .`

If you see another project on the same address, it is an old service worker. In DevTools, Application, Storage, tick "Unregister service workers" and click "Clear site data", or use a different port.

## Bank statement analysis

1. Open the Advisor tab and choose your statement PDF under "Bank statement analysis".
2. Enter the PDF password if asked (it is used on your device only).
3. Review the results, then tap "Add to my tracker" to import the transactions.

Requirements and limits:
- The PDF must contain real text (not a scanned photo) and have Debit, Credit and Balance columns.
- Payee names come from the statement text. UPI rows (`UPI/DR/<ref>/<NAME>/...`) are read best; other rows use the first words of the details.
- If it reports "No transactions found", your bank's layout may differ and the column detection in `js/statement.js` needs adjusting.
- The PDF reader (PDF.js) loads from a CDN the first time you use this feature, then is cached for offline use.

## Updating after you change files

Bump `CACHE` in `sw.js` (for example `expense-tracker-v4`) so installed copies refresh. If you add a new file, also add it to the `CORE` list in `sw.js`.

## Notes

- Data is per browser and device. Use Export and Import to move it, and back up now and then because clearing browser data deletes it.
- The Excel library also loads from a CDN on first use and is then cached. JSON and CSV never need it.
