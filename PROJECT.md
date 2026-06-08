# Screen Companion MVP Project Notes

## Product Definition

Screen Companion is a lightweight Windows desktop companion.

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
- Heart-burst animation on reminder: hearts radiate from the character's center, then fade
- Hover-only companion actions: `SET` and `X` appear only when hovering the character area
- Windows installer, portable exe, and `win-unpacked` packaging output

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

All features implemented and user-verified as of 2026-06-05:

- Transparent frameless always-on-top window, character draggable, hover-only controls
- Continuous screen-usage reminder (powerMonitor, 15s poll, user-configurable)
- Custom character import (PNG/WebP/GIF/JPG, screen-companion-character:// protocol)
- Character random rotation (default 60min, configurable pool)
- CC interaction blocking resolved: companion no longer blocks clicks or keyboard in apps behind it
- CSS animation runs on GPU (will-change: translate, drop-shadow on same compositing layer)

Current packaging:

- Latest build: 2026-06-05 15:24, commit `b960cb4`
- Repo: https://github.com/idoia1027/screen-companion (public)
- Installer: `release/Screen Companion Setup 0.2.1.exe`
- Portable: `release/Screen Companion 0.2.1.exe`

Latest packaging outputs:

```txt
release/Screen Companion Setup 0.2.1.exe
release/Screen Companion 0.2.1.exe
release/win-unpacked/Screen Companion.exe
```

Use for distribution:

```txt
release/Screen Companion Setup 0.2.1.exe
```

Use for fast local testing:

```txt
release/win-unpacked/Screen Companion.exe
```

Do not distribute only `release/win-unpacked/Screen Companion.exe` by itself. The whole `win-unpacked` folder is required for that form.

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

## Next Priorities

1. Reposition reminder bubble so it does not cover the face.
2. Persist window position across restarts.
3. Improve app icon (current is placeholder).
4. Add to BrieflyAI tools tab under Casual category once screenshots are available.

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

## Heart-Burst Reminder Animation (2026-06-08)

A celebratory heart-burst now plays when the usage reminder appears (in addition to the existing reminder bounce).

- **What it does.** 14 hearts radiate from the character's center in a ring with a slight upward drift, peak ~300–500ms, then fade out by ~1s.
- **Implementation.** Pure CSS keyframes (`heart-burst` in `src/styles/global.css`) plus a render layer in `src/components/Pet.tsx`. The hearts are precomputed once (even angles, slight per-heart distance/size/delay variation). The layer is `aria-hidden` and `pointer-events: none`, so it never blocks dragging or button clicks. It re-triggers on each reminder because `App.tsx` already remounts `<Pet>` via the `animationKey` key — no extra state needed.
- **Cross-platform glyph hardening.** The heart glyph is `❤︎` (U+2764 + U+FE0E text variation selector) with `font-variant-emoji: text` on `.heart-burst__heart`. This forces text presentation so the CSS `color: #ff6b8b` applies on every platform. Without it, Windows can render U+2764 as a fixed-color Segoe UI Emoji heart and ignore the pink. macOS verified pink (`rgb(255,107,139)`); Windows no longer needs a separate color check.
- **To tune.** Count → `HEART_COUNT` in `Pet.tsx`; color → `.heart-burst__heart` `color`; travel distance → `distance` in the `HEARTS` map (96–140px); duration → the `1400ms` in the `heart-burst` animation.

## Verifying Animations / UI on macOS — `run-companion` Skill

`.claude/skills/run-companion/` is a project skill for launching and driving the built app on macOS (the way the heart burst was verified). Because the app has no headless mode and the interesting moments are transient animations, the skill launches the built app under Playwright, fires the real reminder, and screenshots it.

- **Prereqs:** `npm install playwright-core --no-save` (kept out of `package.json`) + `npm run build` (the driver runs the built `out/`, not the dev server — rebuild after renderer edits).
- **Live demo (visible window, replays the burst 4×):** `node .claude/skills/run-companion/driver.mjs demo`
- **REPL:** `node .claude/skills/run-companion/driver.mjs` → `launch`, `remind [msg]` (fires the burst via the real `reminder:show` main→renderer IPC — same production path the usage timer uses), `ss [name]`, `eval <js>`, `quit`.
- macOS has a real display, so no xvfb; the launched window appears on screen, and `page.screenshot()` renders the transparent window over white so hearts/character are clearly visible.
