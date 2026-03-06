const contentConteiner = document.getElementById("content-container");

function asText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function getItemStatus(item) {
  if (window.MediaItemUtils?.getMediaStatus) {
    return window.MediaItemUtils.getMediaStatus(item);
  }

  return asText(item?.user_status || item?.user_stauts, "");
}

function getItemId(item) {
  const id = Number.parseInt(asText(item?.id, ""), 10);
  return Number.isNaN(id) ? null : id;
}

function getMediaType(item) {
  return asText(item?.media_type, "anime").toLowerCase() === "manga"
    ? "manga"
    : "anime";
}

function getSafeUrl(url) {
  if (typeof url !== "string" || url.trim() === "") return null;

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}

function getPosterUrl(item) {
  const poster = asText(item?.poster, "");
  if (poster) {
    if (poster.startsWith("http://") || poster.startsWith("https://")) {
      return poster;
    }

    if (poster.startsWith("/")) {
      return `https://shikimori.one${poster}`;
    }

    return poster;
  }

  const itemId = getItemId(item);
  if (itemId !== null) {
    const collection = getMediaType(item) === "manga" ? "mangas" : "animes";
    return `https://shikimori.one/system/${collection}/original/${itemId}.jpg`;
  }

  return "https://shikimori.one/favicon.ico";
}

