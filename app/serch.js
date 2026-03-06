const searchInput = document.getElementById("searchInput");
const tabAnime = document.getElementById("tabAnime");
const tabManga = document.getElementById("tabManga");

const filterYearFrom = document.getElementById("filterYearFrom");
const filterYearTo = document.getElementById("filterYearTo");
const filterYearFromValue = document.getElementById("filterYearFromValue");
const filterYearToValue = document.getElementById("filterYearToValue");
const filterYearProgress = document.getElementById("filterYearProgress");

const filterShikiScoreFrom = document.getElementById("filterShikiScoreFrom");
const filterShikiScoreTo = document.getElementById("filterShikiScoreTo");
const filterShikiScoreFromValue = document.getElementById(
  "filterShikiScoreFromValue",
);
const filterShikiScoreToValue = document.getElementById("filterShikiScoreToValue");
const filterShikiScoreProgress = document.getElementById("filterShikiScoreProgress");

const filterUserScoreFrom = document.getElementById("filterUserScoreFrom");
const filterUserScoreTo = document.getElementById("filterUserScoreTo");
const filterUserScoreFromValue = document.getElementById("filterUserScoreFromValue");
const filterUserScoreToValue = document.getElementById("filterUserScoreToValue");
const filterUserScoreProgress = document.getElementById("filterUserScoreProgress");

const filterChaptersField = document.getElementById("filterChaptersField");
const filterChaptersFrom = document.getElementById("filterChaptersFrom");
const filterChaptersTo = document.getElementById("filterChaptersTo");
const filterChaptersFromValue = document.getElementById("filterChaptersFromValue");
const filterChaptersToValue = document.getElementById("filterChaptersToValue");
const filterChaptersProgress = document.getElementById("filterChaptersProgress");

const filterVolumesField = document.getElementById("filterVolumesField");
const filterVolumesFrom = document.getElementById("filterVolumesFrom");
const filterVolumesTo = document.getElementById("filterVolumesTo");
const filterVolumesFromValue = document.getElementById("filterVolumesFromValue");
const filterVolumesToValue = document.getElementById("filterVolumesToValue");
const filterVolumesProgress = document.getElementById("filterVolumesProgress");

const filterStatus = document.getElementById("filterStatus");
const filterType = document.getElementById("filterType");
const filterGenre = document.getElementById("filterGenre");
const filtersResetBtn = document.getElementById("filtersResetBtn");
const filtersToggle = document.getElementById("filtersToggle");

let selectedGenres = new Set();

function getItemStatus(item) {
  if (window.MediaItemUtils?.getMediaStatus) {
    return window.MediaItemUtils.getMediaStatus(item);
  }

  return String(item?.user_status || item?.user_stauts || "").toLowerCase();
}

function getItemMediaType(item) {
  return String(item?.media_type || "anime").toLowerCase() === "manga"
    ? "manga"
    : "anime";
}

function getActiveMediaType() {
  const active = String(window.catalogState?.activeMediaType || "anime").toLowerCase();
  return active === "manga" ? "manga" : "anime";
}

function getScopedItems(data) {
  const mediaType = getActiveMediaType();
  return data.filter((item) => getItemMediaType(item) === mediaType);
}

function setFiltersPanelState(isOpen) {
  document.body.classList.toggle("filters-open", isOpen);

  if (!filtersToggle) return;

  filtersToggle.setAttribute("aria-expanded", String(isOpen));
  filtersToggle.setAttribute(
    "aria-label",
    isOpen ? "Скрыть фильтры" : "Открыть фильтры",
  );
  filtersToggle.textContent = isOpen ? "▶" : "◀";
}

function toggleMangaFilters(isManga) {
  if (filterChaptersField) filterChaptersField.hidden = !isManga;
  if (filterVolumesField) filterVolumesField.hidden = !isManga;
}

