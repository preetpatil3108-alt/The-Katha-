/**
 * THE KATHA - Level Registry System
 * Exclusively defines the 3 core stages of the sacred journey:
 * 🌿 LEVEL 1 — SIDDHAM (The Preparation)
 * 🪔 LEVEL 2 — UTSAVAM (The Festival)
 * 🌊 LEVEL 3 — NIMAJJANAM (The Immersion)
 */

import { LevelConfig, LevelId } from '../../types/game';

export interface ILevelModule {
  config: LevelConfig;
  init?: (scene: unknown) => void;
  update?: (delta: number) => void;
  cleanup?: () => void;
}

export const ALL_LEVEL_CONFIGS: Record<LevelId, LevelConfig> = {
  [LevelId.LEVEL_1]: {
    id: LevelId.LEVEL_1,
    index: 1,
    title: 'SIDDHAM',
    subtitle: 'The Sacred Preparation • Clay, Pathrika & Altar',
    location: 'Riverbank & Sacred Forest Grove',
    description: 'Procure sacred riverbed clay, gather the 21 auspicious leaves (Pathrika), and craft the eco-friendly Ganesha idol alongside village companions.',
    objectiveBrief: 'Gather pure clay and sacred leaves to prepare Lord Ganesha’s altar.',
    requiredLaddus: 0,
    isRegistered: true,
    isUnlocked: true,
    isCompleted: false,
    bestScore: 0,
  },
  [LevelId.LEVEL_2]: {
    id: LevelId.LEVEL_2,
    index: 2,
    title: 'UTSAVAM',
    subtitle: 'The Grand Festive Celebration • Pandal & Aarti',
    location: 'Central Youth Association Pandal',
    description: 'Celebrate with divine aarti, resonant dhol-tasha rhythms, steamed modak offerings, and joyous community devotion.',
    objectiveBrief: 'Lead the evening aarti, arrange diyas, and offer sweet modaks.',
    requiredLaddus: 16,
    isRegistered: true,
    isUnlocked: false,
    isCompleted: false,
    bestScore: 0,
  },
  [LevelId.LEVEL_3]: {
    id: LevelId.LEVEL_3,
    index: 3,
    title: 'NIMAJJANAM',
    subtitle: 'The Sacred Immersion • Escorting Ayyagaru Home',
    location: 'Rangasthalam Mandapam to Grand Avenue',
    description: 'The divine Nimajjanam prayers are complete. Drive along Highway NH-65 to escort Ayyagaru safely back to his home in the city.',
    objectiveBrief: 'Escort Ayyagaru safely from the Ganesh Mandapam to his home on Grand Avenue.',
    requiredLaddus: 20,
    isRegistered: true,
    isUnlocked: false,
    isCompleted: false,
    bestScore: 0,
  },
};

export class LevelRegistry {
  private static registeredModules: Map<LevelId, ILevelModule> = new Map();

  public static getLevel(id: LevelId): LevelConfig {
    return ALL_LEVEL_CONFIGS[id] || ALL_LEVEL_CONFIGS[LevelId.LEVEL_1];
  }

  public static getAllLevels(): LevelConfig[] {
    return [
      ALL_LEVEL_CONFIGS[LevelId.LEVEL_1],
      ALL_LEVEL_CONFIGS[LevelId.LEVEL_2],
      ALL_LEVEL_CONFIGS[LevelId.LEVEL_3],
    ];
  }

  public static registerLevelModule(id: LevelId, module: ILevelModule): void {
    this.registeredModules.set(id, module);
    if (ALL_LEVEL_CONFIGS[id]) {
      ALL_LEVEL_CONFIGS[id].isRegistered = true;
    }
  }

  public static getLevelModule(id: LevelId): ILevelModule | undefined {
    return this.registeredModules.get(id);
  }

  public static isLevelUnlocked(id: LevelId, unlockedLevels: LevelId[]): boolean {
    return unlockedLevels.includes(id);
  }

  public static getNextLevel(currentId: LevelId): LevelId | null {
    if (currentId === LevelId.LEVEL_1) return LevelId.LEVEL_2;
    if (currentId === LevelId.LEVEL_2) return LevelId.LEVEL_3;
    return null;
  }
}
