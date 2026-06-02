import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DEFAULT_CHARACTER_ROTATION_SETTINGS, type AppSettings } from './shared/appSettings';
import { DEFAULT_REMINDER_SETTINGS, type ReminderSettings } from './shared/reminderSettings';
import './styles/global.css';

if (import.meta.env.DEV && !window.companionApi) {
  let reminderSettings: ReminderSettings = DEFAULT_REMINDER_SETTINGS;
  let appSettings: AppSettings = {
    selectedCharacterId: 'cutout-1',
    customCharacters: [],
    characterRotationSettings: DEFAULT_CHARACTER_ROTATION_SETTINGS,
  };

  window.companionApi = {
    moveWindowBy() {},
    closeApp() {},
    async getReminderSettings() {
      return reminderSettings;
    },
    async saveReminderSettings(settings) {
      reminderSettings = settings;
      return reminderSettings;
    },
    async getAppSettings() {
      return appSettings;
    },
    async selectCharacter(characterId) {
      appSettings = {
        ...appSettings,
        selectedCharacterId: characterId,
      };
      return characterId;
    },
    async saveCharacterRotationSettings(settings) {
      appSettings = {
        ...appSettings,
        characterRotationSettings: settings,
      };
      return settings;
    },
    async importCustomCharacter() {
      return null;
    },
    async removeCustomCharacter() {
      return appSettings;
    },
    onUsageReminder() {
      return () => {};
    },
  };
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
