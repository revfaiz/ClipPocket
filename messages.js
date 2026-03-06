(() => {
  const QM = (window.QM = window.QM || {});

  /**
   * @typedef {{ id: string, title: string, text: string, createdAt: number, updatedAt: number }} MessageNode
   */

  const gridEl = document.getElementById("grid");
  const emptyEl = document.getElementById("emptyState");
  const addBtn = document.getElementById("addNew");
  const searchEl = document.getElementById("search");

  /** @type {MessageNode[]} */
  let nodes = [];
  /** @type {string|null} */
  let dragId = null;
  let searchTerm = "";

  function save() {
    localStorage.setItem(QM.STORAGE_KEY, JSON.stringify(nodes));
  }

  function load() {
    try {
      const raw = localStorage.getItem(QM.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && typeof x.id === "string")
        .map((x) => ({
          id: String(x.id),
          title: typeof x.title === "string" ? x.title : "",
          text: typeof x.text === "string" ? x.text : "",
          createdAt: typeof x.createdAt === "number" ? x.createdAt : QM.now(),
          updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : QM.now(),
        }));
    } catch {
      return [];
    }
  }

  function matchesSearch(node, q) {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      (node.title || "").toLowerCase().includes(needle) ||
      (node.text || "").toLowerCase().includes(needle)
    );
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
    const filtered = nodes.filter((n) => matchesSearch(n, searchTerm));
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
      dragHandle.addEventListener("click", (e) => e.preventDefault());

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.title = "Last updated";
      meta.textContent =
        "Updated " +
        QM.formatTime(n.updatedAt) +
        " • " +
        QM.clamp(
          (n.title ? n.title + " — " : "") + n.text.replace(/\s+/g, " "),
          44
        );

      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.className = "cardTitle";
      titleInput.placeholder = "Title (optional)";
      titleInput.value = n.title || "";
      titleInput.addEventListener("input", () => {
        const idx = nodes.findIndex((x) => x.id === n.id);
        if (idx < 0) return;
        nodes[idx] = { ...nodes[idx], title: titleInput.value, updatedAt: QM.now() };
        save();
        meta.textContent =
          "Updated " +
          QM.formatTime(nodes[idx].updatedAt) +
          " • " +
          QM.clamp(
            (titleInput.value ? titleInput.value + " — " : "") +
              ta.value.replace(/\s+/g, " "),
            44
          );
      });

      left.appendChild(dragHandle);
      left.appendChild(titleInput);
      left.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "actions";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn small";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", () => QM.copyToClipboard(n.text));

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
        nodes[idx] = { ...nodes[idx], text: ta.value, updatedAt: QM.now() };
        save();
        meta.textContent =
          "Updated " +
          QM.formatTime(nodes[idx].updatedAt) +
          " • " +
          QM.clamp(
            (titleInput.value ? titleInput.value + " — " : "") +
              ta.value.replace(/\s+/g, " "),
            44
          );
      });

      card.addEventListener("mousedown", (e) => {
        if (e.target instanceof HTMLElement && e.target.closest("button")) return;
        if (document.activeElement !== ta) ta.focus();
      });

      card.addEventListener("dragstart", (e) => {
        dragId = n.id;
        card.classList.add("dragging");
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

      dragHandle.addEventListener("pointerdown", () => {});

      card.appendChild(header);
      card.appendChild(ta);
      gridEl.appendChild(card);
    }

    updateEmptyState(filtered.length);
  }

  function addNewNode(initialText = "") {
    const ts = QM.now();
    const n = { id: QM.uid(), title: "", text: initialText, createdAt: ts, updatedAt: ts };
    nodes.unshift(n);
    save();
    render();
    const first = gridEl.querySelector("article.card textarea");
    if (first) first.focus();
  }

  QM.bootApp = function bootApp() {
    nodes = load();
    render();
    if (nodes.length === 0) addNewNode("");

    if (addBtn) addBtn.addEventListener("click", () => addNewNode(""));
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        searchTerm = searchEl.value.trim();
        render();
      });
    }
  };
})();


