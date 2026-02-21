const searchInput = document.getElementById("searchInput");
const filterYear = document.getElementById("filterYear");
const filterShikiScore = document.getElementById("filterShikiScore");
const filterUserScore = document.getElementById("filterUserScore");
const filterStatus = document.getElementById("filterStatus");
const filterType = document.getElementById("filterType");
const filterGenre = document.getElementById("filterGenre");
const filtersResetBtn = document.getElementById("filtersResetBtn");

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

function initializeFilters(data) {
  const years = uniqueValues(data, (anime) => String(anime.year)).sort(
    (a, b) => Number(b) - Number(a),
  );

  const statuses = uniqueValues(data, (anime) => anime.user_stauts).sort(
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

  fillSelect(filterYear, years);
  fillSelect(filterStatus, statuses);
  fillSelect(filterType, types);
  fillSelect(filterGenre, genres);
}

function applyAllFilters() {
  if (!Array.isArray(animeData)) return;

  const query = searchInput?.value.toLowerCase().trim() || "";
  const selectedYear = filterYear?.value || "";
  const shikiMin = Number.parseFloat(filterShikiScore?.value);
  const userMin = Number.parseFloat(filterUserScore?.value);
  const selectedStatus = filterStatus?.value || "";
  const selectedType = filterType?.value || "";
  const selectedGenre = filterGenre?.value || "";

  currentList = animeData.filter((anime) => {
    const title = anime.title?.toLowerCase() || "";
    const titleRu = anime.title_ru?.toLowerCase() || "";
    const matchesSearch =
      !query || title.includes(query) || titleRu.includes(query);

    const matchesYear = !selectedYear || String(anime.year) === selectedYear;

    const shikiScore = Number.parseFloat(anime.shiki_score);
    const matchesShiki =
      Number.isNaN(shikiMin) ||
      (!Number.isNaN(shikiScore) && shikiScore >= shikiMin);

    const userScore = Number.parseFloat(anime.user_score);
    const matchesUser =
      Number.isNaN(userMin) ||
      (!Number.isNaN(userScore) && userScore >= userMin);

    const matchesStatus =
      !selectedStatus || anime.user_stauts === selectedStatus;
    const matchesType = !selectedType || anime.type === selectedType;
    const matchesGenre =
      !selectedGenre ||
      (Array.isArray(anime.genres) && anime.genres.includes(selectedGenre));

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

if (searchInput) {
  searchInput.addEventListener("input", applyAllFilters);
}

if (filterYear) {
  filterYear.addEventListener("change", applyAllFilters);
}

if (filterShikiScore) {
  filterShikiScore.addEventListener("input", applyAllFilters);
}

if (filterUserScore) {
  filterUserScore.addEventListener("input", applyAllFilters);
}

if (filterStatus) {
  filterStatus.addEventListener("change", applyAllFilters);
}

if (filterType) {
  filterType.addEventListener("change", applyAllFilters);
}

if (filterGenre) {
  filterGenre.addEventListener("change", applyAllFilters);
}

if (filtersResetBtn) {
  filtersResetBtn.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (filterYear) filterYear.value = "";
    if (filterShikiScore) filterShikiScore.value = "";
    if (filterUserScore) filterUserScore.value = "";
    if (filterStatus) filterStatus.value = "";
    if (filterType) filterType.value = "";
    if (filterGenre) filterGenre.value = "";

    applyAllFilters();
  });
}
