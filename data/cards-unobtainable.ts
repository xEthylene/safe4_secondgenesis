import { Card, CardRarity } from '../types';

export const UNOBTAINABLE_CARDS: Record<string, Card> = {
  'counter_strike': {
    id: 'counter_strike', name: '回击', description: '当被攻击时，对攻击者造成75%攻击力的伤害。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 0.75, target: 'enemy' }, keywords: ['反击'], unobtainable: true,
  },
  'blazing_nova': {
    id: 'blazing_nova', name: '爆炎新星', description: '对所有敌人施加5层[烧伤]。', cost: 2, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'all_enemies', statusEffect: 'burn', statusEffectValue: 5 }, keywords: ['烧伤', '衍生'], unobtainable: true,
  },
  'feverish_strike': {
    id: 'feverish_strike', name: '狂热突袭', description: '对一名敌人造成100%攻击力的伤害，抽1张卡。这张卡被弃置时，抽一张卡。回合结束时，随机丢弃2张卡。消耗。', cost: 1, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.0, drawCards: 1, onDiscard: { target: 'self', drawCards: 1 } }, keywords: ['弃牌', '衍生', '消耗'], unobtainable: true,
  },
  'magitech_blade_arts_2': {
    id: 'magitech_blade_arts_2', name: '魔导剑术 - 破', description: '造成100%攻击力伤害并且恢复1cp，并向牌库加入【魔导剑术 - 终】。消耗。', cost: 1, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.0, gainCp: 1, exhausts: true, addCardToDeck: ['magitech_blade_arts_3'] }, keywords: ['衍生', '消耗'], unobtainable: true,
  },
  'magitech_blade_arts_3': {
    id: 'magitech_blade_arts_3', name: '魔导剑术 - 终', description: '造成100%攻击力伤害并且恢复1cp.', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.0, gainCp: 1 }, keywords: ['衍生'], unobtainable: true,
  },
  'scrap_assembly_2': {
    id: 'scrap_assembly_2', name: '废品组装-破', description: '丢弃一张手牌，恢复1cp，并将【废品组装 - 终】加入牌库。消耗。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', discardCards: { count: 1, from: 'hand' }, gainCp: 1, exhausts: true, addCardToDeck: ['scrap_assembly_3'] }, keywords: ['弃牌', '衍生', '消耗'], unobtainable: true,
  },
  'scrap_assembly_3': {
    id: 'scrap_assembly_3', name: '废品组装-终', description: '恢复1cp，并将【废品龙装加农炮】加入牌库。消耗。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', gainCp: 1, exhausts: true, addCardToDeck: ['scrap_dragon_cannon'] }, keywords: ['衍生', '消耗'], unobtainable: true,
  },
  'scrap_dragon_cannon': {
    id: 'scrap_dragon_cannon', name: '废品龙装加农炮', description: '丢弃一张手牌，对敌人造成150%攻击力的伤害。无限。【终幕】：恢复1cp.', cost: 0, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', discardCards: { count: 1, from: 'hand' }, damageMultiplier: 1.5, returnsToHand: true, finisherEffect: { target: 'self', gainCp: 1 } }, keywords: ['弃牌', '衍生', '终幕', '无限'], unobtainable: true,
  },
  'phase_flash': {
    id: 'phase_flash', name: '相位闪现', description: '获得50%防御力的格挡。抽1张牌。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', gainBlockMultiplier: 0.5, drawCards: 1 }, keywords: ['衍生'], unobtainable: true,
  },
  'stench': {
    id: 'stench',
    name: '恶臭',
    description: '【状态】抽到这张卡时，受到10%最大生命值的伤害。消耗。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: {
        target: 'self',
        onDraw: { damagePercentMaxHp: 0.1, exhausts: true }
    },
    keywords: ['状态', '消耗'],
    unobtainable: true,
  },
  'confusion': {
    id: 'confusion',
    name: '困惑',
    description: '【状态】恢复1点CP。消耗。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: { target: 'self', gainCp: 1, exhausts: true },
    keywords: ['状态', '消耗'],
    unobtainable: true,
  },
  'pain': {
    id: 'pain', name: '苦痛', description: '抽2张牌。消耗。',
    cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', drawCards: 2, exhausts: true }, keywords: ['衍生', '消耗'], unobtainable: true,
  },
  'discharge': {
    id: 'discharge', name: '放电', description: '获得1点CP。消耗。',
    cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', gainCp: 1, exhausts: true }, keywords: ['衍生', '消耗'], unobtainable: true,
  },
  'shield_repair': {
    id: 'shield_repair', name: '护盾修复', description: '获得50%的格挡。',
    cost: 0, rarity: CardRarity.COMMON, type: 'skill', unobtainable: true,
    effect: { target: 'owner', gainBlockMultiplier: 0.5 }
  },
  'self_destruct_30': {
    id: 'self_destruct_30', name: '自毁', description: '造成30点固定伤害。',
    cost: 0, rarity: CardRarity.COMMON, type: 'skill', unobtainable: true,
    effect: { target: 'designated_target', fixedDamage: 30 }
  },
  'sin_card': {
    id: 'sin_card', name: '罪业', description: '恢复1点CP并抽1张卡。消耗。',
    cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', gainCp: 1, drawCards: 1, exhausts: true },
    keywords: ['衍生', '消耗'],
    unobtainable: true,
  },
  'scroll_of_insight': {
    id: 'scroll_of_insight', name: '洞见卷轴',
    description: '抽1张牌。',
    cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', drawCards: 1 },
    keywords: ['演化'], unobtainable: true,
  },
  'laplaces_charge_cannon': {
    id: 'laplaces_charge_cannon', name: '拉普拉斯的充能炮',
    description: '抽1张牌。造成130%攻击力伤害，并为敌人施加1层[弱化]。获得2点充能。',
    cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { 
      target: 'enemy',
      drawCards: 1,
      damageMultiplier: 1.3,
      statusEffect: 'weakened',
      statusEffectDuration: 2,
      gainCharge: 2,
    },
    keywords: ['演化', '充能'], unobtainable: true,
  },
  'interference_shard': {
    id: 'interference_shard',
    name: '干扰碎片',
    description: '在你抽到此牌时，本回合你打出的第一张攻击牌伤害降低50%。消耗。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: {
        target: 'self',
        onDraw: { exhausts: true }
    },
    keywords: ['状态', '消耗'],
    unobtainable: true,
  },
  'corrupting_touch': {
    id: 'corrupting_touch',
    name: '腐败之触',
    description: '【诅咒】抽到此牌时，本回合你打出的下一张攻击牌伤害降低20%。使用后从本场游戏中移除。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: {
        target: 'self',
        onDraw: { autoPlay: true, exhausts: true },
        selfStatusEffect: 'damage_reduction_20',
        selfStatusEffectDuration: 1
    },
    keywords: ['状态', '消耗'],
    unobtainable: true,
  },
};
