import cutoutOne from '../assets/characters/screen-companion-cutout-1.png';
import cutoutTwo from '../assets/characters/screen-companion-cutout-2.png';

export type Character = {
  id: string;
  name: string;
  image: string;
  defaultScale?: number;
  reminderLines?: string[];
};

export const characters: Character[] = [
  {
    id: 'cutout-1',
    name: 'Cutout 1',
    image: cutoutOne,
    defaultScale: 1,
    reminderLines: [
      '\u4f11\u606f\u4e00\u4e0b\uff0c\u7ad9\u8d77\u6765\u8d70\u4e24\u6b65\u3002',
      '\u5df2\u7ecf\u76ef\u5c4f\u5e55\u5f88\u4e45\u4e86\uff0c\u559d\u53e3\u6c34\u3002',
      '\u5148\u522b\u786c\u6491\uff0c\u773c\u775b\u4e5f\u8981\u4e0b\u73ed\u3002',
    ],
  },
  {
    id: 'cutout-2',
    name: 'Cutout 2',
    image: cutoutTwo,
    defaultScale: 1,
    reminderLines: [
      '\u4f11\u606f\u4e00\u4e0b\uff0c\u7ad9\u8d77\u6765\u8d70\u4e24\u6b65\u3002',
      '\u5df2\u7ecf\u76ef\u5c4f\u5e55\u5f88\u4e45\u4e86\uff0c\u559d\u53e3\u6c34\u3002',
      '\u5148\u522b\u786c\u6491\uff0c\u773c\u775b\u4e5f\u8981\u4e0b\u73ed\u3002',
    ],
  },
];
