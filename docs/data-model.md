# Data Model and API Contract

## Unified Entity: mediaItem

All catalog records use the unified `mediaItem` shape with explicit media type.

```json
{
  "id": 35557,
  "media_type": "anime",
  "title": "Houseki no Kuni",
  "title_ru": "Страна самоцветов",
  "type": "tv",
  "user_status": "completed",
  "user_stauts": "completed",
  "user_score": 10,
  "shiki_score": 8.39,
  "episodes": 12,
  "chapters": null,
  "volumes": null,
  "publishing_status": "",
  "demographics": [],
  "authors": [],
  "year": 2017,
  "genres": ["Сэйнэн", "Экшен"],
  "studios": ["Orange"],
  "poster": "/system/animes/original/35557.jpg?1711954240",
  "description": "...",
  "detailUrl": "https://shiki.one/animes/35557-houseki-no-kuni",
  "watchUrl": "https://www.google.com/search?q=...",
  "created_at": "2026-03-06 09:12:00",
  "updated_at": "2026-03-06 09:12:00"
}
```

## Field Rules

- `media_type`: required enum: `anime` or `manga`
- `id`: required positive integer for create (must be unique)
- `user_status`: normalized status field (lowercase string)
- `user_stauts`: temporary backward-compatible mirror of `user_status` (deprecated)
- `genres`, `studios`: arrays of strings
- `demographics`, `authors`: arrays of strings
- `user_score`, `shiki_score`: numeric values from 0 to 10
- `year`, `episodes`, `chapters`, `volumes`: integer values or `null`
- `publishing_status`: normalized lowercase string (for manga)

Validation rules used by API:

- `id` must be unique for create requests
- `year` (if provided) must be in `1900..2100`
- `episodes`, `chapters`, `volumes` (if provided) must be non-negative integers

## Backward Compatibility

- Input supports both `user_status` and legacy `user_stauts`.
- API responses include both fields during migration period.

## Storage (MVP)

SQLite table: `media_items`

```sql
CREATE TABLE media_items (
  id INTEGER PRIMARY KEY,
  media_type TEXT NOT NULL DEFAULT 'anime',
  title TEXT NOT NULL DEFAULT '',
  title_ru TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  user_status TEXT NOT NULL DEFAULT '',
  user_score REAL,
  shiki_score REAL,
  episodes INTEGER,
  chapters INTEGER,
  volumes INTEGER,
  publishing_status TEXT NOT NULL DEFAULT '',
  demographics TEXT NOT NULL DEFAULT '[]',
  authors TEXT NOT NULL DEFAULT '[]',
  year INTEGER,
  genres TEXT NOT NULL DEFAULT '[]',
  studios TEXT NOT NULL DEFAULT '[]',
  poster TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  detail_url TEXT NOT NULL DEFAULT '',
  watch_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

`genres` and `studios` are stored as JSON strings.

## REST API Contract

Base URL: `/api`

### `GET /api/health`

Returns service status.

```json
{ "status": "ok" }
```

### `GET /api/items`

Returns list payload:

```json
{
  "items": ["...mediaItem"],
  "total": 123
}
```

Supported query params:

- `media_type`, `type`, `status`
- `search`
- `genre` or `genres` (comma-separated)
- `year_from`, `year_to`
- `chapter_from`, `chapter_to` (manga)
- `volume_from`, `volume_to` (manga)
- `shiki_from`, `shiki_to`
- `user_from`, `user_to`
- Optional pagination: `page`, `page_size`

When pagination is used, response also includes `page`, `page_size`, `total_pages`.

### `GET /api/items/:id`

Returns one `mediaItem`.

- `404` if not found.

### `POST /api/items`

Creates new item.

Minimal request body:

```json
{
  "id": 199999,
  "media_type": "anime",
  "title": "Frieren",
  "user_status": "planned"
}
```

Returns created `mediaItem` with `201`.

### `PUT /api/items/:id`

Updates existing item (partial payload supported).

- If payload contains `id`, it must match `:id`.

- `404` if not found.

### `DELETE /api/items/:id`

Deletes item.

Optional request body:

```json
{
  "change_reason": "user requested removal"
}
```

- Returns `204` on success.
- `404` if not found.

### `GET /api/change-log`

Returns recent journal entries for create/update/delete operations.

Optional query params:

- `limit` (default `100`, max `500`)

Response shape:

```json
{
  "items": [
    {
      "log_id": 12,
      "action": "update",
      "item_id": 35557,
      "media_type": "anime",
      "changed_at": "2026-03-06 10:20:00",
      "reason": "fixed scores",
      "before": {"...": "mediaItem"},
      "after": {"...": "mediaItem"}
    }
  ],
  "total": 1
}
```

### `GET /api/external/shiki`

Semi-auto import helper for add form.

Query params:

- `source` (required): URL or numeric ID from Shikimori/Shiki
- `media_type` (optional): `anime` or `manga` (type hint)

Returns normalized `mediaItem`-compatible payload (not persisted automatically).

## Error Response

API errors return JSON:

```json
{
  "error": "Human readable message",
  "code": "MACHINE_CODE"
}
```
