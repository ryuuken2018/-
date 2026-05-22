export type PetType = 'cat' | 'dog' | 'rabbit' | 'hamster' | 'bird' | 'turtle';
export type CostumeId = 'none' | 'costume1' | 'costume2';
export type EvolutionStage = 'base' | 'evo1' | 'evo2';

export interface Pet {
  id: string;
  studentName: string;   // 同学姓名
  petName: string;       // 宠物昵称
  petType: PetType;
  level: number;
  xp: number;
  xpToNext: number;
  mood: number;          // 心情 0-100
  hunger: number;        // 饥饿 0-100（100 = 饱）
  energy: number;        // 体力 0-100
  activeCostume?: CostumeId;
}

export const XP_PER_LEVEL = 100;

export const PET_CLASSES: Record<PetType, { name: string; icon: string }> = {
  cat: { name: '小猫咪', icon: '🐱' },
  dog: { name: '小狗狗', icon: '🐶' },
  rabbit: { name: '小兔兔', icon: '🐰' },
  hamster: { name: '小仓鼠', icon: '🐹' },
  bird: { name: '小鸟儿', icon: '🐦' },
  turtle: { name: '小乌龟', icon: '🐢' }
};

// Evolution names mapping
export const EVOLUTION_NAMES: Record<PetType, Record<EvolutionStage, string>> = {
  cat: {
    base: '小猫咪',
    evo1: '天使猫 ⚡',
    evo2: '仙灵猫 🌟'
  },
  dog: {
    base: '小狗狗',
    evo1: '超能犬 ⚡',
    evo2: '黄金战犬 🌟'
  },
  rabbit: {
    base: '小兔兔',
    evo1: '魔法兔 ⚡',
    evo2: '月光守护兔 🌟'
  },
  hamster: {
    base: '小仓鼠',
    evo1: '探险鼠 ⚡',
    evo2: '太空仓鼠 🌟'
  },
  bird: {
    base: '小鸟儿',
    evo1: '火焰鸟 ⚡',
    evo2: '雷霆神鸟 🌟'
  },
  turtle: {
    base: '小乌龟',
    evo1: '龙翼龟 ⚡',
    evo2: '黄金龙龟 🌟'
  }
};

export function getEvolutionStage(level: number): EvolutionStage {
  if (level >= 15) return 'evo2';
  if (level >= 8) return 'evo1';
  return 'base';
}

export function getPetDisplayName(type: PetType, level: number): string {
  const stage = getEvolutionStage(level);
  return EVOLUTION_NAMES[type][stage];
}
