const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  clipboard,
  globalShortcut,
  nativeImage,
  ipcMain,
  dialog,
  screen,
} = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Store = require('electron-store');

// ─── Persistence ────────────────────────────────────────────────────────────────

const store = new Store({
  name: 'clipmer-data',
  defaults: {
    history: [],
    pinned: [],
    theme: 'dark',
    accentColor: '#E95420',
    shortcut: 'Ctrl+Shift+D',
    autoPaste: false,
    autoScrollTop: true,
    autoClearSearch: true,
    fontSize: 13,
    minimalView: false,
    firstLaunch: true,
  },
});

// ─── State ──────────────────────────────────────────────────────────────────────

let mainWindow = null;
let tray = null;
let clipboardHistory = [];
let pinnedEntries = [];
let lastClipboardText = '';
let lastClipboardImageB64 = '';
let pollingInterval = null;

const MAX_HISTORY = 200;
const POLL_MS = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const PID_FILE = path.join(app.getPath('userData'), 'clipmer.pid');

// ─── Single instance lock ───────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  // Send SIGUSR1 to the running instance to toggle, then quit
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
    process.kill(pid, 'SIGUSR1');
  } catch {}
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) toggleWindow();
  });
}

// ─── Window ─────────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 500,
    frame: false,
    resizable: true,
    minWidth: 380,
    minHeight: 500,
    show: false,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ─── Window positioning ─────────────────────────────────────────────────────────

function showWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay();
  const { width, height } = mainWindow.getBounds();
  const x = Math.round((workAreaSize.width - width) / 2);
  const y = Math.round((workAreaSize.height - height) / 2);
  mainWindow.setPosition(x, y);
  mainWindow.show();
  mainWindow.focus();
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
}

// ─── Tray ───────────────────────────────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let icon;

  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Clipmer');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: () => toggleWindow() },
    { label: 'Clear History', click: () => clearHistory() },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// ─── Clipboard polling ──────────────────────────────────────────────────────────

function startClipboardPolling() {
  pollingInterval = setInterval(checkClipboard, POLL_MS);
}

function checkClipboard() {
  const currentText = clipboard.readText();
  if (currentText && currentText !== lastClipboardText) {
    lastClipboardText = currentText;
    addEntry('text', currentText, currentText.substring(0, 200));
    return;
  }

  const currentImage = clipboard.readImage();
  if (!currentImage.isEmpty()) {
    let pngBuffer = currentImage.toPNG();
    const b64 = pngBuffer.toString('base64');

    if (b64 !== lastClipboardImageB64) {
      lastClipboardImageB64 = b64;

      if (pngBuffer.length > MAX_IMAGE_BYTES) {
        const resized = currentImage.resize({ width: 400 });
        pngBuffer = resized.toPNG();
      }

      const dataUrl = 'data:image/png;base64,' + pngBuffer.toString('base64');
      addEntry('image', dataUrl, '[Image]');
    }
  }
}

function addEntry(type, content, preview) {
  const entry = {
    id: crypto.randomUUID(),
    type,
    content,
    preview,
    timestamp: Date.now(),
    note: '',
  };

  clipboardHistory.unshift(entry);
  clipboardHistory = clipboardHistory.slice(0, MAX_HISTORY);
  store.set('history', clipboardHistory);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('history-updated', clipboardHistory);
  }
}

function clearHistory() {
  clipboardHistory = [];
  store.set('history', []);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('history-updated', []);
  }
}

// ─── IPC handlers ───────────────────────────────────────────────────────────────

ipcMain.handle('get-history', () => clipboardHistory);

ipcMain.handle('copy-to-clipboard', (_event, entry) => {
  if (entry.type === 'text') {
    clipboard.writeText(entry.content);
    lastClipboardText = entry.content;
  } else if (entry.type === 'image') {
    const b64 = entry.content.replace(/^data:image\/png;base64,/, '');
    const img = nativeImage.createFromBuffer(Buffer.from(b64, 'base64'));
    clipboard.writeImage(img);
    lastClipboardImageB64 = b64;
  }
});

