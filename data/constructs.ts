import { ConstructTemplate } from '../types';

export const CONSTRUCTS: Record<string, ConstructTemplate> = {
  'auto_turret': {
    id: 'auto_turret',
    name: '自律炮塔',
    description: '在操控者的回合结束时，随机对一个敌人打出【攻击指令】。',
    behavior: { onTurnEnd: { cardId: 'strike', target: 'random_enemy' } },
    durability: 3,
    statScaling: {
      maxHp: { ownerStat: 'maxHp', multiplier: 0.05 },
      attack: { ownerStat: 'attack', multiplier: 0.2 },
      defense: { ownerStat: 'defense', multiplier: 1.0 },
    }
  },
  'force_field_generator': {
    id: 'force_field_generator',
    name: '力场发生器',
    description: '在操控者的回合结束时，对操控者打出【护盾修复】。',
    behavior: { onTurnEnd: { cardId: 'shield_repair', target: 'owner' } },
    durability: 3,
    statScaling: {
      maxHp: { ownerStat: 'maxHp', multiplier: 0.05 },
      attack: { ownerStat: 'attack', multiplier: 0.2 },
      defense: { ownerStat: 'defense', multiplier: 1.0 },
    }
  },
  'patrol_drone': {
    id: 'patrol_drone',
    name: '巡飞弹',
    description: '不作出行动。耐久度为0时，对操控者指定的敌人造成30伤害。',
    behavior: { onDestroy: { cardId: 'self_destruct_30', target: 'designated_target' } },
    durability: 3,
    statScaling: {
      maxHp: { ownerStat: 'maxHp', multiplier: 0.15 },
      attack: { ownerStat: 'attack', multiplier: 0.3 },
      defense: { ownerStat: 'defense', multiplier: 1.0 },
    }
  },
  'sentry_drone': {
    id: 'sentry_drone',
    name: '哨兵无人机',
    description: '在操控者的回合结束时，对玩家施加1层[弱化]。',
    behavior: { onTurnEnd: { cardId: 'drone_apply_weak', target: 'random_enemy' } },
    durability: 2,
    statScaling: {
      maxHp: { ownerStat: 'maxHp', multiplier: 0.3 },
      attack: { ownerStat: 'attack', multiplier: 0 },
      defense: { ownerStat: 'defense', multiplier: 1.0 },
    }
  }
};