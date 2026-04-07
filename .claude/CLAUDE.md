# Clipboard Manager — Project Rules

## Stack
- Electron (latest), Vanilla JS/HTML/CSS, no frontend frameworks
- electron-store@8.2.0 for persistence (last CJS-compatible version)
- CJS throughout (no "type": "module" in package.json)

## Always Follow
- Dark theme: bg #1e1e1e, text #f0f0f0, accent #7c6af7
- Cap history at 200 entries, deduplicate consecutive identical entries
- Window hides on blur, never closes (only Quit from tray menu closes app)
- Global shortcut: Ctrl+Shift+D, fallback Ctrl+Shift+B
- Use contextBridge + preload.js for all IPC — no nodeIntegration in renderer
- Main process owns: clipboard polling, tray, global shortcuts, persistence
- Renderer is pure UI only — no Node.js APIs

## Never Do
- Don't use localStorage or sessionStorage
- Don't set nodeIntegration: true
- Don't add npm packages without asking first
- Don't use ESM-only packages (project is CJS)
