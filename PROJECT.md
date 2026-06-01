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
- Always-on-top behavior
- Local transparent PNG character assets
- Two selectable characters
- Custom React pointer-based window dragging from the character image
- Character size control through settings
- Continuous screen-usage reminder settings
- Electron `powerMonitor` based active usage detection
- Local persistence for reminder enablement, trigger interval, idle break threshold, and message
- User-imported custom companion images, with transparent PNG/WebP/GIF recommended and JPG/JPEG allowed without background removal
- Local persistence for custom character list and selected character
- Development-only test reminder flow
- Reminder speech bubble with dismiss `X`
- Hover-only companion actions: `SET` and `X` appear only when hovering the character area
- Windows installer, portable exe, and `win-unpacked` packaging output

Important implementation detail:

- Do not use CSS `-webkit-app-region: drag` on the character image. It caused transparent-window hit testing problems and swallowed clicks on settings/reminder buttons.
- Dragging is handled through `src/hooks/useDraggable.ts`, which sends `window.companionApi.moveWindowBy(...)` through preload IPC.

## Current UX Direction

The character is the product center.

Settings and timer controls must remain secondary. Avoid making the main view feel like a dashboard, timer app, chat app, or utility panel.

Current expected main-view behavior:

- Default view should visually show only the character.
- Hovering over the character reveals lightweight `SET` and `X` controls.
- Reminder bubble should not permanently block the face and must be dismissible.

## Latest Verified State

Latest validated behavior from today's session:

- `SET` click reaches React after removing CSS drag region.
- `Test reminder` click reaches React.
- Reminder appears after the test timer.
- Reminder bubble `X` reaches React and dismisses the reminder.
- `SET` / `X` are no longer always visible; they fade in on character hover.
- Packaging command succeeded and produced updated files under `release/`.

Latest implementation update:

- `docs/continuous-usage-reminder.md` captures the continuous screen-usage reminder requirement.
- The old renderer-only countdown has been replaced as the reminder driver by main-process activity tracking.
- The main process polls `powerMonitor.getSystemIdleTime()` every 15 seconds.
- Reminder settings are stored in the app user data folder as `settings.json`.
- Reminder disabling only disables reminder bubbles and animation; it does not hide or quit the companion.

Latest user-verified behavior after the continuous reminder work:

- The local dev app opens at `http://localhost:5173/` when `npm run dev` is running.
- The continuous reminder settings UI appears and the user reported yesterday's feature behavior looks normal.
- Reminder settings can be edited through the lightweight settings panel.
- Custom reminder text is supported and remains part of the reminder bubble flow.
- Disabling reminders is treated as a reminder-only toggle, not a companion visibility toggle.
- The feature has been synced to the private GitHub repository `idoia1027/screen-companion` through the GitHub API fallback because local `git push` over HTTPS was unreliable.

Latest custom character implementation update:

- Settings now supports importing user-provided PNG, WebP, GIF, JPG, or JPEG assets.
- Imported character files are copied to Electron user data under `custom-characters/`.
- Custom character images are loaded through an internal `screen-companion-character://` protocol instead of direct `file://` paths.
- The selected character and custom character list persist in `settings.json`.
- Imported custom characters can be removed; if the selected custom character is removed, the app falls back to `cutout-1`.
- This does not perform background removal. PNG/WebP/GIF can preserve transparency; JPG/JPEG will keep its rectangular background.
- `npm.cmd run build` passed after the custom character import and JPG/JPEG support changes.
- Local commit `1f9350b Add custom character import` was synced to the private GitHub repository through the GitHub API fallback.
- Remote `main` was verified at API tree commit `245ed5a79454251292f974a65e19023640f7a5d3`.

Manual verification still recommended:

- Import one transparent PNG/WebP/GIF and confirm it appears as a cutout.
- Import one JPG/JPEG and confirm it appears with its original rectangular background.
- Restart the app and confirm the selected custom character persists.
- Remove the selected custom character and confirm the app falls back to `cutout-1`.

Latest packaging outputs:

```txt
release/Screen Companion Setup 0.1.0.exe
release/Screen Companion 0.1.0.exe
release/win-unpacked/Screen Companion.exe
```

Use for distribution:

```txt
release/Screen Companion Setup 0.1.0.exe
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

## Next Priorities

1. Manually verify custom character import in the desktop app with PNG/WebP/GIF and JPG/JPEG samples.
2. Package a fresh Windows build after custom import is accepted.
3. Clean up settings panel placement so it feels attached to the companion, not floating far away.
4. Reposition reminder bubble so it does not cover the face.
5. Persist window position and scale.
6. Remove or reduce temporary debug logging if it is no longer needed.
7. Improve icon and visual polish.
