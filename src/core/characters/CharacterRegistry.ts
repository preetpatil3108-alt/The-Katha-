/**
 * THE KATHA - Character Architecture & Registry
 * Centralized character configurations for traditional Indian festive 3D characters:
 * - Exactly 5 young Indian male festival participants:
 *   1. Ramu: Leader, athletic, friendly, expressive eyes, tousled hair with side-sweep, small forehead bottu.
 *   2. Chintu: Energetic drummer, compact build, textured crop fade, cheerful wide smile, small tilak dot.
 *   3. Bhavani: Clever strategist, lean build, wavy side-part hair, chiseled chin, small vertical tilak stroke.
 *   4. Varun: Calm builder, tall broad-shouldered frame, clean side-comb gentleman's hair, composed face, small sacred tilak.
 *   5. Dinesh: Festive artisan/decorator, medium slender, soft dark curls, warm dimpled smile, small drop tilak.
 *
 * Traditional Outfit for Every Character:
 * - Bottom: Traditional plain white pattu lungi with natural cloth drape pleats.
 * - Top: Plain, solid-colour, half-sleeve shirt (No checks, no patterns, no logos, no jackets, no backpacks).
 * - Footwear: Completely barefoot (no shoes, sandals, slippers, socks, or sneakers).
 * - Forehead: Small, subtle traditional festive tilak/bottu.
 *
 * Level-Specific Shirt Color System:
 * - Level 1 (Siddham): Ramu (Blue), Comp 1 (Pink), Comp 2 (Orange), Comp 3 (Green), Comp 4 (Yellow)
 * - Level 2 (Utsavam): Ramu (Maroon), Comp 1 (Teal), Comp 2 (Purple), Comp 3 (Cream), Comp 4 (Red)
 * - Level 3 (Nimajjanam): Ramu (Saffron), Comp 1 (Navy Blue), Comp 2 (Turquoise), Comp 3 (Olive), Comp 4 (Coral)
 * Within each level, no two characters wear the same shirt color, and everyone changes colors between levels.
 */

import { CharacterConfig, CharacterId, LevelId } from '../../types/game';

export interface ShirtColorConfig {
  name: string;
  hex: string;
}

export const LEVEL_SHIRT_PALETTES: Record<LevelId, Record<CharacterId, ShirtColorConfig>> = {
  [LevelId.LEVEL_1]: {
    [CharacterId.RAMU]: { name: 'Blue', hex: '#2563eb' },
    [CharacterId.COMPANION_1]: { name: 'Pink', hex: '#ec4899' },
    [CharacterId.COMPANION_2]: { name: 'Orange', hex: '#ea580c' },
    [CharacterId.COMPANION_3]: { name: 'Green', hex: '#16a34a' },
    [CharacterId.COMPANION_4]: { name: 'Yellow', hex: '#eab308' },
    [CharacterId.MUSHAK]: { name: 'Divine Red', hex: '#dc2626' },
  },
  [LevelId.LEVEL_2]: {
    [CharacterId.RAMU]: { name: 'Maroon', hex: '#881337' },
    [CharacterId.COMPANION_1]: { name: 'Teal', hex: '#0d9488' },
    [CharacterId.COMPANION_2]: { name: 'Purple', hex: '#7e22ce' },
    [CharacterId.COMPANION_3]: { name: 'Cream', hex: '#fef3c7' },
    [CharacterId.COMPANION_4]: { name: 'Red', hex: '#dc2626' },
    [CharacterId.MUSHAK]: { name: 'Divine Gold', hex: '#d97706' },
  },
  [LevelId.LEVEL_3]: {
    [CharacterId.RAMU]: { name: 'Saffron', hex: '#f59e0b' },
    [CharacterId.COMPANION_1]: { name: 'Navy Blue', hex: '#1e3a8a' },
    [CharacterId.COMPANION_2]: { name: 'Turquoise', hex: '#06b6d4' },
    [CharacterId.COMPANION_3]: { name: 'Olive', hex: '#65a30d' },
    [CharacterId.COMPANION_4]: { name: 'Coral', hex: '#f43f5e' },
    [CharacterId.MUSHAK]: { name: 'Divine Blue', hex: '#0284c7' },
  },
};