ipcMain.handle('clear-history', () => {
  clearHistory();
});

ipcMain.handle('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('simulate-paste', () => {
  if (mainWindow) mainWindow.hide();

  if (!store.get('autoPaste')) return;

  setTimeout(() => {
    const { exec } = require('child_process');
    exec(
      'gdbus call --session --dest com.clipmer.PasteHelper ' +
      '--object-path /com/clipmer/PasteHelper ' +
      '--method com.clipmer.PasteHelper.Paste',
      (err) => {
        if (err) console.log('Auto-paste unavailable. Enable the Clipmer Paste Helper extension.');
      }
    );
  }, 150);
});

ipcMain.handle('update-note', (_event, { id, note }) => {
  const entry = clipboardHistory.find((e) => e.id === id)
    || pinnedEntries.find((e) => e.id === id);
  if (entry) {
    entry.note = note;
    store.set('history', clipboardHistory);
    store.set('pinned', pinnedEntries);
  }
});

ipcMain.handle('get-pinned', () => pinnedEntries);

ipcMain.handle('pin-entry', (_event, id) => {
  const idx = clipboardHistory.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const [entry] = clipboardHistory.splice(idx, 1);
  if (pinnedEntries.length >= MAX_HISTORY) pinnedEntries.pop();
  pinnedEntries.unshift(entry);
  store.set('history', clipboardHistory);
  store.set('pinned', pinnedEntries);
  mainWindow?.webContents.send('history-updated', clipboardHistory);
  mainWindow?.webContents.send('pinned-updated', pinnedEntries);
});

ipcMain.handle('unpin-entry', (_event, id) => {
  const idx = pinnedEntries.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const [entry] = pinnedEntries.splice(idx, 1);
  clipboardHistory.unshift(entry);
  if (clipboardHistory.length > MAX_HISTORY) clipboardHistory.pop();
  store.set('history', clipboardHistory);
  store.set('pinned', pinnedEntries);
  mainWindow?.webContents.send('history-updated', clipboardHistory);
  mainWindow?.webContents.send('pinned-updated', pinnedEntries);
});

ipcMain.handle('get-stats', () => {
  const historyTexts = clipboardHistory.filter((e) => e.type === 'text').length;
  const historyImages = clipboardHistory.filter((e) => e.type === 'image').length;
  const historyNotes = clipboardHistory.filter((e) => e.note).length;
  const pinnedCount = pinnedEntries.length;
  const pinnedNotes = pinnedEntries.filter((e) => e.note).length;

  const historyJson = JSON.stringify(clipboardHistory);
  const pinnedJson = JSON.stringify(pinnedEntries);
  const totalBytes = Buffer.byteLength(historyJson) + Buffer.byteLength(pinnedJson);

  return {
    historyTotal: clipboardHistory.length,
    historyTexts,
    historyImages,
    historyNotes,
    pinnedCount,
    pinnedNotes,
    totalBytes,
  };
});

ipcMain.handle('get-theme', () => store.get('theme') || 'dark');

ipcMain.handle('set-theme', (_event, theme) => {
  store.set('theme', theme);
});

ipcMain.handle('get-accent', () => store.get('accentColor') || '#E95420');

ipcMain.handle('set-accent', (_event, color) => {
  store.set('accentColor', color);
});

ipcMain.handle('get-shortcut', () => store.get('shortcut') || 'Ctrl+Shift+D');

ipcMain.handle('set-shortcut', (_event, shortcut) => {
  globalShortcut.unregisterAll();
  store.set('shortcut', shortcut);
  registerGlobalShortcut();
  registerGnomeShortcut();
});

