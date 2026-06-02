import type { Character } from '../data/characters';
import type { CharacterRotationSettings } from '../shared/appSettings';

type CharacterRotationControlsProps = {
  characters: Character[];
  settings: CharacterRotationSettings;
  onSave: (settings: CharacterRotationSettings) => void;
};

const getEffectiveRotationIds = (characters: Character[], rotationCharacterIds: string[]) => {
  const availableIds = characters.map((character) => character.id);
  const selectedIds = rotationCharacterIds.filter((characterId) => availableIds.includes(characterId));
  return selectedIds.length > 0 ? selectedIds : availableIds;
};

const CharacterRotationControls = ({ characters, settings, onSave }: CharacterRotationControlsProps) => {
  const effectiveRotationIds = getEffectiveRotationIds(characters, settings.rotationCharacterIds);

  const savePatch = (patch: Partial<CharacterRotationSettings>) => {
    onSave({
      ...settings,
      ...patch,
    });
  };

  const toggleRotationCharacter = (characterId: string, checked: boolean) => {
    const baseIds = getEffectiveRotationIds(characters, settings.rotationCharacterIds);
    const nextIds = checked ? [...new Set([...baseIds, characterId])] : baseIds.filter((id) => id !== characterId);

    savePatch({
      rotationCharacterIds: nextIds.length > 0 ? nextIds : baseIds,
    });
  };

  return (
    <section className="character-rotation" aria-label="Character rotation settings">
      <label className="character-rotation__toggle">
        <span>Random rotation</span>
        <input
          type="checkbox"
          checked={settings.rotationEnabled}
          onChange={(event) => savePatch({ rotationEnabled: event.target.checked })}
        />
      </label>

      <label className="character-rotation__interval">
        <span>Every</span>
        <input
          type="number"
          min="5"
          max="240"
          step="5"
          value={settings.rotationIntervalMinutes}
          onChange={(event) => savePatch({ rotationIntervalMinutes: Number(event.target.value) })}
        />
        <span>min</span>
      </label>

      {settings.rotationEnabled ? (
        <div className="character-rotation__pool">
          <span>Rotation pool</span>
          <div>
            {characters.map((character) => (
              <label key={character.id}>
                <input
                  type="checkbox"
                  checked={effectiveRotationIds.includes(character.id)}
                  onChange={(event) => toggleRotationCharacter(character.id, event.target.checked)}
                />
                <span>{character.name}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default CharacterRotationControls;
