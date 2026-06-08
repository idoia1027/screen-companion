---
name: run-companion
description: Build, run, and drive the Screen Companion Electron app — launch it, trigger the usage reminder (which fires the heart-burst animation), and screenshot it. Use when asked to run the app, see/verify an animation or UI change, or take a screenshot of the companion.
---

Screen Companion is a transparent, always-on-top Electron desktop pet (React renderer,
`electron-vite`). It has no headless mode and the interesting moments are transient
animations (idle float, reminder bounce, **heart burst**), so the way to verify a change
is to launch the built app under Playwright, trigger the moment, and screenshot it.

This is macOS — there is a real display, so **no xvfb**. The launched window appears on
screen; Playwright's `page.screenshot()` captures the renderer DOM (pink hearts etc. show
up fine over the default white screenshot background even though the live window is
transparent).

All commands run from the repo root.

## Prerequisites

```bash
npm install playwright-core --no-save   # attaches to the existing electron binary; --no-save keeps package.json clean
npm run build                            # produces out/ — the driver launches this, NOT the dev server
```

Rebuild (`npm run build`) after every renderer change — the driver runs the built `out/`,
not a live dev server.

## Run

```bash
# Visible live demo: launch + replay the heart burst 4× so a human can watch, then close.
node .claude/skills/run-companion/driver.mjs demo

# Interactive REPL (wrap in tmux for agent use):
node .claude/skills/run-companion/driver.mjs
```

### REPL commands

| command | what it does |
|---|---|
| `launch` | launch the built app, wait for `.pet` |
| `remind [msg]` | send a usage reminder via main→renderer IPC — **this fires the heart burst**. Re-send to replay (the `<Pet>` remounts each time). |
| `ss [name]` | screenshot → `/tmp/companion-shots/<name>.png` (override dir with `SCREENSHOT_DIR`) |
| `eval <js>` | evaluate JS in the renderer, print JSON (e.g. `eval document.querySelectorAll('.heart-burst__heart').length`) |
| `quit` | close app, exit |

### Capturing a transient animation (agent path)

The burst peaks ~300–500ms after `remind` and fades by ~1s. To grab frames, drive the REPL
under tmux and `remind` then `ss` in quick succession, or add timed screenshots to a one-shot
script modeled on the `demo` branch in `driver.mjs`. Then actually open the PNGs.

## How the reminder is triggered

The renderer subscribes to the `reminder:show` IPC channel (`electron/preload.ts`) and the
real usage timer sends it from `electron/main.ts` (`webContents.send('reminder:show', {message})`).
The driver sends the same IPC from the main process via `app.evaluate`, so it exercises the
exact production path — no test-only hooks. In dev (`npm run dev`) there is also a "Test
reminder" button in the settings panel (right-click the pet), but the driver path works
against the built app and needs no clicking.

## Gotchas

- **Run from repo root.** `playwright-core` is installed there; running the script from
  `/tmp` or elsewhere fails with `ERR_MODULE_NOT_FOUND`.
- **Build first / rebuild after edits.** The driver launches `out/`, not the dev server.
- **macOS electron binary** lives at `node_modules/electron/dist/Electron.app/Contents/MacOS/Electron`
  (not the bare `electron` path used on Linux). The driver already uses the macOS path.
- **The live window is transparent**, but screenshots render over white, so hearts/character
  are clearly visible — no need to inject a background.
