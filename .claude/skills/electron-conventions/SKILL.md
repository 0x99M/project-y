---
name: electron-conventions
description: Use when writing any Electron code in this project
---

- Always use contextBridge + preload.js for IPC. Never set nodeIntegration: true
- Main process handles: clipboard polling, tray, global shortcuts, file persistence
- Renderer is pure UI only — no Node.js APIs directly
- IPC channel naming: kebab-case (e.g. "get-history", "copy-to-clipboard", "history-updated")
- Persist data via electron-store@8.2.0 to app.getPath('userData')
- Use ipcMain.handle / ipcRenderer.invoke for request-response patterns
- Use webContents.send / ipcRenderer.on for main→renderer push events
- All BrowserWindow instances must have contextIsolation: true
- Use app.requestSingleInstanceLock() to prevent multiple instances
