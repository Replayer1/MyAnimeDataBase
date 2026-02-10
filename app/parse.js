let animeData;
function fetchRender() {
    fetch('../db/shikimori_data.json')
        .then(response => {
        if (!response.ok) throw new Error("Ошибка загрузки JSON");
            return response.json();
        })
        .then(animeArray => {
            animeData = animeArray;
            renderAinmeCards(animeArray)
        })
        .catch(err => console.error(err));
}
fetchRender()