function syncRangeValues(
  fromEl,
  toEl,
  fromTextEl,
  toTextEl,
  progressEl,
  precision,
  active,
) {
  if (!fromEl || !toEl) return;

  let fromValue = Number.parseFloat(fromEl.value);
  let toValue = Number.parseFloat(toEl.value);
  const min = Number.parseFloat(fromEl.min) || 0;
  const max = Number.parseFloat(fromEl.max) || 10;

  if (Number.isNaN(fromValue)) fromValue = min;
  if (Number.isNaN(toValue)) toValue = max;

  fromValue = Math.min(Math.max(fromValue, min), max);
  toValue = Math.min(Math.max(toValue, min), max);

  if (fromValue > toValue) {
    if (active === "from") {
      toValue = fromValue;
    } else {
      fromValue = toValue;
    }
  }

  fromEl.value = String(fromValue);
  toEl.value = String(toValue);

  if (fromTextEl) {
    fromTextEl.textContent = fromValue.toFixed(precision);
  }

  if (toTextEl) {
    toTextEl.textContent = toValue.toFixed(precision);
  }

  if (progressEl) {
    const range = max - min || 1;
    const left = ((fromValue - min) / range) * 100;
    const right = ((toValue - min) / range) * 100;
    progressEl.style.left = `${left}%`;
    progressEl.style.width = `${Math.max(0, right - left)}%`;
  }
}

function syncYearRange(active) {
  syncRangeValues(
    filterYearFrom,
    filterYearTo,
    filterYearFromValue,
    filterYearToValue,
    filterYearProgress,
    0,
    active,
  );
}

function syncShikiRange(active) {
  syncRangeValues(
    filterShikiScoreFrom,
    filterShikiScoreTo,
    filterShikiScoreFromValue,
    filterShikiScoreToValue,
    filterShikiScoreProgress,
    1,
    active,
  );
}

function syncUserRange(active) {
  syncRangeValues(
    filterUserScoreFrom,
    filterUserScoreTo,
    filterUserScoreFromValue,
    filterUserScoreToValue,
    filterUserScoreProgress,
    0,
    active,
  );
}

function syncChaptersRange(active) {
  syncRangeValues(
    filterChaptersFrom,
    filterChaptersTo,
    filterChaptersFromValue,
    filterChaptersToValue,
    filterChaptersProgress,
    0,
    active,
  );
}

function syncVolumesRange(active) {
  syncRangeValues(
    filterVolumesFrom,
    filterVolumesTo,
    filterVolumesFromValue,
    filterVolumesToValue,
    filterVolumesProgress,
    0,
    active,
  );
}

function getNumericBounds(data, accessor, defaultMin, defaultMax) {
  const values = data
    .map((item) => Number.parseInt(String(accessor(item)), 10))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return { min: defaultMin, max: defaultMax };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function fillSelect(selectEl, values) {
  if (!selectEl) return;

  const firstOption = selectEl.querySelector('option[value=""]');
  const defaultText = firstOption ? firstOption.textContent : "Все";

  selectEl.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultText;
  selectEl.appendChild(defaultOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  });
}

function uniqueValues(data, getValue) {
  return [...new Set(data.map(getValue).filter(Boolean))];
}

function renderGenreCheckboxes(genres) {
  if (!filterGenre) return;

  filterGenre.innerHTML = "";

  genres.forEach((genre) => {
    const label = document.createElement("label");
    label.className = "filters__genre-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = genre;
    checkbox.name = "genre";
    checkbox.checked = selectedGenres.has(genre);

    const text = document.createElement("span");
    text.textContent = genre;

    label.appendChild(checkbox);
    label.appendChild(text);
    filterGenre.appendChild(label);
  });
}

