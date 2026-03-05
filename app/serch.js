const searchInput = document.getElementById("searchInput");
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
const filterShikiScoreToValue = document.getElementById(
  "filterShikiScoreToValue",
);
const filterShikiScoreProgress = document.getElementById(
  "filterShikiScoreProgress",
);
const filterUserScoreFrom = document.getElementById("filterUserScoreFrom");
const filterUserScoreTo = document.getElementById("filterUserScoreTo");
const filterUserScoreFromValue = document.getElementById(
  "filterUserScoreFromValue",
);
const filterUserScoreToValue = document.getElementById(
  "filterUserScoreToValue",
);
const filterUserScoreProgress = document.getElementById(
  "filterUserScoreProgress",
);
const filterStatus = document.getElementById("filterStatus");
const filterType = document.getElementById("filterType");
const filterGenre = document.getElementById("filterGenre");
const filtersResetBtn = document.getElementById("filtersResetBtn");
const filtersToggle = document.getElementById("filtersToggle");

let selectedGenres = new Set();

function getAnimeStatus(anime) {
  return anime?.user_status || anime?.user_stauts || "";
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
  const years = uniqueValues(data, (anime) => String(anime.year)).sort(
    (a, b) => Number(b) - Number(a),
  );

  const minYear =
    years.length > 0 ? Number.parseInt(years[years.length - 1], 10) : 1900;
  const maxYear =
    years.length > 0 ? Number.parseInt(years[0], 10) : new Date().getFullYear();

  if (filterYearFrom && filterYearTo) {
    filterYearFrom.min = String(minYear);
    filterYearFrom.max = String(maxYear);
    filterYearTo.min = String(minYear);
    filterYearTo.max = String(maxYear);
    filterYearFrom.value = String(minYear);
    filterYearTo.value = String(maxYear);
    syncYearRange("from");
  }

  const statuses = uniqueValues(data, (anime) => getAnimeStatus(anime)).sort(
    (a, b) => a.localeCompare(b, "ru"),
  );

  const types = uniqueValues(data, (anime) => anime.type).sort((a, b) =>
    a.localeCompare(b, "ru"),
  );

  const genres = [
    ...new Set(
      data
        .flatMap((anime) => (Array.isArray(anime.genres) ? anime.genres : []))
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "ru"));

  fillSelect(filterStatus, statuses);
  fillSelect(filterType, types);
  renderGenreCheckboxes(genres);
}

function applyAllFilters() {
  if (!Array.isArray(animeData)) return;

  const query = searchInput?.value.toLowerCase().trim() || "";
  const yearFrom = Number.parseInt(filterYearFrom?.value || "", 10);
  const yearTo = Number.parseInt(filterYearTo?.value || "", 10);
  const shikiFrom = Number.parseFloat(filterShikiScoreFrom?.value);
  const shikiTo = Number.parseFloat(filterShikiScoreTo?.value);
  const userFrom = Number.parseFloat(filterUserScoreFrom?.value);
  const userTo = Number.parseFloat(filterUserScoreTo?.value);
  const selectedStatus = filterStatus?.value || "";
  const selectedType = filterType?.value || "";
  const selectedGenresList = [...selectedGenres];

  currentList = animeData.filter((anime) => {
    const title = anime.title?.toLowerCase() || "";
    const titleRu = anime.title_ru?.toLowerCase() || "";
    const matchesSearch =
      !query || title.includes(query) || titleRu.includes(query);

    const animeYear = Number.parseInt(String(anime.year), 10);
    const matchesYear =
      (Number.isNaN(yearFrom) && Number.isNaN(yearTo)) ||
      (!Number.isNaN(animeYear) &&
        (Number.isNaN(yearFrom) || animeYear >= yearFrom) &&
        (Number.isNaN(yearTo) || animeYear <= yearTo));

    const shikiScore = Number.parseFloat(anime.shiki_score);
    const matchesShiki =
      (Number.isNaN(shikiFrom) && Number.isNaN(shikiTo)) ||
      (!Number.isNaN(shikiScore) &&
        (Number.isNaN(shikiFrom) || shikiScore >= shikiFrom) &&
        (Number.isNaN(shikiTo) || shikiScore <= shikiTo));

    const userScore = Number.parseFloat(anime.user_score);
    const matchesUser =
      (Number.isNaN(userFrom) && Number.isNaN(userTo)) ||
      (!Number.isNaN(userScore) &&
        (Number.isNaN(userFrom) || userScore >= userFrom) &&
        (Number.isNaN(userTo) || userScore <= userTo));

    const matchesStatus =
      !selectedStatus || getAnimeStatus(anime) === selectedStatus;
    const matchesType = !selectedType || anime.type === selectedType;
    const matchesGenre =
      selectedGenresList.length === 0 ||
      (Array.isArray(anime.genres) &&
        selectedGenresList.every((genre) => anime.genres.includes(genre)));

    return (
      matchesSearch &&
      matchesYear &&
      matchesShiki &&
      matchesUser &&
      matchesStatus &&
      matchesType &&
      matchesGenre
    );
  });

  if (typeof currentPage !== "undefined") {
    currentPage = 1;
  }

  if (typeof renderPage === "function") {
    renderPage(currentList);
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

    applyAllFilters();
  });
}

syncYearRange("from");
syncShikiRange("from");
syncUserRange("from");

if (filtersToggle) {
  setFiltersPanelState(false);

  filtersToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.contains("filters-open");
    setFiltersPanelState(!isOpen);
  });
}
