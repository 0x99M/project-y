let historyData = [];
let pinnedData = [];
let filteredData = [];
let selectedIndex = -1;
let searchMode = 'content';
let activeTab = 'history';
let settingsOpen = false;
let autoScrollTop = true;
let autoClearSearch = true;
let closeSettingsOnOpen = true;
let proActive = false;
let viewerOpen = false;
let viewerEntry = null;

const listEl = document.getElementById('history-list');
const emptyEl = document.getElementById('empty-state');
const searchEl = document.getElementById('search');
const clearBtn = document.getElementById('clear-all');

// ─── Init ───────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Load theme and accent
  const savedTheme = await window.clipboardManager.getTheme();
  applyTheme(savedTheme);
  const savedAccent = await window.clipboardManager.getAccent();
  applyAccent(savedAccent);
  const savedShortcut = await window.clipboardManager.getShortcut();
  document.getElementById('shortcut-recorder').textContent = savedShortcut;
  const autostartToggle = document.getElementById('autostart-toggle');
  autostartToggle.checked = await window.clipboardManager.getAutostart();
  const autoPasteToggle = document.getElementById('auto-paste-toggle');
  autoPasteToggle.checked = await window.clipboardManager.getAutoPaste();
  const autoScrollToggle = document.getElementById('auto-scroll-toggle');
  autoScrollTop = await window.clipboardManager.getAutoScrollTop();
  autoScrollToggle.checked = autoScrollTop;
  const autoClearSearchToggle = document.getElementById('auto-clear-search-toggle');
  autoClearSearch = await window.clipboardManager.getAutoClearSearch();
  autoClearSearchToggle.checked = autoClearSearch;
  const closeSettingsToggle = document.getElementById('close-settings-toggle');
  closeSettingsOnOpen = await window.clipboardManager.getCloseSettingsOnOpen();
  closeSettingsToggle.checked = closeSettingsOnOpen;
  const rememberPosToggle = document.getElementById('remember-position-toggle');
  rememberPosToggle.checked = await window.clipboardManager.getRememberPosition();
  const minimalToggle = document.getElementById('minimal-view-toggle');
  const savedMinimal = await window.clipboardManager.getMinimalView();
  minimalToggle.checked = savedMinimal;
  if (savedMinimal) document.body.classList.add('minimal');
  const fontSlider = document.getElementById('font-size-slider');
  const savedFontSize = await window.clipboardManager.getFontSize();
  applyFontSize(savedFontSize);
  fontSlider.value = savedFontSize;
  document.getElementById('font-size-value').textContent = savedFontSize + 'px';

  historyData = await window.clipboardManager.getHistory();
  pinnedData = await window.clipboardManager.getPinned();
  render(getSourceData());

  window.clipboardManager.onHistoryUpdated((history) => {
    if (document.activeElement && document.activeElement.classList.contains('note-input')) {
      historyData = history;
      return;
    }
    historyData = history;
    applyFilter();
  });

  window.clipboardManager.onPinnedUpdated((pinned) => {
    if (document.activeElement && document.activeElement.classList.contains('note-input')) {
      pinnedData = pinned;
      return;
    }
    pinnedData = pinned;
    applyFilter();
  });

  searchEl.addEventListener('input', applyFilter);

  clearBtn.addEventListener('click', async () => {
    await window.clipboardManager.clearHistory();
  });

  document.getElementById('expand-btn').addEventListener('click', async () => {
    const expanded = await window.clipboardManager.toggleExpand();
    document.body.classList.toggle('expanded', expanded);
    document.getElementById('expand-icon').style.display = expanded ? 'none' : '';
    document.getElementById('collapse-icon').style.display = expanded ? '' : 'none';
  });

  // Tab switching
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      selectedIndex = -1;
      applyFilter();
    });
  });

  document.getElementById('settings-btn').addEventListener('click', async () => {
    settingsOpen = !settingsOpen;
    const settingsView = document.getElementById('settings-view');
    const tabBar = document.getElementById('tab-bar');
    const searchBar = document.getElementById('search-bar');
    const footer = document.getElementById('footer');

    const minimalBtn = document.getElementById('minimal-settings-btn');
    const isMinimal = document.body.classList.contains('minimal');

    if (settingsOpen) {
      listEl.style.display = 'none';
      emptyEl.style.display = 'none';
      tabBar.style.display = 'none';
      searchBar.style.display = 'none';
      footer.style.display = 'none';
      minimalBtn.style.display = 'none';
      settingsView.style.display = '';
      await renderStats();
    } else {
      settingsView.style.display = 'none';
      listEl.style.display = '';
      searchBar.style.display = '';
      if (!isMinimal) {
        tabBar.style.display = '';
        footer.style.display = '';
      }
      minimalBtn.style.display = '';
      applyFilter();
    }
  });

  // Settings back button
  document.getElementById('settings-back-btn').addEventListener('click', () => {
    document.getElementById('settings-btn').click();
  });

  // Settings tab switching
  document.querySelectorAll('.settings-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.settingsTab;
      document.querySelectorAll('.settings-tab').forEach((t) => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.settings-pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === target));
    });
  });

  // Minimal view toggle
  minimalToggle.addEventListener('change', () => {
    document.body.classList.toggle('minimal', minimalToggle.checked);
    window.clipboardManager.setMinimalView(minimalToggle.checked);
  });

  // Floating settings button (minimal view)
  document.getElementById('minimal-settings-btn').addEventListener('click', () => {
    document.getElementById('settings-btn').click();
  });

  // Font size slider
  fontSlider.addEventListener('input', () => {
    const size = parseInt(fontSlider.value);
    applyFontSize(size);
    document.getElementById('font-size-value').textContent = size + 'px';
    window.clipboardManager.setFontSize(size);
  });

  // Autostart toggle
  autostartToggle.addEventListener('change', () => {
    window.clipboardManager.setAutostart(autostartToggle.checked);
  });

  // Auto-paste toggle
  autoPasteToggle.addEventListener('change', async () => {
    const result = await window.clipboardManager.setAutoPaste(autoPasteToggle.checked);
    if (result === 'needs-restart') {
      alert('Almost there! Log out and log back in to activate auto-paste.');
    }
  });

  // Auto-scroll toggle
  autoScrollToggle.addEventListener('change', () => {
    autoScrollTop = autoScrollToggle.checked;
    window.clipboardManager.setAutoScrollTop(autoScrollTop);
  });

  // Auto-clear search toggle
  autoClearSearchToggle.addEventListener('change', () => {
    autoClearSearch = autoClearSearchToggle.checked;
    window.clipboardManager.setAutoClearSearch(autoClearSearch);
  });

  // Close-settings-on-open toggle
  closeSettingsToggle.addEventListener('change', () => {
    closeSettingsOnOpen = closeSettingsToggle.checked;
    window.clipboardManager.setCloseSettingsOnOpen(closeSettingsOnOpen);
  });

  // Remember position toggle
  rememberPosToggle.addEventListener('change', () => {
    window.clipboardManager.setRememberPosition(rememberPosToggle.checked);
  });

  // Apply settings when window becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;

    // Close settings view if the user enabled that behavior
    if (settingsOpen && closeSettingsOnOpen) {
      document.getElementById('settings-btn').click();
    }

    if (!settingsOpen) {
      if (autoClearSearch) {
        searchEl.value = '';
      }
      selectedIndex = -1;
      applyFilter();
      if (autoScrollTop) {
        listEl.scrollTop = 0;
      }
      searchEl.focus();
    }
  });

  // Accent color picker
  const accentPicker = document.getElementById('accent-picker');
  accentPicker.value = savedAccent;
  accentPicker.addEventListener('input', () => {
    applyAccent(accentPicker.value);
    window.clipboardManager.setAccent(accentPicker.value);
  });

  // Shortcut recorder
  const recorder = document.getElementById('shortcut-recorder');
  let recording = false;

  recorder.addEventListener('click', () => {
    recording = !recording;
    if (recording) {
      recorder.textContent = 'Press shortcut...';
      recorder.classList.add('recording');
    } else {
      recorder.classList.remove('recording');
      window.clipboardManager.getShortcut().then((s) => { recorder.textContent = s; });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      recording = false;
      recorder.classList.remove('recording');
      window.clipboardManager.getShortcut().then((s) => { recorder.textContent = s; });
      return;
    }

    // Ignore modifier-only presses
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    // Require at least one modifier
    if (!e.ctrlKey && !e.shiftKey && !e.altKey) return;

    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    // Map key to Electron accelerator name
    let key = e.key;
    if (key.length === 1) {
      key = key.toUpperCase();
    } else if (key === ' ') {
      key = 'Space';
    }
    parts.push(key);

    const accelerator = parts.join('+');
    recorder.textContent = accelerator;
    recorder.classList.remove('recording');
    recording = false;
    window.clipboardManager.setShortcut(accelerator);
  }, true);

  // Theme toggle
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      applyTheme(theme);
      window.clipboardManager.setTheme(theme);
      document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Reset settings
  document.getElementById('reset-settings-btn').addEventListener('click', () => {
    applyTheme('dark');
    applyAccent('#E95420');
    accentPicker.value = '#E95420';
    recorder.textContent = 'Ctrl+Shift+D';
    autostartToggle.checked = false;
    window.clipboardManager.setAutostart(false);
    autoPasteToggle.checked = false;
    autoScrollToggle.checked = true;
    autoClearSearchToggle.checked = true;
    rememberPosToggle.checked = true;
    window.clipboardManager.setRememberPosition(true);
    minimalToggle.checked = false;
    document.body.classList.remove('minimal');
    autoScrollTop = true;
    autoClearSearch = true;
    window.clipboardManager.setTheme('dark');
    window.clipboardManager.setMinimalView(false);
    window.clipboardManager.setAccent('#E95420');
    window.clipboardManager.setShortcut('Ctrl+Shift+D');
    window.clipboardManager.setAutoPaste(false);
    fontSlider.value = 13;
    applyFontSize(13);
    document.getElementById('font-size-value').textContent = '13px';
    window.clipboardManager.setAutoScrollTop(true);
    window.clipboardManager.setAutoClearSearch(true);
    window.clipboardManager.setCloseSettingsOnOpen(true);
    closeSettingsOnOpen = true;
    closeSettingsToggle.checked = true;
    window.clipboardManager.setFontSize(13);
  });

  document.addEventListener('keydown', handleKeyDown);

  // ─── License UI ─────────────────────────────────────────────────────────────
  await initLicense();

  document.getElementById('activate-btn').addEventListener('click', async () => {
    const input = document.getElementById('license-input');
    const key = input.value.trim();
    if (!key) return;
    const result = await window.clipboardManager.activateLicense(key);
    const msg = document.getElementById('license-message');
    msg.style.display = 'block';
    if (result.success) {
      msg.textContent = 'License activated!';
      msg.className = 'license-message success';
      input.value = '';
      await initLicense();
      historyData = await window.clipboardManager.getHistory();
      pinnedData = await window.clipboardManager.getPinned();
      render(getSourceData());
    } else {
      msg.textContent = result.error || 'Invalid license key';
      msg.className = 'license-message error';
    }
  });

  document.getElementById('buy-btn').addEventListener('click', () => {
    window.open('https://clipmer.app/pro', '_blank');
  });

  document.getElementById('deactivate-btn').addEventListener('click', async () => {
    await window.clipboardManager.deactivateLicense();
    await initLicense();
    historyData = await window.clipboardManager.getHistory();
    pinnedData = await window.clipboardManager.getPinned();
    render(getSourceData());
  });
});