function initializeFilters(data) {
  const scopedData = getScopedItems(Array.isArray(data) ? data : []);
  const isManga = getActiveMediaType() === "manga";

  toggleMangaFilters(isManga);
  selectedGenres.clear();

  const yearBounds = getNumericBounds(
    scopedData,
    (item) => item?.year,
    1900,
    new Date().getFullYear(),
  );

  if (filterYearFrom && filterYearTo) {
    filterYearFrom.min = String(yearBounds.min);
    filterYearFrom.max = String(yearBounds.max);
    filterYearTo.min = String(yearBounds.min);
    filterYearTo.max = String(yearBounds.max);
    filterYearFrom.value = String(yearBounds.min);
    filterYearTo.value = String(yearBounds.max);
    syncYearRange("from");
  }

  const chapterBounds = getNumericBounds(scopedData, (item) => item?.chapters, 0, 5000);
  if (filterChaptersFrom && filterChaptersTo) {
    filterChaptersFrom.min = String(chapterBounds.min);
    filterChaptersFrom.max = String(chapterBounds.max);
    filterChaptersTo.min = String(chapterBounds.min);
    filterChaptersTo.max = String(chapterBounds.max);
    filterChaptersFrom.value = String(chapterBounds.min);
    filterChaptersTo.value = String(chapterBounds.max);
    syncChaptersRange("from");
  }

  const volumeBounds = getNumericBounds(scopedData, (item) => item?.volumes, 0, 200);
  if (filterVolumesFrom && filterVolumesTo) {
    filterVolumesFrom.min = String(volumeBounds.min);
    filterVolumesFrom.max = String(volumeBounds.max);
    filterVolumesTo.min = String(volumeBounds.min);
    filterVolumesTo.max = String(volumeBounds.max);
    filterVolumesFrom.value = String(volumeBounds.min);
    filterVolumesTo.value = String(volumeBounds.max);
    syncVolumesRange("from");
  }

  if (filterShikiScoreFrom) filterShikiScoreFrom.value = "0";
  if (filterShikiScoreTo) filterShikiScoreTo.value = "10";
  if (filterUserScoreFrom) filterUserScoreFrom.value = "0";
  if (filterUserScoreTo) filterUserScoreTo.value = "10";
  syncShikiRange("from");
  syncUserRange("from");

  const statuses = uniqueValues(scopedData, (item) => getItemStatus(item)).sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
  const types = uniqueValues(scopedData, (item) => item.type).sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
  const genres = [
    ...new Set(
      scopedData
        .flatMap((item) => (Array.isArray(item.genres) ? item.genres : []))
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "ru"));

  fillSelect(filterStatus, statuses);
  fillSelect(filterType, types);
  renderGenreCheckboxes(genres);

  if (filterStatus) filterStatus.value = "";
  if (filterType) filterType.value = "";
}

function matchesRange(value, from, to) {
  const numeric = Number.parseFloat(String(value));
  const fromValue = from === "" ? null : Number.parseFloat(String(from));
  const toValue = to === "" ? null : Number.parseFloat(String(to));

  if (fromValue === null && toValue === null) return true;
  if (Number.isNaN(numeric)) return false;
  if (fromValue !== null && !Number.isNaN(fromValue) && numeric < fromValue) {
    return false;
  }
  if (toValue !== null && !Number.isNaN(toValue) && numeric > toValue) {
    return false;
  }

  return true;
}

function getRangeCriteria(fromEl, toEl) {
  const fromValue = fromEl?.value ?? "";
  const toValue = toEl?.value ?? "";
  const minValue = fromEl?.min ?? "";
  const maxValue = toEl?.max ?? "";

  const isDefaultRange = fromValue === minValue && toValue === maxValue;
  if (isDefaultRange) {
    return { from: "", to: "" };
  }

  return {
    from: fromValue,
    to: toValue,
  };
}

