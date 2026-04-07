---
name: ipc-patterns
description: Use when adding new IPC communication between main and renderer
---

# Pattern: main → renderer (push event)
```js
// main.js
mainWindow.webContents.send('channel-name', data);

// preload.js — expose listener registration
onChannelName: (callback) => {
  ipcRenderer.on('channel-name', (_event, data) => callback(data));
}
```

# Pattern: renderer → main (request/response)
```js
// main.js
ipcMain.handle('channel-name', async (_event, data) => {
  // process and return result
  return result;
});

// preload.js — expose as async function
channelName: (data) => ipcRenderer.invoke('channel-name', data)

// renderer/app.js — call it
const result = await window.clipboardManager.channelName(data);
```

# Current IPC channels for this project
| Channel            | Method          | Direction | Payload   |
|--------------------|-----------------|-----------|-----------|
| get-history        | invoke/handle   | R → M     | none      |
| copy-to-clipboard  | invoke/handle   | R → M     | Entry obj |
| clear-history      | invoke/handle   | R → M     | none      |
| hide-window        | invoke/handle   | R → M     | none      |
| history-updated    | send/on         | M → R     | Entry[]   |

# Rules
- All IPC channels must be registered in preload.js via contextBridge
- Never expose raw ipcRenderer to the renderer process
- Channel names use kebab-case
- Use invoke/handle for request-response, send/on for events