// ─── License ────────────────────────────────────────────────────────────────────

async function initLicense() {
  const info = await window.clipboardManager.getLicenseInfo();
  proActive = info.isPro;

  const statusEl = document.getElementById('license-status');
  const freeUI = document.getElementById('license-free-ui');
  const proUI = document.getElementById('license-pro-ui');
  const msgEl = document.getElementById('license-message');

  if (proActive) {
    statusEl.textContent = 'Pro';
    statusEl.classList.add('license-pro-status');
    freeUI.style.display = 'none';
    proUI.style.display = '';
    document.getElementById('license-email').textContent = info.email;
  } else {
    statusEl.textContent = 'Free';
    statusEl.classList.remove('license-pro-status');
    freeUI.style.display = '';
    proUI.style.display = 'none';
    msgEl.style.display = 'none';
  }

  applyProGating();
}

function applyProGating() {
  const proRows = [
    'auto-paste-toggle',
    'minimal-view-toggle',
    'accent-picker',
    'shortcut-recorder',
  ];

  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    if (!proActive && btn.dataset.theme === 'light') {
      btn.classList.add('pro-locked');
    } else {
      btn.classList.remove('pro-locked');
    }
  });

  proRows.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const row = el.closest('.settings-row');
    if (!row) return;
    if (!proActive) {
      row.classList.add('pro-locked');
      if (!row.querySelector('.pro-badge')) {
        const badge = document.createElement('span');
        badge.className = 'pro-badge';
        badge.textContent = 'PRO';
        row.querySelector('.settings-label')?.appendChild(badge);
      }
    } else {
      row.classList.remove('pro-locked');
      row.querySelector('.pro-badge')?.remove();
    }
  });

  // Pinned tab
  const pinnedTab = document.querySelector('[data-tab="pinned"]');
  if (pinnedTab) {
    if (!proActive) {
      pinnedTab.classList.add('pro-locked');
      if (!pinnedTab.querySelector('.pro-badge')) {
        const badge = document.createElement('span');
        badge.className = 'pro-badge';
        badge.textContent = 'PRO';
        pinnedTab.appendChild(badge);
      }
    } else {
      pinnedTab.classList.remove('pro-locked');
      pinnedTab.querySelector('.pro-badge')?.remove();
    }
  }

  // Search bar (free tier)
  searchEl.disabled = false;
  searchEl.placeholder = 'Search clipboard...';
}

