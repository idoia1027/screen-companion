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
  reminderSettings?: unknown;
};
