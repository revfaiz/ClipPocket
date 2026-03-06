## Quick Messages (Vanilla JS)

A simple, clean web app for saving frequently used messages and copying them in one click.

### Demo / What it does

- **Add** message cards
- **Edit** messages directly in the card (textarea)
- **Copy** with one click + a small **“Copied!”** notification
- **Delete** cards
- **Auto-saves** to **localStorage** so your messages stay after refresh
- **Search** to filter cards
- **Drag & reorder** cards
- **Dark mode** toggle (remembered)

### Project structure

- `index.html` — page markup
- `style.css` — styling
- `app.js` — app logic (storage, copy, search, reorder, theme)

### Run locally

Option A: open `index.html` in your browser.

Option B (recommended): serve it on localhost (avoids some browser `file://` restrictions):

```powershell
python -m http.server 8000
```

Then open:

- `http://localhost:8000/`

### Data storage

This app stores your data in your browser’s localStorage:

- `quickMessages.nodes.v1` — message cards
- `quickMessages.theme.v1` — theme preference


