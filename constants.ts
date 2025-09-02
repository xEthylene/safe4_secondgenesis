import { PlayerState, CardRarity } from './types';

export * from './data/cards';
export * from './data/enemies';
export * from './data/equipment';
// FIX: Export MISSIONS and CHARACTER_PORTRAITS from constants to centralize data imports.
export * from './data/missions';
export * from './data/keywords';


export const SYNC_COSTS = {
  weapon: 50,
  equipment: 50,
  card: 50,
};

export const AGGRO_SETTINGS = {
  PLAYER_WEIGHT: 100, // 玩家的基础受击权重
  CONSTRUCT_WEIGHT: 20, // 每个构装体的受击权重
};

export const EQUIPMENT_RARITY_CONFIG = {
  [CardRarity.EPIC]: {
    baseChance: 0.1, // 10% base chance
    stageModifier: 0.05, // +5% chance per stage after the first
  },
  [CardRarity.RARE]: {
    baseChance: 0.40, // 40% base chance
    stageModifier: 0.1, // +10% chance per stage after the first
  },
};

export const WEAPON_ATTACK_BY_CHAPTER: Record<number, [number, number]> = {
    1: [8, 12],   // Common: 8, Rare: 10, Epic: 12
    2: [10, 16],  // Common: 10, Rare: 13, Epic: 16
    3: [13, 21],  // Common: 13, Rare: 17, Epic: 21
    4: [17, 27],  // Common: 17, Rare: 22, Epic: 27
};

export const EQUIPMENT_STATS_BY_CHAPTER: Record<number, { maxHp: [number, number], blockPower: [number, number] }> = {
    1: { maxHp: [15, 25], blockPower: [3, 6] },
    2: { maxHp: [22, 35], blockPower: [6, 9] },
    3: { maxHp: [30, 50], blockPower: [9, 12] },
    4: { maxHp: [45, 70], blockPower: [12, 15] },
};

export const EXPECTED_PLAYER_STATS_BY_CHAPTER: Record<number, { attack: number, maxHp: number, defense: number }> = {
    1: { attack: 20, maxHp: 120, defense: 6 },
    2: { attack: 23, maxHp: 128, defense: 7 },
    3: { attack: 27, maxHp: 140, defense: 8 },
    4: { attack: 32, maxHp: 157, defense: 10 },
};

export const COMBAT_SETTINGS = {
  INITIAL_DRAW_FIRST_COMBAT_FIRST_MISSION: 5,
  INITIAL_DRAW_SUBSEQUENT_COMBAT: 4,
  DRAW_PER_TURN: 2,
};

export const DECK_SIZE = 15;

export const PLAYER_INITIAL_STATS: Omit<PlayerState, 'dreamSediment' | 'completedMissions'> = {
  hp: 100,
  maxHp: 100,
  cp: 10,
  maxCp: 10,
  cpRecovery: 1,
  attack: 10,
  defense: 5,
  blockPower: 20,
  activeProxy: 'Qu-alpha',
  statusEffects: [],
  cardCollection: ['strike', 'strike', 'defend', 'defend', 'charge_up', 'quick_slash', 'preemptive_guard', 'overclock_strike', 'release_power', 'hemorrhage', 'firewall', 'deploy_turret', 'deploy_turret', 'deploy_turret'],
  decks: {
    '1': ['strike', 'strike', 'defend', 'defend', 'charge_up', 'quick_slash', 'preemptive_guard', 'overclock_strike', 'release_power', 'hemorrhage', 'firewall', 'deploy_turret', 'deploy_turret', 'deploy_turret'],
    '2': [],
    '3': [],
  },
  activeDeckId: '1',
  equipment: {
    weapon: 'basic_blade',
    equipment: 'starter_shield_generator',
  },
  inventory: [],
  charge: 0,
  counterAttack: null,
  tideCounter: 0,
};