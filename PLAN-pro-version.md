# Clipmer Pro — Implementation Plan
> Adapted for: Vanilla JS, CJS, electron-store, contextBridge IPC

---

## 1. Free vs Pro Feature Split

| Feature | Free | Pro |
|---|---|---|
| Clipboard history | 25 entries, text only | 200 entries, text + images |
| Pinned items | — | Up to 200 |
| Inline notes | — | On any entry |
| Smart search | — | Content + notes |
| Auto-paste | — | GNOME Wayland |
| Themes | Dark only | Dark + light |
| Accent color | Default orange | Any color |
| Font size | Default (13px) | 10–18px slider |
| Minimal view | — | Toggle |
| Keyboard nav | Basic (arrows, Enter, Esc) | Full (Tab search mode, Shift+Tab tabs) |
| Start on login | Yes | Yes |
| Global shortcut | Default only | Configurable |

Core UX stays intact for free users — they can copy/paste with a history of 25 text entries. They hit natural limits that make Pro worth buying.

---

## 2. Architecture — No Migration Needed

electron-store is schema-less JSON. Adding new keys is backward-compatible — existing users get defaults on first read. No migration system required.

**New store keys:**
```
licenseKey: ''          // base64 license string
licenseEmail: ''        // email from license payload
isPro: false            // cached pro status (revalidated on startup)
```

---

## 3. License System (main process only)

### 3a. Keypair generation — `scripts/generate-keypair.js`
Run once locally. Private key goes to Railway env vars, public key is hardcoded in main.js.

```
node scripts/generate-keypair.js
```

### 3b. License module — `linux/license.js`
New file. Exports:
- `validateLicenseKey(key)` → `{ valid, email, features }` or `{ valid: false }`
- `isPro()` → reads store, returns boolean
- `activateLicense(key)` → validates, saves to store, returns success
- `deactivateLicense()` → clears store keys
- `getLicenseInfo()` → returns `{ isPro, email }` or `{ isPro: false }`

Uses Node.js `crypto.verify()` with Ed25519. Public key embedded in source (safe — only private key is secret).

License key format: base64-encoded JSON `{ payload, signature }` where payload contains `{ email, createdAt, features: ['pro'] }`.

### 3c. IPC channels — add to `linux/main.js`
```
license:info        → getLicenseInfo()
license:activate    → activateLicense(key) → { success, email } | { success: false, error }
license:deactivate  → deactivateLicense() → void
license:isPro       → isPro() → boolean
```

### 3d. Preload bridge — add to `linux/preload.js`
```
window.clipboardManager.getLicenseInfo()
window.clipboardManager.activateLicense(key)
window.clipboardManager.deactivateLicense()
window.clipboardManager.isPro()
```

---

## 4. Feature Gating

### Main process (data-level gates)
In `main.js`, gate these IPC handlers:

- **`get-history`** — if free, filter out image entries and slice to 25
- **`pin-entry` / `unpin-entry` / `get-pinned`** — if free, return empty / no-op
- **`update-note`** — if free, no-op
- **`set-theme`** — if free, always set 'dark'
- **`set-accent`** — if free, always set '#E95420'
- **`set-font-size`** — if free, always set 13
- **`set-minimal-view`** — if free, always set false
- **`set-shortcut`** — if free, no-op (keep default)
- **`set-auto-paste`** — if free, no-op

Clipboard polling still captures everything (so upgrading instantly shows full history). The gate is on what the renderer can see/do.

### Renderer (UI-level gates)
On startup, renderer calls `isPro()` and toggles visibility:

- **History tab**: shows all entries (pro) or limited + "Upgrade for more" banner (free)
- **Pinned tab**: visible (pro) or hidden (free)
- **Search bar**: functional (pro) or disabled with lock icon (free)
- **Note inputs**: visible (pro) or hidden (free)
- **Settings**: pro-only settings show lock icon + "Pro" badge, clicking opens upgrade prompt
- **Image entries**: rendered (pro) or filtered out before rendering (free)

