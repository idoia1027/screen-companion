# Working Memory

## User Preferences

- Wants concise, practical progress.
- Wants honest status, not overconfident claims.
- Product direction matters more than feature quantity.
- Strong preference: do not let the app become a productivity dashboard.
- The app should feel like a desktop companion/pet, not a timer app.
- Use local transparent cutout images only for V1.
- Visual companion controls should be secondary and subtle, not permanently stuck to the face.

## Product Guardrails

Keep these constraints active:

- no AI chat
- no background removal
- no backend
- no login
- no Live2D
- no raw rectangular JPG companion
- no large dashboard UI
- settings remain secondary

## Current Project State

Workspace:

```txt
C:\Users\idoia1027\Documents\companion genie
```

The user may later move the whole workspace to D drive. If that happens, use the new D drive path consistently. Moving only release artifacts does not affect development.

Important files:

```txt
electron/main.ts
electron/preload.ts
src/App.tsx
src/components/Pet.tsx
src/components/SettingsPanel.tsx
src/components/TimerControls.tsx
src/components/SpeechBubble.tsx
src/hooks/useDraggable.ts
src/data/characters.ts
src/styles/global.css
package.json
README.md
PROJECT.md
MEMORY.md
run-dev.ps1
run-release.ps1
package-win.ps1
```

Current character assets:

```txt
src/assets/characters/screen-companion-cutout-1.png
src/assets/characters/screen-companion-cutout-2.png
```

These are transparent PNGs and should remain the primary MVP companion assets.

Do not use:

```txt
yuhe1.png
yuhe2.png
```

Those are opaque RGB PNGs and would show as rectangular images.

## Current Working Behavior

Current app behavior after latest fixes:

- Transparent always-on-top frameless Electron window.
- Character displays as a transparent cutout.
- Character can be dragged with custom pointer-based dragging.
- `SET` and app `X` are hidden by default and appear when hovering over the character.
- Settings can switch character and adjust timer/scale.
- Continuous screen-usage tracking can trigger a reminder bubble.
- Reminder settings can be edited and saved locally.
- Reminder bubble has a clickable `X` and was verified to dismiss.
- Packaged outputs exist in `release/`.

Important implementation note:

- Do not put `-webkit-app-region: drag` back on `.pet__image`.
- It made visible buttons fail to receive clicks in the transparent Electron window.
- Use `src/hooks/useDraggable.ts` and preload IPC instead.

## Commands That Worked

Development:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\idoia1027\Documents\companion genie\run-dev.ps1"
```

Run packaged local app:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\idoia1027\Documents\companion genie\run-release.ps1"
```

Packaging:

```powershell
npm.cmd run package:win
```

Build validation:

```powershell
npm.cmd run build
```

Known environment issue:

- `npm.cmd run build` can fail inside the Codex sandbox with `Cannot read directory "../..": Access is denied`.
- The same build/package flow has worked with normal Windows permissions.

## Packaging Outputs

Current distribution installer:

```txt
release/Screen Companion Setup 0.1.0.exe
```

Portable single-file output:

```txt
release/Screen Companion 0.1.0.exe
```

Local unpacked test app:

```txt
release/win-unpacked/Screen Companion.exe
```

For sharing with other people, use:

```txt
release/Screen Companion Setup 0.1.0.exe
```

Do not share only `release/win-unpacked/Screen Companion.exe`; it depends on the rest of the `win-unpacked` folder.

## Packaging Notes

Packaging uses `electron-builder`.

The config disables executable resource editing/signing with:

```json
"signAndEditExecutable": false
```

This was needed because the local Windows environment failed while extracting `winCodeSign` symlinks.

Installer config is one-click per-user and should run after finish.

Before packaging or reinstall testing, close old processes:

```powershell
Get-Process |
  Where-Object { $_.ProcessName -like 'Screen Companion*' -or $_.ProcessName -like 'electron*' } |
  Stop-Process -Force -ErrorAction SilentlyContinue
```

Old install cleanup checked:

- `D:\PERSONAL\Screen Companion` no longer exists.
- Desktop and Start Menu old shortcuts were not found.
- `AppData\Local\screen-companion-mvp-updater` cache was deleted.

## Lessons From The Bad Debugging Session

This session was inefficient and frustrating for the user. Avoid repeating it.

What caused the wasted time:

- Claimed or implied behavior was fixed before doing real click verification.
- Confused installed app, portable app, and `win-unpacked` app during testing.
- Left old app processes running, which locked package files and caused stale versions to be tested.
- Used CSS Electron drag regions in a transparent window, which made controls visible but not clickable.
- Over-focused on packaging while basic UI interactions were still broken.
- Made debugging controls permanently visible, which violated the intended subtle companion UX.

Future rule:

- For every interaction fix, verify the exact user action with a real launched app before reporting success.
- Build success is not enough for Electron UI work.
- If a control is visible but does not click, inspect `pointer-events`, z-index, transparent-window hit testing, and `-webkit-app-region` first.
- Prefer the smallest reproducible manual test: launch `release/win-unpacked`, click the target, confirm app state/log changes.
- Keep UX polish in mind even during debugging; remove debugging scaffolding before calling it done.

## Next Product Priorities

1. Make the settings panel feel spatially connected to the companion.
2. Move reminder bubble so it does not cover the face.
3. Decide whether temporary renderer console logs should stay.
4. Persist selected character, scale, and window position.

## Continuous Reminder Implementation

New requirement doc:

```txt
docs/continuous-usage-reminder.md
```

Reminder settings model:

```ts
reminderEnabled: boolean
reminderTriggerMinutes: number
idleBreakThresholdMinutes: number
reminderMessage: string
```

Defaults:

```txt
reminderEnabled = true
reminderTriggerMinutes = 50
idleBreakThresholdMinutes = 3
reminderMessage = "休息一下，站起来走两步。"
```

The main process owns continuous active usage detection with Electron `powerMonitor`.
It polls system idle time every 15 seconds. If idle time reaches the configured break threshold, active usage resets. If active usage reaches the configured trigger interval, the renderer shows the existing speech bubble with the configured message.

Reminder settings persist in Electron user data as `settings.json`.

Important UX rule:

- Disabling reminders only disables reminder messages and reminder animation.
- It must not hide the companion, close the app, or quit the app.