function slugify(title) {
  return asText(title)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getShikiLink(item) {
  const id = getItemId(item);
  const mediaType = getMediaType(item);
  const collection = mediaType === "manga" ? "mangas" : "animes";

  if (id === null) return `https://shiki.one/${collection}`;

  const slug = slugify(item?.title || item?.title_ru || "");
  return slug
    ? `https://shiki.one/${collection}/${id}-${slug}`
    : `https://shiki.one/${collection}/${id}`;
}

function getWatchLink(item) {
  const titleRu = asText(item?.title_ru, asText(item?.title, "")).trim();
  const mediaType = getMediaType(item);
  const query =
    mediaType === "manga"
      ? titleRu
        ? `Читать мангу ${titleRu}`
        : "Читать мангу"
      : titleRu
        ? `Смотреть аниме ${titleRu}`
        : "Смотреть аниме";

  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function renderMetaLine(label, value) {
  const safeValue = asText(value, "").trim();
  return `${label}: ${safeValue ? safeValue.replaceAll("_", " ") : "-"}`;
}

function getMangaMeta(item) {
  const demographics = Array.isArray(item?.demographics)
    ? item.demographics.join(", ")
    : "";
  const authors = Array.isArray(item?.authors) ? item.authors.join(", ") : "";

  return [
    renderMetaLine("Главы", item?.chapters),
    renderMetaLine("Тома", item?.volumes),
    renderMetaLine("Публикация", item?.publishing_status),
    renderMetaLine("Демография", demographics),
    renderMetaLine("Авторы", authors),
  ];
}

function getAnimeMeta(item) {
  const studios = Array.isArray(item?.studios) ? item.studios.join(", ") : "";

  return [
    renderMetaLine("Эпизоды", item?.episodes),
    renderMetaLine("Студии", studios),
  ];
}

function createAnimeCard(anime) {
  const statusColors = {
    completed: "#34e062",
    reading: "#34e062",
    watching: "#803fbc",
    on_hold: "#f59e0b",
    dropped: "#f44336",
    planned: "#2196f3",
  };

  const statusColor = statusColors[getItemStatus(anime)] || "#999";
  const animeGenres = Array.isArray(anime?.genres) ? anime.genres : [];
  const visibleGenres = animeGenres.slice(0, 4);
  const hiddenGenres = animeGenres.slice(visibleGenres.length);
  const card = document.createElement("div");
  card.className = "anime-card";
  card.style.setProperty("--anime-status-color", statusColor);

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "anime-card__image-wrapper";

  const image = document.createElement("img");
  image.className = "anime-card__image";
  image.loading = "lazy";
  image.alt = asText(anime?.title_ru, asText(anime?.title, "Тайтл"));

  image.src = getPosterUrl(anime);

  const rating = document.createElement("div");
  rating.className = "anime-card__rating";

  const shikiScore = document.createElement("span");
  shikiScore.className =
    "anime-card__rating-line anime-card__rating-line--shiki";
  shikiScore.textContent = `⭐ Shiki: ${asText(anime?.shiki_score, "-")}`;

  const userScore = document.createElement("span");
  userScore.className = "anime-card__rating-line anime-card__rating-line--user";
  userScore.textContent = `⭐ You: ${asText(anime?.user_score, "-")}`;

  rating.appendChild(shikiScore);
  rating.appendChild(userScore);
  imageWrapper.appendChild(image);
  imageWrapper.appendChild(rating);

  const info = document.createElement("div");
  info.className = "anime-card__info";

  const title = document.createElement("h3");
  title.className = "anime-card__title";
  title.textContent = asText(anime?.title_ru, asText(anime?.title, "Без названия"));

  const genres = document.createElement("div");
  genres.className = "anime-card__genres";

  if (animeGenres.length === 0) {
    const emptyGenre = document.createElement("span");
    emptyGenre.className = "genre genre--empty";
    emptyGenre.textContent = "Без жанров";
    genres.appendChild(emptyGenre);
  } else {
    visibleGenres.forEach((genreName) => {
      const genre = document.createElement("span");
      genre.className = "genre";
      genre.textContent = asText(genreName);
      genres.appendChild(genre);
    });

    if (hiddenGenres.length > 0) {
      const moreGenres = document.createElement("span");
      moreGenres.className = "genre genre--more genre--more-with-tooltip";
      moreGenres.setAttribute("tabindex", "0");
      moreGenres.setAttribute("aria-label", "Показать скрытые жанры");
      moreGenres.textContent = `+${hiddenGenres.length}`;

      const tooltip = document.createElement("span");
      tooltip.className = "genre-tooltip";
      tooltip.setAttribute("role", "tooltip");

      hiddenGenres.forEach((genreName) => {
        const item = document.createElement("span");
        item.className = "genre-tooltip__item";
        item.textContent = asText(genreName);
        tooltip.appendChild(item);
      });

      moreGenres.appendChild(tooltip);
      genres.appendChild(moreGenres);
    }
  }

  const typeYear = document.createElement("p");
  typeYear.className = "anime-card__type-year";

  const year = document.createElement("span");
  year.className = "anime-card__year";
  const mediaType = getMediaType(anime);
  const type = asText(anime?.type, "-");
  year.textContent = `${asText(anime?.year, "-")} • ${type}`;
  typeYear.appendChild(year);

  const meta = document.createElement("p");
  meta.className = "anime-card__meta";
  const lines = mediaType === "manga" ? getMangaMeta(anime) : getAnimeMeta(anime);
  meta.textContent = lines.join(" | ");

  const description = document.createElement("p");
  description.className = "anime-card__description";
  description.textContent = asText(anime?.description, "");

  info.appendChild(title);
  info.appendChild(genres);
  info.appendChild(typeYear);
  info.appendChild(meta);
  info.appendChild(description);

  const actions = document.createElement("div");
  actions.className = "anime-card__actions";

  const detailBtn = document.createElement("button");
  detailBtn.type = "button";
  detailBtn.className = "btn btn--detail";
  detailBtn.textContent = "Подробнее";
  detailBtn.addEventListener("click", () => {
    const detailUrl = getSafeUrl(anime?.detailUrl) || getShikiLink(anime);
    window.open(detailUrl, "_blank", "noopener,noreferrer");
  });

  const watchBtn = document.createElement("button");
  watchBtn.type = "button";
  watchBtn.className = "btn btn--watch";
  watchBtn.textContent = mediaType === "manga" ? "Читать" : "Смотреть";
  watchBtn.addEventListener("click", () => {
    const watchUrl = getSafeUrl(anime?.watchUrl) || getWatchLink(anime);
    window.open(watchUrl, "_blank", "noopener,noreferrer");
  });

  actions.appendChild(detailBtn);
  actions.appendChild(watchBtn);

  card.appendChild(imageWrapper);
  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

function renderAnimeCards(animeData) {
  if (!contentConteiner) return;

  contentConteiner.innerHTML = "";

  animeData.forEach((anime) => {
    contentConteiner.appendChild(createAnimeCard(anime));
  });
}
