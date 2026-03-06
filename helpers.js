(() => {
  const QM = (window.QM = window.QM || {});

  // Keys / config
  QM.STORAGE_KEY = "quickMessages.nodes.v1";
  QM.THEME_KEY = "quickMessages.theme.v1";
  QM.AUTH_KEY = "quickMessages.auth.v1";
  QM.CONNECTIONS_KEY = "quickMessages.connections.v1";
  QM.NODE_POSITIONS_KEY = "quickMessages.nodePositions.v1";

  // Change these to your own credentials
  QM.ALLOWED_EMAIL = "admin@example.com";
  QM.ALLOWED_PASSWORD = "changeme123";

  // Small helpers
  QM.uid = function uid() {
    return "n_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  };

  QM.now = function now() {
    return Date.now();
  };

  QM.clamp = function clamp(str, max) {
    if (str.length <= max) return str;
    return str.slice(0, max - 1) + "…";
  };

  QM.formatTime = function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  QM.normalizeEmail = function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  };

  QM.normalizePassword = function normalizePassword(password) {
    return String(password || "").trim();
  };

  QM.getTheme = function getTheme() {
    const saved = localStorage.getItem(QM.THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  QM.setTheme = function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(QM.THEME_KEY, theme);
    const isDark = theme === "dark";
    const themeIconEl = document.getElementById("themeIcon");
    const themeTextEl = document.getElementById("themeText");
    if (themeIconEl) themeIconEl.textContent = isDark ? "☀️" : "🌙";
    if (themeTextEl) themeTextEl.textContent = isDark ? "Light" : "Dark";
  };

  let toastTimer = null;

  QM.showToast = function showToast(text) {
    const toastEl = document.getElementById("toast");
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.add("show");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 900);
  };

  QM.copyToClipboard = async function copyToClipboard(text) {
    const clean = text ?? "";
    if (!clean) {
      QM.showToast("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(clean);
      QM.showToast("Copied!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = clean;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      QM.showToast(ok ? "Copied!" : "Copy failed");
    }
  };
})();