function applyAllFilters() {
  if (!Array.isArray(animeData)) return;

  const mediaType = getActiveMediaType();
  const query = searchInput?.value || "";
  const yearRange = getRangeCriteria(filterYearFrom, filterYearTo);
  const shikiRange = getRangeCriteria(filterShikiScoreFrom, filterShikiScoreTo);
  const userRange = getRangeCriteria(filterUserScoreFrom, filterUserScoreTo);
  const chaptersRange = getRangeCriteria(filterChaptersFrom, filterChaptersTo);
  const volumesRange = getRangeCriteria(filterVolumesFrom, filterVolumesTo);

  const yearFrom = yearRange.from;
  const yearTo = yearRange.to;
  const shikiFrom = shikiRange.from;
  const shikiTo = shikiRange.to;
  const userFrom = userRange.from;
  const userTo = userRange.to;
  const chaptersFrom = chaptersRange.from;
  const chaptersTo = chaptersRange.to;
  const volumesFrom = volumesRange.from;
  const volumesTo = volumesRange.to;
  const selectedStatus = filterStatus?.value || "";
  const selectedType = filterType?.value || "";
  const selectedGenresList = [...selectedGenres];

  if (window.ListUtils?.filterMediaItems) {
    currentList = window.ListUtils.filterMediaItems(animeData, {
      query,
      media_type: mediaType,
      yearFrom,
      yearTo,
      shikiFrom,
      shikiTo,
      userFrom,
      userTo,
      chaptersFrom,
      chaptersTo,
      volumesFrom,
      volumesTo,
      status: selectedStatus,
      type: selectedType,
      genres: selectedGenresList,
    });
  } else {
    currentList = animeData.filter((item) => {
      const title = String(item?.title || "").toLowerCase();
      const titleRu = String(item?.title_ru || "").toLowerCase();
      const preparedQuery = query.toLowerCase().trim();
      const matchesSearch =
        !preparedQuery || title.includes(preparedQuery) || titleRu.includes(preparedQuery);

      const matchesMediaType = getItemMediaType(item) === mediaType;
      const matchesStatus = !selectedStatus || getItemStatus(item) === selectedStatus;
      const matchesType = !selectedType || item.type === selectedType;
      const matchesGenre =
        selectedGenresList.length === 0 ||
        (Array.isArray(item.genres) &&
          selectedGenresList.every((genre) => item.genres.includes(genre)));
      const matchesYear = matchesRange(item?.year, yearFrom, yearTo);
      const matchesShiki = matchesRange(item?.shiki_score, shikiFrom, shikiTo);
      const matchesUser = matchesRange(item?.user_score, userFrom, userTo);
      const matchesChapters =
        mediaType !== "manga" || matchesRange(item?.chapters, chaptersFrom, chaptersTo);
      const matchesVolumes =
        mediaType !== "manga" || matchesRange(item?.volumes, volumesFrom, volumesTo);

      return (
        matchesSearch &&
        matchesMediaType &&
        matchesYear &&
        matchesShiki &&
        matchesUser &&
        matchesStatus &&
        matchesType &&
        matchesGenre &&
        matchesChapters &&
        matchesVolumes
      );
    });
  }

  if (typeof currentPage !== "undefined") {
    currentPage = 1;
  }

  if (typeof renderPage === "function") {
    renderPage(currentList);
  }
}

function setActiveMediaType(nextType) {
  const mediaType = String(nextType || "anime").toLowerCase() === "manga" ? "manga" : "anime";

  window.catalogState = window.catalogState || {
    activeMediaType: "anime",
    activePage: "catalog",
    statsSlice: "all",
  };

  window.catalogState.activeMediaType = mediaType;
  window.catalogState.activePage = "catalog";

  if (tabAnime) {
    tabAnime.classList.toggle("site-nav__link--active", mediaType === "anime");
  }

  if (tabManga) {
    tabManga.classList.toggle("site-nav__link--active", mediaType === "manga");
  }

  if (searchInput) {
    searchInput.placeholder = mediaType === "manga" ? "Поиск манги..." : "Поиск аниме...";
  }

  toggleMangaFilters(mediaType === "manga");

  if (Array.isArray(animeData)) {
    initializeFilters(animeData);
    applyAllFilters();
  }
}

function debounce(callback, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}

const debouncedApplyAllFilters = debounce(applyAllFilters, 150);

if (searchInput) {
  searchInput.addEventListener("input", debouncedApplyAllFilters);
}

