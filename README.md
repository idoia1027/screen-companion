# Screen Companion MVP

Lightweight Windows desktop screen companion built with Electron, React, TypeScript, and Vite.

The MVP is intentionally not a chatbot, productivity dashboard, browser extension, backend service, login system, Live2D app, or background-removal pipeline. It uses local pre-cut transparent character assets only.

## What It Does

- Opens a transparent, frameless, always-on-top Electron window.
- Displays a local transparent PNG character asset.
- Lets the user drag the companion around the screen.
- Tracks continuous active screen usage locally with Electron `powerMonitor`.
- Shows a small reminder speech bubble after the configured active usage interval.
- Lets the user configure reminder enablement, interval, idle break threshold, and message text.
- Lets the user import their own PNG, WebP, GIF, JPG, or JPEG companion image.
- Randomly rotates through selected companion characters every hour by default.
- Provides minimal controls for settings, companion size, and closing the app.

## Custom Companion Images

Users can import an image from Settings with `Import image`.

Supported formats:

```txt
PNG
WebP
GIF
JPG / JPEG
```

Imported images are copied into the app's local user data folder under `custom-characters/`, then loaded through an internal Electron protocol. This means the companion can keep using the imported image even if the original file is moved or deleted.

This feature does not remove backgrounds. PNG, WebP, and GIF can preserve transparency; JPG/JPEG does not have a transparent channel and will appear with its original rectangular background.

## Character Rotation

Character rotation is enabled by default. The app randomly switches between selected companion characters every 60 minutes.

Users can configure this in Settings:

- Turn `Random rotation` on or off.
- Change the rotation interval.
- Select which built-in and imported custom characters participate in the rotation pool.
- Turn rotation off to keep one fixed selected character.

Newly imported custom characters are added to the rotation pool by default. Removing a custom character also removes it from the rotation pool.

Character selection and rotation settings are saved locally in the app user data folder and restored after restart.

## Continuous Screen Usage Reminder

The reminder is based on system activity, not a manual timer. The Electron main process polls `powerMonitor.getSystemIdleTime()` every 15 seconds:

- If system idle time is below the configured break threshold, the app counts that poll interval as active usage.
- If system idle time reaches the configured break threshold, the app treats that as a break and resets active usage.
- When active usage reaches the configured reminder interval, the renderer shows the existing speech bubble with the configured message.
- After a reminder fires, it does not repeatedly fire again until the user has taken an idle break.

Default reminder settings:

```txt
Continuous screen reminder: enabled
Reminder interval: 50 minutes
Break detection: 3 idle minutes
Reminder message: 休息一下，站起来走两步。
```

Reminder settings are saved locally in the app user data folder and restored after restart. Disabling reminders only stops reminder bubbles and reminder animation; it does not hide the companion and does not quit the app.

Important limitation: this feature detects system activity and idle state. It does not detect eye gaze, attention, posture, or whether the user is physically looking at the screen.

## Run Locally

```bash
npm install
npm run dev
```

On Windows you can also run the helper script from this project folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-dev.ps1
```

Run the latest packaged build directly, after closing any old running copies:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-release.ps1
```

If Electron's binary download fails on your network, retry install with an Electron mirror:

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
npm.cmd install
```

## Build Check

```bash
npm run build
```

This runs TypeScript checks and builds the Electron main, preload, and renderer outputs into `out/`.

## Package For Windows

Create both a Windows installer and a portable executable:

```powershell
npm.cmd run package:win
```

Or use the helper script:

```powershell
powershell -ExecutionPolicy Bypass -File .\package-win.ps1
```

Create only the portable executable:

```powershell
npm.cmd run package:win:portable
```

Packaged files are written to:

```txt
release/
```

Expected Windows outputs:

```txt
release/Screen Companion Setup 0.1.0.exe
release/Screen Companion 0.1.0.exe
release/win-unpacked/Screen Companion.exe
```

The app icon placeholder lives in:

```txt
build/icon.ico
```

## Manual Windows Checks

- The app launches with `npm run dev`.
- The window has no frame or default OS chrome.
- The window background is transparent.
- The companion floats above other windows.
- The app appears in the taskbar while running.
- Launching it again focuses the existing companion instead of opening many copies.
- The companion image is not shown inside a rectangular photo block.
- The companion can be dragged around the screen.
- Open settings with the small button.
- Confirm default reminder settings: enabled, 50 minute interval, 3 minute idle break threshold, and the default Chinese reminder message.
- Change the reminder message, save, close the app, relaunch, and confirm the custom message persists.
- Disable continuous screen reminders, save, and confirm the companion remains visible.
- Re-enable reminders, set a practical short interval for manual testing, keep the system active, and confirm the reminder bubble uses the custom message.
- Stay idle longer than the idle break threshold and confirm active usage resets safely.
- Import a PNG/WebP/GIF/JPG from Settings and confirm the companion switches to it.
- Restart the app and confirm the imported custom companion remains available.
- Remove the custom companion and confirm the app falls back to a built-in character.
- Confirm `Random rotation` is enabled by default, with a 60 minute interval.
- Confirm the rotation pool can include or exclude individual built-in/custom characters.
- Turn `Random rotation` off, select one character, restart, and confirm the fixed selection persists.
- Dismiss the reminder bubble.
- Run `npm.cmd run package:win`.
- Close any existing `Screen Companion` processes before running the installer.
- Open the installer from `release/` and confirm the installed app launches.
- Open the portable `.exe` from `release/` and confirm it launches without installation.

## Character Assets

MVP character assets live in:

```txt
src/assets/characters/
```

Transparent PNG, WebP, or simple GIF files work best. JPG/JPEG files are supported but keep their rectangular background because the app does not remove backgrounds.

## Known Limitations

- No automatic image background removal.
- No AI chat or LLM integration.
- No backend, login, sync, or marketplace.
- No automatic background removal for imported images.
- Active usage detection is based on OS idle time, not eye-gaze detection.
- Window position is not persisted yet.
- The app icon is a simple placeholder.
