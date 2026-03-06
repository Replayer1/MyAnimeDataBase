const fs = require("fs");

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

function normalizeMediaType(value, fallback = "anime") {
  const source = toText(value || fallback).toLowerCase();
  return source === "manga" ? "manga" : "anime";
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => toText(item))
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

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function migrateSeedItem(rawItem, defaultMediaType = "anime") {
  const item = rawItem || {};
  const mediaType = normalizeMediaType(item.media_type, defaultMediaType);
  const userStatus = toText(
    firstDefined(item.user_status, item.user_stauts, item.status),
  ).toLowerCase();

  return {
    id: toInteger(item.id),
    media_type: mediaType,
    title: toText(item.title),
    title_ru: toText(item.title_ru),
    type: toText(item.type),
    user_status: userStatus,
    user_stauts: userStatus,
    user_score: toFloat(item.user_score),
    shiki_score: toFloat(item.shiki_score),
    episodes: toInteger(firstDefined(item.episodes, item.episode_count)),
    chapters: toInteger(firstDefined(item.chapters, item.chapter_count)),
    volumes: toInteger(firstDefined(item.volumes, item.volume_count)),
    publishing_status: toText(
      firstDefined(
        item.publishing_status,
        item.publication_status,
        item.status_publishing,
      ),
    ).toLowerCase(),
    demographics: normalizeArray(
      item.demographics !== undefined ? item.demographics : item.demographic,
    ),
    authors: normalizeAuthors(firstDefined(item.authors, item.author)),
    year: toInteger(item.year),
    genres: normalizeArray(item.genres),
    studios: normalizeArray(item.studios),
    poster: toText(firstDefined(item.poster, item.poster_url, item.image, item.cover)),
    description: toText(item.description),
    detailUrl: toText(firstDefined(item.detailUrl, item.detail_url, item.url)),
    watchUrl: toText(firstDefined(item.watchUrl, item.watch_url, item.read_url)),
  };
}

function migrateSeedCollection(payload, defaultMediaType) {
  if (Array.isArray(payload)) {
    return payload.map((item) => migrateSeedItem(item, defaultMediaType));
  }

  if (Array.isArray(payload?.items)) {
    return payload.items.map((item) => migrateSeedItem(item, defaultMediaType));
  }

  const anime = Array.isArray(payload?.anime)
    ? payload.anime.map((item) => migrateSeedItem(item, "anime"))
    : [];
  const manga = Array.isArray(payload?.manga)
    ? payload.manga.map((item) => migrateSeedItem(item, "manga"))
    : [];

  return [...anime, ...manga];
}

function readSeedFile(seedPath, defaultMediaType = "anime") {
  if (!seedPath || !fs.existsSync(seedPath)) return [];

  const raw = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  return migrateSeedCollection(raw, defaultMediaType);
}

function loadSeedEntries(seedSources) {
  const sources = Array.isArray(seedSources) ? seedSources : [];

  return sources.flatMap((source) => {
    if (typeof source === "string") {
      return readSeedFile(source, "anime");
    }

    return readSeedFile(source?.path, source?.mediaType || "anime");
  });
}

module.exports = {
  loadSeedEntries,
  migrateSeedCollection,
  migrateSeedItem,
};
