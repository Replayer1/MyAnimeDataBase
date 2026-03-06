# MyAnimeDataBase

MyAnimeDataBase is a web app for managing and browsing media entries with a unified model for anime and manga.
The frontend is plain JavaScript, and the MVP backend uses Node.js + Express + SQLite for persistent storage and real CRUD operations.

## Features

- Unified `mediaItem` model with `media_type: "anime" | "manga"`
- Backward-compatible status normalization: `user_status` + temporary `user_stauts`
- Anime and manga tabs with shared UX: cards, search, filters, pagination
- Common filters: title, year, scores, status, type, genres
- Manga filters: chapters and volumes ranges
- Statistics page with client-side charts and cached aggregates
- Add page with manual/semi-auto mode, client validation and CRUD actions
- Responsive pagination and theme toggle
- REST API for listing, creating, editing, deleting + change journal

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express
- Database: SQLite

## Project Structure

```text
.
|- app/
|  |- utils/
|  |  |- media-item.js   # normalization helpers for mediaItem
|  |  `- list-utils.js   # reusable filtering and pagination helpers
|  |- parse.js           # data loading and bootstrap
|  |- render.js          # card rendering and action handlers
|  |- serch.js           # search + filters logic
|  |- statistics.js      # statistics page, charts, aggregate cache
|  |- add-item.js        # add/edit/delete page and validation
|  |- pagination.js      # pagination UI logic
|  `- theme.js           # theme switcher
|- db/
|  |- anime-data.json    # initial anime seed data
|  `- manga-data.json    # initial manga seed data
|- docs/
|  `- data-model.md      # API contract and schema
|- server/
|  |- index.js           # Express app and API routes
|  |- store.js           # SQLite storage layer
|  |- external-source.js # external source adapter (URL/ID prefill)
|  `- seed-migration.js  # raw seed migration to unified mediaItem
|- style/
|  |- index.css
|  `- content.css
|- index.html
`- package.json
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app server:

```bash
npm start
```

3. Open in browser:

```text
http://localhost:3000
```

The backend serves static frontend files and API on the same origin.
On first run, SQLite is created at `data/app.db` and seeded from `db/anime-data.json` + `db/manga-data.json`.

## API Overview

- `GET /api/health`
- `GET /api/items`
- `GET /api/items/:id`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`
- `GET /api/change-log`
- `GET /api/external/shiki?source=...&media_type=...`

Aliases without `/api` are also available (for example, `POST /items`).

Full contract: `docs/data-model.md`.

## Data Notes

- Canonical status field: `user_status`
- Legacy compatibility field: `user_stauts` (deprecated)
- Frontend and backend accept both fields during transition
