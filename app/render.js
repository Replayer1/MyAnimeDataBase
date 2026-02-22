const contentConteiner = document.getElementById("content-container");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

//Создание Крточки Аниме
function createAnimeCard(anime) {
  let card = document.createElement("div");
  const statusColors = {
    completed: "#34e062",
    watching: "#803fbc",
    dropped: "#f44336",
    planned: "#2196f3",
  };

  const statusColor = statusColors[anime.user_stauts] || "#999";
  const animeGenres = Array.isArray(anime.genres) ? anime.genres : [];
  const visibleGenres = animeGenres.slice(0, 4);
  const hiddenGenres = animeGenres.slice(visibleGenres.length);
  const hiddenGenresCount = hiddenGenres.length;
  const hiddenGenresMarkup = hiddenGenres
    .map(
      (genre) =>
        `<span class="genre-tooltip__item">${escapeHtml(genre)}</span>`,
    )
    .join("");
  const genresMarkup =
    visibleGenres
      .map((genre) => `<span class="genre">${escapeHtml(genre)}</span>`)
      .join("") +
      (hiddenGenresCount > 0
        ? `<span class="genre genre--more genre--more-with-tooltip" tabindex="0" aria-label="Показать скрытые жанры">+${hiddenGenresCount}<span class="genre-tooltip" role="tooltip">${hiddenGenresMarkup}</span></span>`
        : "") || '<span class="genre genre--empty">Без жанров</span>';

  card.className = "anime-card";
  card.style.setProperty("--anime-status-color", statusColor);
  card.innerHTML = `
            <div class="anime-card__image-wrapper">
                <img src="https://shikimori.one/system/animes/original/${anime.id}.jpg" alt="${anime.title_ru}" class="anime-card__image"/>
                <div class="anime-card__rating">
                  <span class="anime-card__rating-line anime-card__rating-line--shiki">⭐ Shiki: ${anime.shiki_score}</span>
                  <span class="anime-card__rating-line anime-card__rating-line--user">⭐ You: ${anime.user_score}</span>
                </div>
            </div>
            <div class="anime-card__info">
                    <h3 class="anime-card__title">${anime.title_ru}</h3>
                    <div class="anime-card__genres">${genresMarkup}</div>
                    <p class="anime-card__type-year"><span class="anime-card__year">${anime.year}</span></p>
                    <p class="anime-card__description"></p>
            </div>
            <div class="anime-card__actions">
                <button class="btn btn--detail">Подробнее</button>
                <button class="btn btn--watch">Смотреть</button>
            </div>
        `;
  //Кнопка "подробнее"
  const detailBtn = card.querySelector(".btn--detail");
  detailBtn.addEventListener("click", () => {
    function slugify(title) {
      return title
        .toLowerCase() // нижний регистр
        .normalize("NFD") // разложение диакритики
        .replace(/[\u0300-\u036f]/g, "") // удаляем акценты
        .replace(/[^a-z0-9\s-]/g, "") // убираем спецсимволы
        .trim() // обрезаем пробелы по краям
        .replace(/\s+/g, "-"); // пробелы → дефисы
    }
    function getShikiLink(anime) {
      const id = anime.id;
      const slug = slugify(anime.title);
      return `https://shiki.one/animes/${id}-${slug}`;
    }
    window.open(
      anime.detailUrl || getShikiLink(anime),
      "_blank",
      "noopener,noreferrer",
    );
  });
  //Кнопка "смотреть"
  const watchBtn = card.querySelector(".btn--watch");
  watchBtn.addEventListener("click", () => {
    function getWatchLink(anime) {
      const animeNameRu = anime.title_ru.replace(/\s+/g, "+");
      return `https://www.google.com/search?q=Смотреть+аниме+${animeNameRu}`;
    }
    window.open(
      anime.watchUrl || getWatchLink(anime),
      "_blank",
      "noopener,noreferrer",
    );
  });

  return card;
}

function renderAnimeCards(animeData) {
  contentConteiner.innerHTML = "";

  animeData.forEach((anime) => {
    contentConteiner.appendChild(createAnimeCard(anime));
  });
}
