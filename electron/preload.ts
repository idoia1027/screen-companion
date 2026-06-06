import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, CharacterRotationSettings, CustomCharacter } from '../src/shared/appSettings';
import type { ReminderSettings } from '../src/shared/reminderSettings';

type UsageReminderPayload = {
  message: string;
  activeUsageSeconds: number;
};

const companionApi = {
  moveWindowBy(delta: { x: number; y: number }) {
    ipcRenderer.send('window:move-by', delta);
  },
  setIgnoreMouseEvents(ignore: boolean) {
    ipcRenderer.send('window:set-ignore-mouse-events', ignore);
  },
  blurWindow() {
    ipcRenderer.send('window:blur');
  },
  closeApp() {
    ipcRenderer.send('app:close');
  },
  getReminderSettings() {
    return ipcRenderer.invoke('reminder-settings:get') as Promise<ReminderSettings>;
  },
  saveReminderSettings(settings: ReminderSettings) {
    return ipcRenderer.invoke('reminder-settings:save', settings) as Promise<ReminderSettings>;
  },
  getAppSettings() {
    return ipcRenderer.invoke('app-settings:get') as Promise<AppSettings>;
  },
  selectCharacter(characterId: string) {
    return ipcRenderer.invoke('character:select', characterId) as Promise<string>;
  },
  saveCharacterRotationSettings(settings: CharacterRotationSettings) {
    return ipcRenderer.invoke('character-rotation:save', settings) as Promise<CharacterRotationSettings>;
  },
  importCustomCharacter() {
    return ipcRenderer.invoke('character:import') as Promise<CustomCharacter | null>;
  },
  removeCustomCharacter(characterId: string) {
    return ipcRenderer.invoke('character:remove-custom', characterId) as Promise<AppSettings>;
  },
  onUsageReminder(callback: (payload: UsageReminderPayload) => void) {
    const listener = (_event: Electron.IpcRendererEvent, payload: UsageReminderPayload) => {
      callback(payload);
    };

    ipcRenderer.on('reminder:show', listener);

    return () => {
      ipcRenderer.removeListener('reminder:show', listener);
    };
  },
};

contextBridge.exposeInMainWorld('companionApi', companionApi);

export type CompanionApi = typeof companionApi;
