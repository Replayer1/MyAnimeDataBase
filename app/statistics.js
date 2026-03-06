(() => {
  const CACHE_KEY = "myanimedb-stats-cache-v1";
  const VIEW_CATALOG = "catalog";
  const VIEW_STATISTICS = "statistics";
  const SLICE_ALL = "all";
  const SLICE_ANIME = "anime";
  const SLICE_MANGA = "manga";

  const tabAnime = document.getElementById("tabAnime");
  const tabManga = document.getElementById("tabManga");
  const tabStats = document.getElementById("tabStats");
  const tabAdd = document.getElementById("tabAdd");
  const searchInput = document.getElementById("searchInput");
  const contentContainer = document.getElementById("content-container");
  const pagination = document.getElementById("pagination");
  const statisticsPage = document.getElementById("statisticsPage");
  const sliceSwitch = document.getElementById("statsSliceSwitch");

  const totalTitlesEl = document.getElementById("statsTotalTitles");
  const avgUserScoreEl = document.getElementById("statsAvgUserScore");
  const ratedTitlesEl = document.getElementById("statsRatedTitles");
  const cacheInfoEl = document.getElementById("statsCacheInfo");

  const statusCanvas = document.getElementById("statsStatusChart");
  const yearCanvas = document.getElementById("statsYearChart");
  const genreCanvas = document.getElementById("statsGenreChart");
  const themeToggle = document.getElementById("themeToggle");

  const STATUS_LABELS = {
    completed: "Завершено",
    watching: "Смотрю",
    reading: "Читаю",
    planned: "В планах",
    dropped: "Брошено",
    on_hold: "Пауза",
    unknown: "Без статуса",
  };

  let allItems = [];
  let memoryCache = null;
  let activeSlice = SLICE_ALL;
  let chartStatus = null;
  let chartYears = null;
  let chartGenres = null;

  function ensureCatalogState() {
    if (!window.catalogState) {
      window.catalogState = {
        activeMediaType: "anime",
        activePage: VIEW_CATALOG,
        statsSlice: SLICE_ALL,
      };
    }

    if (!window.catalogState.activeMediaType) {
      window.catalogState.activeMediaType = "anime";
    }

    if (!window.catalogState.activePage) {
      window.catalogState.activePage = VIEW_CATALOG;
    }

    if (!window.catalogState.statsSlice) {
      window.catalogState.statsSlice = SLICE_ALL;
    }
  }

  function getItemMediaType(item) {
    return String(item?.media_type || "anime").toLowerCase() === "manga"
      ? SLICE_MANGA
      : SLICE_ANIME;
  }

  function getItemStatus(item) {
    const raw =
      window.MediaItemUtils?.getMediaStatus(item) ||
      String(item?.user_status || item?.user_stauts || "").toLowerCase();

    return raw || "unknown";
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function getSignature(items) {
    const list = Array.isArray(items) ? items : [];
    let checksum = 0;

    list.forEach((item, index) => {
      const id = toNumber(item?.id) || 0;
      const year = toNumber(item?.year) || 0;
      const userScore = Math.round((toNumber(item?.user_score) || 0) * 10);
      const genreCount = Array.isArray(item?.genres) ? item.genres.length : 0;
      const mediaWeight = getItemMediaType(item) === SLICE_MANGA ? 19 : 11;
      checksum =
        (checksum + id * 3 + year * 5 + userScore * 7 + genreCount * mediaWeight + index) %
        2147483647;
    });

    return `v1:${list.length}:${checksum}`;
  }

  function getStatusLabel(status) {
    if (STATUS_LABELS[status]) return STATUS_LABELS[status];
    return status.replaceAll("_", " ") || STATUS_LABELS.unknown;
  }

  function aggregateSlice(items) {
    const list = Array.isArray(items) ? items : [];
    const statusMap = new Map();
    const yearMap = new Map();
    const genreMap = new Map();
    let scoreSum = 0;
    let scoreCount = 0;

    list.forEach((item) => {
      const status = getItemStatus(item);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);

      const year = Math.trunc(toNumber(item?.year) || 0);
      if (year > 0) {
        yearMap.set(year, (yearMap.get(year) || 0) + 1);
      }

      const score = toNumber(item?.user_score);
      if (score !== null && score >= 0 && score <= 10) {
        scoreSum += score;
        scoreCount += 1;
      }

      const genres = Array.isArray(item?.genres) ? item.genres : [];
      genres.forEach((genre) => {
        const name = String(genre || "").trim();
        if (!name) return;
        genreMap.set(name, (genreMap.get(name) || 0) + 1);
      });
    });

    const statusesSorted = [...statusMap.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], "ru");
    });

    const yearsSorted = [...yearMap.entries()].sort((a, b) => a[0] - b[0]);

    const genresSorted = [...genreMap.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0], "ru");
      })
      .slice(0, 10);

    return {
      totalTitles: list.length,
      avgUserScore:
        scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 100) / 100 : null,
      ratedTitles: scoreCount,
      statusDistribution: {
        labels: statusesSorted.map(([status]) => getStatusLabel(status)),
        values: statusesSorted.map(([, count]) => count),
      },
      yearDistribution: {
        labels: yearsSorted.map(([year]) => String(year)),
        values: yearsSorted.map(([, count]) => count),
      },
      topGenres: {
        labels: genresSorted.map(([genre]) => genre),
        values: genresSorted.map(([, count]) => count),
      },
    };
  }

  function buildAllSlices(items) {
    const list = Array.isArray(items) ? items : [];
    const anime = list.filter((item) => getItemMediaType(item) === SLICE_ANIME);
    const manga = list.filter((item) => getItemMediaType(item) === SLICE_MANGA);

    return {
      all: aggregateSlice(list),
      anime: aggregateSlice(anime),
      manga: aggregateSlice(manga),
    };
  }

  function getCachedSlices(items) {
    const signature = getSignature(items);

    if (memoryCache && memoryCache.signature === signature) {
      return {
        source: "memory",
        updatedAt: memoryCache.updatedAt,
        slices: memoryCache.slices,
      };
    }

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.signature === signature && parsed?.slices) {
          memoryCache = parsed;
          return {
            source: "localStorage",
            updatedAt: parsed.updatedAt,
            slices: parsed.slices,
          };
        }
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }

    const payload = {
      signature,
      updatedAt: Date.now(),
      slices: buildAllSlices(items),
    };

    memoryCache = payload;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // ignore localStorage write issues
    }

    return {
      source: "fresh",
      updatedAt: payload.updatedAt,
      slices: payload.slices,
    };
  }

  function formatCacheSource(source) {
    if (source === "memory") return "оперативный кеш";
    if (source === "localStorage") return "localStorage кеш";
    return "пересчитано";
  }

  function getThemeValues() {
    const styles = getComputedStyle(document.body);
    return {
      text: styles.getPropertyValue("--text-color").trim() || "#e7edf9",
      muted: styles.getPropertyValue("--text-muted").trim() || "#b2bfdb",
      border: styles.getPropertyValue("--border-color").trim() || "#6d7a97",
      accent: styles.getPropertyValue("--accent").trim() || "#68a2ff",
      accentStrong:
        styles.getPropertyValue("--accent-strong").trim() || "#3b82f6",
    };
  }

  function getPalette() {
    return [
      "#34e062",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#14b8a6",
      "#f97316",
      "#22c55e",
      "#e11d48",
      "#0ea5e9",
      "#a855f7",
      "#64748b",
    ];
  }

  function setButtonsState(slice) {
    if (!sliceSwitch) return;

    const buttons = sliceSwitch.querySelectorAll("[data-stats-slice]");
    buttons.forEach((button) => {
      const isActive = button.getAttribute("data-stats-slice") === slice;
      button.classList.toggle("statistics-slice-switch__btn--active", isActive);
    });
  }

  function updateKpi(aggregate) {
    if (totalTitlesEl) {
      totalTitlesEl.textContent = String(aggregate?.totalTitles || 0);
    }

    if (avgUserScoreEl) {
      avgUserScoreEl.textContent =
        aggregate?.avgUserScore === null || aggregate?.avgUserScore === undefined
          ? "-"
          : aggregate.avgUserScore.toFixed(2);
    }

    if (ratedTitlesEl) {
      ratedTitlesEl.textContent = String(aggregate?.ratedTitles || 0);
    }
  }

  function destroyCharts() {
    if (chartStatus) {
      chartStatus.destroy();
      chartStatus = null;
    }

    if (chartYears) {
      chartYears.destroy();
      chartYears = null;
    }

    if (chartGenres) {
      chartGenres.destroy();
      chartGenres = null;
    }
  }

  function withFallbackChartData(labels, values, fallbackLabel = "Нет данных") {
    if (labels.length > 0 && values.length > 0) {
      return { labels, values };
    }

    return {
      labels: [fallbackLabel],
      values: [1],
    };
  }

  function renderCharts(aggregate) {
    destroyCharts();

    if (typeof window.Chart !== "function") {
      if (cacheInfoEl) {
        const existing = cacheInfoEl.textContent ? `${cacheInfoEl.textContent}. ` : "";
        cacheInfoEl.textContent = `${existing}Chart.js не загружен, графики недоступны.`;
      }
      return;
    }

    const theme = getThemeValues();
    const palette = getPalette();

    const status = withFallbackChartData(
      aggregate?.statusDistribution?.labels || [],
      aggregate?.statusDistribution?.values || [],
    );

    if (statusCanvas) {
      chartStatus = new window.Chart(statusCanvas, {
        type: "doughnut",
        data: {
          labels: status.labels,
          datasets: [
            {
              data: status.values,
              backgroundColor: status.values.map((_, index) => palette[index % palette.length]),
              borderColor: theme.border,
              borderWidth: 1,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: theme.text,
              },
            },
          },
        },
      });
    }

    const years = withFallbackChartData(
      aggregate?.yearDistribution?.labels || [],
      aggregate?.yearDistribution?.values || [],
    );

    if (yearCanvas) {
      chartYears = new window.Chart(yearCanvas, {
        type: "bar",
        data: {
          labels: years.labels,
          datasets: [
            {
              label: "Тайтлов",
              data: years.values,
              backgroundColor: theme.accent,
              borderColor: theme.accentStrong,
              borderWidth: 1,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: theme.muted },
              grid: { color: "rgba(127, 127, 127, 0.18)" },
            },
            y: {
              beginAtZero: true,
              ticks: { color: theme.muted },
              grid: { color: "rgba(127, 127, 127, 0.18)" },
            },
          },
          plugins: {
            legend: {
              labels: {
                color: theme.text,
              },
            },
          },
        },
      });
    }

    const genres = withFallbackChartData(
      aggregate?.topGenres?.labels || [],
      aggregate?.topGenres?.values || [],
    );

    if (genreCanvas) {
      chartGenres = new window.Chart(genreCanvas, {
        type: "bar",
        data: {
          labels: genres.labels,
          datasets: [
            {
              label: "Упоминаний",
              data: genres.values,
              backgroundColor: genres.values.map((_, index) => palette[index % palette.length]),
              borderColor: theme.border,
              borderWidth: 1,
            },
          ],
        },
        options: {
          indexAxis: "y",
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              ticks: { color: theme.muted },
              grid: { color: "rgba(127, 127, 127, 0.18)" },
            },
            y: {
              ticks: { color: theme.muted },
              grid: { color: "rgba(127, 127, 127, 0.12)" },
            },
          },
          plugins: {
            legend: {
              labels: {
                color: theme.text,
              },
            },
          },
        },
      });
    }
  }

  function formatTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function applySlice(slice) {
    ensureCatalogState();

    const safeSlice =
      slice === SLICE_ANIME || slice === SLICE_MANGA || slice === SLICE_ALL
        ? slice
        : SLICE_ALL;

    activeSlice = safeSlice;
    window.catalogState.statsSlice = safeSlice;
    setButtonsState(safeSlice);

    const payload = getCachedSlices(allItems);
    const aggregate = payload.slices[safeSlice] || payload.slices.all;

    updateKpi(aggregate);
    renderCharts(aggregate);

    if (cacheInfoEl) {
      cacheInfoEl.textContent = `Источник агрегатов: ${formatCacheSource(payload.source)} | Обновлено: ${formatTime(payload.updatedAt)}`;
    }
  }

  function syncSearchPlaceholder() {
    if (!searchInput) return;
    const isManga = String(window.catalogState?.activeMediaType || "anime") === SLICE_MANGA;
    searchInput.placeholder = isManga ? "Поиск манги..." : "Поиск аниме...";
  }

  function showStatisticsPage() {
    ensureCatalogState();
    window.catalogState.activePage = VIEW_STATISTICS;

    if (statisticsPage) {
      statisticsPage.hidden = false;
    }

    if (contentContainer) {
      contentContainer.hidden = true;
    }

    if (pagination) {
      pagination.hidden = true;
    }

    if (searchInput) {
      searchInput.disabled = true;
      searchInput.placeholder = "Страница статистики";
    }

    document.body.classList.remove("filters-open");
    document.body.classList.remove("view-add");
    document.body.classList.add("view-statistics");

    if (tabStats) {
      tabStats.classList.add("site-nav__link--active");
    }

    if (tabAnime) {
      tabAnime.classList.remove("site-nav__link--active");
    }

    if (tabManga) {
      tabManga.classList.remove("site-nav__link--active");
    }

    if (tabAdd) {
      tabAdd.classList.remove("site-nav__link--active");
    }

    applySlice(window.catalogState.statsSlice || activeSlice || SLICE_ALL);
  }

  function hideStatisticsPage() {
    ensureCatalogState();
    window.catalogState.activePage = VIEW_CATALOG;

    if (statisticsPage) {
      statisticsPage.hidden = true;
    }

    if (contentContainer) {
      contentContainer.hidden = false;
    }

    if (pagination) {
      pagination.hidden = false;
    }

    if (searchInput) {
      searchInput.disabled = false;
      syncSearchPlaceholder();
    }

    document.body.classList.remove("view-statistics");

    if (tabStats) {
      tabStats.classList.remove("site-nav__link--active");
    }
  }

  function onDataLoaded(items) {
    allItems = Array.isArray(items) ? items : [];

    if (window.catalogState?.activePage === VIEW_STATISTICS) {
      applySlice(window.catalogState.statsSlice || activeSlice || SLICE_ALL);
    }
  }

  function isActive() {
    return window.catalogState?.activePage === VIEW_STATISTICS;
  }

  if (tabStats) {
    tabStats.addEventListener("click", (event) => {
      event.preventDefault();
      showStatisticsPage();
    });
  }

  if (tabAnime) {
    tabAnime.addEventListener("click", () => {
      hideStatisticsPage();
    });
  }

  if (tabManga) {
    tabManga.addEventListener("click", () => {
      hideStatisticsPage();
    });
  }

  if (tabAdd) {
    tabAdd.addEventListener("click", () => {
      hideStatisticsPage();
    });
  }

  if (sliceSwitch) {
    sliceSwitch.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const slice = target.getAttribute("data-stats-slice");
      if (!slice) return;
      applySlice(slice);
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      if (!isActive()) return;
      setTimeout(() => {
        applySlice(window.catalogState.statsSlice || activeSlice || SLICE_ALL);
      }, 10);
    });
  }

  window.StatsPage = {
    hide: hideStatisticsPage,
    isActive,
    onDataLoaded,
    show: showStatisticsPage,
  };

  ensureCatalogState();
  activeSlice = window.catalogState.statsSlice || SLICE_ALL;

  if (Array.isArray(animeData)) {
    onDataLoaded(animeData);
  }

  hideStatisticsPage();
})();
