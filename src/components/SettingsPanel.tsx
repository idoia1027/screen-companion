import type { Character } from '../data/characters';
import type { ReminderSettings } from '../shared/reminderSettings';
import ReminderSettingsControls from './ReminderSettingsControls';

type SettingsPanelProps = {
  characters: Character[];
  selectedCharacterId: string;
  petScale: number;
  reminderSettings: ReminderSettings;
  onCharacterChange: (characterId: string) => void;
  onPetScaleChange: (scale: number) => void;
  onSaveReminderSettings: (settings: ReminderSettings) => void;
  onRestoreReminderDefaults: () => void;
  onCloseSettings: () => void;
  onTestReminder?: () => void;
};

const SettingsPanel = ({
  characters,
  selectedCharacterId,
  petScale,
  reminderSettings,
  onCharacterChange,
  onPetScaleChange,
  onSaveReminderSettings,
  onRestoreReminderDefaults,
  onCloseSettings,
  onTestReminder,
}: SettingsPanelProps) => {
  return (
    <aside
      className="settings-panel"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="settings-panel__header">
        <span>Settings</span>
        <button type="button" aria-label="Close settings" onClick={onCloseSettings}>
          Close
        </button>
      </div>
      <label className="settings-panel__field">
        <span>Character</span>
        <select value={selectedCharacterId} onChange={(event) => onCharacterChange(event.target.value)}>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </select>
      </label>
      <ReminderSettingsControls
        settings={reminderSettings}
        onSave={onSaveReminderSettings}
        onRestoreDefaults={onRestoreReminderDefaults}
        onTestReminder={onTestReminder}
      />
      <div className="scale-controls">
        <label className="scale-controls__field">
          <span>Size</span>
          <input
            type="range"
            min="0.7"
            max="1.35"
            step="0.05"
            value={petScale}
            onChange={(event) => onPetScaleChange(Number(event.target.value))}
          />
        </label>
        <div className="scale-controls__actions">
          <button type="button" onClick={() => onPetScaleChange(Math.max(0.7, petScale - 0.05))}>
            -
          </button>
          <span>{Math.round(petScale * 100)}%</span>
          <button type="button" onClick={() => onPetScaleChange(Math.min(1.35, petScale + 0.05))}>
            +
          </button>
        </div>
      </div>
      <button className="settings-panel__hide" type="button" onClick={onCloseSettings}>
        Hide settings
      </button>
    </aside>
  );
};

export default SettingsPanel;