---

## 5. UI Changes (`linux/renderer/`)

### 5a. License section in settings — `index.html`
Add between "Behavior" and "Keyboard Shortcuts" sections:

```html
<div class="settings-section" id="license-section">
  <h3 class="settings-title">License</h3>
  <div class="settings-row" id="license-status-row">
    <span class="settings-label">Status</span>
    <span class="settings-value" id="license-status">Free</span>
  </div>
  <div id="license-free-ui">
    <div class="settings-row">
      <input type="text" id="license-input" placeholder="Paste license key..." />
    </div>
    <div class="settings-row">
      <button id="activate-btn">Activate License</button>
      <button id="buy-btn">Buy Pro License</button>
    </div>
    <div id="license-error" class="settings-hint" style="display:none"></div>
  </div>
  <div id="license-pro-ui" style="display:none">
    <div class="settings-row">
      <span class="settings-label">Email</span>
      <span class="settings-value" id="license-email"></span>
    </div>
    <div class="settings-row">
      <button id="deactivate-btn">Deactivate License</button>
    </div>
  </div>
</div>
```

### 5b. Pro badges and lock icons
- Settings rows for pro features get a small "PRO" badge span
- Locked features show `opacity: 0.5; pointer-events: none` with a lock overlay
- History list shows "Upgrade to see N more entries" card at bottom when truncated

### 5c. Upgrade prompt
Simple inline banner, not a modal — when free user taps a locked feature:
- Shows in-context message: "This feature requires Pro"
- "Buy Pro" button opens `https://clipmer.app/pro` in external browser
- "Enter Key" scrolls to license section in settings

---

## 6. Next.js Backend — Paddle Webhook

### 6a. API route — `web/app/api/paddle-webhook/route.ts`
Handles `transaction.completed` event:
1. Verify Paddle HMAC signature
2. Extract buyer email
3. Generate license key (sign with Ed25519 private key from env)
4. Send license key via Resend email API

### 6b. Railway env vars
```
PADDLE_WEBHOOK_SECRET=
LICENSE_PRIVATE_KEY=
RESEND_API_KEY=
```

### 6c. License resend page (optional) — `web/app/api/resend-license/route.ts`
Lookup by email, regenerate key, resend via Resend.

---

## 7. Legal Pages (`web/app/`)

Required for Paddle approval:
- `/privacy` — privacy policy (app is offline, no data collection)
- `/terms` — terms of service
- `/refund` — 30-day refund policy
- `/contact` — email contact

---

## 8. Implementation Order

Each step is a standalone commit that doesn't break existing functionality:

1. **`scripts/generate-keypair.js`** — generate keys, save private to Railway
2. **`linux/license.js`** — license validation module
3. **IPC + preload** — add license channels to main.js and preload.js
4. **Feature gating in main.js** — gate IPC handlers behind isPro()
5. **Settings UI** — license section in settings (HTML + CSS + JS)
6. **Renderer gating** — hide/lock pro features in app.js
7. **Paddle webhook** — Next.js API route for license generation
8. **Legal pages** — privacy, terms, refund, contact
9. **Landing page update** — add pricing section, pro feature table
10. **Test end-to-end** — buy sandbox → receive key → activate → verify features unlock

---

## Files to Create
- `scripts/generate-keypair.js`
- `linux/license.js`
- `web/app/api/paddle-webhook/route.ts`
- `web/app/privacy/page.tsx`
- `web/app/terms/page.tsx`
- `web/app/refund/page.tsx`
- `web/app/contact/page.tsx`

## Files to Modify
- `linux/main.js` — add license IPC handlers + feature gates
- `linux/preload.js` — expose license methods
- `linux/renderer/index.html` — license settings section + pro badges
- `linux/renderer/app.js` — renderer-side gating logic
- `linux/renderer/style.css` — pro badge, lock overlay, upgrade banner styles
