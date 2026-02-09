fetch('../db/shikimori_data.json')
    .then(response => {
    if (!response.ok) throw new Error("Ошибка загрузки JSON");
        return response.json();
    })
    .then(animeArray => {
        renderAinmeCards(animeArray)
    })
    .catch(err => console.error(err));


