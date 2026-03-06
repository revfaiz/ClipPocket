(() => {
  /** @typedef {{ id: string, text: string, createdAt: number, updatedAt: number }} MessageNode */
  const STORAGE_KEY = "quickMessages.nodes.v1";
  const THEME_KEY = "quickMessages.theme.v1";

  const gridEl = document.getElementById("grid");
  const emptyEl = document.getElementById("emptyState");
  const addBtn = document.getElementById("addNew");
  const searchEl = document.getElementById("search");
  const toastEl = document.getElementById("toast");
  const toggleThemeBtn = document.getElementById("toggleTheme");
  const themeIconEl = document.getElementById("themeIcon");
  const themeTextEl = document.getElementById("themeText");

  /** @type {MessageNode[]} */
  let nodes = [];
  /** @type {number|null} */
  let toastTimer = null;
  /** @type {string|null} */
  let dragId = null;
  let searchTerm = "";

  function uid() {
    // Collision-resistant enough for local-only usage.
    return (
      "n_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8)
    );
  }

  function now() {
    return Date.now();
  }

  function clamp(str, max) {
    if (str.length <= max) return str;
    return str.slice(0, max - 1) + "…";
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && typeof x.id === "string")
        .map((x) => ({
          id: String(x.id),
          text: typeof x.text === "string" ? x.text : "",
          createdAt: typeof x.createdAt === "number" ? x.createdAt : now(),
          updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : now(),
        }));
    } catch {
      return [];
    }
  }

  function getTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    // Default: follow system preference
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    const isDark = theme === "dark";
    themeIconEl.textContent = isDark ? "☀️" : "🌙";
    themeTextEl.textContent = isDark ? "Light" : "Dark";
  }

  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 900);
  }

  async function copyToClipboard(text) {
    const clean = text ?? "";
    if (!clean) {
      showToast("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(clean);
      showToast("Copied!");
    } catch {
      // Fallback for older browsers / file:// restrictions.
      const ta = document.createElement("textarea");
      ta.value = clean;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      showToast(ok ? "Copied!" : "Copy failed");
    }
  }

  function matchesSearch(text, q) {
    if (!q) return true;
    return text.toLowerCase().includes(q.toLowerCase());
  }

  function updateEmptyState(visibleCount) {
    emptyEl.hidden = visibleCount !== 0;
  }

  function reorderByDragTarget(targetId) {
    if (!dragId || !targetId || dragId === targetId) return;
    const from = nodes.findIndex((n) => n.id === dragId);
    const to = nodes.findIndex((n) => n.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = nodes.splice(from, 1);
    nodes.splice(to, 0, moved);
    save();
    render();
  }

  function render() {
    const filtered = nodes.filter((n) => matchesSearch(n.text, searchTerm));
    gridEl.innerHTML = "";

    for (const n of filtered) {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.id = n.id;
      card.draggable = true;
      card.setAttribute("aria-label", "Message card");

      const header = document.createElement("div");
      header.className = "cardHeader";

      const left = document.createElement("div");
      left.className = "leftMeta";

      const dragHandle = document.createElement("button");
      dragHandle.type = "button";
      dragHandle.className = "dragHandle";
      dragHandle.title = "Drag to reorder";
      dragHandle.setAttribute("aria-label", "Drag handle");
      dragHandle.innerHTML = "<span aria-hidden='true'>↕</span><span>Move</span>";
      // Keep keyboard users from triggering "click" side effects
      dragHandle.addEventListener("click", (e) => e.preventDefault());

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.title = "Last updated";
      meta.textContent =
        "Updated " + formatTime(n.updatedAt) + " • " + clamp(n.text.replace(/\s+/g, " "), 32);

      left.appendChild(dragHandle);
      left.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "actions";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn small";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", () => copyToClipboard(n.text));

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn small danger";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        const ok = confirm("Delete this message?");
        if (!ok) return;
        nodes = nodes.filter((x) => x.id !== n.id);
        save();
        render();
      });

      actions.appendChild(copyBtn);
      actions.appendChild(delBtn);

      header.appendChild(left);
      header.appendChild(actions);

      const ta = document.createElement("textarea");
      ta.value = n.text;
      ta.placeholder = "Type or paste a message…";
      ta.addEventListener("input", () => {
        const idx = nodes.findIndex((x) => x.id === n.id);
        if (idx < 0) return;
        nodes[idx] = { ...nodes[idx], text: ta.value, updatedAt: now() };
        save();
        // Update meta line without full render to keep cursor stable.
        meta.textContent =
          "Updated " +
          formatTime(nodes[idx].updatedAt) +
          " • " +
          clamp(ta.value.replace(/\s+/g, " "), 32);
      });

      // Clicking the card focuses editor for quick editing
      card.addEventListener("mousedown", (e) => {
        // Don't steal focus from buttons.
        if (e.target instanceof HTMLElement && e.target.closest("button")) return;
        if (document.activeElement !== ta) ta.focus();
      });

      // Drag and drop (HTML5)
      card.addEventListener("dragstart", (e) => {
        dragId = n.id;
        card.classList.add("dragging");
        // Needed for Firefox
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", n.id);
        }
      });
      card.addEventListener("dragend", () => {
        dragId = null;
        card.classList.remove("dragging");
      });
      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      });
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        const targetId = card.dataset.id;
        reorderByDragTarget(targetId);
      });

      // Ensure dragging starts from handle but still works if user drags card
      dragHandle.addEventListener("pointerdown", () => {
        // Some browsers will prefer dragging from handle; no-op.
      });

      card.appendChild(header);
      card.appendChild(ta);
      gridEl.appendChild(card);
    }

    updateEmptyState(filtered.length);
  }

  function addNewNode(initialText = "") {
    const ts = now();
    const n = { id: uid(), text: initialText, createdAt: ts, updatedAt: ts };
    nodes.unshift(n);
    save();
    render();
    // Focus first textarea after render
    const first = gridEl.querySelector("article.card textarea");
    if (first) first.focus();
  }

  function init() {
    setTheme(getTheme());
    nodes = load();
    render();
    if (nodes.length === 0) addNewNode("");

    addBtn.addEventListener("click", () => addNewNode(""));
    searchEl.addEventListener("input", () => {
      searchTerm = searchEl.value.trim();
      render();
    });

    toggleThemeBtn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next);
    });

    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        searchEl.focus();
      }
    });
  }

  init();
})();


