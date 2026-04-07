let historyData = [];
let filteredData = [];
let selectedIndex = -1;

const listEl = document.getElementById('history-list');
const emptyEl = document.getElementById('empty-state');
const searchEl = document.getElementById('search');
const clearBtn = document.getElementById('clear-all');

// ─── Init ───────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  historyData = await window.clipboardManager.getHistory();
  render(historyData);

  window.clipboardManager.onHistoryUpdated((history) => {
    historyData = history;
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

  document.addEventListener('keydown', handleKeyDown);
});

// ─── Rendering ──────────────────────────────────────────────────────────────────

function render(entries) {
  listEl.textContent = '';

  if (entries.length === 0) {
    emptyEl.classList.add('visible');
    return;
  }

  emptyEl.classList.remove('visible');

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

    row.appendChild(body);
    row.addEventListener('click', () => selectEntry(i));
    listEl.appendChild(row);
  });

  // Update entry count in header
  const countEl = document.getElementById('entry-count');
  if (countEl) {
    countEl.textContent = historyData.length > 0 ? `${historyData.length} items` : '';
  }
}

async function selectEntry(index) {
  const entries = currentEntries();
  if (index < 0 || index >= entries.length) return;
  await window.clipboardManager.copyToClipboard(entries[index]);
  await window.clipboardManager.hideWindow();
}

// ─── Search ─────────────────────────────────────────────────────────────────────

function applyFilter() {
  const query = searchEl.value.toLowerCase().trim();
  selectedIndex = -1;

  if (!query) {
    filteredData = [];
    render(historyData);
  } else {
    filteredData = historyData.filter(
      (e) => e.type === 'text' && e.content.toLowerCase().includes(query)
    );
    render(filteredData);
  }
}

function currentEntries() {
  return filteredData.length > 0 ? filteredData : historyData;
}

// ─── Keyboard navigation ────────────────────────────────────────────────────────

function handleKeyDown(e) {
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