if (tabAnime) {
  tabAnime.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveMediaType("anime");
  });
}

if (tabManga) {
  tabManga.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveMediaType("manga");
  });
}

if (filterYearFrom) {
  filterYearFrom.addEventListener("input", () => {
    syncYearRange("from");
    applyAllFilters();
  });
}

if (filterYearTo) {
  filterYearTo.addEventListener("input", () => {
    syncYearRange("to");
    applyAllFilters();
  });
}

if (filterShikiScoreFrom) {
  filterShikiScoreFrom.addEventListener("input", () => {
    syncShikiRange("from");
    applyAllFilters();
  });
}

if (filterShikiScoreTo) {
  filterShikiScoreTo.addEventListener("input", () => {
    syncShikiRange("to");
    applyAllFilters();
  });
}

if (filterUserScoreFrom) {
  filterUserScoreFrom.addEventListener("input", () => {
    syncUserRange("from");
    applyAllFilters();
  });
}

if (filterUserScoreTo) {
  filterUserScoreTo.addEventListener("input", () => {
    syncUserRange("to");
    applyAllFilters();
  });
}

if (filterChaptersFrom) {
  filterChaptersFrom.addEventListener("input", () => {
    syncChaptersRange("from");
    applyAllFilters();
  });
}

if (filterChaptersTo) {
  filterChaptersTo.addEventListener("input", () => {
    syncChaptersRange("to");
    applyAllFilters();
  });
}

if (filterVolumesFrom) {
  filterVolumesFrom.addEventListener("input", () => {
    syncVolumesRange("from");
    applyAllFilters();
  });
}

if (filterVolumesTo) {
  filterVolumesTo.addEventListener("input", () => {
    syncVolumesRange("to");
    applyAllFilters();
  });
}

if (filterStatus) {
  filterStatus.addEventListener("change", applyAllFilters);
}

if (filterType) {
  filterType.addEventListener("change", applyAllFilters);
}

if (filterGenre) {
  filterGenre.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name !== "genre") return;

    if (target.checked) {
      selectedGenres.add(target.value);
    } else {
      selectedGenres.delete(target.value);
    }

    applyAllFilters();
  });
}

if (filtersResetBtn) {
  filtersResetBtn.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";

    if (filterYearFrom && filterYearTo) {
      filterYearFrom.value = filterYearFrom.min || "1900";
      filterYearTo.value = filterYearTo.max || String(new Date().getFullYear());
    }

    if (filterShikiScoreFrom) filterShikiScoreFrom.value = "0";
    if (filterShikiScoreTo) filterShikiScoreTo.value = "10";
    if (filterUserScoreFrom) filterUserScoreFrom.value = "0";
    if (filterUserScoreTo) filterUserScoreTo.value = "10";

    if (filterChaptersFrom && filterChaptersTo) {
      filterChaptersFrom.value = filterChaptersFrom.min || "0";
      filterChaptersTo.value = filterChaptersTo.max || "5000";
    }

    if (filterVolumesFrom && filterVolumesTo) {
      filterVolumesFrom.value = filterVolumesFrom.min || "0";
      filterVolumesTo.value = filterVolumesTo.max || "200";
    }

    if (filterStatus) filterStatus.value = "";
    if (filterType) filterType.value = "";

    selectedGenres.clear();

    if (filterGenre) {
      const checkboxes = filterGenre.querySelectorAll('input[name="genre"]');
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    }

    syncYearRange("from");
    syncShikiRange("from");
    syncUserRange("from");
    syncChaptersRange("from");
    syncVolumesRange("from");

    applyAllFilters();
  });
}

syncYearRange("from");
syncShikiRange("from");
syncUserRange("from");
syncChaptersRange("from");
syncVolumesRange("from");
setActiveMediaType(getActiveMediaType());

if (filtersToggle) {
  setFiltersPanelState(false);

  filtersToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.contains("filters-open");
    setFiltersPanelState(!isOpen);
  });
}