// ─── Theme ──────────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('theme-light');
  } else {
    document.body.classList.remove('theme-light');
  }
  // Update toggle button states
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function applyAccent(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Darken for hover
  const hoverR = Math.max(0, Math.round(r * 0.8));
  const hoverG = Math.max(0, Math.round(g * 0.8));
  const hoverB = Math.max(0, Math.round(b * 0.8));

  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-hover', `rgb(${hoverR}, ${hoverG}, ${hoverB})`);
  document.documentElement.style.setProperty('--accent-muted', `rgba(${r}, ${g}, ${b}, 0.20)`);
}

function applyFontSize(size) {
  document.documentElement.style.setProperty('--font-size-base', size + 'px');
}

// ─── Rendering ──────────────────────────────────────────────────────────────────

function getSourceData() {
  return activeTab === 'pinned' ? pinnedData : historyData;
}

function render(entries) {
  listEl.textContent = '';

  if (entries.length === 0) {
    emptyEl.classList.add('visible');
    return;
  }

  emptyEl.classList.remove('visible');

  const pinnedIds = new Set(pinnedData.map((e) => e.id));

  entries.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'history-entry' + (i === selectedIndex ? ' selected' : '');
    row.dataset.index = i;

    // Type badge
    const badge = document.createElement('div');
    badge.className = 'entry-type-badge ' + (entry.type === 'image' ? 'badge-image' : 'badge-text');
    badge.textContent = entry.type === 'image' ? '\u{1F5BC}' : 'T';
    row.appendChild(badge);

    // Body wrapper
    const body = document.createElement('div');
    body.className = 'entry-body';

    if (entry.type === 'image') {
      const img = document.createElement('img');
      img.className = 'entry-image-preview';
      img.alt = 'Image';
      if (/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(entry.content)) {
        img.src = entry.content;
      }
      body.appendChild(img);
    } else {
      const preview = document.createElement('div');
      preview.className = 'entry-preview';
      preview.textContent = entry.preview;
      body.appendChild(preview);
    }

    const time = document.createElement('div');
    time.className = 'entry-time';
    time.textContent = timeAgo(entry.timestamp);
    body.appendChild(time);

    // Note input (pro only)
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.className = 'note-input';
    noteInput.placeholder = 'Add a note...';
    noteInput.maxLength = 500;
    noteInput.value = entry.note || '';
    if (!proActive) noteInput.style.display = 'none';

    const saveNote = debounce((value) => {
      window.clipboardManager.updateNote({ id: entry.id, note: value });
    }, 300);

    noteInput.addEventListener('input', () => {
      entry.note = noteInput.value;
      saveNote(noteInput.value);
    });

    noteInput.addEventListener('blur', () => {
      window.clipboardManager.updateNote({ id: entry.id, note: noteInput.value });
    });

    body.appendChild(noteInput);
    row.appendChild(body);

    // View full content button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'view-btn';
    viewBtn.title = 'View full content (Space)';
    viewBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openViewer(entry);
    });
    row.appendChild(viewBtn);

    // Pin/unpin button (pro only)
    const isPinned = pinnedIds.has(entry.id);
    const pinBtn = document.createElement('button');
    pinBtn.className = 'pin-btn' + (isPinned ? ' pinned' : '');
    if (!proActive) pinBtn.style.display = 'none';
    pinBtn.title = isPinned ? 'Unpin' : 'Pin';
    pinBtn.textContent = isPinned ? '\u2605' : '\u2606';
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isPinned) {
        window.clipboardManager.unpinEntry(entry.id);
      } else {
        window.clipboardManager.pinEntry(entry.id);
      }
    });
    row.appendChild(pinBtn);

    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('note-input')) return;
      if (e.target.classList.contains('pin-btn')) return;
      if (e.target.closest('.view-btn')) return;
      selectEntry(i);
    });

    listEl.appendChild(row);
  });

  // Update entry count in header
  const sourceData = getSourceData();
  const countEl = document.getElementById('entry-count');
  if (countEl) {
    countEl.textContent = sourceData.length > 0 ? `${sourceData.length} items` : '';
  }
}

