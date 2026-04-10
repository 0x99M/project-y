const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clipboardManager', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  copyToClipboard: (entry) => ipcRenderer.invoke('copy-to-clipboard', entry),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  updateNote: ({ id, note }) => ipcRenderer.invoke('update-note', { id, note }),
  toggleExpand: () => ipcRenderer.invoke('toggle-expand'),
  getPinned: () => ipcRenderer.invoke('get-pinned'),
  pinEntry: (id) => ipcRenderer.invoke('pin-entry', id),
  unpinEntry: (id) => ipcRenderer.invoke('unpin-entry', id),
  onHistoryUpdated: (callback) => {
    ipcRenderer.removeAllListeners('history-updated');
    ipcRenderer.on('history-updated', (_event, history) => callback(history));
  },
  onPinnedUpdated: (callback) => {
    ipcRenderer.removeAllListeners('pinned-updated');
    ipcRenderer.on('pinned-updated', (_event, pinned) => callback(pinned));
  },
});
