Build a clipboard history manager desktop app using Electron for Ubuntu/Linux.

## Core Requirements

**Clipboard Monitoring**
- Poll the clipboard every 500ms using Electron's built-in `clipboard` module
- Detect changes by comparing current content to last recorded entry
- Support text and images (use clipboard.readImage() for image detection)
- Cap history at 200 entries (oldest removed first)
- Deduplicate: don't add an entry if it's identical to the most recent one

**Data Persistence**
- Save history to a local JSON file in the app's userData directory
- Load history on app startup
- Auto-save whenever history changes

**System Tray**
- App lives in the system tray (no dock/taskbar icon)
- Tray icon opens/hides the main window on click
- Tray right-click menu has: "Show", "Clear History", "Quit"
- Use a simple PNG icon (generate a placeholder if needed)

**Main Window (Popup UI)**
- Frameless window, ~380px wide, ~500px tall
- Appears near the tray icon or centered on screen
- Hides (not closes) when it loses focus
- Shows clipboard history as a scrollable list, newest on top
- Each entry shows: truncated preview (max 2 lines), timestamp (e.g. "2 min ago")
- Clicking an entry copies it back to clipboard and hides the window
- Search bar at the top to filter entries in real time
- "Clear All" button at the bottom

**Global Shortcut**
- Register Ctrl+Shift+V to toggle the window from anywhere
- If the shortcut is already taken, fall back to Ctrl+Shift+B

**Autostart**
- On first launch, ask the user if they want the app to start on login
- If yes, write a .desktop file to ~/.config/autostart/

## Tech Stack
- Electron (latest stable)
- Vanilla JS, HTML, CSS (no frontend frameworks)
- Use contextBridge + preload.js for IPC (no nodeIntegration in renderer)
- electron-store for persistence (or plain fs + JSON if preferred)

## Project Structure
electron-clipboard-manager/
├── main.js
├── preload.js
├── package.json
├── assets/
│   └── icon.png
└── renderer/
    ├── index.html
    ├── style.css
    └── app.js

## UX Details
- Dark theme UI (background #1e1e1e, text #f0f0f0, accent #7c6af7)
- Smooth fade-in animation when window appears
- Hover highlight on each history entry
- Show "No items yet" empty state when history is empty
- Keyboard navigation: arrow keys to move between entries, Enter to select, Escape to close

## Deliverables
1. All source files with the above structure
2. package.json with all dependencies and these npm scripts:
   - "start": run the app
   - "build": package with electron-builder for Linux (.AppImage and .deb)
3. A short README.md with setup and usage instructions

Start by scaffolding the project, then implement main.js, then preload.js, then the renderer.