async function selectEntry(index) {
  const entries = currentEntries();
  if (index < 0 || index >= entries.length) return;
  await window.clipboardManager.copyToClipboard(entries[index]);
  await window.clipboardManager.simulatePaste();
}

// ─── Settings ───────────────────────────────────────────────────────────────────

async function renderStats() {
  const stats = await window.clipboardManager.getStats();
  const el = document.getElementById('stats-content');
  const size = stats.totalBytes < 1024 * 1024
    ? (stats.totalBytes / 1024).toFixed(1) + ' KB'
    : (stats.totalBytes / (1024 * 1024)).toFixed(1) + ' MB';

  el.textContent = '';
  const rows = [
    ['History entries', stats.historyTotal],
    ['Text entries', stats.historyTexts],
    ['Image entries', stats.historyImages],
    ['Notes (history)', stats.historyNotes],
    ['Pinned entries', stats.pinnedCount],
    ['Notes (pinned)', stats.pinnedNotes],
    ['Storage used', size],
  ];
  rows.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'settings-row';
    const labelEl = document.createElement('span');
    labelEl.className = 'settings-label';
    labelEl.textContent = label;
    const valueEl = document.createElement('span');
    valueEl.className = 'settings-value';
    valueEl.textContent = value;
    row.appendChild(labelEl);
    row.appendChild(valueEl);
    el.appendChild(row);
  });
}

