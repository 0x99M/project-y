const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clipboardManager', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  copyToClipboard: (entry) => ipcRenderer.invoke('copy-to-clipboard', entry),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  simulatePaste: () => ipcRenderer.invoke('simulate-paste'),
  updateNote: ({ id, note }) => ipcRenderer.invoke('update-note', { id, note }),
  toggleExpand: () => ipcRenderer.invoke('toggle-expand'),
  getPinned: () => ipcRenderer.invoke('get-pinned'),
  pinEntry: (id) => ipcRenderer.invoke('pin-entry', id),
  unpinEntry: (id) => ipcRenderer.invoke('unpin-entry', id),
  getStats: () => ipcRenderer.invoke('get-stats'),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  getAccent: () => ipcRenderer.invoke('get-accent'),
  setAccent: (color) => ipcRenderer.invoke('set-accent', color),
  getShortcut: () => ipcRenderer.invoke('get-shortcut'),
  setShortcut: (shortcut) => ipcRenderer.invoke('set-shortcut', shortcut),
  getAutoPaste: () => ipcRenderer.invoke('get-auto-paste'),
  setAutoPaste: (enabled) => ipcRenderer.invoke('set-auto-paste', enabled),
  getAutoScrollTop: () => ipcRenderer.invoke('get-auto-scroll-top'),
  setAutoScrollTop: (v) => ipcRenderer.invoke('set-auto-scroll-top', v),
  getAutoClearSearch: () => ipcRenderer.invoke('get-auto-clear-search'),
  setAutoClearSearch: (v) => ipcRenderer.invoke('set-auto-clear-search', v),
  getFontSize: () => ipcRenderer.invoke('get-font-size'),
  setFontSize: (size) => ipcRenderer.invoke('set-font-size', size),
  getMinimalView: () => ipcRenderer.invoke('get-minimal-view'),
  setMinimalView: (v) => ipcRenderer.invoke('set-minimal-view', v),
  getRememberPosition: () => ipcRenderer.invoke('get-remember-position'),
  setRememberPosition: (v) => ipcRenderer.invoke('set-remember-position', v),
  getAutostart: () => ipcRenderer.invoke('get-autostart'),
  setAutostart: (v) => ipcRenderer.invoke('set-autostart', v),
  getLicenseInfo: () => ipcRenderer.invoke('license:info'),
  activateLicense: (key) => ipcRenderer.invoke('license:activate', key),
  deactivateLicense: () => ipcRenderer.invoke('license:deactivate'),
  isPro: () => ipcRenderer.invoke('license:isPro'),
  onHistoryUpdated: (callback) => {
    ipcRenderer.removeAllListeners('history-updated');
    ipcRenderer.on('history-updated', (_event, history) => callback(history));
  },
  onPinnedUpdated: (callback) => {
    ipcRenderer.removeAllListeners('pinned-updated');
    ipcRenderer.on('pinned-updated', (_event, pinned) => callback(pinned));
  },
});
