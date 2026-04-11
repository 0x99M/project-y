#!/bin/bash
REAL_USER="${SUDO_USER:-$USER}"

if [ -n "$REAL_USER" ] && [ "$REAL_USER" != "root" ] && id "$REAL_USER" &>/dev/null; then
  REAL_UID=$(id -u "$REAL_USER")
  XDG_RUNTIME="/run/user/${REAL_UID}"

  # Detect active desktop session process
  SESSION_PID=""
  for proc in gnome-session plasmashell xfce4-session lxsession mate-session; do
    SESSION_PID=$(pgrep -u "$REAL_USER" -x "$proc" | head -1)
    [ -n "$SESSION_PID" ] && break
  done

  # Read environment from the session process
  SESS_DISPLAY=""
  SESS_WAYLAND=""
  SESS_DBUS=""

  if [ -n "$SESSION_PID" ] && [ -r "/proc/${SESSION_PID}/environ" ]; then
    SESS_DISPLAY=$(tr '\0' '\n' < "/proc/${SESSION_PID}/environ" | grep '^DISPLAY=' | cut -d= -f2-)
    SESS_WAYLAND=$(tr '\0' '\n' < "/proc/${SESSION_PID}/environ" | grep '^WAYLAND_DISPLAY=' | cut -d= -f2-)
    SESS_DBUS=$(tr '\0' '\n' < "/proc/${SESSION_PID}/environ" | grep '^DBUS_SESSION_BUS_ADDRESS=' | cut -d= -f2-)
  fi

  # Fall back to standard paths if not found
  SESS_DBUS="${SESS_DBUS:-unix:path=${XDG_RUNTIME}/bus}"

  # Kill old instance so the new version starts fresh
  pkill -u "$REAL_USER" -f "/opt/Clipmer/clipmer" 2>/dev/null || true
  for i in 1 2 3; do
    pgrep -u "$REAL_USER" -f "/opt/Clipmer/clipmer" > /dev/null 2>&1 || break
    sleep 1
  done

  su "$REAL_USER" -c "
    export DISPLAY='${SESS_DISPLAY}'
    export WAYLAND_DISPLAY='${SESS_WAYLAND}'
    export DBUS_SESSION_BUS_ADDRESS='${SESS_DBUS}'
    export XDG_RUNTIME_DIR='${XDG_RUNTIME}'
    nohup \"/opt/Clipmer/clipmer\" > /dev/null 2>&1 &
  "
fi