// ─── Search ─────────────────────────────────────────────────────────────────────

function applyFilter() {
  const query = searchEl.value.toLowerCase().trim();
  selectedIndex = -1;

  if (!query) {
    filteredData = [];
    render(getSourceData());
  } else {
    // Search across both pinned and history
    const allEntries = [...pinnedData, ...historyData];
    filteredData = allEntries.filter((e) => {
      const matchContent = e.type === 'text' && e.content.toLowerCase().includes(query);
      const matchNote = (e.note || '').toLowerCase().includes(query);
      return searchMode === 'notes' ? matchNote : matchContent;
    });
    render(filteredData);
  }
}

function currentEntries() {
  if (filteredData.length > 0) return filteredData;
  return getSourceData();
}

function updateSearchModeIndicator() {
  const badge = document.getElementById('search-mode-badge');
  if (searchMode === 'notes') {
    searchEl.placeholder = 'Search notes...';
    badge.innerHTML = 'notes <kbd>tab</kbd>';
    badge.classList.add('active');
  } else {
    searchEl.placeholder = 'Search...';
    badge.innerHTML = 'content <kbd>tab</kbd>';
    badge.classList.remove('active');
  }
}

// ─── Keyboard navigation ────────────────────────────────────────────────────────

function handleKeyDown(e) {
  // If viewer is open, Escape closes it (everything else ignored)
  if (viewerOpen) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeViewer();
    }
    return;
  }

  // In settings
  if (settingsOpen) {
    if (e.key === 'Escape' || (e.ctrlKey && e.key === ',')) {
      e.preventDefault();
      document.getElementById('settings-btn').click();
      return;
    }
    // Tab / Shift+Tab cycles through settings tabs
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabs = Array.from(document.querySelectorAll('.settings-tab'));
      const currentIdx = tabs.findIndex((t) => t.classList.contains('active'));
      const nextIdx = e.shiftKey
        ? (currentIdx - 1 + tabs.length) % tabs.length
        : (currentIdx + 1) % tabs.length;
      tabs[nextIdx].click();
    }
    return;
  }

  // Don't intercept keys when typing in the note input
  if (document.activeElement && document.activeElement.classList.contains('note-input')) {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.activeElement.blur();
    }
    return;
  }

  // Space: view full content of selected entry (but only if search isn't focused with content)
  if (e.key === ' ' && selectedIndex >= 0 && document.activeElement !== searchEl) {
    e.preventDefault();
    const entries = currentEntries();
    const entry = entries[selectedIndex];
    if (entry) openViewer(entry);
    return;
  }

  // Ctrl+E: toggle expanded window size
  if (e.ctrlKey && e.key.toLowerCase() === 'e') {
    e.preventDefault();
    document.getElementById('expand-btn').click();
    return;
  }

  // Ctrl+,: toggle settings
  if (e.ctrlKey && e.key === ',') {
    e.preventDefault();
    document.getElementById('settings-btn').click();
    return;
  }

  // Auto-focus search bar when typing a printable character
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && document.activeElement !== searchEl) {
    searchEl.focus();
    return;
  }

  const entries = currentEntries();

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, entries.length - 1);
      render(entries);
      scrollSelectedIntoView();
      break;

    case 'ArrowUp':
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      render(entries);
      scrollSelectedIntoView();
      break;

    case 'Enter':
      if (selectedIndex >= 0) {
        e.preventDefault();
        selectEntry(selectedIndex);
      }
      break;

    case 'Tab':
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: switch between History and Pinned tabs
        activeTab = activeTab === 'history' ? 'pinned' : 'history';
        document.querySelectorAll('.tab').forEach((t) => {
          t.classList.toggle('active', t.dataset.tab === activeTab);
        });
        selectedIndex = -1;
        applyFilter();
      } else {
        // Tab: toggle search mode
        searchMode = searchMode === 'content' ? 'notes' : 'content';
        updateSearchModeIndicator();
        applyFilter();
      }
      break;

    case 'Escape':
      e.preventDefault();
      window.clipboardManager.hideWindow();
      break;
  }
}