let isExpanded = false;
ipcMain.handle('toggle-expand', () => {
  if (!mainWindow) return isExpanded;
  const { workAreaSize } = screen.getPrimaryDisplay();
  if (isExpanded) {
    mainWindow.setSize(380, 500);
  } else {
    mainWindow.setSize(800, 900);
  }
  // Re-center after resize
  const { width, height } = mainWindow.getBounds();
  const x = Math.round((workAreaSize.width - width) / 2);
  const y = Math.round((workAreaSize.height - height) / 2);
  mainWindow.setPosition(x, y);
  isExpanded = !isExpanded;
  return isExpanded;
});

// ─── Global shortcuts ───────────────────────────────────────────────────────────

function registerGlobalShortcut() {
  // Electron globalShortcut works on X11 but silently fails on Wayland.
  // On Wayland, the SIGUSR1/GNOME-shortcut approach handles it instead.
  const shortcut = store.get('shortcut') || 'Ctrl+Shift+D';
  const registered = globalShortcut.register(shortcut, toggleWindow);
  if (registered) {
    console.log(`Global shortcut registered: ${shortcut}`);
  } else {
    console.log(`Failed to register shortcut: ${shortcut}`);
  }
}

function toGnomeBinding(shortcut) {
  return shortcut
    .split('+')
    .map((part, i, arr) => {
      if (i === arr.length - 1) return part.toLowerCase();
      return `<${part}>`;
    })
    .join('');
}

// Remove legacy GNOME shortcut from before the rename
function cleanupLegacyShortcut() {
  const { execSync } = require('child_process');
  try {
    const existing = execSync(
      'gsettings get org.gnome.settings-daemon.plugins.media-keys custom-keybindings',
      { encoding: 'utf8' }
    ).trim();
    if (existing.includes('clipboard-manager-toggle')) {
      const cleaned = existing.replace(/,?\s*'\/org\/gnome\/settings-daemon\/plugins\/media-keys\/custom-keybindings\/clipboard-manager-toggle\/'/, '');
      execSync(`gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "${cleaned}"`);
    }
  } catch {}
}

// Register a GNOME custom keyboard shortcut.
// It runs our app binary; the single-instance lock sends SIGUSR1 to toggle.
function registerGnomeShortcut() {
  const { execSync } = require('child_process');
  const shortcutName = 'clipmer-toggle';
  const shortcutPath = `/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/${shortcutName}/`;

  // Build a command that sends SIGUSR1 to the running process
  const command = `kill -USR1 $(cat '${PID_FILE}') 2>/dev/null`;

  try {
    const existing = execSync(
      'gsettings get org.gnome.settings-daemon.plugins.media-keys custom-keybindings',
      { encoding: 'utf8' }
    ).trim();

    if (!existing.includes(shortcutName)) {
      let paths;
      if (existing === '@as []' || existing === '[]') {
        paths = `['${shortcutPath}']`;
      } else {
        paths = existing.slice(0, -1) + `, '${shortcutPath}']`;
      }
      execSync(
        `gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "${paths}"`
      );
    }

    const base = `gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:${shortcutPath}`;
    execSync(`${base} name 'Clipmer Toggle'`);
    execSync(`${base} command "bash -c \\"${command}\\""`);
    const binding = toGnomeBinding(store.get('shortcut') || 'Ctrl+Shift+D');
    execSync(`${base} binding '${binding}'`);

    console.log(`GNOME shortcut registered: ${store.get('shortcut') || 'Ctrl+Shift+D'}`);
  } catch (err) {
    console.log('Could not register GNOME shortcut:', err.message);
  }
}

// ─── SIGUSR1 handler (Wayland shortcut toggle) ─────────────────────────────────

process.on('SIGUSR1', () => {
  if (mainWindow) toggleWindow();
});

// ─── Autostart ──────────────────────────────────────────────────────────────────

async function checkAutostart() {
  if (!store.get('firstLaunch')) return;
  store.set('firstLaunch', false);

  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 0,
    title: 'Autostart',
    message: 'Would you like Clipmer to start automatically on login?',
  });

  if (response === 0) {
    writeAutostartDesktopFile();
  }
}

