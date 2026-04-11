#!/bin/bash
REAL_USER="${SUDO_USER:-$USER}"

if [ -n "$REAL_USER" ] && [ "$REAL_USER" != "root" ] && id "$REAL_USER" &>/dev/null; then
  su - "$REAL_USER" -c 'nohup "/opt/Clipmer/clipmer" > /dev/null 2>&1 &'
fi
