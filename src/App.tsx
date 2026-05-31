import { useCallback, useEffect, useMemo, useState } from 'react';
import Pet from './components/Pet';
import SettingsPanel from './components/SettingsPanel';
import { characters } from './data/characters';
import { DEFAULT_REMINDER_SETTINGS, type ReminderSettings } from './shared/reminderSettings';

const isDevelopment = import.meta.env.DEV;

const App = () => {
  const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0].id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [petScale, setPetScale] = useState(1);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId) ?? characters[0],
    [selectedCharacterId],
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
          characters={characters}
          selectedCharacterId={selectedCharacterId}
          petScale={petScale}
          reminderSettings={reminderSettings}
          onCharacterChange={setSelectedCharacterId}
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
