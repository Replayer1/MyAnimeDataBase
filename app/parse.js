let animeData;
let currentList = [];
function fetchRender() {
  fetch("./db/anime-data.json")
    .then((response) => {
      if (!response.ok) throw new Error("Ошибка загрузки JSON");
      return response.json();
    })
    .then((animeArray) => {
      animeData = animeArray;

      if (typeof initializeFilters === "function") {
        initializeFilters(animeArray);
      }

      if (typeof applyAllFilters === "function") {
        applyAllFilters();
      } else {
        currentList = animeArray;
        renderPage(currentList);
      }
    })
    .catch((err) => console.error(err));
}
fetchRender();
