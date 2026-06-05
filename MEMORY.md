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
src/components/CharacterRotationControls.tsx
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
- Reminder settings save shows visible feedback: `Saving...`, `Saved`, and `Saved locally.`
- Reminder message supports free text, including Chinese text.
- Quick-fill buttons only fill the reminder message input and currently use Chinese labels.
- Users can import their own PNG/WebP/GIF/JPG character images.
- Imported custom characters are copied into Electron user data and loaded via `screen-companion-character://`.
- Selected character and custom character list persist locally.
- JPG/JPEG import is supported, but the image keeps its original rectangular background because there is no background removal.
- Random character rotation is implemented and enabled by default.
- Rotation defaults to 60 minutes and can be disabled for a fixed selected character.
- Users can choose which built-in/custom characters participate in the rotation pool.
- New imported custom characters are added to the rotation pool by default.
- The development build may show `Test reminder`; final packaged user builds should not expose test mode.
- Reminder bubble has a clickable `X` and was verified to dismiss.
- Packaged outputs exist in `release/`.

Important implementation notes:

- Do not put `-webkit-app-region: drag` back on `.pet__image`. Use `src/hooks/useDraggable.ts` and preload IPC instead.
- Mouse passthrough uses a hover counter (`hoverCountRef`) not a timer. Counter increments on mouseenter of any interactive area, decrements on mouseleave. When counter hits 0 and not dragging, `setTimeout(0)` restores `setIgnoreMouseEvents(true)`. Do not revert to the 50ms timer — it caused clicks on apps behind the companion to be swallowed.
- `isDraggingRef` blocks passthrough restoration during drag. `onDragEnd` restores passthrough and calls `window.blur()` to return keyboard focus.
- Closing settings panel force-resets counter to 0 and restores passthrough, in case panel unmounts without firing `mouseleave`.

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
release/Screen Companion Setup 0.2.1.exe
```

Latest build timestamp: 2026-06-05 15:24

This build includes all fixes through commit `b960cb4`: CC interaction blocking fix, CSS animation performance optimization, character rotation, custom image import, continuous reminder.

Portable single-file output:

```txt
release/Screen Companion 0.2.1.exe
```

Local unpacked test app (fastest for local verification):

```txt
release/win-unpacked/Screen Companion.exe
```

For sharing with other people, use the Setup installer. Do not share only `win-unpacked/Screen Companion.exe` — it depends on the entire `win-unpacked` folder.

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

1. Move reminder bubble so it does not cover the face.
2. Persist window position across restarts.
3. Improve app icon (current is placeholder).
4. Add to BrieflyAI tools tab once screenshots are available.

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

Repository: https://github.com/idoia1027/screen-companion (public)

Branch: main — up to date with origin/main.

Latest commit: `b960cb4 fix: eliminate CC interaction blocking and reduce animation CPU usage` (2026-06-05)

Normal `git push` over HTTPS works. No API fallback needed.

## Latest User Verification

- Continuous screen-usage reminder: user-verified working in dev build.
- Custom character import: implemented and synced. Manual desktop verification with transparent PNG and JPG still recommended but not blocking.
- Character rotation: implemented and synced. Manual desktop verification with short interval still recommended but not blocking.
- CC interaction blocking: **fixed and user-verified** (2026-06-05). Companion no longer blocks clicks or keyboard input in apps behind it.
- CSS animation performance: `will-change: translate` added, `drop-shadow` moved to same compositing layer as animation. Reduces CPU usage on low-end machines.

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

## Character Rotation

New behavior:

- Random character rotation is enabled by default.
- Default interval is 60 minutes.
- Users can choose which built-in/custom characters participate in the rotation pool.
- Users can disable random rotation to keep one fixed selected character.
- New imported custom characters are added to the rotation pool by default.
- Removing a custom character also removes it from the rotation pool.
- Character switching uses a lightweight image animation.
- Rotation settings persist in `settings.json` through the existing app settings flow.

UI notes:

- Settings panel must not be anchored to the top of the transparent Electron window. That caused the panel to be clipped when the app window was near the screen edge.
- Current safer positioning anchors the panel above the companion with a bounded max height and internal scrolling.
- If settings become too crowded, prefer collapsible sections or tabs instead of making one long always-open panel.
- Reminder Save must show visible feedback so the user does not think the click failed.
