#!/usr/bin/env bash
# Reset Clipmer to a clean-install state for development.
#
# Usage:
#   ./scripts/reset-data.sh                  # wipe everything
#   ./scripts/reset-data.sh --keep-extension # keep the GNOME paste extension
#   ./scripts/reset-data.sh --keep-autostart # keep autostart entry
#   ./scripts/reset-data.sh --keep-shortcut  # keep the GNOME global shortcut
#   ./scripts/reset-data.sh --data-only      # only wipe the store file
#   ./scripts/reset-data.sh --dry-run        # show what would happen, no changes
#   ./scripts/reset-data.sh --help

set -euo pipefail

# ─── Flags ────────────────────────────────────────────────────────────────────
KEEP_EXTENSION=0
KEEP_AUTOSTART=0
KEEP_SHORTCUT=0
DATA_ONLY=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep-extension) KEEP_EXTENSION=1 ;;
    --keep-autostart) KEEP_AUTOSTART=1 ;;
    --keep-shortcut)  KEEP_SHORTCUT=1 ;;
    --data-only)      DATA_ONLY=1 ;;
    --dry-run)        DRY_RUN=1 ;;
    --help|-h)
      sed -n '2,12p' "$0" | sed 's/^# //; s/^#//'
      exit 0
      ;;
    *)
      echo "Unknown flag: $1" >&2
      echo "Run with --help for options." >&2
      exit 1
      ;;
  esac
  shift
done

# ─── Paths ────────────────────────────────────────────────────────────────────
STORE_DIR="$HOME/.config/clipmer"
AUTOSTART_FILE="$HOME/.config/autostart/clipmer.desktop"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/clipmer-paste@clipmer.local"
SHORTCUT_NAME="clipmer-toggle"
SHORTCUT_PATH="/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/${SHORTCUT_NAME}/"

# ─── Helpers ──────────────────────────────────────────────────────────────────
run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "  [dry-run] $*"
  else
    eval "$@"
  fi
}

log() { echo "  $*"; }

# ─── Step 1: stop running Clipmer ─────────────────────────────────────────────
echo "→ Stopping running Clipmer instance..."
if pgrep -f "clipmer" >/dev/null 2>&1; then
  run "pkill -f 'clipmer' || true"
  log "killed running process(es)"
else
  log "no running instance"
fi

# ─── Step 2: wipe store data ──────────────────────────────────────────────────
echo "→ Wiping store data..."
if [[ -d "$STORE_DIR" ]]; then
  run "rm -rf '$STORE_DIR'"
  log "removed $STORE_DIR"
else
  log "no store dir to remove"
fi

# ─── Data-only mode: stop here ────────────────────────────────────────────────
if [[ $DATA_ONLY -eq 1 ]]; then
  echo ""
  echo "Done. Store wiped. Extension, autostart, and shortcut left intact."
  exit 0
fi

# ─── Step 3: autostart ────────────────────────────────────────────────────────
if [[ $KEEP_AUTOSTART -eq 0 ]]; then
  echo "→ Removing autostart entry..."
  if [[ -f "$AUTOSTART_FILE" ]]; then
    run "rm -f '$AUTOSTART_FILE'"
    log "removed $AUTOSTART_FILE"
  else
    log "no autostart file to remove"
  fi
else
  echo "→ Keeping autostart entry (--keep-autostart)"
fi

# ─── Step 4: GNOME extension ──────────────────────────────────────────────────
if [[ $KEEP_EXTENSION -eq 0 ]]; then
  echo "→ Removing GNOME paste extension..."
  if [[ -d "$EXTENSION_DIR" ]]; then
    run "rm -rf '$EXTENSION_DIR'"
    log "removed $EXTENSION_DIR"
    log "note: you may need to log out & back in for GNOME Shell to drop it fully"
  else
    log "no extension dir to remove"
  fi
else
  echo "→ Keeping GNOME extension (--keep-extension)"
fi

# ─── Step 5: GNOME shortcut ───────────────────────────────────────────────────
if [[ $KEEP_SHORTCUT -eq 0 ]]; then
  echo "→ Removing GNOME custom keybinding..."
  if command -v gsettings >/dev/null 2>&1; then
    EXISTING=$(gsettings get org.gnome.settings-daemon.plugins.media-keys custom-keybindings 2>/dev/null || echo "@as []")
    if echo "$EXISTING" | grep -q "$SHORTCUT_NAME"; then
      CLEANED=$(echo "$EXISTING" | sed "s|,\? *'${SHORTCUT_PATH}'||g")
      # Normalize empty list
      if [[ "$CLEANED" == "[]" || "$CLEANED" == "@as []" ]]; then
        CLEANED="@as []"
      fi
      run "gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings \"$CLEANED\""
      run "gsettings reset-recursively org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:${SHORTCUT_PATH} 2>/dev/null || true"
      log "removed custom keybinding from gsettings"
    else
      log "no custom keybinding to remove"
    fi
  else
    log "gsettings not available, skipping"
  fi
else
  echo "→ Keeping GNOME shortcut (--keep-shortcut)"
fi

echo ""
echo "Done. Clipmer is back to a clean-install state."
echo "Start with: cd linux && npm start"
