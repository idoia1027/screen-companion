export type CustomCharacter = {
  id: string;
  name: string;
  image: string;
  imagePath: string;
  defaultScale?: number;
  isCustom: true;
};

export type AppSettings = {
  selectedCharacterId: string;
  customCharacters: CustomCharacter[];
  characterRotationSettings: CharacterRotationSettings;
};

export type CharacterRotationSettings = {
  rotationEnabled: boolean;
  rotationIntervalMinutes: number;
  rotationCharacterIds: string[];
};

export type StoredCustomCharacter = {
  id: string;
  name: string;
  imagePath: string;
  defaultScale?: number;
};

export type StoredSettings = {
  selectedCharacterId?: string;
  customCharacters?: StoredCustomCharacter[];
  characterRotationSettings?: unknown;
  reminderSettings?: unknown;
};

export const DEFAULT_CHARACTER_ROTATION_SETTINGS: CharacterRotationSettings = {
  rotationEnabled: true,
  rotationIntervalMinutes: 60,
  rotationCharacterIds: [],
};

const MIN_ROTATION_INTERVAL_MINUTES = 5;
const MAX_ROTATION_INTERVAL_MINUTES = 240;

export const sanitizeCharacterRotationSettings = (
  settings: Partial<CharacterRotationSettings> | undefined,
): CharacterRotationSettings => {
  const rotationIntervalMinutes = Number(settings?.rotationIntervalMinutes);

  return {
    rotationEnabled:
      typeof settings?.rotationEnabled === 'boolean'
        ? settings.rotationEnabled
        : DEFAULT_CHARACTER_ROTATION_SETTINGS.rotationEnabled,
    rotationIntervalMinutes: Number.isFinite(rotationIntervalMinutes)
      ? Math.min(MAX_ROTATION_INTERVAL_MINUTES, Math.max(MIN_ROTATION_INTERVAL_MINUTES, Math.round(rotationIntervalMinutes)))
      : DEFAULT_CHARACTER_ROTATION_SETTINGS.rotationIntervalMinutes,
    rotationCharacterIds: Array.isArray(settings?.rotationCharacterIds)
      ? settings.rotationCharacterIds.filter((characterId): characterId is string => typeof characterId === 'string')
      : DEFAULT_CHARACTER_ROTATION_SETTINGS.rotationCharacterIds,
  };
};
