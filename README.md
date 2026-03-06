# Quick Messages 📋

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/pure%20vanilla%20JS-yes-green.svg" alt="Pure Vanilla JS"></a>
  <a href="#"><img src="https://img.shields.io/badge/local--storage-only-orange.svg" alt="Local Storage"></a>
</p>

A clean, local-first web app for saving frequently used text messages and copying them with one click. Features both a card-based grid view and a visual node canvas for organizing your messages.

![Quick Messages Demo](https://via.placeholder.com/800x400?text=Quick+Messages+Demo)

## ✨ Features

### Core Functionality
- **Add Message Cards** - Create new message nodes with titles and content
- **One-Click Copy** - Copy any message to clipboard instantly with visual feedback
- **Auto-Save** - All changes saved automatically to localStorage
- **Search** - Filter messages by title or content (Ctrl+K shortcut)
- **Drag & Reorder** - Rearrange cards by dragging the handle

### Views
- **Notes View** - Card-based grid layout for quick access
- **Canvas View** - Visual node map with pan, zoom, and connections

### User Experience
- **Dark Mode** - Toggle between light and dark themes
- **Keyboard Shortcuts** - Ctrl+K to focus search
- **Responsive Design** - Works on desktop and mobile
- **Accessible** - ARIA labels and keyboard navigation

### Data
- **Local Storage** - All data stays in your browser
- **No Server** - Runs entirely client-side
- **No Account Required** - No login needed (optional basic gate)

## 🚀 Getting Started

### Option 1: Direct Open
Simply open `index.html` in your browser:
```powershell
start index.html
```

### Option 2: Local Server (Recommended)
Run a local server to avoid browser restrictions:

```powershell
# Python 3
python -m http.server 8000

# Or using Node.js
npx serve .
```

Then open: **http://localhost:8000**

### Default Login (Optional)
The app has optional client-side authentication:
- **Email:** `admin@example.com`
- **Password:** `changeme123`

> ⚠️ **Note:** This is basic client-side gating only. It's meant for light privacy, not strong security.

## 📁 Project Structure

```
note app/
├── index.html          # Main app page (Notes view)
├── notes.html          # Alternative Notes view with fixed header
├── login.html          # Login page
├── how-it-works.html   # Help/guide page
├── node-canvas.html    # Canvas view (visual node map)
├── style.css           # Main stylesheet
├── styles.css          # Additional styles
├── helpers.js          # Utilities & configuration
├── messages.js         # Notes view logic
├── canvas.js           # Canvas view logic
└── auth.js             # Authentication logic
```

## 🎨 Customization

### Change Login Credentials
Edit `helpers.js`:
```javascript
QM.ALLOWED_EMAIL = "your-email@example.com";
QM.ALLOWED_PASSWORD = "your-password";
```

### Change Colors
Edit the CSS variables in `style.css`:
```css
:root {
  --primary: #2563eb;      /* Change main color */
  --bg: #f6f7fb;          /* Change background */
  --panel: #ffffff;       /* Change card background */
}
```

## 🔧 Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox
- **Vanilla JavaScript** - No frameworks
- **localStorage** - Data persistence

## 📋 Data Storage

Data is stored in browser localStorage with these keys:
- `quickMessages.nodes.v1` - Message cards
- `quickMessages.theme.v1` - Theme preference
- `quickMessages.auth.v1` - Auth state
- `quickMessages.connections.v1` - Canvas node connections
- `quickMessages.nodePositions.v1` - Canvas node positions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by snippet managers and text expansion tools
- Built with pure vanilla JavaScript for simplicity and performance

