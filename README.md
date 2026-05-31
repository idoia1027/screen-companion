# Screen Companion MVP

Lightweight Windows desktop screen companion built with Electron, React, TypeScript, and Vite.

The MVP is intentionally not a chatbot, productivity dashboard, browser extension, backend service, login system, Live2D app, or background-removal pipeline. It uses local pre-cut transparent character assets only.

## What It Does

- Opens a transparent, frameless, always-on-top Electron window.
- Displays a local transparent PNG character asset.
- Lets the user drag the companion around the screen.
- Runs a configurable lightweight work timer, defaulting to 50 minutes.
- Shows a small reminder speech bubble when the timer finishes.
- Provides minimal controls for start, pause, reset, interval, and closing the app.

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
- Set the interval to a short value such as `0.1` minutes for testing.
- Start the timer and confirm the reminder bubble appears.
- Dismiss the reminder bubble.
- Reset the timer.
- Run `npm.cmd run package:win`.
- Close any existing `Screen Companion` processes before running the installer.
- Open the installer from `release/` and confirm the installed app launches.
- Open the portable `.exe` from `release/` and confirm it launches without installation.

## Character Assets

MVP character assets live in:

```txt
src/assets/characters/
```

Assets should be pre-cut transparent PNG, WebP, or simple GIF files. Do not use raw rectangular JPG photos as the companion.

## Known Limitations

- No automatic image background removal.
- No AI chat or LLM integration.
- No backend, login, sync, or marketplace.
- Window position and selected character are not persisted yet.
- The app icon is a simple placeholder.