export const CHARACTER_CONFIGS: Record<CharacterId, CharacterConfig> = {
  [CharacterId.RAMU]: {
    id: CharacterId.RAMU,
    name: 'Ramu',
    role: 'PLAYER',
    title: 'Village Youth Leader',
    description: '19-year-old student from Rangastalam leading the festival preparations. Kind, curious, energetic, slightly goofy, with an adventurous spirit. Wears traditional white pattu lungi, barefoot, and small forehead bottu.',
    speed: 7.2,
    rotationSpeed: 12.0,
    scale: 1.0,
    colors: {
      primary: '#2563eb', // Blue solid half-sleeve shirt (Level 1)
      secondary: '#ffffff', // Traditional plain white pattu lungi
      accent: '#f59e0b', // Subtle golden border accent
      skin: '#cb8756', // Warm South-Asian golden-brown skin tone
      clothing: '#2563eb',
    },
    dialogueColor: '#2563eb',
  },
  [CharacterId.COMPANION_1]: {
    id: CharacterId.COMPANION_1,
    name: 'Chintu',
    role: 'NPC_COMPANION',
    title: 'The Energetic Drummer',
    description: '18-year-old high-energy companion who brings rhythm and dhol beats. Shorter compact build, textured crop hair, barefoot with white pattu lungi.',
    speed: 5.5,
    rotationSpeed: 8.0,
    scale: 0.94,
    colors: {
      primary: '#ec4899', // Pink solid half-sleeve shirt (Level 1)
      secondary: '#ffffff', // Traditional plain white pattu lungi
      accent: '#db2777',
      skin: '#b87333', // Dusky copper skin tone
      clothing: '#ec4899',
    },
    dialogueColor: '#ec4899',
  },
  [CharacterId.COMPANION_2]: {
    id: CharacterId.COMPANION_2,
    name: 'Bhavani',
    role: 'NPC_COMPANION',
    title: 'The Playful Strategist',
    description: '19-year-old playful youth with stylish wavy hair, sharp chiseled jaw, agile build, barefoot with white pattu lungi.',
    speed: 5.8,
    rotationSpeed: 8.0,
    scale: 0.98,
    colors: {
      primary: '#ea580c', // Orange solid half-sleeve shirt (Level 1)
      secondary: '#ffffff', // Traditional plain white pattu lungi
      accent: '#c2410c',
      skin: '#d89c68', // Golden wheatish Indian skin tone
      clothing: '#ea580c',
    },
    dialogueColor: '#ea580c',
  },
  [CharacterId.COMPANION_3]: {
    id: CharacterId.COMPANION_3,
    name: 'Varun',
    role: 'NPC_COMPANION',
    title: 'The Calm Builder',
    description: '20-year-old thoughtful and strong companion. Taller athletic frame, clean side-comb hair, square jaw, barefoot with white pattu lungi.',
    speed: 5.0,
    rotationSpeed: 7.0,
    scale: 1.05,
    colors: {
      primary: '#16a34a', // Green solid half-sleeve shirt (Level 1)
      secondary: '#ffffff', // Traditional plain white pattu lungi
      accent: '#15803d',
      skin: '#9e5e32', // Deep bronze South Asian tone
      clothing: '#16a34a',
    },
    dialogueColor: '#16a34a',
  },
  [CharacterId.COMPANION_4]: {
    id: CharacterId.COMPANION_4,
    name: 'Dinesh',
    role: 'NPC_COMPANION',
    title: 'The Festive Artisan',
    description: '19-year-old cheerful young festival artisan with soft dark curls, gentle oval face, warm dimpled smile, barefoot with white pattu lungi.',
    speed: 5.6,
    rotationSpeed: 8.0,
    scale: 0.96,
    colors: {
      primary: '#eab308', // Yellow solid half-sleeve shirt (Level 1)
      secondary: '#ffffff', // Traditional plain white pattu lungi
      accent: '#ca8a04',
      skin: '#be7c47', // Warm caramel bronze skin tone
      clothing: '#eab308',
    },
    dialogueColor: '#ca8a04',
  },
  [CharacterId.MUSHAK]: {
    id: CharacterId.MUSHAK,
    name: 'Mushak',
    role: 'NPC_GUIDE',
    title: 'Divine Companion & Guide',
    description: 'Lord Ganesha’s wise, agile, and sacred grey cartoon mouse vehicle. Appears with hints, gentle squeaks, and blessings.',
    speed: 7.5,
    rotationSpeed: 12.0,
    scale: 0.45,
    colors: {
      primary: '#78716c', // Friendly warm cartoon grey coat
      secondary: '#f5f5f4', // Soft cream chest & inner ears
      accent: '#dc2626', // Sacred red ribbon/bell collar
      skin: '#fbcfe8', // Soft pink snout and paws
      clothing: '#dc2626',
    },
    dialogueColor: '#78716c',
  },
};

export class CharacterRegistry {
  public static getCharacter(id: CharacterId): CharacterConfig {
    return CHARACTER_CONFIGS[id] || CHARACTER_CONFIGS[CharacterId.RAMU];
  }

  public static getAllCharacters(): CharacterConfig[] {
    return Object.values(CHARACTER_CONFIGS);
  }

  public static getCompanions(): CharacterConfig[] {
    return [
      CHARACTER_CONFIGS[CharacterId.COMPANION_1],
      CHARACTER_CONFIGS[CharacterId.COMPANION_2],
      CHARACTER_CONFIGS[CharacterId.COMPANION_3],
      CHARACTER_CONFIGS[CharacterId.COMPANION_4],
    ];
  }

  public static getGuide(): CharacterConfig {
    return CHARACTER_CONFIGS[CharacterId.MUSHAK];
  }

  public static getShirtColor(characterId: CharacterId, levelId: LevelId): ShirtColorConfig {
    const levelPalettes = LEVEL_SHIRT_PALETTES[levelId] || LEVEL_SHIRT_PALETTES[LevelId.LEVEL_1];
    return levelPalettes[characterId] || { name: 'Festive', hex: '#2563eb' };
  }

  public static getShirtHex(characterId: CharacterId, levelId: LevelId): string {
    return CharacterRegistry.getShirtColor(characterId, levelId).hex;
  }
}

