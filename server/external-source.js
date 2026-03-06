function toText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function toInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeMediaType(value) {
  return toText(value).toLowerCase() === "manga" ? "manga" : "anime";
}

function createError(message, statusCode = 400, code = "EXTERNAL_SOURCE_ERROR") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function readYearFromDate(value) {
  const raw = toText(value);
  if (!raw) return null;
  const match = raw.match(/^(\d{4})/);
  if (!match) return null;
  return toInteger(match[1]);
}

function normalizePeople(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((person) => toText(person?.russian || person?.name))
    .filter(Boolean);
}

function normalizeNamedArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toText(item?.russian || item?.name))
    .filter(Boolean);
}

function extractMediaTypeFromPath(pathname) {
  const path = toText(pathname).toLowerCase();
  if (path.includes("/mangas/")) return "manga";
  if (path.includes("/animes/")) return "anime";
  return "";
}

function extractIdAndMediaType(source, mediaTypeHint = "") {
  const normalizedHint = toText(mediaTypeHint).toLowerCase();
  const hintMediaType =
    normalizedHint === "anime" || normalizedHint === "manga" ? normalizedHint : "";

  const asId = toInteger(source);
  if (asId !== null && asId > 0) {
    return {
      id: asId,
      media_type: hintMediaType || "anime",
    };
  }

  const sourceText = toText(source);
  let parsedUrl;

  try {
    parsedUrl = new URL(sourceText);
  } catch {
    throw createError("Не удалось распознать URL/ID источника", 400, "INVALID_SOURCE");
  }

  const mediaFromPath = extractMediaTypeFromPath(parsedUrl.pathname);
  const idMatch = parsedUrl.pathname.match(/\/(?:animes|mangas)\/(\d+)/i);
  const extractedId = idMatch ? toInteger(idMatch[1]) : null;

  if (!extractedId) {
    throw createError("В URL не найден ID тайтла", 400, "MISSING_SOURCE_ID");
  }

  return {
    id: extractedId,
    media_type: hintMediaType || mediaFromPath || "anime",
  };
}

function mapExternalPayload(payload, mediaType) {
  const source = payload || {};
  const year =
    readYearFromDate(source.aired_on) ||
    readYearFromDate(source.released_on) ||
    readYearFromDate(source.created_at);

  const collection = mediaType === "manga" ? "mangas" : "animes";

  return {
    id: toInteger(source.id),
    media_type: mediaType,
    title: toText(source.name),
    title_ru: toText(source.russian),
    type: toText(source.kind, mediaType === "manga" ? "manga" : "tv"),
    user_status: "planned",
    user_stauts: "planned",
    user_score: null,
    shiki_score: toNumber(source.score),
    episodes: toInteger(source.episodes),
    chapters: toInteger(source.chapters),
    volumes: toInteger(source.volumes),
    publishing_status: toText(source.status).toLowerCase(),
    demographics: normalizeNamedArray(source.demographics),
    authors: normalizePeople(source.mangakas || source.authors),
    year,
    genres: normalizeNamedArray(source.genres),
    studios: normalizeNamedArray(source.studios),
    poster: toText(source?.image?.original),
    description: toText(source.description),
    detailUrl: `https://shiki.one/${collection}/${toInteger(source.id) || ""}`,
    watchUrl: "",
  };
}

async function fetchExternalShikiItem({ source, mediaTypeHint = "" }) {
  const { id, media_type } = extractIdAndMediaType(source, mediaTypeHint);
  const collection = media_type === "manga" ? "mangas" : "animes";
  const endpoint = `https://shikimori.one/api/${collection}/${id}`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MyAnimeDataBase/1.0",
    },
  });

  if (response.status === 404) {
    throw createError("Тайтл во внешнем источнике не найден", 404, "EXTERNAL_NOT_FOUND");
  }

  if (!response.ok) {
    throw createError(
      `Внешний источник временно недоступен (HTTP ${response.status})`,
      502,
      "EXTERNAL_FETCH_FAILED",
    );
  }

  const payload = await response.json();
  return mapExternalPayload(payload, normalizeMediaType(media_type));
}

module.exports = {
  fetchExternalShikiItem,
};
