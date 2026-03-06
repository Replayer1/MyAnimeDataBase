(() => {
  const VIEW_ADD = "add";
  const VIEW_CATALOG = "catalog";
  const VIEW_STATISTICS = "statistics";

  const tabAnime = document.getElementById("tabAnime");
  const tabManga = document.getElementById("tabManga");
  const tabStats = document.getElementById("tabStats");
  const tabAdd = document.getElementById("tabAdd");
  const searchInput = document.getElementById("searchInput");
  const addPage = document.getElementById("addPage");
  const modeSwitch = document.getElementById("entryModeSwitch");
  const prefillBlock = document.getElementById("externalPrefill");
  const externalSourceInput = document.getElementById("externalSourceInput");
  const externalMediaTypeHint = document.getElementById("externalMediaTypeHint");
  const externalPrefillBtn = document.getElementById("externalPrefillBtn");
  const messageEl = document.getElementById("addPageMessage");

  const fields = {
    id: document.getElementById("itemId"),
    media_type: document.getElementById("itemMediaType"),
    title: document.getElementById("itemTitle"),
    title_ru: document.getElementById("itemTitleRu"),
    type: document.getElementById("itemType"),
    user_status: document.getElementById("itemUserStatus"),
    year: document.getElementById("itemYear"),
    user_score: document.getElementById("itemUserScore"),
    shiki_score: document.getElementById("itemShikiScore"),
    episodes: document.getElementById("itemEpisodes"),
    chapters: document.getElementById("itemChapters"),
    volumes: document.getElementById("itemVolumes"),
    publishing_status: document.getElementById("itemPublishingStatus"),
    genres: document.getElementById("itemGenres"),
    studios: document.getElementById("itemStudios"),
    demographics: document.getElementById("itemDemographics"),
    authors: document.getElementById("itemAuthors"),
    poster: document.getElementById("itemPoster"),
    detailUrl: document.getElementById("itemDetailUrl"),
    watchUrl: document.getElementById("itemWatchUrl"),
    description: document.getElementById("itemDescription"),
    change_reason: document.getElementById("itemChangeReason"),
  };

  const loadItemByIdBtn = document.getElementById("loadItemByIdBtn");
  const createItemBtn = document.getElementById("createItemBtn");
  const updateItemBtn = document.getElementById("updateItemBtn");
  const deleteItemBtn = document.getElementById("deleteItemBtn");

  const actionButtons = [
    externalPrefillBtn,
    loadItemByIdBtn,
    createItemBtn,
    updateItemBtn,
    deleteItemBtn,
  ].filter(Boolean);

  function ensureCatalogState() {
    if (!window.catalogState) {
      window.catalogState = {
        activeMediaType: "anime",
        activePage: VIEW_CATALOG,
        statsSlice: "all",
      };
    }

    if (!window.catalogState.activeMediaType) {
      window.catalogState.activeMediaType = "anime";
    }

    if (!window.catalogState.activePage) {
      window.catalogState.activePage = VIEW_CATALOG;
    }
  }

  function getCatalogPlaceholder() {
    const mediaType = String(window.catalogState?.activeMediaType || "anime").toLowerCase();
    return mediaType === "manga" ? "Поиск манги..." : "Поиск аниме...";
  }

  function setMessage(text, type = "") {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.classList.remove("add-page__message--success", "add-page__message--error");

    if (type === "success") {
      messageEl.classList.add("add-page__message--success");
    }

    if (type === "error") {
      messageEl.classList.add("add-page__message--error");
    }
  }

  function setLoading(isLoading) {
    actionButtons.forEach((button) => {
      button.disabled = Boolean(isLoading);
    });
  }

  function splitList(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseInteger(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function parseFloatNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number.parseFloat(String(value));
    return Number.isNaN(parsed) ? null : parsed;
  }

  function normalizeMediaType(value) {
    return String(value || "anime").toLowerCase() === "manga" ? "manga" : "anime";
  }

  function getSafeText(value) {
    return String(value || "").trim();
  }

  function buildPayloadFromForm() {
    return {
      id: parseInteger(fields.id?.value),
      media_type: normalizeMediaType(fields.media_type?.value),
      title: getSafeText(fields.title?.value),
      title_ru: getSafeText(fields.title_ru?.value),
      type: getSafeText(fields.type?.value),
      user_status: getSafeText(fields.user_status?.value || "planned").toLowerCase(),
      year: parseInteger(fields.year?.value),
      user_score: parseFloatNumber(fields.user_score?.value),
      shiki_score: parseFloatNumber(fields.shiki_score?.value),
      episodes: parseInteger(fields.episodes?.value),
      chapters: parseInteger(fields.chapters?.value),
      volumes: parseInteger(fields.volumes?.value),
      publishing_status: getSafeText(fields.publishing_status?.value).toLowerCase(),
      genres: splitList(fields.genres?.value),
      studios: splitList(fields.studios?.value),
      demographics: splitList(fields.demographics?.value),
      authors: splitList(fields.authors?.value),
      poster: getSafeText(fields.poster?.value),
      detailUrl: getSafeText(fields.detailUrl?.value),
      watchUrl: getSafeText(fields.watchUrl?.value),
      description: getSafeText(fields.description?.value),
      change_reason: getSafeText(fields.change_reason?.value),
    };
  }

  function validateScore(name, value) {
    if (value === null) return null;
    if (value < 0 || value > 10) return `${name} должна быть в диапазоне 0..10`;
    return null;
  }

  function validatePayload(payload, mode) {
    const isDelete = mode === "delete";

    if (payload.id === null || payload.id <= 0) {
      return "ID обязателен и должен быть положительным числом";
    }

    if (isDelete) return null;

    if (!payload.title && !payload.title_ru) {
      return "Укажите хотя бы одно название: оригинальное или русское";
    }

    const userScoreError = validateScore("Моя оценка", payload.user_score);
    if (userScoreError) return userScoreError;

    const shikiScoreError = validateScore("Оценка Shiki", payload.shiki_score);
    if (shikiScoreError) return shikiScoreError;

    if (payload.year !== null && (payload.year < 1900 || payload.year > 2100)) {
      return "Год должен быть в диапазоне 1900..2100";
    }

    const integerFields = [
      ["Эпизоды", payload.episodes],
      ["Главы", payload.chapters],
      ["Тома", payload.volumes],
    ];

    for (const [name, value] of integerFields) {
      if (value !== null && value < 0) {
        return `${name} не могут быть отрицательными`;
      }
    }

    return null;
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      const message = payload?.error || `HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.code = payload?.code || "HTTP_ERROR";
      throw error;
    }

    return payload;
  }

  function applyItemToForm(item) {
    if (!item) return;

    if (fields.id) fields.id.value = item.id ?? "";
    if (fields.media_type) fields.media_type.value = normalizeMediaType(item.media_type);
    if (fields.title) fields.title.value = item.title || "";
    if (fields.title_ru) fields.title_ru.value = item.title_ru || "";
    if (fields.type) fields.type.value = item.type || "";
    if (fields.user_status) fields.user_status.value = item.user_status || "planned";
    if (fields.year) fields.year.value = item.year ?? "";
    if (fields.user_score) fields.user_score.value = item.user_score ?? "";
    if (fields.shiki_score) fields.shiki_score.value = item.shiki_score ?? "";
    if (fields.episodes) fields.episodes.value = item.episodes ?? "";
    if (fields.chapters) fields.chapters.value = item.chapters ?? "";
    if (fields.volumes) fields.volumes.value = item.volumes ?? "";
    if (fields.publishing_status) {
      fields.publishing_status.value = item.publishing_status || "";
    }
    if (fields.genres) {
      fields.genres.value = Array.isArray(item.genres) ? item.genres.join(", ") : "";
    }
    if (fields.studios) {
      fields.studios.value = Array.isArray(item.studios) ? item.studios.join(", ") : "";
    }
    if (fields.demographics) {
      fields.demographics.value = Array.isArray(item.demographics)
        ? item.demographics.join(", ")
        : "";
    }
    if (fields.authors) {
      fields.authors.value = Array.isArray(item.authors) ? item.authors.join(", ") : "";
    }
    if (fields.poster) fields.poster.value = item.poster || "";
    if (fields.detailUrl) fields.detailUrl.value = item.detailUrl || "";
    if (fields.watchUrl) fields.watchUrl.value = item.watchUrl || "";
    if (fields.description) fields.description.value = item.description || "";
    if (fields.change_reason) fields.change_reason.value = "";
  }

  async function refreshAppData() {
    if (typeof window.reloadCatalogData === "function") {
      await window.reloadCatalogData();
      return;
    }

    if (window.StatsPage?.onDataLoaded && Array.isArray(window.animeData)) {
      window.StatsPage.onDataLoaded(window.animeData);
    }
  }

  async function loadItemById() {
    const id = parseInteger(fields.id?.value);
    if (!id) {
      setMessage("Укажите корректный ID для загрузки", "error");
      return;
    }

    setLoading(true);
    setMessage("Загружаем запись...");

    try {
      const item = await requestJson(`/api/items/${id}`);
      applyItemToForm(item);
      setMessage("Запись загружена", "success");
    } catch (error) {
      setMessage(`Не удалось загрузить запись: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function prefillFromExternal() {
    const source = getSafeText(externalSourceInput?.value);
    if (!source) {
      setMessage("Введите URL или ID внешнего источника", "error");
      return;
    }

    const hint = getSafeText(externalMediaTypeHint?.value);
    const params = new URLSearchParams({ source });
    if (hint) params.set("media_type", hint);

    setLoading(true);
    setMessage("Подтягиваем данные из внешнего источника...");

    try {
      const item = await requestJson(`/api/external/shiki?${params.toString()}`);
      applyItemToForm(item);
      setMessage("Данные подтянуты. Проверьте поля и сохраните.", "success");
    } catch (error) {
      setMessage(`Не удалось подтянуть данные: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function createItem() {
    const payload = buildPayloadFromForm();
    const validationError = validatePayload(payload, "create");
    if (validationError) {
      setMessage(validationError, "error");
      return;
    }

    setLoading(true);
    setMessage("Проверяем уникальность ID...");

    try {
      try {
        await requestJson(`/api/items/${payload.id}`);
        setMessage("ID уже существует. Используйте другой ID или обновление.", "error");
        return;
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
      }

      setMessage("Создаем запись...");
      await requestJson("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await refreshAppData();
      setMessage("Тайтл успешно создан", "success");
    } catch (error) {
      setMessage(`Ошибка создания: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateItem() {
    const payload = buildPayloadFromForm();
    const validationError = validatePayload(payload, "update");
    if (validationError) {
      setMessage(validationError, "error");
      return;
    }

    setLoading(true);
    setMessage("Обновляем запись...");

    try {
      await requestJson(`/api/items/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await refreshAppData();
      setMessage("Тайтл успешно обновлен", "success");
    } catch (error) {
      setMessage(`Ошибка обновления: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem() {
    const payload = buildPayloadFromForm();
    const validationError = validatePayload(payload, "delete");
    if (validationError) {
      setMessage(validationError, "error");
      return;
    }

    if (!window.confirm(`Удалить запись с ID ${payload.id}?`)) {
      return;
    }

    setLoading(true);
    setMessage("Удаляем запись...");

    try {
      await requestJson(`/api/items/${payload.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ change_reason: payload.change_reason }),
      });

      await refreshAppData();
      setMessage("Тайтл удален", "success");
    } catch (error) {
      setMessage(`Ошибка удаления: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  function setEntryMode(mode) {
    if (!modeSwitch) return;

    const safeMode = mode === "semi" ? "semi" : "manual";
    const buttons = modeSwitch.querySelectorAll("[data-entry-mode]");
    buttons.forEach((button) => {
      const isActive = button.getAttribute("data-entry-mode") === safeMode;
      button.classList.toggle("add-page__mode-btn--active", isActive);
    });

    if (prefillBlock) {
      prefillBlock.hidden = safeMode !== "semi";
    }
  }

  function showAddPage() {
    ensureCatalogState();
    window.catalogState.activePage = VIEW_ADD;

    if (window.StatsPage?.isActive()) {
      window.StatsPage.hide();
    }

    if (addPage) {
      addPage.hidden = false;
    }

    document.body.classList.remove("view-statistics");
    document.body.classList.add("view-add");
    document.body.classList.remove("filters-open");

    if (tabAdd) {
      tabAdd.classList.add("site-nav__link--active");
    }

    if (tabAnime) {
      tabAnime.classList.remove("site-nav__link--active");
    }

    if (tabManga) {
      tabManga.classList.remove("site-nav__link--active");
    }

    if (tabStats) {
      tabStats.classList.remove("site-nav__link--active");
    }

    if (searchInput) {
      searchInput.disabled = true;
      searchInput.placeholder = "Страница добавления";
    }
  }

  function hideAddPage() {
    ensureCatalogState();
    if (window.catalogState.activePage === VIEW_ADD) {
      window.catalogState.activePage = VIEW_CATALOG;
    }

    if (addPage) {
      addPage.hidden = true;
    }

    document.body.classList.remove("view-add");

    if (tabAdd) {
      tabAdd.classList.remove("site-nav__link--active");
    }

    if (searchInput && window.catalogState.activePage !== VIEW_STATISTICS) {
      searchInput.disabled = false;
      searchInput.placeholder = getCatalogPlaceholder();
    }
  }

  if (tabAdd) {
    tabAdd.addEventListener("click", (event) => {
      event.preventDefault();
      showAddPage();
    });
  }

  if (tabAnime) {
    tabAnime.addEventListener("click", () => {
      hideAddPage();
    });
  }

  if (tabManga) {
    tabManga.addEventListener("click", () => {
      hideAddPage();
    });
  }

  if (tabStats) {
    tabStats.addEventListener("click", () => {
      hideAddPage();
    });
  }

  if (modeSwitch) {
    modeSwitch.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const mode = target.getAttribute("data-entry-mode");
      if (!mode) return;
      setEntryMode(mode);
    });
  }

  if (externalPrefillBtn) {
    externalPrefillBtn.addEventListener("click", prefillFromExternal);
  }

  if (loadItemByIdBtn) {
    loadItemByIdBtn.addEventListener("click", loadItemById);
  }

  if (createItemBtn) {
    createItemBtn.addEventListener("click", createItem);
  }

  if (updateItemBtn) {
    updateItemBtn.addEventListener("click", updateItem);
  }

  if (deleteItemBtn) {
    deleteItemBtn.addEventListener("click", deleteItem);
  }

  window.AddPage = {
    hide: hideAddPage,
    show: showAddPage,
  };

  setEntryMode("manual");
  hideAddPage();
})();
