import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Pet from './components/Pet';
import SettingsPanel from './components/SettingsPanel';
import { characters, type Character } from './data/characters';
import {
  DEFAULT_CHARACTER_ROTATION_SETTINGS,
  type CharacterRotationSettings,
  type CustomCharacter,
} from './shared/appSettings';
import { DEFAULT_REMINDER_SETTINGS, type ReminderSettings } from './shared/reminderSettings';

const isDevelopment = import.meta.env.DEV;

const App = () => {
  const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0].id);
  const [customCharacters, setCustomCharacters] = useState<CustomCharacter[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [petScale, setPetScale] = useState(1);
  const hoverCountRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleInteractiveEnter = useCallback(() => {
    hoverCountRef.current += 1;
    window.companionApi.setIgnoreMouseEvents(false);
  }, []);

  const handleInteractiveLeave = useCallback(() => {
    hoverCountRef.current = Math.max(0, hoverCountRef.current - 1);
    if (hoverCountRef.current === 0 && !isDraggingRef.current) {
      setTimeout(() => {
        if (hoverCountRef.current === 0 && !isDraggingRef.current) {
          window.companionApi.setIgnoreMouseEvents(true);
          window.companionApi.blurWindow();
        }
      }, 0);
    }
  }, []);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    if (hoverCountRef.current === 0) {
      window.companionApi.setIgnoreMouseEvents(true);
      window.blur();
    }
  }, []);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [characterRotationSettings, setCharacterRotationSettings] = useState<CharacterRotationSettings>(
    DEFAULT_CHARACTER_ROTATION_SETTINGS,
  );
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [isCharacterSwitching, setIsCharacterSwitching] = useState(false);
  const characterSwitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allCharacters = useMemo<Character[]>(() => [...characters, ...customCharacters], [customCharacters]);

  const selectedCharacter = useMemo(
    () => allCharacters.find((character) => character.id === selectedCharacterId) ?? allCharacters[0] ?? characters[0],
    [allCharacters, selectedCharacterId],
  );

  const rotationCandidateIds = useMemo(() => {
    const availableIds = allCharacters.map((character) => character.id);
    const savedIds = characterRotationSettings.rotationCharacterIds.filter((characterId) =>
      availableIds.includes(characterId),
    );

    return savedIds.length > 0 ? savedIds : availableIds;
  }, [allCharacters, characterRotationSettings.rotationCharacterIds]);

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
        setCharacterRotationSettings(settings.characterRotationSettings);
      }
    });

    const unsubscribe = window.companionApi.onUsageReminder(({ message }) => {
      showReminder(message);
    });

    return () => {
      isMounted = false;
      if (characterSwitchTimeoutRef.current) {
        clearTimeout(characterSwitchTimeoutRef.current);
      }
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

  const switchCharacter = useCallback((characterId: string, animate = true) => {
    setSelectedCharacterId((currentCharacterId) => {
      if (currentCharacterId === characterId) {
        return currentCharacterId;
      }

      if (animate) {
        setIsCharacterSwitching(true);

        if (characterSwitchTimeoutRef.current) {
          clearTimeout(characterSwitchTimeoutRef.current);
        }

        characterSwitchTimeoutRef.current = setTimeout(() => {
          setIsCharacterSwitching(false);
          characterSwitchTimeoutRef.current = null;
        }, 460);
      }

      void window.companionApi.selectCharacter(characterId);
      return characterId;
    });
  }, []);

  const saveCharacterRotationSettings = useCallback(async (settings: CharacterRotationSettings) => {
    const savedSettings = await window.companionApi.saveCharacterRotationSettings(settings);
    setCharacterRotationSettings(savedSettings);
  }, []);

  const handleCharacterChange = useCallback(
    (characterId: string) => {
      switchCharacter(characterId);
    },
    [switchCharacter],
  );

  const handleImportCharacter = useCallback(async () => {
    const importedCharacter = await window.companionApi.importCustomCharacter();

    if (!importedCharacter) {
      return;
    }

    setCustomCharacters((current) => [...current, importedCharacter]);
    switchCharacter(importedCharacter.id);
    void saveCharacterRotationSettings({
      ...characterRotationSettings,
      rotationCharacterIds: [...new Set([...rotationCandidateIds, importedCharacter.id])],
    });
  }, [characterRotationSettings, rotationCandidateIds, saveCharacterRotationSettings, switchCharacter]);

  const handleRemoveCustomCharacter = useCallback(async (characterId: string) => {
    const settings = await window.companionApi.removeCustomCharacter(characterId);
    setCustomCharacters(settings.customCharacters);
    switchCharacter(settings.selectedCharacterId);
    setCharacterRotationSettings(settings.characterRotationSettings);
  }, [switchCharacter]);

  useEffect(() => {
    if (!characterRotationSettings.rotationEnabled || rotationCandidateIds.length <= 1) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      const nextCandidates = rotationCandidateIds.filter((characterId) => characterId !== selectedCharacterId);
      const candidates = nextCandidates.length > 0 ? nextCandidates : rotationCandidateIds;
      const nextCharacterId = candidates[Math.floor(Math.random() * candidates.length)];

      if (nextCharacterId) {
        switchCharacter(nextCharacterId);
      }
    }, characterRotationSettings.rotationIntervalMinutes * 60_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    characterRotationSettings.rotationEnabled,
    characterRotationSettings.rotationIntervalMinutes,
    rotationCandidateIds,
    selectedCharacterId,
    switchCharacter,
  ]);

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
          characterRotationSettings={characterRotationSettings}
          onCharacterChange={handleCharacterChange}
          onSaveCharacterRotationSettings={(settings) => {
            void saveCharacterRotationSettings(settings);
          }}
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
          onCloseSettings={() => {
            setSettingsOpen(false);
            hoverCountRef.current = 0;
            window.companionApi.setIgnoreMouseEvents(true);
            window.companionApi.blurWindow();
          }}
          onTestReminder={isDevelopment ? handleTestReminder : undefined}
          onMouseEnter={handleInteractiveEnter}
          onMouseLeave={handleInteractiveLeave}
        />
      ) : null}
      <Pet
        key={`${selectedCharacter.id}-${animationKey}`}
        character={selectedCharacter}
        scale={petScale}
        reminderMessage={reminderMessage}
        isReminding={Boolean(reminderMessage)}
        isSwitching={isCharacterSwitching}
        onInteractiveEnter={handleInteractiveEnter}
        onInteractiveLeave={handleInteractiveLeave}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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
