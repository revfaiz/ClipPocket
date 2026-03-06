(() => {
  const QM = (window.QM = window.QM || {});

  const canvasContainer = document.getElementById("canvasContainer");
  const canvas = document.getElementById("canvas");
  const svg = document.getElementById("connectionsSvg");
  const addNodeBtn = document.getElementById("addNode");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const zoomResetBtn = document.getElementById("zoomReset");

  let nodes = [];
  let connections = [];
  let nodePositions = {};
  
  let scale = 1;
  let panX = 0;
  let panY = 0;
  
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  
  let draggedNode = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  
  let connectingFrom = null;
  let tempLine = null;

  // Load data
  function loadNodes() {
    try {
      const raw = localStorage.getItem(QM.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x) => x && typeof x.id === "string");
    } catch {
      return [];
    }
  }

  function loadConnections() {
    try {
      const raw = localStorage.getItem(QM.CONNECTIONS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  }

  function loadPositions() {
    try {
      const raw = localStorage.getItem(QM.NODE_POSITIONS_KEY);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }

  function saveConnections() {
    localStorage.setItem(QM.CONNECTIONS_KEY, JSON.stringify(connections));
  }

  function savePositions() {
    localStorage.setItem(QM.NODE_POSITIONS_KEY, JSON.stringify(nodePositions));
  }

  // Calculate position for new node
  function getNewNodePosition() {
    const centerX = (-panX + canvasContainer.clientWidth / 2) / scale;
    const centerY = (-panY + canvasContainer.clientHeight / 2) / scale;
    return {
      x: centerX - 100 + Math.random() * 50,
      y: centerY - 60 + Math.random() * 50
    };
  }

  // Create node element
  function createNodeElement(node) {
    const el = document.createElement("div");
    el.className = "node";
    el.dataset.id = node.id;
    
    const pos = nodePositions[node.id] || getNewNodePosition();
    nodePositions[node.id] = pos;
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";

    el.innerHTML = `
      <div class="node-connector left" data-side="left"></div>
      <div class="node-connector right" data-side="right"></div>
      <div class="node-connector top" data-side="top"></div>
      <div class="node-connector bottom" data-side="bottom"></div>
      <div class="node-header">
        <input type="text" class="node-title" placeholder="Title" value="${node.title || ''}" />
        <div class="node-actions">
          <button class="node-btn connect" title="Connect to another node">⬡</button>
          <button class="node-btn delete" title="Delete">✕</button>
        </div>
      </div>
      <div class="node-content">
        <textarea placeholder="Type your message...">${node.text || ''}</textarea>
      </div>
    `;

    // Title input
    const titleInput = el.querySelector(".node-title");
    titleInput.addEventListener("input", () => {
      const idx = nodes.findIndex((n) => n.id === node.id);
      if (idx >= 0) {
        nodes[idx].title = titleInput.value;
        localStorage.setItem(QM.STORAGE_KEY, JSON.stringify(nodes));
      }
    });

    // Text input
    const textArea = el.querySelector("textarea");
    textArea.addEventListener("input", () => {
      const idx = nodes.findIndex((n) => n.id === node.id);
      if (idx >= 0) {
        nodes[idx].text = textArea.value;
        localStorage.setItem(QM.STORAGE_KEY, JSON.stringify(nodes));
      }
    });

    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.className = "node-btn";
    copyBtn.textContent = "📋";
    copyBtn.title = "Copy";
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      QM.copyToClipboard(node.text);
    });
    el.querySelector(".node-actions").insertBefore(copyBtn, el.querySelector(".delete"));

    // Delete button
    el.querySelector(".delete").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Delete this node?")) {
        deleteNode(node.id);
      }
    });

    // Connect button
    el.querySelector(".connect").addEventListener("click", (e) => {
      e.stopPropagation();
      startConnecting(node.id);
    });

    // Connectors
    el.querySelectorAll(".node-connector").forEach((connector) => {
      connector.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        startConnecting(node.id, connector.dataset.side);
      });
    });

    // Drag handling
    el.addEventListener("mousedown", (e) => {
      if (e.target.closest(".node-connector") || e.target.closest(".node-actions") || e.target.closest("textarea")) {
        return;
      }
      e.preventDefault();
      draggedNode = node.id;
      const rect = el.getBoundingClientRect();
      dragOffsetX = (e.clientX - rect.left) / scale;
      dragOffsetY = (e.clientY - rect.top) / scale;
    });

    return el;
  }

  function deleteNode(nodeId) {
    nodes = nodes.filter((n) => n.id !== nodeId);
    delete nodePositions[nodeId];
    connections = connections.filter((c) => c.from !== nodeId && c.to !== nodeId);
    localStorage.setItem(QM.STORAGE_KEY, JSON.stringify(nodes));
    saveConnections();
    savePositions();
    render();
  }

  // Rendering
  function render() {
    // Clear existing nodes
    canvas.querySelectorAll(".node").forEach((el) => el.remove());
    
    // Render nodes
    nodes.forEach((node) => {
      const el = createNodeElement(node);
      canvas.appendChild(el);
    });

    // Render connections
    renderConnections();
  }

  function renderConnections() {
    svg.innerHTML = "";
    
    connections.forEach((conn, index) => {
      const fromPos = nodePositions[conn.from];
      const toPos = nodePositions[conn.to];
      
      if (!fromPos || !toPos) return;

      const fromEl = canvas.querySelector(`.node[data-id="${conn.from}"]`);
      const toEl = canvas.querySelector(`.node[data-id="${conn.to}"]`);
      
      if (!fromEl || !toEl) return;

      const fromRect = { width: fromEl.offsetWidth, height: fromEl.offsetHeight };
      const toRect = { width: toEl.offsetWidth, height: toEl.offsetHeight };

      // Calculate connection points
      const startX = fromPos.x + fromRect.width / 2;
      const startY = fromPos.y + fromRect.height / 2;
      const endX = toPos.x + toRect.width / 2;
      const endY = toPos.y + toRect.height / 2;

      // Create curved path
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const dx = endX - startX;
      const dy = endY - startY;
      const offset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const d = `M ${startX} ${startY} Q ${midX + (dy > 0 ? offset : -offset)} ${midY + (dx > 0 ? -offset : offset)} ${endX} ${endY}`;
      
      path.setAttribute("d", d);
      path.setAttribute("class", "connection-line");
      svg.appendChild(path);

      // Connection label
      if (conn.label) {
        const label = document.createElement("div");
        label.className = "connection-label";
        label.textContent = conn.label;
        label.style.left = midX + "px";
        label.style.top = midY + "px";
        label.style.transform = "translate(-50%, -50%)";
        
        label.addEventListener("dblclick", () => {
          const newLabel = prompt("Edit connection label:", conn.label);
          if (newLabel !== null) {
            connections[index].label = newLabel;
            saveConnections();
            renderConnections();
          }
        });
        
        canvas.appendChild(label);
      }

      // Delete connection on click
      path.style.pointerEvents = "stroke";
      path.style.cursor = "pointer";
      path.addEventListener("click", () => {
        if (confirm("Remove this connection?")) {
          connections.splice(index, 1);
          saveConnections();
          renderConnections();
        }
      });
    });
  }

  // Connecting nodes
  function startConnecting(nodeId, side) {
    if (connectingFrom === nodeId) {
      cancelConnecting();
      return;
    }
    
    connectingFrom = nodeId;
    canvasContainer.classList.add("connecting-mode");
    
    // Create temp line
    tempLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    tempLine.setAttribute("class", "connection-line");
    tempLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(tempLine);
    
    QM.showToast("Click another node to connect, or click anywhere to cancel");
  }

  function cancelConnecting() {
    connectingFrom = null;
    canvasContainer.classList.remove("connecting-mode");
    if (tempLine) {
      tempLine.remove();
      tempLine = null;
    }
  }

  function finishConnecting(toNodeId) {
    if (!connectingFrom || connectingFrom === toNodeId) {
      cancelConnecting();
      return;
    }

    // Check if connection already exists
    const exists = connections.some(
      (c) => (c.from === connectingFrom && c.to === toNodeId) ||
             (c.from === toNodeId && c.to === connectingFrom)
    );

    if (!exists) {
      const label = prompt("Enter connection label (optional):", "");
      connections.push({
        from: connectingFrom,
        to: toNodeId,
        label: label || ""
      });
      saveConnections();
    }

    cancelConnecting();
    renderConnections();
  }

  // Pan and zoom
  function updateTransform() {
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.25, Math.min(3, scale * delta));
    
    // Zoom toward cursor
    const rect = canvasContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleChange = newScale / scale;
    panX = mouseX - (mouseX - panX) * scaleChange;
    panY = mouseY - (mouseY - panY) * scaleChange;
    
    scale = newScale;
    updateTransform();
  }

  function handleMouseDown(e) {
    if (e.target === canvasContainer || e.target === canvas || e.target === svg) {
      if (connectingFrom) {
        cancelConnecting();
        return;
      }
      
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
      canvasContainer.classList.add("grabbing");
    }
  }

  function handleMouseMove(e) {
    if (isPanning) {
      panX = e.clientX - panStartX;
      panY = e.clientY - panStartY;
      updateTransform();
    }
    
    if (draggedNode) {
      const rect = canvasContainer.getBoundingClientRect();
      const x = (e.clientX - rect.left - panX) / scale - dragOffsetX;
      const y = (e.clientY - rect.top - panY) / scale - dragOffsetY;
      
      nodePositions[draggedNode] = { x, y };
      
      const el = canvas.querySelector(`.node[data-id="${draggedNode}"]`);
      if (el) {
        el.style.left = x + "px";
        el.style.top = y + "px";
      }
      
      renderConnections();
    }
    
    if (tempLine && connectingFrom) {
      const fromPos = nodePositions[connectingFrom];
      const fromEl = canvas.querySelector(`.node[data-id="${connectingFrom}"]`);
      if (fromPos && fromEl) {
        const rect = canvasContainer.getBoundingClientRect();
        const endX = (e.clientX - rect.left - panX) / scale;
        const endY = (e.clientY - rect.top - panY) / scale;
        const startX = fromPos.x + fromEl.offsetWidth / 2;
        const startY = fromPos.y + fromEl.offsetHeight / 2;
        
        tempLine.setAttribute("d", `M ${startX} ${startY} L ${endX} ${endY}`);
      }
    }
  }

  function handleMouseUp(e) {
    if (isPanning) {
      isPanning = false;
      canvasContainer.classList.remove("grabbing");
    }
    
    if (draggedNode) {
      savePositions();
      draggedNode = null;
    }
    
    // Check if we clicked on a node to connect
    if (connectingFrom && !draggedNode) {
      const targetNode = e.target.closest(".node");
      if (targetNode) {
        finishConnecting(targetNode.dataset.id);
      }
    }
  }

  // Add new node
  function addNewNode() {
    const newNode = {
      id: QM.uid(),
      title: "",
      text: "",
      createdAt: QM.now(),
      updatedAt: QM.now()
    };
    nodes.push(newNode);
    localStorage.setItem(QM.STORAGE_KEY, JSON.stringify(nodes));
    render();
  }

  // Sync with notes page
  function syncFromNotes() {
    const notesNodes = loadNodes();
    
    // Add new nodes from notes
    notesNodes.forEach((note) => {
      if (!nodes.find((n) => n.id === note.id)) {
        nodes.push(note);
      }
    });
    
    // Update existing nodes
    nodes = nodes.map((node) => {
      const note = notesNodes.find((n) => n.id === node.id);
      return note ? { ...node, title: note.title, text: note.text, updatedAt: note.updatedAt } : node;
    });
    
    localStorage.setItem(QM.STORAGE_KEY, JSON.stringify(nodes));
  }

  // Initialize
  function init() {
    nodes = loadNodes();
    connections = loadConnections();
    nodePositions = loadPositions();
    
    // If no positions, generate them
    if (Object.keys(nodePositions).length === 0) {
      nodes.forEach((node, index) => {
        nodePositions[node.id] = {
          x: 100 + (index % 4) * 250,
          y: 100 + Math.floor(index / 4) * 200
        };
      });
      savePositions();
    }

    render();
    updateTransform();

    // Event listeners
    canvasContainer.addEventListener("wheel", handleWheel, { passive: false });
    canvasContainer.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    addNodeBtn.addEventListener("click", addNewNode);

    zoomInBtn.addEventListener("click", () => {
      scale = Math.min(3, scale * 1.2);
      updateTransform();
    });

    zoomOutBtn.addEventListener("click", () => {
      scale = Math.max(0.25, scale / 1.2);
      updateTransform();
    });

    zoomResetBtn.addEventListener("click", () => {
      scale = 1;
      panX = 0;
      panY = 0;
      updateTransform();
    });

    // Sync button in header (optional - sync from notes)
    const syncBtn = document.createElement("button");
    syncBtn.className = "btn";
    syncBtn.textContent = "↻ Sync";
    syncBtn.title = "Sync from Notes";
    syncBtn.addEventListener("click", () => {
      syncFromNotes();
      render();
      QM.showToast("Synced from Notes!");
    });
    
    document.querySelector(".toolbar").insertBefore(syncBtn, document.querySelector(".toolbar a"));
  }

  // Make init available globally
  QM.bootCanvas = init;
})();

