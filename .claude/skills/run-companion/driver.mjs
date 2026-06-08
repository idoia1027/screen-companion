// REPL + demo driver for the Screen Companion Electron app.
// macOS has a real display, so no xvfb — the launched window appears on screen.
//
//   node .claude/skills/run-companion/driver.mjs          # interactive REPL
//   node .claude/skills/run-companion/driver.mjs demo      # visible live demo (no screenshots)
//
// Must be run from the repo root (so playwright-core resolves from node_modules):
//   npm install playwright-core --no-save   # one-time, not saved to package.json
//   npm run build                            # produces out/ that this launches
import { _electron as electron } from 'playwright-core';
import * as readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';

const APP_DIR = path.resolve(import.meta.dirname, '../../..');
const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/companion-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const BIN = path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');

let app = null;
let page = null;

async function launch() {
  if (app) return console.log('already launched');
  app = await electron.launch({ executablePath: BIN, args: [APP_DIR], cwd: APP_DIR });
  page = await app.firstWindow();
  await page.waitForSelector('.pet', { timeout: 15_000 });
  console.log('launched — pet rendered');
}

// Fire the usage reminder exactly like the real timer does (main → renderer IPC).
// Re-sending replays the heart burst because <Pet> remounts on each reminder.
async function remind(message) {
  if (!app) return console.log('ERROR: launch first');
  await app.evaluate(({ BrowserWindow }, msg) => {
    BrowserWindow.getAllWindows()[0].webContents.send('reminder:show', { message: msg });
  }, message || '休息一下，喝口水吧 💧');
  console.log('reminder sent →', message || '休息一下，喝口水吧 💧');
}

async function ss(name) {
  if (!page) return console.log('ERROR: launch first');
  const f = path.join(SHOT_DIR, (name || `ss-${process.hrtime.bigint()}`) + '.png');
  await page.screenshot({ path: f });
  console.log('screenshot:', f);
}

async function quit() {
  if (app) await app.close().catch(() => {});
  app = null;
  page = null;
}

// One-shot visible demo: launch and replay the heart burst a few times.
if (process.argv.includes('demo')) {
  await launch();
  for (let i = 0; i < 4; i++) {
    await remind(`休息一下，喝口水吧 💧 (${i + 1}/4)`);
    await page.waitForTimeout(2200);
  }
  console.log('demo done — closing');
  await quit();
  process.exit(0);
}

const COMMANDS = {
  launch,
  remind: (a) => remind(a),
  ss: (a) => ss(a),
  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try { console.log(JSON.stringify(await page.evaluate(expr))); }
    catch (e) { console.log('ERROR:', e.message); }
  },
  quit,
  help: () => console.log('commands:', Object.keys(COMMANDS).join(', ')),
};

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'companion> ' });
console.log('Screen Companion driver — "launch", "remind [msg]", "ss [name]", "eval <js>", "quit"');
rl.prompt();
rl.on('line', async (line) => {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (cmd) {
    const fn = COMMANDS[cmd];
    if (!fn) console.log('unknown:', cmd, '— try: help');
    else { try { await fn(rest.join(' ')); } catch (e) { console.log('ERROR:', e.message); } }
  }
  if (cmd === 'quit') { rl.close(); process.exit(0); }
  rl.prompt();
});
rl.on('close', async () => { await quit(); process.exit(0); });
