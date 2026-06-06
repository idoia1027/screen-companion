import baibai from '../assets/characters/baibai.webp';
import maomao from '../assets/characters/maomao.webp';

export type Character = {
  id: string;
  name: string;
  image: string;
  defaultScale?: number;
  reminderLines?: string[];
  isCustom?: boolean;
  imagePath?: string;
};

export const characters: Character[] = [
  {
    id: 'baibai',
    name: '白白',
    image: baibai,
    defaultScale: 1,
    reminderLines: [
      '休息一下，站起来走两步。',
      '已经盯屏幕很久了，喝口水。',
      '先别硬撑，眼睛也要下班。',
    ],
  },
  {
    id: 'maomao',
    name: '毛毛',
    image: maomao,
    defaultScale: 1,
    reminderLines: [
      '休息一下，站起来走两步。',
      '已经盯屏幕很久了，喝口水。',
      '先别硬撑，眼睛也要下班。',
    ],
  },
];
