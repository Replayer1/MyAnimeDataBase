const contentConteiner = document.getElementById("content-container");

function asText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function getAnimeStatus(anime) {
  return asText(anime?.user_status || anime?.user_stauts, "");
}

function getAnimeId(anime) {
  const id = Number.parseInt(asText(anime?.id, ""), 10);
  return Number.isNaN(id) ? null : id;
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

function slugify(title) {
  return asText(title)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getShikiLink(anime) {
  const id = getAnimeId(anime);
  if (id === null) return "https://shiki.one/animes";

  const slug = slugify(anime?.title || anime?.title_ru || "");
  return slug
    ? `https://shiki.one/animes/${id}-${slug}`
    : `https://shiki.one/animes/${id}`;
}

function getWatchLink(anime) {
  const titleRu = asText(anime?.title_ru, "").trim();
  const query = titleRu ? `Смотреть аниме ${titleRu}` : "Смотреть аниме";
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function createAnimeCard(anime) {
  const statusColors = {
    completed: "#34e062",
    watching: "#803fbc",
    dropped: "#f44336",
    planned: "#2196f3",
  };

  const statusColor = statusColors[getAnimeStatus(anime)] || "#999";
  const animeGenres = Array.isArray(anime?.genres) ? anime.genres : [];
  const visibleGenres = animeGenres.slice(0, 4);
  const hiddenGenres = animeGenres.slice(visibleGenres.length);
  const animeId = getAnimeId(anime);

  const card = document.createElement("div");
  card.className = "anime-card";
  card.style.setProperty("--anime-status-color", statusColor);

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "anime-card__image-wrapper";

  const image = document.createElement("img");
  image.className = "anime-card__image";
  image.loading = "lazy";
  image.alt = asText(anime?.title_ru, asText(anime?.title, "Аниме"));

  const imageUrl =
    animeId !== null
      ? `https://shikimori.one/system/animes/original/${animeId}.jpg`
      : "https://shikimori.one/favicon.ico";
  image.src = imageUrl;

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
  year.textContent = asText(anime?.year, "-");
  typeYear.appendChild(year);

  const description = document.createElement("p");
  description.className = "anime-card__description";

  info.appendChild(title);
  info.appendChild(genres);
  info.appendChild(typeYear);
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
  watchBtn.textContent = "Смотреть";
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
