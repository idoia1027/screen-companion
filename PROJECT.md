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
- raw rectangular JPG companion display

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

1. Clean up settings panel placement so it feels attached to the companion, not floating far away.
2. Reposition reminder bubble so it does not cover the face.
3. Remove or reduce temporary debug logging if it is no longer needed.
4. Persist window position, selected character, and scale.
5. Improve icon and visual polish.
