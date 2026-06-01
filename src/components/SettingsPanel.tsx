import type { Character } from '../data/characters';
import type { ReminderSettings } from '../shared/reminderSettings';
import ReminderSettingsControls from './ReminderSettingsControls';

type SettingsPanelProps = {
  characters: Character[];
  selectedCharacterId: string;
  petScale: number;
  reminderSettings: ReminderSettings;
  onCharacterChange: (characterId: string) => void;
  onImportCharacter: () => void;
  onRemoveCustomCharacter: (characterId: string) => void;
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
  onImportCharacter,
  onRemoveCustomCharacter,
  onPetScaleChange,
  onSaveReminderSettings,
  onRestoreReminderDefaults,
  onCloseSettings,
  onTestReminder,
}: SettingsPanelProps) => {
  const selectedCharacter = characters.find((character) => character.id === selectedCharacterId) ?? characters[0];

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
      <div className="character-import">
        <button type="button" onClick={onImportCharacter}>
          Import image
        </button>
        {selectedCharacter?.isCustom ? (
          <button type="button" onClick={() => onRemoveCustomCharacter(selectedCharacter.id)}>
            Remove custom
          </button>
        ) : null}
        <span>PNG / WebP / GIF / JPG</span>
      </div>
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