function scrollSelectedIntoView() {
  const el = listEl.querySelector('.history-entry.selected');
  if (el) el.scrollIntoView({ block: 'nearest' });
}

// ─── Utilities ──────────────────────────────────────────────────────────────────

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── Full-content viewer ────────────────────────────────────────────────────────

function openViewer(entry) {
  viewerEntry = entry;
  viewerOpen = true;

  const overlay = document.getElementById('viewer-overlay');
  const body = document.getElementById('viewer-body');
  const title = document.getElementById('viewer-title');
  const meta = document.getElementById('viewer-meta');

  if (entry.type === 'image') {
    title.textContent = 'Image';
    body.innerHTML = '';
    const img = document.createElement('img');
    img.src = entry.content;
    body.appendChild(img);
    meta.textContent = '';
  } else {
    title.textContent = 'Full content';
    body.textContent = entry.content;
    const chars = entry.content.length;
    const lines = entry.content.split('\n').length;
    meta.textContent = `${chars.toLocaleString()} chars · ${lines} line${lines === 1 ? '' : 's'}`;
  }

  overlay.style.display = 'flex';
}

function closeViewer() {
  viewerOpen = false;
  viewerEntry = null;
  document.getElementById('viewer-overlay').style.display = 'none';
}

// Wire up viewer controls (elements exist since script is at end of body)
document.getElementById('viewer-close').addEventListener('click', closeViewer);
document.getElementById('viewer-backdrop').addEventListener('click', closeViewer);
document.getElementById('viewer-copy').addEventListener('click', () => {
  if (viewerEntry) {
    window.clipboardManager.copyToClipboard(viewerEntry);
    closeViewer();
    window.clipboardManager.hideWindow();
  }
});
