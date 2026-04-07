# Electron Clipboard History Manager — Implementation Plan

## Overview

Tray-based clipboard history manager for Ubuntu/Linux. Monitors the system clipboard, stores up to 200 text/image entries, provides a popup UI with search and keyboard navigation. Spec: `starter.md`.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Persistence | `electron-store@8.2.0` | Last CJS version. Atomic writes, `.bak` corruption recovery, auto `userData` path |
| Module system | CJS (`require`) | No `"type": "module"` — avoids ESM-only breakage |
| Image storage | Base64 PNG data URLs | Only way to serialize `NativeImage` into JSON |
| Image size cap | Thumbnail via `nativeImage.resize({width: 400})` if >5MB | Prevents history file from ballooning |
| Multi-instance | `app.requestSingleInstanceLock()` | Second launch focuses existing window |
| Tray on Linux | Context menu only, no click handler | `tray.on('click')` is unreliable on Linux DEs (see `linux-tray` skill) |
| Window position | Always center on screen | `tray.getBounds()` returns zeros on GNOME — don't even try |

## Data Model

```js
{
  id: String,           // crypto.randomUUID()
  type: 'text' | 'image',
  content: String,      // plain text or data:image/png;base64,...
  timestamp: Number,    // Date.now()
  preview: String       // first 200 chars for text, '[Image]' for images
}
```

## IPC Contract

All channels go through `contextBridge` in `preload.js`. Renderer never sees `ipcRenderer` directly.

| Channel | Pattern | Direction | Payload | Response |
|---|---|---|---|---|
| `get-history` | invoke/handle | R → M | — | `Entry[]` |
| `copy-to-clipboard` | invoke/handle | R → M | `Entry` | — |
| `clear-history` | invoke/handle | R → M | — | — |
| `hide-window` | invoke/handle | R → M | — | — |
| `history-updated` | send/on | M → R | `Entry[]` | — |

## File Structure

```
project-y/
├── package.json
├── main.js
├── preload.js
├── assets/
│   └── icon.png          (256x256 placeholder)
├── renderer/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── README.md
├── starter.md            (spec — already exists)
└── .claude/              (already exists)
```

---

## Steps

### Step 1 — Scaffold

**Files**: `package.json`, directories `assets/`, `renderer/`

`package.json`:
- `"name": "electron-clipboard-manager"`, `"main": "main.js"`
- No `"type": "module"`
- Dependencies: `electron-store@8.2.0`
- DevDependencies: `electron`, `electron-builder`
- Scripts:
  - `"start": "electron ."`
  - `"build": "electron-builder --linux AppImage deb"`
- `"build"` config: `linux.target: ["AppImage", "deb"]`, `linux.icon: "assets/icon.png"`, `linux.category: "Utility"`, `productName: "Clipboard Manager"`

Then: `npm install`

### Step 2 — Placeholder icon

**File**: `assets/icon.png`

