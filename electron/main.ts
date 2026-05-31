import { app, BrowserWindow, ipcMain, powerMonitor, screen } from 'electron';
import { dirname, join } from 'node:path';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
  sanitizeReminderSettings,
} from '../src/shared/reminderSettings';

let mainWindow: BrowserWindow | null = null;
const logPath = join(tmpdir(), 'screen-companion-main.log');
const usagePollIntervalMs = 15_000;
let reminderSettings: ReminderSettings = DEFAULT_REMINDER_SETTINGS;
let activeUsageSeconds = 0;
let reminderAlreadyShown = false;
let usagePollIntervalId: ReturnType<typeof setInterval> | null = null;

const logMain = (message: string) => {
  appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
};

process.on('uncaughtException', (error) => {
  logMain(`uncaughtException: ${error.stack ?? error.message}`);
});

process.on('unhandledRejection', (reason) => {
  logMain(`unhandledRejection: ${String(reason)}`);
});

const getSettingsPath = () => join(app.getPath('userData'), 'settings.json');

const loadReminderSettings = () => {
  const settingsPath = getSettingsPath();

  if (!existsSync(settingsPath)) {
    reminderSettings = DEFAULT_REMINDER_SETTINGS;
    return reminderSettings;
  }

  try {
    const parsed = JSON.parse(readFileSync(settingsPath, 'utf8')) as Partial<ReminderSettings>;
    reminderSettings = sanitizeReminderSettings(parsed);
  } catch (error) {
    logMain(`settings:load-failed:${String(error)}`);
    reminderSettings = DEFAULT_REMINDER_SETTINGS;
  }

  return reminderSettings;
};

const saveReminderSettings = (settings: ReminderSettings) => {
  reminderSettings = sanitizeReminderSettings(settings);
  const settingsPath = getSettingsPath();
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(reminderSettings, null, 2), 'utf8');
  resetUsageTracking();
  return reminderSettings;
};

function resetUsageTracking() {
  activeUsageSeconds = 0;
  reminderAlreadyShown = false;
}

const notifyReminder = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send('reminder:show', {
    message: reminderSettings.reminderMessage,
    activeUsageSeconds,
  });
};

const pollActiveUsage = () => {
  if (!reminderSettings.reminderEnabled) {
    resetUsageTracking();
    return;
  }

  const idleSeconds = powerMonitor.getSystemIdleTime();
  const idleBreakSeconds = reminderSettings.idleBreakThresholdMinutes * 60;

  if (!Number.isFinite(idleSeconds) || idleSeconds >= idleBreakSeconds) {
    resetUsageTracking();
    return;
  }

  if (reminderAlreadyShown) {
    return;
  }

  activeUsageSeconds += usagePollIntervalMs / 1000;

  if (activeUsageSeconds >= reminderSettings.reminderTriggerMinutes * 60) {
    reminderAlreadyShown = true;
    notifyReminder();
  }
};

const startUsageTracking = () => {
  if (usagePollIntervalId) {
    return;
  }

  usagePollIntervalId = setInterval(pollActiveUsage, usagePollIntervalMs);
};

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
  loadReminderSettings();
  startUsageTracking();
  powerMonitor.on('suspend', resetUsageTracking);
  powerMonitor.on('lock-screen', resetUsageTracking);
  powerMonitor.on('resume', resetUsageTracking);
  powerMonitor.on('unlock-screen', resetUsageTracking);
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

ipcMain.handle('reminder-settings:get', () => {
  return reminderSettings;
});

ipcMain.handle('reminder-settings:save', (_event, settings: ReminderSettings) => {
  return saveReminderSettings(settings);
});
