import { useCallback, useMemo, useState } from 'react';
import Pet from './components/Pet';
import SettingsPanel from './components/SettingsPanel';
import { characters } from './data/characters';
import { useTimer } from './hooks/useTimer';

const DEFAULT_INTERVAL_MINUTES = 50;

const pickReminderLine = (lines: string[] | undefined) => {
  return lines?.[0] ?? '\u4f11\u606f\u4e00\u4e0b\uff0c\u7ad9\u8d77\u6765\u8d70\u4e24\u6b65\u3002';
};

const App = () => {
  const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0].id);
  const [intervalMinutes, setIntervalMinutes] = useState(DEFAULT_INTERVAL_MINUTES);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [petScale, setPetScale] = useState(1);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId) ?? characters[0],
    [selectedCharacterId],
  );

  const showReminder = useCallback(() => {
    console.log('state:show-reminder');
    setReminderMessage(pickReminderLine(selectedCharacter.reminderLines));
    setAnimationKey((current) => current + 1);
  }, [selectedCharacter.reminderLines]);

  const timer = useTimer({
    defaultDurationSeconds: DEFAULT_INTERVAL_MINUTES * 60,
    onComplete: showReminder,
  });

  const handleIntervalChange = (minutes: number) => {
    if (!Number.isFinite(minutes)) {
      return;
    }

    const nextMinutes = Math.max(1, Math.round(minutes));
    setIntervalMinutes(nextMinutes);
    setReminderMessage(null);
    timer.setDurationMinutes(nextMinutes);
  };

  const handleTestReminder = () => {
    console.log('action:test-reminder');
    setIntervalMinutes(1);
    setReminderMessage(null);
    timer.reset(10);
    timer.start();
  };

  const handleReset = () => {
    setReminderMessage(null);
    timer.reset(Math.round(intervalMinutes * 60));
  };

  return (
    <main className="app-shell">
      {settingsOpen ? (
        <SettingsPanel
          characters={characters}
          selectedCharacterId={selectedCharacterId}
          intervalMinutes={intervalMinutes}
          remainingSeconds={timer.remainingSeconds}
          status={timer.status}
          petScale={petScale}
          onCharacterChange={setSelectedCharacterId}
          onIntervalChange={handleIntervalChange}
          onPetScaleChange={setPetScale}
          onCloseSettings={() => setSettingsOpen(false)}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={handleReset}
          onTestReminder={handleTestReminder}
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
