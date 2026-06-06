import { app, BrowserWindow, dialog, ipcMain, net, powerMonitor, protocol, screen } from 'electron';
import { basename, dirname, extname, join } from 'node:path';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import type {
  AppSettings,
  CharacterRotationSettings,
  CustomCharacter,
  StoredCustomCharacter,
  StoredSettings,
} from '../src/shared/appSettings';
import {
  DEFAULT_CHARACTER_ROTATION_SETTINGS,
  sanitizeCharacterRotationSettings,
} from '../src/shared/appSettings';
import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
  sanitizeReminderSettings,
} from '../src/shared/reminderSettings';

let mainWindow: BrowserWindow | null = null;
const logPath = join(tmpdir(), 'screen-companion-main.log');
const usagePollIntervalMs = 15_000;
let reminderSettings: ReminderSettings = DEFAULT_REMINDER_SETTINGS;
let characterRotationSettings: CharacterRotationSettings = DEFAULT_CHARACTER_ROTATION_SETTINGS;
let selectedCharacterId = 'cutout-1';
let customCharacters: StoredCustomCharacter[] = [];
let activeUsageSeconds = 0;
let reminderAlreadyShown = false;
let usagePollIntervalId: ReturnType<typeof setInterval> | null = null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'screen-companion-character',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

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
const getCustomCharactersDir = () => join(app.getPath('userData'), 'custom-characters');

const readStoredSettings = (): StoredSettings => {
  const settingsPath = getSettingsPath();

  if (!existsSync(settingsPath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(settingsPath, 'utf8')) as StoredSettings & Partial<ReminderSettings>;

    if ('reminderEnabled' in parsed) {
      return {
        reminderSettings: parsed,
      };
    }

    return parsed;
  } catch (error) {
    logMain(`settings:load-failed:${String(error)}`);
    return {};
  }
};

const writeStoredSettings = () => {
  const settingsPath = getSettingsPath();
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(
    settingsPath,
    JSON.stringify(
      {
        selectedCharacterId,
        customCharacters,
        characterRotationSettings,
        reminderSettings,
      },
      null,
      2,
    ),
    'utf8',
  );
};

const toCustomCharacter = (character: StoredCustomCharacter): CustomCharacter => ({
  ...character,
  image: `screen-companion-character://${encodeURIComponent(character.id)}`,
  isCustom: true,
});

const registerCustomCharacterProtocol = () => {
  protocol.handle('screen-companion-character', (request) => {
    const characterId = decodeURIComponent(new URL(request.url).hostname);
    const character = customCharacters.find((item) => item.id === characterId);

    if (!character || !existsSync(character.imagePath)) {
      return new Response(null, { status: 404 });
    }

    return net.fetch(pathToFileURL(character.imagePath).toString());
  });
};

const getAppSettings = (): AppSettings => ({
  selectedCharacterId,
  customCharacters: customCharacters.filter((character) => existsSync(character.imagePath)).map(toCustomCharacter),
  characterRotationSettings,
});

const loadReminderSettings = () => {
  const storedSettings = readStoredSettings();
  reminderSettings = sanitizeReminderSettings(storedSettings.reminderSettings as Partial<ReminderSettings>);
  characterRotationSettings = sanitizeCharacterRotationSettings(
    storedSettings.characterRotationSettings as Partial<CharacterRotationSettings>,
  );
  selectedCharacterId = typeof storedSettings.selectedCharacterId === 'string' ? storedSettings.selectedCharacterId : 'cutout-1';
  customCharacters = Array.isArray(storedSettings.customCharacters)
    ? storedSettings.customCharacters.filter(
        (character) =>
          typeof character.id === 'string' &&
          typeof character.name === 'string' &&
          typeof character.imagePath === 'string' &&
          existsSync(character.imagePath),
      )
    : [];

  if (selectedCharacterId.startsWith('custom-') && !customCharacters.some((character) => character.id === selectedCharacterId)) {
    selectedCharacterId = 'cutout-1';
  }

  return reminderSettings;
};

const saveReminderSettings = (settings: ReminderSettings) => {
  reminderSettings = sanitizeReminderSettings(settings);
  writeStoredSettings();
  resetUsageTracking();
  return reminderSettings;
};

const saveSelectedCharacter = (characterId: string) => {
  if (typeof characterId !== 'string' || characterId.length === 0) {
    return selectedCharacterId;
  }

  selectedCharacterId = characterId;
  writeStoredSettings();
  return selectedCharacterId;
};

const saveCharacterRotationSettings = (settings: CharacterRotationSettings) => {
  characterRotationSettings = sanitizeCharacterRotationSettings(settings);
  writeStoredSettings();
  return characterRotationSettings;
};

const importCustomCharacter = async () => {
  if (!mainWindow) {
    return null;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import transparent character image',
    properties: ['openFile'],
    filters: [
      {
        name: 'Character image assets',
        extensions: ['png', 'webp', 'gif', 'jpg', 'jpeg'],
      },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const sourcePath = result.filePaths[0];
  const extension = extname(sourcePath).toLowerCase();
  const allowedExtensions = new Set(['.png', '.webp', '.gif', '.jpg', '.jpeg']);

  if (!allowedExtensions.has(extension)) {
    return null;
  }

  mkdirSync(getCustomCharactersDir(), { recursive: true });

  const id = `custom-${Date.now()}`;
  const imagePath = join(getCustomCharactersDir(), `${id}${extension}`);
  copyFileSync(sourcePath, imagePath);

  const character: StoredCustomCharacter = {
    id,
    name: basename(sourcePath, extension),
    imagePath,
    defaultScale: 1,
  };

  customCharacters = [...customCharacters, character];
  selectedCharacterId = id;
  writeStoredSettings();
  return toCustomCharacter(character);
};

const removeCustomCharacter = (characterId: string) => {
  const character = customCharacters.find((item) => item.id === characterId);

  if (!character) {
    return getAppSettings();
  }

  customCharacters = customCharacters.filter((item) => item.id !== characterId);
  characterRotationSettings = {
    ...characterRotationSettings,
    rotationCharacterIds: characterRotationSettings.rotationCharacterIds.filter((id) => id !== characterId),
  };
  rmSync(character.imagePath, { force: true });

  if (selectedCharacterId === characterId) {
    selectedCharacterId = 'cutout-1';
  }

  writeStoredSettings();
  return getAppSettings();
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

  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.on('will-resize', (event) => {
    event.preventDefault();
  });
  mainWindow.webContents.once('did-finish-load', () => {
    logMain('renderer:did-finish-load');
    mainWindow?.show();
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
  registerCustomCharacterProtocol();
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

ipcMain.on('window:set-ignore-mouse-events', (_event, ignore: boolean) => {
  mainWindow?.setIgnoreMouseEvents(ignore, { forward: true });
});

ipcMain.on('window:blur', () => {
  mainWindow?.blur();
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

ipcMain.handle('app-settings:get', () => {
  return getAppSettings();
});

ipcMain.handle('character:select', (_event, characterId: string) => {
  return saveSelectedCharacter(characterId);
});

ipcMain.handle('character-rotation:save', (_event, settings: CharacterRotationSettings) => {
  return saveCharacterRotationSettings(settings);
});

ipcMain.handle('character:import', () => {
  return importCustomCharacter();
});

ipcMain.handle('character:remove-custom', (_event, characterId: string) => {
  return removeCustomCharacter(characterId);
});
