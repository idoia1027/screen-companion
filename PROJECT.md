# Screen Companion MVP Project Notes

## Product Definition

Screen Companion is a lightweight desktop companion. It originated on Windows and now also
runs and ships on macOS (Apple Silicon).

It is a transparent, frameless, always-on-top Electron window that displays a local pre-cut transparent character image. The character should feel like it is sitting directly on the desktop, not inside a rectangular photo frame or productivity widget.

The emotional goal is quiet presence:

- always visible but not annoying
- draggable around the screen
- visually centered on a chosen transparent character asset
- lightly reminds the user to rest through a speech bubble

## Non-goals

Do not add these to MVP:

- AI chat
- LLM integration
- automatic background removal
- backend
- login
- cloud sync
- Live2D or 3D character system
- browser extension
- productivity dashboard
- automatic conversion of opaque JPGs into transparent companion cutouts

## Current Stack

- Electron
- React
- TypeScript
- Vite
- electron-vite
- electron-builder

## Current App Behavior

Implemented and currently considered working:

- Transparent frameless Electron window
- Always-on-top behavior (`floating` level — not `screen-saver`)
- Mouse click-through on transparent areas via `setIgnoreMouseEvents(true, { forward: true })` default; temporarily disabled on mouseenter of pet, settings panel, and speech bubble, restored on mouseleave (50ms debounce shared in App.tsx)
- No keyboard focus stealing on startup — `mainWindow.focus()` removed from `did-finish-load`
- Aero Snap resize blocked via `will-resize` event handler
- Local transparent PNG character assets (two built-in: cutout-1, cutout-2)
- Custom React pointer-based window dragging from the character image
- Character size control through settings
- Continuous screen-usage reminder settings
- Electron `powerMonitor` based active usage detection
- Local persistence for reminder enablement, trigger interval, idle break threshold, and message
- User-imported custom companion images, with transparent PNG/WebP/GIF recommended and JPG/JPEG allowed without background removal
- Local persistence for custom character list and selected character
- Character random rotation settings, including enabled state, interval, and selected rotation pool
- Fixed-character mode when random rotation is disabled
- Reminder settings save feedback with `Saving...`, `Saved`, and `Saved locally.`
- Development-only test reminder flow
- Reminder speech bubble with dismiss `X`
- Hover-only companion actions: `SET` and `X` appear only when hovering the character area
- Packaging: Windows installer + portable exe (`package:win`) and macOS arm64 `.dmg` (`package:mac`); both also built together in CI

Important implementation details:

- Do not use CSS `-webkit-app-region: drag` on the character image. It caused transparent-window hit testing problems and swallowed clicks on settings/reminder buttons.
- Dragging is handled through `src/hooks/useDraggable.ts`, which sends `window.companionApi.moveWindowBy(...)` through preload IPC.
- `setIgnoreMouseEvents` handlers are lifted to `App.tsx` (not inside `Pet.tsx`) so the shared debounce timer covers both Pet and SettingsPanel. Moving between the two does not re-enable passthrough.
- `transparent-companion.png` exists in `src/assets/characters/` but is intentionally NOT registered in `characters.ts` — it is a development placeholder, not a distributable character asset.

## Current UX Direction

The character is the product center.

Settings and timer controls must remain secondary. Avoid making the main view feel like a dashboard, timer app, chat app, or utility panel.

Current expected main-view behavior:

- Default view should visually show only the character.
- Hovering over the character reveals lightweight `SET` and `X` controls.
- Reminder bubble should not permanently block the face and must be dismissible.

## Latest Verified State

All features implemented and user-verified. Latest milestone: **v0.3.0 released 2026-06-09**
(heart-burst reminder + macOS support + dual-platform CI).

