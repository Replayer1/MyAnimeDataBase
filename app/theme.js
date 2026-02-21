(() => {
  const STORAGE_KEY = "myanimedb-theme";
  const THEME_LIGHT = "light";
  const THEME_DARK = "dark";

  const body = document.body;
  const toggleBtn = document.getElementById("themeToggle");
  const toggleIcon = toggleBtn?.querySelector(".theme-toggle__icon");
  const toggleText = toggleBtn?.querySelector(".theme-toggle__text");

  if (!body || !toggleBtn) return;

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? THEME_LIGHT
      : THEME_DARK;
  }

  function getSavedTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === THEME_LIGHT || saved === THEME_DARK ? saved : null;
  }

  function updateToggleUi(theme) {
    const isLight = theme === THEME_LIGHT;
    if (toggleIcon) toggleIcon.textContent = isLight ? "☀️" : "🌙";
    if (toggleText) toggleText.textContent = isLight ? "Светлая" : "Тёмная";

    toggleBtn.setAttribute("aria-pressed", String(isLight));
    toggleBtn.setAttribute(
      "title",
      isLight ? "Переключить на тёмную тему" : "Переключить на светлую тему",
    );
  }

  function applyTheme(theme, persist = true) {
    const isLight = theme === THEME_LIGHT;

    if (isLight) {
      body.setAttribute("data-theme", THEME_LIGHT);
    } else {
      body.removeAttribute("data-theme");
    }

    updateToggleUi(theme);

    if (persist) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }

  const initialTheme = getSavedTheme() || getSystemTheme();
  applyTheme(initialTheme, false);

  toggleBtn.addEventListener("click", () => {
    const isLightNow = body.getAttribute("data-theme") === THEME_LIGHT;
    applyTheme(isLightNow ? THEME_DARK : THEME_LIGHT, true);
  });
})();
