(function () {
  function parseInteger(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function parseFloatNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number.parseFloat(String(value));
    return Number.isNaN(parsed) ? null : parsed;
  }

  function getTotalPages(totalItems, pageSize) {
    if (!Number.isFinite(pageSize) || pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }

  function clampPage(page, totalPages) {
    return Math.min(Math.max(1, page), totalPages);
  }

  function paginateItems(items, page, pageSize) {
    const list = Array.isArray(items) ? items : [];
    const totalPages = getTotalPages(list.length, pageSize);
    const safePage = clampPage(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }

  function matchesNumberRange(value, from, to) {
    const parsed = parseFloatNumber(value);
    if (from === null && to === null) return true;
    if (parsed === null) return false;

    if (from !== null && parsed < from) return false;
    if (to !== null && parsed > to) return false;
    return true;
  }

  function matchesIntegerRange(value, from, to) {
    const parsed = parseInteger(value);
    if (from === null && to === null) return true;
    if (parsed === null) return false;

    if (from !== null && parsed < from) return false;
    if (to !== null && parsed > to) return false;
    return true;
  }

  function filterMediaItems(items, criteria) {
    const list = Array.isArray(items) ? items : [];
    const query = String(criteria?.query || "").toLowerCase().trim();
    const selectedStatus = String(criteria?.status || "").toLowerCase();
    const selectedType = String(criteria?.type || "").toLowerCase();
    const selectedMediaType = String(criteria?.media_type || "").toLowerCase();
    const selectedGenres = Array.isArray(criteria?.genres)
      ? criteria.genres.filter(Boolean)
      : [];

    const yearFrom = parseInteger(criteria?.yearFrom);
    const yearTo = parseInteger(criteria?.yearTo);
    const shikiFrom = parseFloatNumber(criteria?.shikiFrom);
    const shikiTo = parseFloatNumber(criteria?.shikiTo);
    const userFrom = parseFloatNumber(criteria?.userFrom);
    const userTo = parseFloatNumber(criteria?.userTo);
    const chaptersFrom = parseInteger(criteria?.chaptersFrom);
    const chaptersTo = parseInteger(criteria?.chaptersTo);
    const volumesFrom = parseInteger(criteria?.volumesFrom);
    const volumesTo = parseInteger(criteria?.volumesTo);

    return list.filter((item) => {
      const title = String(item?.title || "").toLowerCase();
      const titleRu = String(item?.title_ru || "").toLowerCase();
      const matchesSearch =
        !query || title.includes(query) || titleRu.includes(query);

      const status =
        window.MediaItemUtils?.getMediaStatus(item) ||
        String(item?.user_status || item?.user_stauts || "").toLowerCase();

      const itemType = String(item?.type || "").toLowerCase();
      const itemMediaType = String(item?.media_type || "anime").toLowerCase();
      const itemGenres = Array.isArray(item?.genres) ? item.genres : [];

      const matchesStatus = !selectedStatus || status === selectedStatus;
      const matchesType = !selectedType || itemType === selectedType;
      const matchesMediaType =
        !selectedMediaType || itemMediaType === selectedMediaType;
      const matchesGenres =
        selectedGenres.length === 0 ||
        selectedGenres.every((genre) => itemGenres.includes(genre));
      const matchesYear = matchesIntegerRange(item?.year, yearFrom, yearTo);
      const matchesShiki = matchesNumberRange(
        item?.shiki_score,
        shikiFrom,
        shikiTo,
      );
      const matchesUser = matchesNumberRange(item?.user_score, userFrom, userTo);
      const matchesChapters =
        selectedMediaType !== "manga" ||
        matchesIntegerRange(item?.chapters, chaptersFrom, chaptersTo);
      const matchesVolumes =
        selectedMediaType !== "manga" ||
        matchesIntegerRange(item?.volumes, volumesFrom, volumesTo);

      return (
        matchesSearch &&
        matchesYear &&
        matchesShiki &&
        matchesUser &&
        matchesChapters &&
        matchesVolumes &&
        matchesStatus &&
        matchesType &&
        matchesMediaType &&
        matchesGenres
      );
    });
  }

  window.ListUtils = {
    clampPage,
    filterMediaItems,
    getTotalPages,
    paginateItems,
  };
})();
