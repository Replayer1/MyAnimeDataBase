# MyAnimeDataBase

MyAnimeDataBase is a static web app for browsing a personal anime collection.
It renders anime cards from local JSON data, supports advanced filtering, and provides quick links to detail and watch pages.

## Features

- Card grid with poster, scores, year, and genres
- Search by Russian and original titles
- Filters by year, Shiki score, user score, status, type, and multiple genres
- Responsive pagination with mobile-friendly controls
- Theme toggle (light/dark) persisted in localStorage
- Safe external link opening for detail/watch actions

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (no framework)
- Local JSON database in `db/anime-data.json`

## Project Structure

```text
.
|- app/
|  |- parse.js        # data loading and bootstrap
|  |- render.js       # card rendering and action handlers
|  |- serch.js        # search + filters logic
|  |- pagination.js   # pagination logic
|  `- theme.js        # theme switcher
|- db/
|  |- anime-data.json
|  `- shikimori_data.json
|- style/
|  |- index.css
|  `- content.css
`- index.html
```

## Run Locally

Because the app uses `fetch()` for local JSON, run it with a local HTTP server.

1. Open the project folder.
2. Start a server:

```bash
python3 -m http.server 8000
```

3. Open:

```text
http://localhost:8000
```

## Data Notes

Current dataset uses the key `user_stauts` (legacy typo).
The app supports both `user_stauts` and `user_status` for compatibility.

Minimal record example:

```json
{
  "id": 35557,
  "title": "Houseki no Kuni",
  "title_ru": "Land of the Lustrous",
  "type": "tv",
  "user_score": 10,
  "shiki_score": "8.39",
  "year": "2017",
  "user_stauts": "completed",
  "genres": ["Drama", "Fantasy"]
}
```

## Future Improvements

- Add dedicated anime details page
- Add statistics page (planned in UI navigation)
- Add tests for filtering and pagination behavior
- Normalize data schema to `user_status`
