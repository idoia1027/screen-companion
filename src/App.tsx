import { useCallback, useEffect, useMemo, useState } from 'react';
import Pet from './components/Pet';
import SettingsPanel from './components/SettingsPanel';
import { characters, type Character } from './data/characters';
import type { CustomCharacter } from './shared/appSettings';
import { DEFAULT_REMINDER_SETTINGS, type ReminderSettings } from './shared/reminderSettings';

const isDevelopment = import.meta.env.DEV;

const App = () => {
  const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0].id);
  const [customCharacters, setCustomCharacters] = useState<CustomCharacter[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [petScale, setPetScale] = useState(1);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const allCharacters = useMemo<Character[]>(() => [...characters, ...customCharacters], [customCharacters]);

  const selectedCharacter = useMemo(
    () => allCharacters.find((character) => character.id === selectedCharacterId) ?? allCharacters[0] ?? characters[0],
    [allCharacters, selectedCharacterId],
  );

  const showReminder = useCallback((message: string) => {
    console.log('state:show-reminder');
    setReminderMessage(message);
    setAnimationKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    window.companionApi.getReminderSettings().then((settings) => {
      if (isMounted) {
        setReminderSettings(settings);
      }
    });

    window.companionApi.getAppSettings().then((settings) => {
      if (isMounted) {
        setCustomCharacters(settings.customCharacters);
        setSelectedCharacterId(settings.selectedCharacterId);
      }
    });

    const unsubscribe = window.companionApi.onUsageReminder(({ message }) => {
      showReminder(message);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [showReminder]);

  const saveReminderSettings = useCallback(async (settings: ReminderSettings) => {
    const savedSettings = await window.companionApi.saveReminderSettings(settings);
    setReminderSettings(savedSettings);

    if (!savedSettings.reminderEnabled) {
      setReminderMessage(null);
    }
  }, []);

  const restoreReminderDefaults = useCallback(() => {
    void saveReminderSettings(DEFAULT_REMINDER_SETTINGS);
  }, [saveReminderSettings]);

  const handleCharacterChange = useCallback((characterId: string) => {
    setSelectedCharacterId(characterId);
    void window.companionApi.selectCharacter(characterId);
  }, []);

  const handleImportCharacter = useCallback(async () => {
    const importedCharacter = await window.companionApi.importCustomCharacter();

    if (!importedCharacter) {
      return;
    }

    setCustomCharacters((current) => [...current, importedCharacter]);
    setSelectedCharacterId(importedCharacter.id);
  }, []);

  const handleRemoveCustomCharacter = useCallback(async (characterId: string) => {
    const settings = await window.companionApi.removeCustomCharacter(characterId);
    setCustomCharacters(settings.customCharacters);
    setSelectedCharacterId(settings.selectedCharacterId);
  }, []);

  const handleTestReminder = () => {
    console.log('action:test-reminder');
    if (reminderSettings.reminderEnabled) {
      showReminder(reminderSettings.reminderMessage);
    }
  };

  return (
    <main className="app-shell">
      {settingsOpen ? (
        <SettingsPanel
          characters={allCharacters}
          selectedCharacterId={selectedCharacterId}
          petScale={petScale}
          reminderSettings={reminderSettings}
          onCharacterChange={handleCharacterChange}
          onImportCharacter={() => {
            void handleImportCharacter();
          }}
          onRemoveCustomCharacter={(characterId) => {
            void handleRemoveCustomCharacter(characterId);
          }}
          onPetScaleChange={setPetScale}
          onSaveReminderSettings={(settings) => {
            void saveReminderSettings(settings);
          }}
          onRestoreReminderDefaults={restoreReminderDefaults}
          onCloseSettings={() => setSettingsOpen(false)}
          onTestReminder={isDevelopment ? handleTestReminder : undefined}
        />
      ) : null}
      <Pet
        key={`${selectedCharacter.id}-${animationKey}`}
        character={selectedCharacter}
        scale={petScale}
        reminderMessage={reminderMessage}
        isReminding={Boolean(reminderMessage)}
        onDismissReminder={() => {
          console.log('action:dismiss-reminder');
          setReminderMessage(null);
        }}
        onOpenSettings={() => {
          console.log('action:toggle-settings');
          setSettingsOpen((open) => !open);
        }}
        onCloseApp={window.companionApi.closeApp}
      />
    </main>
  );
};

export default App;
