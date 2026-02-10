const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
    if (searchInput.value !== '') {
        const query = searchInput.value.toLowerCase().trim()
        const filtered = animeData.filter(anime =>
            anime.target_title?.toLowerCase().includes(query) ||
            anime.target_title_ru?.toLowerCase().includes(query)
        );
        renderAinmeCards(filtered)
    } else {
        fetchRender()
    }
});