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
- no automatic conversion of opaque JPGs into transparent companion cutouts
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
src/components/ReminderSettingsControls.tsx
src/components/TimerControls.tsx
src/components/SpeechBubble.tsx
src/hooks/useDraggable.ts
src/shared/appSettings.ts
src/shared/reminderSettings.ts
src/data/characters.ts
src/styles/global.css
docs/continuous-usage-reminder.md
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
- Reminder message supports free text, including Chinese text.
- Quick-fill buttons only fill the reminder message input.
- Users can import their own PNG/WebP/GIF/JPG character images.
- Imported custom characters are copied into Electron user data and loaded via `screen-companion-character://`.
- Selected character and custom character list persist locally.
- JPG/JPEG import is supported, but the image keeps its original rectangular background because there is no background removal.
- The development build may show `Test reminder`; final packaged user builds should not expose test mode.
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

1. Manually verify custom image import in the desktop app with transparent PNG/WebP/GIF and opaque JPG/JPEG samples.
2. Package a fresh Windows build from the current accepted dev state.
3. Make the settings panel feel spatially connected to the companion.
4. Move reminder bubble so it does not cover the face.
5. Persist scale and window position.
6. Decide whether temporary renderer console logs should stay.

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

## GitHub Sync State

Private repository:

```txt
https://github.com/idoia1027/screen-companion
```

Local branch:

```txt
main
```

Latest local feature commit:

```txt
1f9350b Add custom character import
```

Because local `git push` over HTTPS was unreliable, the latest feature file tree was synced to GitHub `main` through the GitHub API fallback.

Remote `main` was verified to include:

```txt
docs/continuous-usage-reminder.md
README.md continuous reminder documentation
README.md custom character import documentation with JPG/JPEG support
src/shared/appSettings.ts
```

Documentation progress is also tracked in Git and synced through the same GitHub API fallback when normal HTTPS push is unavailable. Avoid hard-coding the remote API commit SHA in this memory file because each documentation sync creates a new remote commit.

If normal GitHub connectivity improves later, prefer a normal `git push` flow again.

## Latest User Verification

The user reported that yesterday's continuous reminder behavior looks normal in the local app.

Treat the continuous screen-usage reminder as implemented and user-accepted for the dev build, pending a fresh packaged Windows build and real packaged-app verification.

Treat custom character import as implemented, build-validated, and synced to GitHub. It still needs real desktop manual verification with at least one transparent image and one JPG/JPEG before calling the user-facing flow fully accepted.

## Custom Character Import

New behavior:

- Settings includes an `Import image` action under Character.
- Supported import formats are PNG, WebP, GIF, JPG, and JPEG.
- The imported source file is copied into:

```txt
Electron userData/custom-characters/
```

- The renderer receives imported image URLs through the internal protocol:

```txt
screen-companion-character://<custom-character-id>
```

- Do not use raw `file://` paths for custom character images; they may be blocked when the renderer is loaded from the Vite dev server.
- Custom characters can be removed from Settings.
- Removing the selected custom character falls back to `cutout-1`.
- This feature intentionally does not do background removal. PNG/WebP/GIF can preserve transparency; JPG/JPEG will keep its original rectangular background.
