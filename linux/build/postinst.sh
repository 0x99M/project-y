#!/bin/bash
REAL_USER="${SUDO_USER:-$USER}"

if [ -n "$REAL_USER" ] && [ "$REAL_USER" != "root" ] && id "$REAL_USER" &>/dev/null; then
  # Stop old instance if running
  pkill -u "$REAL_USER" -f "/opt/Clipmer/clipmer" 2>/dev/null || true
  for i in 1 2 3; do
    pgrep -u "$REAL_USER" -f "/opt/Clipmer/clipmer" > /dev/null 2>&1 || break
    sleep 1
  done

  echo ""
  echo "  Clipmer has been installed successfully."
  echo "  Please open Clipmer from your applications menu or run: /opt/Clipmer/clipmer"
  echo ""
fi
