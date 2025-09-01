
import { PlayerState, CardRarity } from './types';

export * from './data/cards';
export * from './data/enemies';
export * from './data/equipment';
// FIX: Export MISSIONS and CHARACTER_PORTRAITS from constants to centralize data imports.
export * from './data/missions';


export const SYNC_COSTS = {
  weapon: 50,
  equipment: 50,
  card: 100,
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
    equipment: 'starter_reactor',
  },
  inventory: ['starter_capacitor'],
  charge: 0,
  counterAttack: null,
  tideCounter: 0,
};