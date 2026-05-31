import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { join } from 'node:path';
import { appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

let mainWindow: BrowserWindow | null = null;
const logPath = join(tmpdir(), 'screen-companion-main.log');

const logMain = (message: string) => {
  appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
};

process.on('uncaughtException', (error) => {
  logMain(`uncaughtException: ${error.stack ?? error.message}`);
});

process.on('unhandledRejection', (reason) => {
  logMain(`unhandledRejection: ${String(reason)}`);
});

const createWindow = () => {
  logMain('createWindow:start');
  const { workArea } = screen.getPrimaryDisplay();
  const width = 520;
  const height = 620;
  const x = Math.min(workArea.x + 120, workArea.x + workArea.width - width - 20);
  const y = Math.min(workArea.y + 80, workArea.y + workArea.height - height - 20);

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    title: 'Screen Companion',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.webContents.once('did-finish-load', () => {
    logMain('renderer:did-finish-load');
    mainWindow?.show();
    mainWindow?.focus();
    mainWindow?.moveTop();
  });
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logMain(`renderer:did-fail-load:${errorCode}:${errorDescription}`);
  });
  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    logMain(`renderer:console:${message}`);
  });
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      logMain('window:forced-show');
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
    }
  }, 2500);
  logMain('createWindow:window-created');

  if (process.env.ELECTRON_RENDERER_URL) {
    logMain(`loadURL:${process.env.ELECTRON_RENDERER_URL}`);
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    const rendererPath = join(__dirname, '../renderer/index.html');
    logMain(`loadFile:${rendererPath}`);
    mainWindow.loadFile(rendererPath);
  }
};

const gotSingleInstanceLock = app.requestSingleInstanceLock();
logMain(`singleInstance:${gotSingleInstanceLock}`);

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
    mainWindow.focus();
  });
}

app.whenReady().then(() => {
  logMain('app:ready');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('window:move-by', (_event, delta: { x: number; y: number }) => {
  if (!mainWindow || !Number.isFinite(delta.x) || !Number.isFinite(delta.y)) {
    return;
  }

  const [x, y] = mainWindow.getPosition();
  mainWindow.setPosition(Math.round(x + delta.x), Math.round(y + delta.y));
});

ipcMain.on('app:close', () => {
  app.quit();
});
