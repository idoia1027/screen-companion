import { contextBridge, ipcRenderer } from 'electron';
import type { ReminderSettings } from '../src/shared/reminderSettings';

type UsageReminderPayload = {
  message: string;
  activeUsageSeconds: number;
};

const companionApi = {
  moveWindowBy(delta: { x: number; y: number }) {
    ipcRenderer.send('window:move-by', delta);
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
