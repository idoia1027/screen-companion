// Launches the built companion with a visible window and re-fires the heart-burst
// reminder on a fixed cadence, so you have a stable, repeating target to screen-record
// (Cmd+Shift+5). Each burst runs ~4.2s; we fire every 6s so one fully plays before the
// next. Runs until you Ctrl-C / kill it. Run from repo root after `npm run build`.
import { _electron as electron } from 'playwright-core';
import path from 'node:path';

const APP_DIR = path.resolve(import.meta.dirname, '../../..');
const BIN = path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');
const GAP_MS = 6000;
const MSG = '休息一下，喝口水吧 💧';

const app = await electron.launch({ executablePath: BIN, args: [APP_DIR], cwd: APP_DIR });
const page = await app.firstWindow();
await page.waitForSelector('.pet', { timeout: 15_000 });
console.log('launched — window is on screen. Recording target ready.');
console.log(`firing a heart burst every ${GAP_MS / 1000}s — Ctrl-C to stop.`);

let n = 0;
async function burst() {
  n += 1;
  await app.evaluate(({ BrowserWindow }, msg) => {
    BrowserWindow.getAllWindows()[0].webContents.send('reminder:show', { message: msg });
  }, MSG);
  console.log(`burst #${n}`);
}

await burst();
setInterval(burst, GAP_MS);

// Keep the process alive; clean up on termination.
process.on('SIGINT', async () => { await app.close().catch(() => {}); process.exit(0); });
process.on('SIGTERM', async () => { await app.close().catch(() => {}); process.exit(0); });
