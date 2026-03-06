let animeData;
let currentList = [];

window.catalogState = window.catalogState || {
  activeMediaType: "anime",
  activePage: "catalog",
  statsSlice: "all",
};

function normalizeMediaItems(items, options = {}) {
  if (window.MediaItemUtils?.normalizeMediaItems) {
    return window.MediaItemUtils.normalizeMediaItems(items, options);
  }

  return Array.isArray(items) ? items : [];
}

function migrateSeedPayload(payload) {
  if (window.MediaItemUtils?.migrateSeedPayload) {
    return window.MediaItemUtils.migrateSeedPayload(payload);
  }

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;

  const anime = Array.isArray(payload?.anime) ? payload.anime : [];
  const manga = Array.isArray(payload?.manga) ? payload.manga : [];
  return [...anime, ...manga];
}

async function fetchFromSource(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ошибка загрузки данных из ${url}`);
  }

  const payload = await response.json();
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  throw new Error(`Некорректный формат данных из ${url}`);
}

async function loadRawItems() {
  try {
    return await fetchFromSource("/api/items");
  } catch {
    const [animeRaw, mangaRaw] = await Promise.all([
      fetchFromSource("./db/anime-data.json").catch(() => []),
      fetchFromSource("./db/manga-data.json").catch(() => []),
    ]);

    return [
      ...normalizeMediaItems(animeRaw, {
        defaultMediaType: "anime",
      }),
      ...normalizeMediaItems(mangaRaw, {
        defaultMediaType: "manga",
      }),
    ];
  }
}

function applyLoadedItems(rawItems) {
  animeData = normalizeMediaItems(migrateSeedPayload(rawItems));
  window.animeData = animeData;

  if (window.StatsPage?.onDataLoaded) {
    window.StatsPage.onDataLoaded(animeData);
  }

  if (typeof initializeFilters === "function") {
    initializeFilters(animeData);
  }

  if (typeof applyAllFilters === "function") {
    applyAllFilters();
  } else {
    currentList = animeData;
    if (typeof renderPage === "function") {
      renderPage(currentList);
    }
  }
}

async function reloadCatalogData() {
  const rawItems = await loadRawItems();
  applyLoadedItems(rawItems);
  return animeData;
}

async function fetchRender() {
  try {
    await reloadCatalogData();
  } catch (err) {
    console.error(err);
    const contentContainer = document.getElementById("content-container");
    if (contentContainer) {
      contentContainer.innerHTML =
        '<p class="load-error-message">Не удалось загрузить данные. Обновите страницу и попробуйте снова.</p>';
    }
  }
}

window.reloadCatalogData = reloadCatalogData;

fetchRender();
