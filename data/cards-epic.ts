import { Card, CardRarity } from '../types';

export const EPIC_CARDS: Record<string, Card> = {
  'annihilate': {
    id: 'annihilate', name: '存在抹消', description: '造成350%攻击力的伤害。', cost: 3, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 3.5, target: 'enemy' },
  },
  'impenetrable_fortress': {
    id: 'impenetrable_fortress', name: '绝对壁垒', description: '获得300%防御力的格挡。', cost: 3, rarity: CardRarity.EPIC, type: 'skill',
    effect: { gainBlockMultiplier: 3.0, target: 'self' },
  },
  'final_spark': {
    id: 'final_spark', name: '终极闪光', description: '花费至多10层[充能]。每层[充能]造成85%攻击力的伤害，并无视格挡。', cost: 4, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 0, consumeChargeMultiplier: 0.85, maxConsumeCharge: 10, pierceMultiplier: 1.0, target: 'enemy' }, keywords: ['充能', '贯穿'],
  },
  'system_shock': {
    id: 'system_shock', name: '系统休克', description: '对所有敌人施加1回合[束缚]。', cost: 3, rarity: CardRarity.EPIC, type: 'skill',
    effect: { statusEffect: 'bind', statusEffectDuration: 2, target: 'all_enemies' },
  },
  'orbital_bombardment': {
    id: 'orbital_bombardment', name: '轨道轰炸肃正', description: '对所有敌人造成250%攻击力的伤害。', cost: 4, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 2.5, target: 'all_enemies' }
  },
  'emergency_protocol': {
    id: 'emergency_protocol', name: '紧急规程', description: '获得200%防御力的格挡。抽2张牌。', cost: 4, rarity: CardRarity.EPIC, type: 'skill',
    effect: { gainBlockMultiplier: 2.0, drawCards: 2, target: 'self' }
  },
  'overload_annihilation_beam': {
    id: 'overload_annihilation_beam', name: '超限：湮灭序列', description: '花费15点HP。对所有敌人造成220%攻击力的伤害。', cost: 0, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 2.2, target: 'all_enemies', overclockCost: 15 }, keywords: ['过载'],
  },
  'final_bastion': {
    id: 'final_bastion', name: '绝对防御', description: '获得400%防御力的格挡。', cost: 4, rarity: CardRarity.EPIC, type: 'skill',
    effect: { gainBlockMultiplier: 4.0, target: 'self' },
  },
  'immolation': {
    id: 'immolation', name: '活体熔炉', description: '花费至多10层[烧伤]。每层[烧伤]造成65%攻击力的伤害。', cost: 2, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', consumeStatus: { effectId: 'burn', damagePerStackMultiplier: 0.65, maxConsumeStacks: 10 } }, keywords: ['烧伤'],
  },
  'blood_rite': {
    id: 'blood_rite', name: '鲜血圣餐', description: '如果敌人有[流血]则抽2张牌并且花费目标敌人所有[流血]层数。每层[流血]为你恢复3点HP。', cost: 3, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'enemy', consumeStatus: { effectId: 'bleed', healPerStack: 3 }, bonusEffect: { condition: 'target_has_bleed', effect: { drawCards: 2 } } }, keywords: ['流血'],
  },
  'detonate': {
    id: 'detonate', name: '过载熔毁', description: '花费目标敌人所有[烧伤]层数。对所有敌人造成等同于花费层数x5的固定伤害。', cost: 2, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', consumeStatus: { effectId: 'burn', damagePerStack: 5, target: 'all_enemies' } }, keywords: ['烧伤'],
  },
  'rupture': {
    id: 'rupture', name: '深度撕裂', description: '花费至多10层[流血]。每层[流血]对其造成65%攻击力的伤害。', cost: 2, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', consumeStatus: { effectId: 'bleed', damagePerStackMultiplier: 0.65, maxConsumeStacks: 10 } }, keywords: ['流血'],
  },
  'conflagration': {
    id: 'conflagration', name: '焚尽万象', description: '获得[烈焰焚烧]状态。获得一张[爆炎新星]。消耗。', cost: 4, rarity: CardRarity.EPIC, type: 'power',
    effect: { target: 'self', statusEffect: 'conflagration_effect', statusEffectDuration: 999, addCardToHand: 'blazing_nova' }, keywords: ['能力', '烧伤', '消耗'],
  },
  'wildfire': {
    id: 'wildfire', name: '燎原', description: '将目标敌人50%的[烧伤]层数施加给所有其他敌人。', cost: 2, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'enemy', spreadStatus: { effectId: 'burn', ratio: 0.5, from: 'target', to: 'all_other_enemies' } }, keywords: ['烧伤'],
  },
  'embers': {
    id: 'embers', name: '烬燃', description: '获得200%防御力的格挡。将目标敌人身上的[烧伤]层数翻倍。', cost: 4, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'enemy', gainBlockMultiplier: 2.0, multiplyStatus: { effectId: 'burn', multiplier: 2 } }, keywords: ['烧伤'],
  },
  'feverish_calculation': {
    id: 'feverish_calculation',
    name: '狂热演算',
    description: '获得[狂热计算]状态，并将两张【狂热突袭】加入牌库。消耗。',
    cost: 4,
    rarity: CardRarity.EPIC,
    type: 'power',
    effect: {
        target: 'self',
        exhausts: true,
        statusEffect: 'feverish_calculation',
        statusEffectDuration: 999,
        addCardToDeck: ['feverish_strike', 'feverish_strike']
    },
    keywords: ['能力', '弃牌', '消耗', '狂热计算'],
  },
  'bloody_legacy': {
    id: 'bloody_legacy', name: '血色遗言', description: '获得等同于目标敌人[流血]层数x50%防御力的格挡。被弃置时对所有敌人施加4层[流血]。', cost: 1, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'enemy', consumeStatus: { effectId: 'bleed', gainBlockPerStackMultiplier: 0.5 }, onDiscard: { target: 'all_enemies', statusEffect: 'bleed', statusEffectValue: 4 } }, keywords: ['弃牌', '流血'],
  },
  'overload_stream': {
    id: 'overload_stream', name: '过载冲流', description: '这张卡在手牌时，其他卡每发动一次都减1点cp消耗。造成500%攻击力的伤害。', cost: 20, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 5.0, costReductionOnCardPlay: 1 }, keywords: ['终幕'],
  },
  'scrap_assembly_1': {
    id: 'scrap_assembly_1', name: '废品组装-初', description: '丢弃一张手牌，恢复3cp，并将【废品组装 - 破】加入牌库。消耗。', cost: 2, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', discardCards: { count: 1, from: 'hand' }, gainCp: 3, exhausts: true, addCardToDeck: ['scrap_assembly_2'] }, keywords: ['弃牌', '衍生', '消耗'],
  },
  'magitech_terminal_prototype': {
    id: 'magitech_terminal_prototype', name: '魔导终端-原型', description: '花费3点[充能]抽3张牌，并将一张【能量上载】加入牌库。消耗。', cost: 1, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', chargeCost: 3, drawCards: 3, exhausts: true, addCardToDeck: ['charge_up'] }, keywords: ['充能', '衍生', '消耗'],
  },
  'phase_horizon': {
    id: 'phase_horizon', name: '超现象相位视界', description: '获得150%防御力的格挡。将一张0费的【相位闪现】置入手牌。消耗。', cost: 3, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', gainBlockMultiplier: 1.5, addCardToHand: 'phase_flash', exhausts: true }, keywords: ['衍生', '消耗'],
  },
  'heat_siphon': {
    id: 'heat_siphon', name: '热能虹吸', description: '花费目标敌人7层[烧伤]才能发动，抽1张牌。无限。',
    cost: 1, rarity: CardRarity.EPIC, type: 'skill',
    effect: {
      target: 'enemy',
      playCondition: { requiresStatus: { effectId: 'burn', minStacks: 7 } },
      consumeStatus: { effectId: 'burn', stacksToRemove: 7 },
      drawCards: 1,
      returnsToHand: true
    }, keywords: ['烧伤', '无限']
  },
  'kindling': {
    id: 'kindling', name: '薪火', description: '(能量牌) 获得[薪火]状态：回合开始时，若场上所有敌人身上的[烧伤]层数总和不低于15，抽1张牌，衍生一张临时的【熔火之心】到手牌，然后移除此状态。消耗。',
    cost: 3, rarity: CardRarity.EPIC, type: 'power',
    effect: { target: 'self', statusEffect: 'kindling_effect', statusEffectDuration: 999 }, keywords: ['能力', '烧伤', '薪火']
  },
  'pain_echo': {
    id: 'pain_echo', name: '痛苦回响', description: '获得[痛苦回响]状态，将2张0费的【苦痛】置入卡组。消耗。',
    cost: 4, rarity: CardRarity.EPIC, type: 'power',
    effect: {
      target: 'self',
      statusEffect: 'pain_echo_effect',
      statusEffectDuration: 999,
      addCardToDeck: ['pain', 'pain'],
      exhausts: true,
    }, keywords: ['能力', '流血', '消耗', '痛苦回响']
  },
  'alchemy': {
    id: 'alchemy', name: '炼金术',
    description: '清除目标所有[中毒]层数，那之后自己抽一张卡。无限。',
    cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: {
        playCondition: { requiresStatus: { effectId: 'poison', minStacks: 1 } },
        target: 'enemy',
        consumeStatus: { effectId: 'poison', stacksToRemove: 999 },
        drawCards: 1,
        returnsToHand: true
    }, keywords: ['中毒', '无限']
  },
  'flesh_pact': {
    id: 'flesh_pact',
    name: '血肉契约',
    description: '抽一张卡并且，获得5层[流血]。无限。',
    cost: 1,
    rarity: CardRarity.EPIC,
    type: 'skill',
    effect: {
        target: 'self',
        drawCards: 1,
        selfStatusEffect: 'bleed',
        selfStatusEffectValue: 5,
        returnsToHand: true,
    },
    keywords: ['流血', '能力', '无限'],
  },
  'toxic_formula': {
    id: 'toxic_formula', name: '剧毒配方',
    description: '发现：从所有稀有和史诗的[中毒]卡牌中发现一张，其费用永久-1。消耗。',
    cost: 2, rarity: CardRarity.EPIC, type: 'skill',
    effect: { 
        target: 'self', 
        discover: { 
            from: 'all_rare_epic_poison', 
            options: 3, 
            modify: { cost: -1, permanent: true }
        },
        exhausts: true 
    },
    keywords: ['发现', '中毒', '消耗'],
  },
};