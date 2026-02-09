const contentConteiner = document.getElementById("content-container");

function createAinmeCard(anime) {
        let card = document.createElement("div");
        card.className = "anime-card";
        card.innerHTML = `
            <div class="anime-card__image-wrapper">
                <img src="https://shikimori.one/system/animes/original/${anime.target_id}.jpg" alt="${anime.target_title_ru}" class="anime-card__image"/>
                <div class="anime-card__rating">⭐ ${anime.score}</div>
            </div>
            <div class="anime-card__info">
                    <h3 class="anime-card__title">${anime.target_title_ru}</h3>
                    <p class="anime-card__type-year">${anime.target_type} · 2000</p>
                    <p class="anime-card__description"></p>
            </div>
            <div class="anime-card__actions">
                <button class="btn btn--detail">Подробнее</button>
                <button class="btn btn--watch">Смотреть</button>
            </div>
        `;

        const detailBtn = card.querySelector(".btn--detail");
        const watchBtn = card.querySelector(".btn--watch");

        
        //Кнопка "подробнее"
        detailBtn.addEventListener("click", () => {
            function slugify(title) {
            return title
                .toLowerCase()                // нижний регистр
                .normalize("NFD")             // разложение диакритики
                .replace(/[\u0300-\u036f]/g, "") // удаляем акценты
                .replace(/[^a-z0-9\s-]/g, "")   // убираем спецсимволы
                .trim()                       // обрезаем пробелы по краям
                .replace(/\s+/g, "-");        // пробелы → дефисы
            }
            function getShikiLink(anime) {
                const id = anime.target_id;
                const slug = slugify(anime.target_title);
                return `https://shiki.one/animes/${id}-${slug}`;
            }
            window.open(anime.detailUrl || getShikiLink(anime), "_blank");
        });

        //Кнопка "смотреть"
        watchBtn.addEventListener("click", () => {
            window.open(anime.watchUrl || "#", "_blank");
        });
        return card;
}

function renderAinmeCards(animeData) {
    
    contentConteiner.innerHTML = "";

    animeData.forEach(anime => {
        console.log(anime);
        console.log(createAinmeCard(anime));
        contentConteiner.appendChild(createAinmeCard(anime));
    });

};

console.log(contentConteiner);