function writeAutostartDesktopFile() {
  const os = require('os');
  const autostartDir = path.join(os.homedir(), '.config', 'autostart');

  if (!fs.existsSync(autostartDir)) {
    fs.mkdirSync(autostartDir, { recursive: true });
  }

  const execPath = app.isPackaged
    ? process.execPath
    : `${process.execPath} "${app.getAppPath()}"`;

  const desktopEntry = [
    '[Desktop Entry]',
    'Type=Application',
    'Name=Clipmer',
    `Exec=${execPath}`,
    `Icon=${path.join(__dirname, 'assets', 'icon.png')}`,
    'Comment=Clipboard History Manager',
    'Categories=Utility;',
    'Terminal=false',
    'StartupNotify=false',
    'X-GNOME-Autostart-enabled=true',
  ].join('\n') + '\n';

  fs.writeFileSync(
    path.join(autostartDir, 'clipmer.desktop'),
    desktopEntry
  );
}

// ─── Paste extension ────────────────────────────────────────────────────────────

function installPasteExtension() {
  const os = require('os');
  const extId = 'clipmer-paste@clipmer.local';
  const extDir = path.join(
    os.homedir(),
    '.local/share/gnome-shell/extensions',
    extId
  );

  const srcDir = path.join(__dirname, 'gnome-extension');
  if (!fs.existsSync(srcDir)) return;

  const isNew = !fs.existsSync(extDir);
  if (isNew) fs.mkdirSync(extDir, { recursive: true });

  for (const file of ['metadata.json', 'extension.js']) {
    fs.copyFileSync(path.join(srcDir, file), path.join(extDir, file));
  }

  const { execSync } = require('child_process');
  try {
    execSync(`gnome-extensions enable ${extId}`);
  } catch {
    // Extension not yet known to GNOME Shell — needs logout/login
  }

  return isNew;
}

ipcMain.handle('get-auto-paste', () => store.get('autoPaste') || false);
ipcMain.handle('get-auto-scroll-top', () => store.get('autoScrollTop') !== false);
ipcMain.handle('set-auto-scroll-top', (_event, v) => store.set('autoScrollTop', v));
ipcMain.handle('get-auto-clear-search', () => store.get('autoClearSearch') !== false);
ipcMain.handle('set-auto-clear-search', (_event, v) => store.set('autoClearSearch', v));
ipcMain.handle('get-font-size', () => store.get('fontSize') || 13);
ipcMain.handle('set-font-size', (_event, size) => store.set('fontSize', size));
ipcMain.handle('get-minimal-view', () => store.get('minimalView') || false);
ipcMain.handle('set-minimal-view', (_event, v) => store.set('minimalView', v));

ipcMain.handle('set-auto-paste', (_event, enabled) => {
  store.set('autoPaste', enabled);

  if (enabled) {
    const isNew = installPasteExtension();
    if (isNew) {
      return 'needs-restart';
    }
  }

  return 'ok';
});

// ─── App lifecycle ──────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Write PID file for SIGUSR1-based toggle
  fs.writeFileSync(PID_FILE, String(process.pid));

  // Load persisted history and pinned
  try {
    clipboardHistory = store.get('history') || [];
    pinnedEntries = store.get('pinned') || [];
  } catch {
    clipboardHistory = [];
    pinnedEntries = [];
  }

  if (clipboardHistory.length > 0) {
    const latest = clipboardHistory[0];
    if (latest.type === 'text') {
      lastClipboardText = latest.content;
    } else if (latest.type === 'image') {
      lastClipboardImageB64 = latest.content.replace(/^data:image\/png;base64,/, '');
    }
  }

  createWindow();
  createTray();
  cleanupLegacyShortcut();
  registerGlobalShortcut();
  registerGnomeShortcut();
  if (store.get('autoPaste')) installPasteExtension();
  startClipboardPolling();
  checkAutostart();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (pollingInterval) clearInterval(pollingInterval);
  // Clean up PID file
  try { fs.unlinkSync(PID_FILE); } catch {}
});

app.on('window-all-closed', () => {
  // Do nothing — app stays alive in tray
});
