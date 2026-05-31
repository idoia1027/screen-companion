import { contextBridge, ipcRenderer } from 'electron';

const companionApi = {
  moveWindowBy(delta: { x: number; y: number }) {
    ipcRenderer.send('window:move-by', delta);
  },
  closeApp() {
    ipcRenderer.send('app:close');
  },
};

contextBridge.exposeInMainWorld('companionApi', companionApi);

export type CompanionApi = typeof companionApi;
