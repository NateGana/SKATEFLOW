# SKATEFLOW

**Find Your Flow. Master Your Tricks.**

SKATEFLOW is a skating companion web app. Track your sessions, learn tricks, manage your gear, set goals, join challenges, and keep a private skate journal. It runs fully in your browser. No server, no account, no paid API.

## Main features

- **Dashboard** with stats calculated from your own records, a weekly activity chart, recommended tricks, quick actions
- **My Progress** with skill levels, 5 charts, and personal records
- **Trick Library** with 4 skill categories, custom tricks, a practice checklist, attempts and landings
- **Skate Sessions** to add, edit, delete, search, filter and sort (duration is calculated from start and end time)
- **Skatepark Finder** to save parks, rate them, mark favorites, visited, and a bucket list
- **My Equipment** with spending, condition, replacement reminders and your board setup
- **Challenges** to join, track, complete and earn badges, plus custom challenges
- **Skate Journal** with an editorial layout, tags, images and a link to a session
- **Goals** with automatic progress percentage, pause/complete, and "sync from records"
- **Community** (local demo only), **Settings** (profile, light/dark theme, export/import), and **global search**

## Technologies

HTML, CSS and vanilla JavaScript. Optional CDNs: Chart.js (charts), Lucide (icons), Google Fonts (Space Grotesk and Inter). If the CDNs are blocked, the app still works but charts and icons will not show.

## Folder structure

```
SKATEFLOW/
├── index.html
├── css/style.css
├── js/
│   ├── utils.js        helpers: modal, forms, toasts, dates, charts
│   ├── seed.js         starter tricks, parks, challenges, demo data
│   ├── storage.js      LocalStorage saving + statistics
│   ├── dashboard.js    progress.js   tricks.js     sessions.js
│   ├── skateparks.js   equipment.js  challenges.js journal.js
│   ├── goals.js        community.js  settings.js   search.js
│   └── app.js          navigation and events (loaded last)
├── assets/icons/favicon.svg
├── assets/images/
└── README.md
```

## How to run

**Easiest:** double-click `index.html` to open it in your browser (Chrome, Edge, Firefox or Safari).

**Optional local server** (if you prefer):
1. Open a terminal in the SKATEFLOW folder.
2. Run `python -m http.server 8000` (or `npx serve`).
3. Open http://localhost:8000 in your browser.

You need an internet connection the first time for charts, icons and fonts.

## How LocalStorage works

Your data is saved in your browser using keys such as `skateflow_sessions` and `skateflow_tricks`. It stays after you refresh or close the tab. It is saved **only in this browser on this device**. It does not sync to other devices or users. Clearing your browser's site data will delete it, so export backups.

## Export and import

Go to **Settings > Data management**.
- **Export data** downloads a `.json` backup.
- **Import data** restores a backup. The file is checked first, and you must confirm before it replaces your current data.

## Getting started

New installs start with the tricks, challenges and sample parks, but no sessions. Click **Settings > Load demo data** to fill in sample sessions, goals, gear and journal entries so you can see the charts. Use **Clear personal records** to remove them.

## Known limitations

- Everything is entered manually. SKATEFLOW does not detect or verify tricks or sessions.
- Skatepark entries marked "Sample info" are made up. There is no map and no real park database.
- The Community page is a local demo. There are no accounts, no online users and no live feed.
- Images you upload are stored inside LocalStorage (limit 600 KB each). Browsers allow about 5 MB total.
- Trick cards use drawn illustrations, not photographs.
