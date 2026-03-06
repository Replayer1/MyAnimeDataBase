const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { loadSeedEntries } = require("./seed-migration");

const DEFAULT_MEDIA_TYPE = "anime";

function toText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function toInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toFloat(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function createError(message, statusCode = 400, code = "VALIDATION_ERROR") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function normalizeMediaType(value) {
  return toText(value).toLowerCase() === "manga" ? "manga" : "anime";
}

function normalizeStatus(value) {
  return toText(value).toLowerCase();
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeAuthors(value) {
  if (Array.isArray(value)) {
    return value
      .map((author) => {
        if (typeof author === "string") return toText(author);

        if (author && typeof author === "object") {
          return toText(author.name || author.title_ru || author.title);
        }

        return "";
      })
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return [toText(value.name || value.title_ru || value.title)].filter(Boolean);
  }

  return normalizeArray(value);
}

function parseJsonArray(value) {
  if (typeof value !== "string" || value.trim() === "") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => toText(item)).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value) {
  if (typeof value !== "string" || value.trim() === "") return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapRowToMediaItem(row) {
  if (!row) return null;

  const userStatus = toText(row.user_status).toLowerCase();

  return {
    id: row.id,
    media_type: normalizeMediaType(row.media_type),
    title: toText(row.title),
    title_ru: toText(row.title_ru),
    type: toText(row.type),
    user_status: userStatus,
    user_stauts: userStatus,
    user_score: row.user_score,
    shiki_score: row.shiki_score,
    episodes: row.episodes,
    chapters: row.chapters,
    volumes: row.volumes,
    publishing_status: toText(row.publishing_status).toLowerCase(),
    demographics: parseJsonArray(row.demographics),
    authors: parseJsonArray(row.authors),
    year: row.year,
    genres: parseJsonArray(row.genres),
    studios: parseJsonArray(row.studios),
    poster: toText(row.poster),
    description: toText(row.description),
    detailUrl: toText(row.detail_url),
    watchUrl: toText(row.watch_url),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function validateScore(name, value) {
  if (value === null) return;

  if (value < 0 || value > 10) {
    throw createError(`${name} must be between 0 and 10`, 400, "INVALID_SCORE");
  }
}

function validateNonNegativeInteger(name, value) {
  if (value === null) return;
  if (!Number.isInteger(value) || value < 0) {
    throw createError(`${name} must be a non-negative integer`, 400, "INVALID_INTEGER");
  }
}

function buildNormalizedItem(input, options = {}) {
  const { isCreate = false, currentItem = null } = options;

  const source = input || {};
  const current = currentItem || {};

  const title = toText(source.title ?? current.title, "");
  const titleRu = toText(source.title_ru ?? current.title_ru, "");

  const normalizedId = toInteger(source.id ?? current.id);

  if (isCreate && normalizedId === null) {
    throw createError("id is required", 400, "ID_REQUIRED");
  }

  if (isCreate && !title && !titleRu) {
    throw createError("title or title_ru is required", 400, "TITLE_REQUIRED");
  }

  const userStatusRaw = normalizeStatus(
    source.user_status ?? source.user_stauts ?? current.user_status,
  );
  const userStatus = userStatusRaw || "planned";

  const normalized = {
    id: normalizedId,
    media_type: normalizeMediaType(source.media_type ?? current.media_type),
    title,
    title_ru: titleRu,
    type: toText(source.type ?? current.type, ""),
    user_status: userStatus,
    user_score: toFloat(source.user_score ?? current.user_score),
    shiki_score: toFloat(source.shiki_score ?? current.shiki_score),
    episodes: toInteger(source.episodes ?? current.episodes),
    chapters: toInteger(source.chapters ?? current.chapters),
    volumes: toInteger(source.volumes ?? current.volumes),
    publishing_status: toText(
      source.publishing_status ?? current.publishing_status,
      "",
    ).toLowerCase(),
    demographics:
      source.demographics !== undefined || source.demographic !== undefined
        ? normalizeArray(source.demographics ?? source.demographic)
        : normalizeArray(current.demographics),
    authors:
      source.authors !== undefined || source.author !== undefined
        ? normalizeAuthors(source.authors ?? source.author)
        : normalizeAuthors(current.authors),
    year: toInteger(source.year ?? current.year),
    genres:
      source.genres !== undefined
        ? normalizeArray(source.genres)
        : normalizeArray(current.genres),
    studios:
      source.studios !== undefined
        ? normalizeArray(source.studios)
        : normalizeArray(current.studios),
    poster: toText(source.poster ?? current.poster, ""),
    description: toText(source.description ?? current.description, ""),
    detail_url: toText(source.detailUrl ?? current.detailUrl, ""),
    watch_url: toText(source.watchUrl ?? current.watchUrl, ""),
  };

  validateScore("user_score", normalized.user_score);
  validateScore("shiki_score", normalized.shiki_score);
  validateNonNegativeInteger("episodes", normalized.episodes);
  validateNonNegativeInteger("chapters", normalized.chapters);
  validateNonNegativeInteger("volumes", normalized.volumes);

  if (
    normalized.year !== null &&
    (!Number.isInteger(normalized.year) || normalized.year < 1900 || normalized.year > 2100)
  ) {
    throw createError("year must be between 1900 and 2100", 400, "INVALID_YEAR");
  }

  if (normalized.media_type !== "anime" && normalized.media_type !== "manga") {
    throw createError("media_type must be anime or manga", 400, "INVALID_MEDIA_TYPE");
  }

  return normalized;
}

function matchesRange(value, from, to) {
  if (from === null && to === null) return true;
  if (value === null || value === undefined) return false;

  if (from !== null && value < from) return false;
  if (to !== null && value > to) return false;
  return true;
}

function applyQueryFilters(items, query) {
  const search = toText(query.search).toLowerCase();
  const mediaType = toText(query.media_type).toLowerCase();
  const type = toText(query.type).toLowerCase();
  const status = normalizeStatus(query.status || query.user_status);

  const yearFrom = toInteger(query.year_from);
  const yearTo = toInteger(query.year_to);
  const chapterFrom = toInteger(query.chapter_from);
  const chapterTo = toInteger(query.chapter_to);
  const volumeFrom = toInteger(query.volume_from);
  const volumeTo = toInteger(query.volume_to);
  const shikiFrom = toFloat(query.shiki_from);
  const shikiTo = toFloat(query.shiki_to);
  const userFrom = toFloat(query.user_from);
  const userTo = toFloat(query.user_to);

  const genres = normalizeArray(query.genres || query.genre);

  return items.filter((item) => {
    const title = toText(item.title).toLowerCase();
    const titleRu = toText(item.title_ru).toLowerCase();

    const matchesSearch =
      !search || title.includes(search) || titleRu.includes(search);
    const matchesMediaType = !mediaType || item.media_type === mediaType;
    const matchesType = !type || toText(item.type).toLowerCase() === type;
    const matchesStatus = !status || item.user_status === status;
    const matchesYear = matchesRange(item.year, yearFrom, yearTo);
    const matchesChapters =
      mediaType !== "manga" || matchesRange(item.chapters, chapterFrom, chapterTo);
    const matchesVolumes =
      mediaType !== "manga" || matchesRange(item.volumes, volumeFrom, volumeTo);
    const matchesShiki = matchesRange(item.shiki_score, shikiFrom, shikiTo);
    const matchesUser = matchesRange(item.user_score, userFrom, userTo);

    const itemGenres = Array.isArray(item.genres) ? item.genres : [];
    const matchesGenres =
      genres.length === 0 || genres.every((genre) => itemGenres.includes(genre));

    return (
      matchesSearch &&
      matchesMediaType &&
      matchesType &&
      matchesStatus &&
      matchesYear &&
      matchesChapters &&
      matchesVolumes &&
      matchesShiki &&
      matchesUser &&
      matchesGenres
    );
  });
}

function mapRowToChangeLogEntry(row) {
  if (!row) return null;

  return {
    log_id: row.log_id,
    action: toText(row.action),
    item_id: row.item_id,
    media_type: normalizeMediaType(row.media_type),
    changed_at: row.changed_at,
    reason: toText(row.reason),
    before: parseJsonObject(row.before_payload),
    after: parseJsonObject(row.after_payload),
  };
}

async function writeChangeLog(db, payload) {
  await db.run(
    `
    INSERT INTO change_log (
      action,
      item_id,
      media_type,
      reason,
      before_payload,
      after_payload,
      changed_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    toText(payload?.action),
    toInteger(payload?.item_id),
    normalizeMediaType(payload?.media_type),
    toText(payload?.reason),
    payload?.before ? JSON.stringify(payload.before) : null,
    payload?.after ? JSON.stringify(payload.after) : null,
  );
}

async function ensureSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS media_items (
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
  `);

  const columns = await db.all("PRAGMA table_info(media_items)");
  const existingColumns = new Set(columns.map((column) => column.name));

  const missingColumns = [
    {
      name: "publishing_status",
      sql: "ALTER TABLE media_items ADD COLUMN publishing_status TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "demographics",
      sql: "ALTER TABLE media_items ADD COLUMN demographics TEXT NOT NULL DEFAULT '[]'",
    },
    {
      name: "authors",
      sql: "ALTER TABLE media_items ADD COLUMN authors TEXT NOT NULL DEFAULT '[]'",
    },
  ].filter((column) => !existingColumns.has(column.name));

  for (const column of missingColumns) {
    await db.exec(column.sql);
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS change_log (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      item_id INTEGER,
      media_type TEXT NOT NULL DEFAULT 'anime',
      reason TEXT NOT NULL DEFAULT '',
      before_payload TEXT,
      after_payload TEXT,
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

async function seedIfEmpty(db, seedSources) {
  const counters = await db.all(
    "SELECT media_type, COUNT(*) as count FROM media_items GROUP BY media_type",
  );

  const existingMediaTypes = new Set(
    counters
      .filter((row) => row.count > 0)
      .map((row) => normalizeMediaType(row.media_type)),
  );

  const needAnimeSeed = !existingMediaTypes.has("anime");
  const needMangaSeed = !existingMediaTypes.has("manga");
  if (!needAnimeSeed && !needMangaSeed) return;

  const raw = loadSeedEntries(seedSources).filter((item) => {
    const mediaType = normalizeMediaType(item.media_type);

    if (mediaType === "anime") return needAnimeSeed;
    if (mediaType === "manga") return needMangaSeed;
    return false;
  });

  if (!Array.isArray(raw) || raw.length === 0) return;

  await db.exec("BEGIN TRANSACTION");

  try {
    for (const sourceItem of raw) {
      const item = buildNormalizedItem(
        {
          ...sourceItem,
          media_type: sourceItem.media_type || DEFAULT_MEDIA_TYPE,
        },
        { isCreate: true },
      );

      await db.run(
        `
        INSERT OR IGNORE INTO media_items (
          id, media_type, title, title_ru, type, user_status,
          user_score, shiki_score, episodes, chapters, volumes,
          publishing_status, demographics, authors, year,
          genres, studios, poster, description, detail_url, watch_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        item.id,
        item.media_type,
        item.title,
        item.title_ru,
        item.type,
        item.user_status,
        item.user_score,
        item.shiki_score,
        item.episodes,
        item.chapters,
        item.volumes,
        item.publishing_status,
        JSON.stringify(item.demographics),
        JSON.stringify(item.authors),
        item.year,
        JSON.stringify(item.genres),
        JSON.stringify(item.studios),
        item.poster,
        item.description,
        item.detail_url,
        item.watch_url,
      );
    }

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

async function createStore(options = {}) {
  const dbPath = options.dbPath;
  const seedSources = Array.isArray(options.seedSources)
    ? options.seedSources
    : options.seedPath
      ? [options.seedPath]
      : [];

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await ensureSchema(db);
  await seedIfEmpty(db, seedSources);

  return {
    async listItems(query = {}) {
      const rows = await db.all("SELECT * FROM media_items ORDER BY id DESC");
      const allItems = rows.map((row) => mapRowToMediaItem(row));
      const filteredItems = applyQueryFilters(allItems, query);

      const page = toInteger(query.page);
      const pageSize = toInteger(query.page_size);

      if (page && pageSize) {
        const safePage = Math.max(1, page);
        const safePageSize = Math.min(Math.max(1, pageSize), 200);
        const start = (safePage - 1) * safePageSize;
        const pagedItems = filteredItems.slice(start, start + safePageSize);
        const totalPages = Math.max(
          1,
          Math.ceil(filteredItems.length / safePageSize),
        );

        return {
          items: pagedItems,
          total: filteredItems.length,
          page: safePage,
          page_size: safePageSize,
          total_pages: totalPages,
        };
      }

      return {
        items: filteredItems,
        total: filteredItems.length,
      };
    },

    async getItemById(id) {
      const numericId = toInteger(id);
      if (numericId === null) return null;

      const row = await db.get("SELECT * FROM media_items WHERE id = ?", numericId);
      return mapRowToMediaItem(row);
    },

    async listChangeLog(query = {}) {
      const limit = toInteger(query.limit) || 100;
      const safeLimit = Math.min(Math.max(1, limit), 500);

      const rows = await db.all(
        "SELECT * FROM change_log ORDER BY log_id DESC LIMIT ?",
        safeLimit,
      );

      return {
        items: rows.map((row) => mapRowToChangeLogEntry(row)),
        total: rows.length,
      };
    },

    async createItem(payload) {
      const item = buildNormalizedItem(payload, { isCreate: true });

      const existing = await this.getItemById(item.id);
      if (existing) {
        throw createError("id already exists", 409, "ID_CONFLICT");
      }

      await db.exec("BEGIN TRANSACTION");

      try {
        await db.run(
          `
          INSERT INTO media_items (
            id, media_type, title, title_ru, type, user_status,
            user_score, shiki_score, episodes, chapters, volumes,
            publishing_status, demographics, authors, year,
            genres, studios, poster, description, detail_url, watch_url,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `,
          item.id,
          item.media_type,
          item.title,
          item.title_ru,
          item.type,
          item.user_status,
          item.user_score,
          item.shiki_score,
          item.episodes,
          item.chapters,
          item.volumes,
          item.publishing_status,
          JSON.stringify(item.demographics),
          JSON.stringify(item.authors),
          item.year,
          JSON.stringify(item.genres),
          JSON.stringify(item.studios),
          item.poster,
          item.description,
          item.detail_url,
          item.watch_url,
        );

        const created = await this.getItemById(item.id);

        await writeChangeLog(db, {
          action: "create",
          item_id: item.id,
          media_type: item.media_type,
          reason: toText(payload?.change_reason),
          before: null,
          after: created,
        });

        await db.exec("COMMIT");
        return created;
      } catch (error) {
        await db.exec("ROLLBACK");

        if (String(error?.message || "").includes("UNIQUE")) {
          throw createError("id already exists", 409, "ID_CONFLICT");
        }

        throw error;
      }
    },

    async updateItem(id, payload) {
      const current = await this.getItemById(id);
      if (!current) return null;

      const payloadId = toInteger(payload?.id);
      if (payloadId !== null && payloadId !== current.id) {
        throw createError(
          "id in payload must match URL id",
          400,
          "ID_MISMATCH",
        );
      }

      const item = buildNormalizedItem(payload, {
        isCreate: false,
        currentItem: current,
      });

      await db.exec("BEGIN TRANSACTION");

      try {
        await db.run(
          `
          UPDATE media_items
          SET
            media_type = ?,
            title = ?,
            title_ru = ?,
            type = ?,
            user_status = ?,
            user_score = ?,
            shiki_score = ?,
            episodes = ?,
            chapters = ?,
            volumes = ?,
            publishing_status = ?,
            demographics = ?,
            authors = ?,
            year = ?,
            genres = ?,
            studios = ?,
            poster = ?,
            description = ?,
            detail_url = ?,
            watch_url = ?,
            updated_at = datetime('now')
          WHERE id = ?
          `,
          item.media_type,
          item.title,
          item.title_ru,
          item.type,
          item.user_status,
          item.user_score,
          item.shiki_score,
          item.episodes,
          item.chapters,
          item.volumes,
          item.publishing_status,
          JSON.stringify(item.demographics),
          JSON.stringify(item.authors),
          item.year,
          JSON.stringify(item.genres),
          JSON.stringify(item.studios),
          item.poster,
          item.description,
          item.detail_url,
          item.watch_url,
          current.id,
        );

        const updated = await this.getItemById(current.id);

        await writeChangeLog(db, {
          action: "update",
          item_id: current.id,
          media_type: item.media_type,
          reason: toText(payload?.change_reason),
          before: current,
          after: updated,
        });

        await db.exec("COMMIT");
        return updated;
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }
    },

    async deleteItem(id, options = {}) {
      const numericId = toInteger(id);
      if (numericId === null) return false;

      const existing = await this.getItemById(numericId);
      if (!existing) return false;

      await db.exec("BEGIN TRANSACTION");

      try {
        const result = await db.run("DELETE FROM media_items WHERE id = ?", numericId);
        if (result.changes <= 0) {
          await db.exec("ROLLBACK");
          return false;
        }

        await writeChangeLog(db, {
          action: "delete",
          item_id: existing.id,
          media_type: existing.media_type,
          reason: toText(options?.change_reason),
          before: existing,
          after: null,
        });

        await db.exec("COMMIT");
        return true;
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

module.exports = {
  createStore,
};
