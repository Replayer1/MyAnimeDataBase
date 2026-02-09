//Кнопки

    const detailBtn = card.querySelector(".btn--detail");
    const watchBtn = card.querySelector(".btn--watch");

    detailBtn.addEventListener("click", () => {
        window.open(anime.detailUrl || "#", "_blank");
    });

    watchBtn.addEventListener("click", () => {
        window.open(anime.watchUrl || "#", "_blank");
    });