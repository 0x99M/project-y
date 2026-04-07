---
name: linux-tray
description: Use when implementing system tray functionality on Linux
---

- GNOME requires the AppIndicator/KStatusNotifierItem extension — document this in README
- Use tray.setContextMenu() not tray.on('click') for Linux compatibility
  - On many Linux DEs, left-click on tray icon triggers the context menu, not a custom handler
  - Workaround: add "Show" as the first context menu item
- tray.getBounds() often returns {x:0, y:0, width:0, height:0} on Linux (especially GNOME)
  - Always fall back to centering the window on screen.getPrimaryDisplay().workAreaSize
- Window positioning near tray is unreliable on Linux — default to screen center
- Test with both X11 and Wayland if possible
- Tray icon must be a file path (not just a NativeImage) for AppIndicator compatibility
- Icon should be at least 22x22 px for tray, 256x256 for app icon
