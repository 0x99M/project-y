const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clipboardManager', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  copyToClipboard: (entry) => ipcRenderer.invoke('copy-to-clipboard', entry),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  toggleExpand: () => ipcRenderer.invoke('toggle-expand'),
  onHistoryUpdated: (callback) => {
    ipcRenderer.removeAllListeners('history-updated');
    ipcRenderer.on('history-updated', (_event, history) => callback(history));
  },
});