- Transparent frameless always-on-top window, character draggable, hover-only controls
- Continuous screen-usage reminder (powerMonitor, 15s poll, user-configurable; min interval now 1 min)
- Custom character import (PNG/WebP/GIF/JPG, screen-companion-character:// protocol)
- Character random rotation (default 60min, configurable pool)
- CC interaction blocking resolved: companion no longer blocks clicks or keyboard in apps behind it
- Heart-burst reminder animation, with the passthrough/clickability fix (see "Heart Burst … Bug Diagnosis")
- CSS animation runs on GPU (will-change: translate, drop-shadow on same compositing layer)
- Runs and packages natively on macOS Apple Silicon as well as Windows

### Distribution (as of v0.3.0)

- Repo: https://github.com/idoia1027/screen-companion (public)
- **Public release (stable download link for the tools-library card):**
  https://github.com/idoia1027/screen-companion/releases/latest
- v0.3.0 published assets (built by CI, **unsigned**):
  - Windows installer: `Screen-Companion-Setup-0.3.0.exe`
  - Windows portable: `Screen-Companion-0.3.0.exe`
  - macOS (Apple Silicon): `Screen-Companion-0.3.0-arm64.dmg`
- How to cut a new release: bump `version` in package.json → merge to main → `git tag vX.Y.Z && git push origin vX.Y.Z`. CI builds both platforms and creates a **draft** Release; review, then publish (or `gh release edit vX.Y.Z --draft=false --latest`). See "Packaging & Distribution".
- Listing target: BrieflyAI / yt-x-assist tools tab, **Casual** category (project intro + recording handed off in a separate workspace conversation).

For fast LOCAL testing (not for distribution) you can still run the unpacked build, but the
whole `release/<platform>-unpacked` (or `mac-arm64`) folder is required — never ship a bare
unpacked executable by itself.

## Why Today Was Inefficient

The main slowdown was not product complexity. It came from weak verification discipline around Electron desktop behavior.

What went wrong:

- Too much confidence from code inspection without immediately doing real click tests.
- Transparent frameless Electron windows have special hit-testing behavior; normal web assumptions were not enough.
- CSS `-webkit-app-region: drag` made buttons look visible but not reliably clickable.
- Old running app processes locked packaging output and made it unclear which version was being tested.
- Installed version, portable version, and `win-unpacked` version were mixed during debugging.
- Some fixes were made visually visible first, which solved debugging but created bad companion UX until corrected.
- The stale project memory still described already-fixed bugs, which could mislead future work.

## Rules To Avoid Repeating This

For every future desktop interaction change:

1. Kill old `Screen Companion` and `electron` processes before packaging or testing.
2. Test against one known target at a time, preferably `release/win-unpacked` for fast local verification.
3. Add temporary logs only when needed, then remove or keep them intentionally.
4. Verify with real clicks, not just build success.
5. For transparent Electron windows, treat drag regions as risky. Prefer custom pointer dragging unless there is a specific reason to use `-webkit-app-region: drag`.
6. Do not ship a visible debugging workaround as final UX.
7. After packaging, confirm timestamp in `release/` so the tested artifact is the latest one.
8. Update `PROJECT.md` and `MEMORY.md` when behavior changes materially.

## Local Commands

Run development app:

```powershell
powershell -ExecutionPolicy Bypass -File ".\run-dev.ps1"
```

Run packaged local app:

```powershell
powershell -ExecutionPolicy Bypass -File ".\run-release.ps1"
```

Package Windows installer and portable exe:

```powershell
npm.cmd run package:win
```

Direct npm commands:

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run package:win
```

Known environment note:

- In the Codex sandbox, plain `npm.cmd run build` may fail with `Cannot read directory "../..": Access is denied`. Running with normal Windows permissions has worked.

## Workspace Location

Current workspace:

```txt
C:\Users\idoia1027\Documents\companion genie
```

The project can be moved to D drive later if desired, but move the whole project folder, not individual source folders.

Recommended future location if moving:

```txt
D:\PERSONAL\companion genie
```

## Mouse Passthrough Implementation

Companion window is non-blocking by default. Implementation:

- Default: `setIgnoreMouseEvents(true, { forward: true })` — all events pass through to apps below
- Hover counter (`hoverCountRef`) tracks how many interactive areas the mouse is currently inside
- `mouseenter` on Pet / SettingsPanel / SpeechBubble → counter++ → `setIgnoreMouseEvents(false)`
- `mouseleave` → counter-- → if counter reaches 0 and not dragging → `setTimeout(0)` → `setIgnoreMouseEvents(true)`
- `isDraggingRef` prevents passthrough from re-enabling mid-drag when mouse leaves pet bounds
- Drag end → `setIgnoreMouseEvents(true)` + `window.blur()` to return keyboard focus
- Settings panel close → force-resets counter to 0 + restores passthrough (handles unmount without mouseleave)

The `setTimeout(0)` gap (vs. the old 50ms) allows Pet→SettingsPanel mouse transitions to register the next `mouseenter` before passthrough is restored, while eliminating the 50ms click-swallowing window that blocked CC interaction.

User-verified: companion running over CC no longer blocks clicks or keyboard input in CC.

## Heart Burst Animation — Interaction Bug Diagnosis (2026-06-09)

### What was added
A radial heart burst animation fires when the usage reminder appears: 14 hearts
scatter from the character center, peak ~756ms, then fade out over 4200ms total.
Branch: `fix/heart-burst-passthrough` (not yet merged to main).

### Root cause — two independent bugs

**Bug 1 (animation design): Hearts appear at full opacity ON the character (18% keyframe)**

The keyframe sequence is:
- 0%  → opacity 0, position: character center
- 18% → opacity 1, position: character center  ← all hearts fully visible ON the character
- 55% → opacity 1, position: 85% of destination
- 100%→ opacity 0, position: destination

Electron transparent-window hit-testing is pixel-alpha based, NOT CSS `pointer-events` based.
When hearts sit at alpha > 0 on top of the character, those pixels are "opaque" at the OS
level. Mouse moves over them are swallowed before `onMouseEnter` on `.pet` can fire, so
`setIgnoreMouseEvents(false)` is never called and the character becomes unclickable.

**Bug 2 (attempted fix introduced a secondary problem): setIgnoreMouseEvents(false) blocks entire window**

To unblock interaction during the burst, a `useEffect` was added that calls
`setIgnoreMouseEvents(false)` whenever `reminderMessage` is set. This works for interacting
with the speech bubble and character, but it makes the **entire 520×620px window
non-passthrough** for the whole reminder lifetime — blocking clicks on other windows
underneath, including their top-right close buttons.

### Correct fix (APPLIED & verified — 2026-06-09)

Both layers fixed on `fix/heart-burst-passthrough`:

- **Bug 1 — keyframe offset (`src/styles/global.css`).** The `@keyframes heart-burst`
  now keeps hearts at `opacity: 0` while they travel outward, fading them in only after
  they clear the character. New stops: `0%` (center, invisible) → `22%` (still
  `opacity: 0`, already ~22% of destination ≈ 50–70px off-center) → `45%` (`opacity: 1`,
  60% of destination) → `100%` (fade out at full destination). No heart is ever opaque on
  the character center, so Electron's alpha hit-test never swallows the character.
- **Bug 2 — reverted the `useEffect`** in `src/App.tsx`. The window stays at its base
  `setIgnoreMouseEvents(true, { forward: true })`; transparent areas remain passthrough for
  the whole reminder lifetime, so underlying windows (and their close buttons) stay clickable.

**Verified** via the `run-companion` driver on macOS (launch built app → fire real
`reminder:show` IPC → sample geometry + screenshot across the burst):
- Hearts stay `opacity: 0` until ~650ms, then fade in only once ≥66px from the character center.
- Screenshots show hearts forming a ring *around* the cat; face/body core stay unobscured.

### Current branch state
`fix/heart-burst-passthrough` now contains the full fix plus the animation parameter
changes (4200ms, 220–324px spread, min reminder 1 min). Ready to merge to main.

## Next Priorities

1. Reposition reminder bubble so it does not cover the face.
2. Persist window position across restarts.
3. Improve app icon (current is a placeholder; `build/icon-mac-512.png` is just the upscaled Windows icon).
4. Tools-library listing (yt-x-assist, Casual) — in progress: project intro + screen recording handed off to a separate workspace conversation; v0.3.0 release link is live.
5. (Optional) Add an Intel Mac target (`x64`/`universal`) — current macOS build is arm64 only.
6. (Optional) Code signing + notarization to remove the first-run security prompt on both platforms.

## macOS Migration Note (2026-06-07)

The project now also runs on macOS (Apple Silicon) for day-to-day development. Notes:

- **Mac dev environment set up and verified.** `npm install` + `npm run dev` run the app directly on macOS; no Windows-only steps required. See README "Run On macOS".
- **GitHub SSH over port 443 workaround.** On this network, `github.com:22` was intercepted (resolved to a bogus `198.18.0.x` address) and SSH timed out. Fixed by routing GitHub SSH through `ssh.github.com:443` via `~/.ssh/config`:
  ```
  Host github.com
    Hostname ssh.github.com
    Port 443
    User git
  ```
  `ssh -T git@github.com` and `git push` both work over this route.
- **Toolchain verified.** Homebrew (used to install `gh`), Node/npm (clean `npm install`, 0 vulnerabilities), and Claude Code CLI are all working on the Mac. `gh` is authenticated and the SSH public key is registered on GitHub.
- **screen-companion verified on Apple Silicon.** Electron binary is native `arm64`; `npm run dev` launches the transparent always-on-top companion window with no errors (only the standard dev-mode CSP/deprecation notices). Character renders and `did-finish-load` fires normally.

## Packaging & Distribution (2026-06-09)

Electron is not a cross-platform binary — **each OS needs its own build, made on that
OS** (a macOS `.dmg` can only be produced on macOS). Builds are unsigned, which is fine
for personal sharing but makes recipients bypass an OS security warning on first launch
(macOS: System Settings → Privacy & Security → "Open Anyway"; Windows: SmartScreen →
"Run anyway"). The running app and all features are identical signed or not — signing only
removes the install-time friction. Proper signing/notarization needs an Apple Developer
account ($99/yr) and a Windows code-signing cert.

### Local packaging

```bash
npm run package:mac    # → release/Screen Companion-<ver>-arm64.dmg  (Apple Silicon only)
npm run package:win    # → release/Screen Companion Setup <ver>.exe + portable  (run on Windows)
```

- mac config (`build.mac` in package.json): `dmg` / `arm64`, `identity: null` (skips
  signing). **arm64 only** — Intel Macs are NOT covered yet; add an `x64`/`universal`
  target if needed. Icon is `build/icon-mac-512.png` (electron-builder requires ≥512×512;
  the Windows `icon.png` was only 256×256).
- **Apple Silicon gotcha:** an unsigned arm64 `.app` won't launch as-is — ad-hoc sign it
  first: `codesign --force --deep --sign - "release/mac-arm64/Screen Companion.app"`, then
  `xattr -dr com.apple.quarantine <app>` after copying to /Applications.

### CI — both installers in one run

`.github/workflows/build.yml` builds Windows + macOS together via an OS matrix
(`windows-latest`, `macos-latest`):

- **Tag push** (`git tag v0.2.1 && git push --tags`) → builds both and publishes them to a
  **draft GitHub Release** (electron-builder `--publish always`; release tag/name come from
  the package.json `version`). Review the draft, then hit "Publish release".
- **Manual run** (Actions tab → Run workflow) → builds both and uploads the installers as
  run artifacts, without touching Releases.
- Builds are unsigned in CI (`CSC_IDENTITY_AUTO_DISCOVERY: false`); job has
  `contents: write` so `GITHUB_TOKEN` can create the release. Publish target is the
  `build.publish` github config in package.json.