Generate a 256x256 purple (#7c6af7) clipboard-shaped PNG. Approach: write a small Node script that creates it using raw PNG bytes or the `canvas` package, run it once, delete the script. Alternatively, embed a hardcoded base64 minimal PNG and decode it to disk.

The icon must be a **file on disk** (not just a `NativeImage` in memory) because Linux AppIndicator requires a file path.

### Step 3 — Main process (`main.js`, ~280 lines)

**File**: `main.js`

This is the core. Broken into sections:

**3a. Boilerplate & store**
- Require: `app, BrowserWindow, Tray, Menu, clipboard, globalShortcut, nativeImage, ipcMain, dialog, screen`
- `const Store = require('electron-store')`
- Store defaults: `{ history: [], firstLaunch: true }`

**3b. Single instance lock**
- `app.requestSingleInstanceLock()` — if not acquired, `app.quit()`
- On `second-instance` event: show and focus the existing window

**3c. `createWindow()`**
- `width: 380, height: 500, frame: false, resizable: false`
- `skipTaskbar: true, show: false, alwaysOnTop: true`
- `webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js') }`
- Load `renderer/index.html`
- On `blur` → `mainWindow.hide()`
- On `close` → prevent default + hide (unless `app.isQuitting` flag is set)

**3d. `createTray()` — Linux-compatible approach**
- Load icon from file path: `path.join(__dirname, 'assets', 'icon.png')`
- If file missing, generate a fallback 16x16 in-memory PNG and write it to disk first
- **No `tray.on('click')` handler** — unreliable on Linux
- Context menu only (covers both left-click and right-click on Linux):
  ```
  Show/Hide  → toggleWindow()
  Clear History → clearHistory()
  ─────────
  Quit → app.isQuitting = true; app.quit()
  ```
- `toggleWindow()`: if visible → hide; else → center on primary display workArea → show + focus

**3e. Window positioning**
- Always center on screen: `screen.getPrimaryDisplay().workAreaSize`
- Do NOT use `tray.getBounds()` — returns zeros on GNOME

**3f. Clipboard polling**
- `setInterval(checkClipboard, 500)`
- `checkClipboard()`:
  1. `clipboard.readText()` — if non-empty and differs from `lastClipboardContent`, add text entry
  2. Else: `clipboard.readImage()` — if not empty, convert to PNG buffer, compare base64 to `lastClipboardImageHash`, add image entry if different
  3. Text checked first because apps often provide both text+image formats simultaneously
- `addEntry(type, content, preview)`:
  - If image and `buffer.length > 5MB`, resize to width 400
  - Create entry object with `crypto.randomUUID()`, `Date.now()`
  - `clipboardHistory.unshift(entry)`
  - `clipboardHistory = clipboardHistory.slice(0, 200)`
  - `store.set('history', clipboardHistory)`
  - `mainWindow.webContents.send('history-updated', clipboardHistory)`

**3g. Global shortcut**
- Try `Ctrl+Shift+V` → if fails, try `Ctrl+Shift+B` → if fails, log warning
- `app.on('will-quit', () => globalShortcut.unregisterAll())`

**3h. Autostart**
- On first launch (`store.get('firstLaunch') === true`):
  - `dialog.showMessageBox()` with Yes/No
  - If Yes: write `~/.config/autostart/clipboard-manager.desktop`
  - Set `store.set('firstLaunch', false)`
- `.desktop` file content: `Type=Application`, `Exec=` pointing to `process.execPath`, icon path, `Terminal=false`

**3i. IPC handlers**
- `get-history` → return `clipboardHistory`
- `copy-to-clipboard` → write text or image back to clipboard, update `lastClipboard*` to prevent re-capture
- `clear-history` → empty array, persist, notify renderer
- `hide-window` → `mainWindow.hide()`

**3j. Startup sequence in `app.whenReady()`**
1. Load history from store (try/catch, default to `[]`)
2. Seed `lastClipboardContent` / `lastClipboardImageHash` from most recent entry
3. `createWindow()`
4. `createTray()`
5. `registerGlobalShortcut()`
6. `startClipboardPolling()`
7. `checkAutostart()`

### Step 4 — Preload bridge (`preload.js`, ~20 lines)

**File**: `preload.js`

```js
contextBridge.exposeInMainWorld('clipboardManager', {
  getHistory:        () => ipcRenderer.invoke('get-history'),
  copyToClipboard:   (entry) => ipcRenderer.invoke('copy-to-clipboard', entry),
  clearHistory:      () => ipcRenderer.invoke('clear-history'),
  hideWindow:        () => ipcRenderer.invoke('hide-window'),
  onHistoryUpdated:  (cb) => ipcRenderer.on('history-updated', (_e, data) => cb(data)),
});
```

No raw `ipcRenderer` exposed. Each channel maps to a named function.

### Step 5 — HTML (`renderer/index.html`, ~30 lines)

**File**: `renderer/index.html`

Structure:
```
#app
  #search-bar > input#search (placeholder "Search clipboard...", autofocus)
  #history-list (scrollable, dynamically populated)
  #empty-state > p "No items yet" (shown when list is empty)
  #footer > button#clear-all "Clear All"
```

Links `style.css` and `app.js`. No external CDN dependencies.

### Step 6 — Styles (`renderer/style.css`, ~150 lines)

**File**: `renderer/style.css`

- `body`: bg `#1e1e1e`, text `#f0f0f0`, system sans-serif, no margin, `overflow: hidden`, `border-radius: 8px`
- `#app`: `animation: fadeIn 0.15s ease-in`
- `#search-bar`: sticky top, bg `#2a2a2a`, padding 12px
- `#search` input: full width, dark bg `#333`, accent border on focus, rounded
- `#history-list`: `overflow-y: auto`, `max-height: calc(100vh - 110px)`
- `.history-entry`: padding, pointer cursor, `border-bottom: 1px solid #333`, `transition: background 0.1s`
- `.history-entry:hover, .history-entry.selected`: bg `#2d2d3d`
- `.entry-preview`: `-webkit-line-clamp: 2`, overflow hidden, `word-break: break-all`
- `.entry-image-preview`: `max-width: 100%`, `max-height: 60px`, rounded
- `.entry-time`: small font, color `#888`
- `#empty-state`: centered, color `#666`, padded
- `#clear-all`: bg `#7c6af7`, white text, rounded, no border
- Custom scrollbar: thin (6px), thumb `#555`

### Step 7 — Renderer logic (`renderer/app.js`, ~150 lines)

**File**: `renderer/app.js`

**State**: `historyData = []`, `filteredData = []`, `selectedIndex = -1`

**On DOMContentLoaded**:
1. `historyData = await window.clipboardManager.getHistory()`
2. `renderHistory(historyData)`
3. Subscribe: `window.clipboardManager.onHistoryUpdated(...)` → update `historyData`, re-apply filter
4. Wire `#search` input → `applyFilter()`
5. Wire `#clear-all` click → `clearHistory()` IPC
6. Wire `document` keydown → `handleKeyDown()`

**`renderHistory(entries)`**:
- If empty → show `#empty-state`, clear list
- Else → build HTML for each entry:
  - Text: `escapeHtml(entry.preview)` in a clamped div
  - Image: `<img src="${entry.content}">` thumbnail
  - Timestamp: `timeAgo(entry.timestamp)`
- Attach click handler to each: `copyToClipboard(entry)` + `hideWindow()`

**`applyFilter()`**:
- Get search input value, lowercase
- Filter `historyData` where `type === 'text'` and `content.toLowerCase().includes(query)`
- Reset `selectedIndex = -1`
- `renderHistory(filteredData)` or full list if query is empty

**`handleKeyDown(e)`**:
- ArrowDown → increment `selectedIndex` (clamp to list length)
- ArrowUp → decrement `selectedIndex` (clamp to 0)
- Enter → copy selected entry + hide
- Escape → hide window
- `scrollIntoView({ block: 'nearest' })` after arrow nav

**`escapeHtml(str)`**: create text node, read innerHTML (safe)

**`timeAgo(ts)`**: "just now" / "Xs ago" / "X min ago" / "Xh ago" / "Xd ago"

### Step 8 — README (`README.md`)

**File**: `README.md`

Short doc:
- What the app does (1 sentence)
- Prerequisites: Node.js 18+, npm, GNOME AppIndicator extension (for tray)
- `npm install` → `npm start` → `npm run build`
- Usage: global shortcut, tray menu, search, keyboard nav
- Config location: `~/.config/electron-clipboard-manager/`

### Step 9 — Review

Run the `code-reviewer` agent against all files to check for:
- Security violations (nodeIntegration, unsanitized innerHTML)
- IPC violations (channels not in preload)
- Linux compatibility issues (tray click handlers, getBounds assumptions)

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Corrupted store file | `electron-store` recovers from `.bak`; wrap in try/catch, default `[]` |
| `tray.getBounds()` returns zeros | Don't use it — always center on screen |
| Tray click not firing (Linux) | Context menu only — "Show/Hide" as first item |
| Large clipboard images | Thumbnail to width 400 before storing |
| Shortcut already taken | Fallback `Ctrl+Shift+V` → `Ctrl+Shift+B` → log warning |
| Window off-screen | Center on `workAreaSize` guarantees on-screen |
| Multiple app instances | Single instance lock; second launch focuses first |
| Text+image dual clipboard format | Check text first; only check image if text unchanged |
| Copying entry back to clipboard | Update `lastClipboard*` to prevent re-capture loop |
| AppIndicator needs file path | Icon always loaded from disk, not in-memory NativeImage |

## Verification Checklist

1. `npm start` — app in system tray, no taskbar entry
2. Copy text → appears in popup within 1s
3. Copy image (screenshot) → appears as thumbnail
4. Click entry → copies to clipboard, window hides
5. `Ctrl+Shift+V` or `Ctrl+Shift+B` → toggles popup
6. Search bar → filters entries in real time
7. Arrow keys → navigate, Enter → select, Escape → close
8. "Clear All" → empties history
9. Quit + relaunch → history persists
10. `npm run build` → produces `.AppImage` and `.deb`
