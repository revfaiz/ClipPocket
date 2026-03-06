(() => {
  const QM = (window.QM = window.QM || {});

  const authWrapEl = document.getElementById("auth");
  const appWrapEl = document.getElementById("app");
  const loginFormEl = document.getElementById("loginForm");
  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");
  const loginErrorEl = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logout");
  const toggleThemeBtn = document.getElementById("toggleTheme");
  const searchEl = document.getElementById("search");

  function isAuthed() {
    try {
      return sessionStorage.getItem(QM.AUTH_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setAuthed(value) {
    try {
      if (value) sessionStorage.setItem(QM.AUTH_KEY, "1");
      else sessionStorage.removeItem(QM.AUTH_KEY);
    } catch {
      // ignore
    }
  }

  function showLogin(message = "") {
    // If we're on notes.html, redirect to login
    if (window.location.pathname.includes("notes.html")) {
      window.location.href = "login.html";
      return;
    }
    
    if (appWrapEl) appWrapEl.hidden = true;
    if (authWrapEl) authWrapEl.hidden = false;
    if (loginErrorEl) {
      loginErrorEl.hidden = !message;
      loginErrorEl.textContent = message || "";
    }
    if (emailEl) emailEl.focus();
  }

  function showApp() {
    // If we're on login.html, redirect to notes
    if (window.location.pathname.includes("login.html") || 
        window.location.pathname.includes("how-it-works.html") ||
        window.location.pathname.endsWith("/") ||
        window.location.pathname.endsWith("/index.html")) {
      window.location.href = "notes.html";
      return;
    }
    
    if (authWrapEl) authWrapEl.hidden = true;
    if (appWrapEl) appWrapEl.hidden = false;
  }

  function logout() {
    setAuthed(false);
    window.location.href = "login.html";
  }

  function initAuth() {
    QM.setTheme(QM.getTheme());

    // Check authentication on page load
    if (isAuthed()) {
      // If already authed and on login/how-it-works, go to notes
      if (window.location.pathname.includes("login.html") || 
          window.location.pathname.includes("how-it-works.html")) {
        window.location.href = "notes.html";
        return;
      }
      
      // If on notes or canvas page, show app
      if (window.location.pathname.includes("notes.html") || 
          window.location.pathname.includes("node-canvas.html")) {
        showApp();
        // Boot canvas if on canvas page
        if (window.location.pathname.includes("node-canvas.html")) {
          if (typeof QM.bootCanvas === "function") {
            QM.bootCanvas();
          }
        } else if (typeof QM.bootApp === "function") {
          QM.bootApp();
        }
      }
    } else {
      // Not authed - redirect to login if trying to access notes or canvas
      if (window.location.pathname.includes("notes.html") || 
          window.location.pathname.includes("node-canvas.html")) {
        window.location.href = "login.html";
        return;
      }
      
      showLogin("");
    }

    if (loginFormEl) {
      loginFormEl.addEventListener("submit", (e) => {
        e.preventDefault();
        const entered = QM.normalizeEmail(emailEl ? emailEl.value : "");
        const allowed = QM.normalizeEmail(QM.ALLOWED_EMAIL);
        const enteredPass = QM.normalizePassword(passwordEl ? passwordEl.value : "");
        const allowedPass = QM.normalizePassword(QM.ALLOWED_PASSWORD);

        if (!entered || !enteredPass) return showLogin("Please enter email and password.");
        if (entered !== allowed || enteredPass !== allowedPass) {
          return showLogin("Access denied: invalid email or password.");
        }
        setAuthed(true);
        showApp();
        if (typeof QM.bootApp === "function") {
          QM.bootApp();
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }

    if (toggleThemeBtn) {
      toggleThemeBtn.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        QM.setTheme(next);
      });
    }

    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        if (appWrapEl && !appWrapEl.hidden) {
          e.preventDefault();
          if (searchEl) searchEl.focus();
        }
      }
    });
  }

  initAuth();
})();

