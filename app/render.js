const contentConteiner = document.getElementById("content-container");

function createAinmeCard(anime) {
        let card = document.createElement("div");
        card.className = "anime-card";
        card.innerHTML = `
            <div class="anime-card__image-wrapper">
                <img src=" # " alt="${anime.target_title_ru}" class="anime-card__image"/>
                <div class="anime-card__rating">⭐ ${anime.score}</div>
            </div>
            <div class="anime-card__info">
                    <h3 class="anime-card__title">${anime.target_title_ru}</h3>
                    <p class="anime-card__type-year">${anime.target_type} · 2000</p>
                    <p class="anime-card__description"></p>
            </div>
            <div class="anime-card__actions">
                <button class="btn btn--detail" onclick="openDetail(https://shiki.one/animes/'${anime.id}')">Подробнее</button>
                <button class="btn btn--watch" onclick="watchAnime('${anime.id}')">Смотреть</button>
            </div>
        `;
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