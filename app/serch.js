const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();

  currentPage = 1;

  if (!query) {
    currentList = animeData;
  } else {
    currentList = animeData.filter(
      (anime) =>
        anime.target_title?.toLowerCase().includes(query) ||
        anime.target_title_ru?.toLowerCase().includes(query),
    );
  }

  renderPage(currentList);
});
