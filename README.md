# NEONFLOW

> A visually striking, single-page task manager with a cyberpunk aesthetic.

**NEONFLOW** brings "acid rave meets brutalist productivity" — deep void backgrounds shattered by electric neons, chunky brutalist typography, and motion that feels physics-driven and satisfying.

## Features

- 🎨 **Bold Visual Design** — Electric neons, glassmorphism, ambient glow effects
- ⚡ **Zero Dependencies** — Vanilla JS, no build step required
- 📱 **Responsive** — Works on desktop and mobile
- ⌨️ **Keyboard Navigation** — Navigate tasks with J/K, complete with Space
- 🔄 **Drag & Drop** — Reorder tasks within lists
- 🔍 **Smart Lists** — Filter tasks by My Day, Important, Planned, All, Completed
- 💾 **Local Persistence** — Data survives page refreshes via localStorage
- 🎭 **Rich Animations** — Particle effects on completion, glitch effects on deletion

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Vanilla HTML5/CSS3/JavaScript (ES6+) |
| **Styling** | Custom CSS with CSS variables |
| **Fonts** | Google Fonts — Space Grotesk, JetBrains Mono |
| **Testing** | Jasmine 5.x |
| **Storage** | Browser localStorage |

## Project Structure

```
neonflow/
├── index.html              # Main HTML entry point
├── css/
│   └── styles.css          # All styles with CSS custom properties
├── js/
│   ├── app.js              # Application bootstrap
│   ├── store.js            # Data model, CRUD, localStorage persistence
│   ├── task-list-view.js   # Task rendering and view logic
│   ├── task-creation.js    # Task creation UI and modal
│   ├── task-completion.js  # Completion animations & effects
│   └── task-deletion.js     # Deletion animations & effects
├── spec/                   # Feature specifications (BDD-style)
├── test/                   # Feature tests (Jasmine)
├── SPEC.md                 # Full application specification
└── package.json            # Project metadata & test scripts
```

## Quick Start

> ⚠️ **Important**: Opening `index.html` directly via `file://` may cause CSS/JS loading issues due to browser security restrictions. Use a local server.

### Option 1: Quick Start Script (Recommended)
```bash
./start.sh
```

### Option 2: Manual Server
```bash
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

### Option 3: Using npx
```bash
npx serve .
```

## Testing

Run all tests:
```bash
npm test
```

Run specific feature tests:
```bash
npm run test:feat002    # Task completion tests
npm run test:feat003    # Task deletion tests
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl + N` | New task |
| `Ctrl + F` | Focus search |
| `J / ↓` | Navigate to next task |
| `K / ↑` | Navigate to previous task |
| `Space` | Toggle task completion |
| `Enter` | Edit task (double-click on title) |

## Smart Lists

- **My Day** — Tasks due today or marked urgent
- **Important** — High/urgent priority tasks
- **Planned** — All tasks with due dates
- **All** — All incomplete tasks
- **Completed** — All completed tasks

## Task Options

Click the `...` menu on any task to:
- **Edit** — Open modal to edit task details
- **Delete** — Remove task with confirmation

## Data

All data is stored locally in your browser's localStorage. Data persists across sessions and works offline.

## License

MIT
