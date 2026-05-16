# Clipmer Snap

Snap is built by electron-builder from the same `package.json` that produces
the `.deb` / `.rpm` / `.AppImage`. The snap config lives under `build.snap`;
no hand-written `snapcraft.yaml`.

## One-time setup (Ubuntu)

```bash
sudo snap install snapcraft --classic
sudo snap install lxd
sudo lxd init --auto
sudo usermod -a -G lxd $USER
```

The `lxd` group only kicks in for **new** shells. Either log out and back
in, or open a sub-shell with `newgrp lxd` for the build. Verify with
`groups | grep lxd`.

## Build

```bash
cd linux

# All targets (deb + rpm + AppImage + snap)
npm run build

# Snap only — much faster when iterating on snap-specific config
npx electron-builder --linux snap
```

First snap build takes 5–15 min as snapcraft pulls down the `core22` build
container into LXD. Subsequent builds reuse the container and finish in
about a minute.

Output lands at `dist/clipmer_<version>_amd64.snap`.

## Install locally and test

```bash
# Use --dangerous because the snap isn't signed by snapcraft.io yet
sudo snap install ./dist/clipmer_<version>_amd64.snap --dangerous

# Launch
clipmer

# Inspect granted interfaces
snap connections clipmer

# Tail the snap log (useful for diagnosing missing plugs)
sudo snap logs -f clipmer

# Cleanup
sudo snap remove clipmer
```

If the app crashes on launch, the most common causes are missing plugs.
The plug list in `package.json > build.snap.plugs` covers the standard
Electron set: `browser-support` for `/dev/shm`, `opengl` for `/dev/dri/*`,
`home`/`gsettings` for config persistence, the desktop sockets for X11 +
Wayland integration. Add more as `snap logs` reveals them.

## Publish to snapcraft.io

```bash
# Once per machine
snapcraft login

# Once ever — claim the snap name
snapcraft register clipmer

# Per release — push to a narrow channel first, smoke-test, then widen
snapcraft upload --release=edge   ./dist/clipmer_<version>_amd64.snap
# `snap refresh clipmer --channel=edge` on a test machine to verify
snapcraft upload --release=stable ./dist/clipmer_<version>_amd64.snap
```

Per-release follow-ups on https://snapcraft.io/clipmer/listing:

- Upload screenshots (PNG, 480p+, up to 5)
- Add the publisher-verified link to https://clipmer.app
- Set the category to *Productivity*

## Known limitations under snap confinement

| Feature | Snap status | Why |
|---|---|---|
| Clipboard capture (X11) | Works | Electron `clipboard.readText` polling |
| Clipboard capture (Wayland) | Limited | Snap blocks background clipboard reads on Wayland — same root cause as Flatpak |
| Global shortcut (X11) | Works | Electron `globalShortcut` registers directly with X |
| Global shortcut (Wayland-GNOME) | **Doesn't work** | The host's `org.gnome.settings-daemon` schema isn't visible inside the snap, so the gsettings fallback can't register. User has to set a custom keybinding in GNOME Settings → Keyboard manually. |
| Auto-paste | **Doesn't work** | Bundled GNOME Shell extension can't be written to `~/.local/share/gnome-shell/extensions/` from inside the snap |
| Tray icon | Works on KDE; requires AppIndicator extension on GNOME | Same as everywhere |

In practice the snap covers a smaller slice of users than the `.deb` does
(no auto-paste anywhere, no shortcut on Wayland-GNOME). Worth shipping for
distribution reach via the Snap Store, but the `.deb` remains the
recommended install path for users who want the full feature set on
GNOME-Ubuntu.
