(function () {
  function toText(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function toInteger(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function normalizeGenres(value) {
    if (Array.isArray(value)) {
      return value.map((genre) => toText(genre)).filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((genre) => toText(genre))
        .filter(Boolean);
    }

    return [];
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

  function normalizeMediaType(value) {
    return toText(value).toLowerCase() === "manga" ? "manga" : "anime";
  }

  function getMediaStatus(item) {
    return toText(item?.user_status || item?.user_stauts || "").toLowerCase();
  }

  function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null);
  }

  function normalizeMediaItem(rawItem, options = {}) {
    const item = rawItem || {};
    const mediaType = normalizeMediaType(
      firstDefined(item.media_type, options.defaultMediaType),
    );
    const userStatus = getMediaStatus(item);
    const demographicsSource =
      item.demographics !== undefined ? item.demographics : item.demographic;

    return {
      id: toInteger(item.id),
      media_type: mediaType,
      title: toText(item.title),
      title_ru: toText(item.title_ru),
      type: toText(item.type),
      user_status: userStatus,
      user_stauts: userStatus,
      user_score: toInteger(item.user_score),
      shiki_score: toNumber(item.shiki_score),
      episodes: toInteger(item.episodes),
      chapters: toInteger(firstDefined(item.chapters, item.chapter_count)),
      volumes: toInteger(firstDefined(item.volumes, item.volume_count)),
      publishing_status: toText(
        firstDefined(
          item.publishing_status,
          item.publication_status,
          item.status_publishing,
        ),
      ).toLowerCase(),
      demographics: normalizeArray(demographicsSource),
      authors: normalizeAuthors(firstDefined(item.authors, item.author)),
      year: toInteger(item.year),
      genres: normalizeGenres(item.genres),
      studios: Array.isArray(item.studios)
        ? item.studios.map((studio) => toText(studio)).filter(Boolean)
        : [],
      poster: toText(
        firstDefined(item.poster, item.poster_url, item.image, item.cover),
      ),
      description: toText(item.description),
      detailUrl: toText(firstDefined(item.detailUrl, item.detail_url, item.url)),
      watchUrl: toText(firstDefined(item.watchUrl, item.watch_url, item.read_url)),
    };
  }

  function normalizeMediaItems(items, options = {}) {
    if (!Array.isArray(items)) return [];
    return items.map((item) => normalizeMediaItem(item, options));
  }

  function migrateSeedPayload(payload) {
    if (Array.isArray(payload)) {
      return normalizeMediaItems(payload);
    }

    if (Array.isArray(payload?.items)) {
      return normalizeMediaItems(payload.items);
    }

    const animeItems = normalizeMediaItems(payload?.anime, {
      defaultMediaType: "anime",
    });
    const mangaItems = normalizeMediaItems(payload?.manga, {
      defaultMediaType: "manga",
    });

    return [...animeItems, ...mangaItems];
  }

  window.MediaItemUtils = {
    getMediaStatus,
    migrateSeedPayload,
    normalizeMediaItem,
    normalizeMediaItems,
  };
})();
