let currentPage = 1;
const pageSize = 20; // карточек на странице
const pagination = document.getElementById("pagination");

function getPage(data, page) {
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

function renderPage(data) {
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  currentPage = Math.min(Math.max(1, currentPage), totalPages);

  const pageData = getPage(data, currentPage);
  renderAnimeCards(pageData);
  renderPagination(data.length);
}

function renderPagination(total) {
  pagination.innerHTML = "";

  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 0) {
    const empty = document.createElement("span");
    empty.className = "pagination-empty";
    empty.textContent = "Ничего не найдено";
    pagination.appendChild(empty);
    return;
  }

  const width = window.innerWidth;
  const maxVisible = width <= 480 ? 4 : width <= 900 ? 6 : 8;

  function createBtn(label, page, disabled = false) {
    const btn = document.createElement("button");
    btn.textContent = label;

    if (disabled) btn.disabled = true;

    btn.addEventListener("click", () => {
      currentPage = page;
      renderPage(currentList);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    return btn;
  }

  function createDots() {
    const span = document.createElement("span");
    span.textContent = "...";
    span.className = "dots";
    return span;
  }

  // ⏮ first
  pagination.appendChild(createBtn("⏮", 1, currentPage === 1));

  // ◀ prev
  pagination.appendChild(
    createBtn("◀", Math.max(1, currentPage - 1), currentPage === 1),
  );

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }

  // левая ...
  if (start > 1) {
    pagination.appendChild(createDots());
  }

  for (let i = start; i <= end; i++) {
    const btn = createBtn(i, i);
    if (i === currentPage) btn.classList.add("active");
    pagination.appendChild(btn);
  }

  // правая ...
  if (end < totalPages) {
    pagination.appendChild(createDots());
  }

  // ▶ next
  pagination.appendChild(
    createBtn(
      "▶",
      Math.min(totalPages, currentPage + 1),
      currentPage === totalPages,
    ),
  );

  // ⏭ last
  pagination.appendChild(
    createBtn("⏭", totalPages, currentPage === totalPages),
  );
}
