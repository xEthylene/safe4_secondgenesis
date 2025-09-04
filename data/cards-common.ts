import { Card, CardRarity } from '../types';

export const COMMON_CARDS: Record<string, Card> = {
  'strike': {
    id: 'strike', name: '攻击指令', description: '造成100%攻击力的伤害。', cost: 1, rarity: CardRarity.COMMON, type: 'attack',
    effect: { damageMultiplier: 1.0, target: 'enemy' },
  },
  'defend': {
    id: 'defend', name: '防御指令', description: '获得50%防御力的格挡。', cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { gainBlockMultiplier: 0.5, target: 'self' },
  },
  'charge_up': {
    id: 'charge_up', name: '能量上载', description: '获得3点[充能]。恢复1点CP。', cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { gainCharge: 3, gainCp: 1, target: 'self' }, keywords: ['充能'],
  },
  'quick_slash': {
    id: 'quick_slash', name: '瞬斩', description: '造成70%攻击力的伤害。抽1张牌。', cost: 1, rarity: CardRarity.COMMON, type: 'attack',
    effect: { damageMultiplier: 0.7, drawCards: 1, target: 'enemy' }, keywords: ['瞬发'],
  },
  'kinetic_barrier': {
    id: 'kinetic_barrier', name: '充能偏转', description: '获得50%防御力的格挡。每有1点[充能]，额外获得10%防御力的格挡。', cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', gainBlockMultiplier: 0.5, gainBlockPerChargeMultiplier: 0.1 }, keywords: ['充能'],
  },
  'flame_jet': {
    id: 'flame_jet', name: '热熔喷射', description: '造成60%攻击力的伤害。施加4层[烧伤]。', cost: 1, rarity: CardRarity.COMMON, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 0.6, statusEffect: 'burn', statusEffectValue: 4 }, keywords: ['烧伤'],
  },
  'spark': {
    id: 'spark', name: '点火', description: '造成20%攻击力的伤害。施加3层[烧伤]。递增。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 0.2, statusEffect: 'burn', statusEffectValue: 3 }, keywords: ['烧伤', '递增'],
  },
  'exsanguinate': {
    id: 'exsanguinate', name: '失血恶化', description: '获得100%防御力的格挡。如果目标敌人处于[流血]状态，则额外获得100%防御力的格挡。', cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'enemy', gainBlockMultiplier: 1, bonusEffect: { condition: 'target_has_bleed', effect: { gainBlockMultiplier: 1 } } }, keywords: ['流血'],
  },
  'quick_calculation': {
    id: 'quick_calculation', name: '高速演算', description: '抽2张牌，然后弃1张牌。', cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', drawCards: 2, discardCards: { count: 1, from: 'hand' } }, keywords: ['弃牌'],
  },
  'scrap_armor': {
    id: 'scrap_armor', name: '废件装甲', description: '获得60%防御力的格挡。这张卡被丢弃时，获得30%防御力的格挡。', cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', gainBlockMultiplier: 0.6, onDiscard: { target: 'self', gainBlockMultiplier: 0.3 } }, keywords: ['弃牌'],
  },
  'spare_battery': {
    id: 'spare_battery', name: '备用能源', description: '获得1点[充能]。被弃置时获得3点[充能]。', cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', gainCharge: 1, onDiscard: { target: 'self', gainCharge: 3 } }, keywords: ['弃牌', '充能'],
  },
  'mental_overload': {
    id: 'mental_overload', name: '数据洪流', description: '抽3张牌，然后弃掉2张手牌。被弃置时抽一张牌。', cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', drawCards: 3, discardCards: { count: 2, from: 'hand' }, onDiscard: { target: 'self', drawCards: 1 } }, keywords: ['弃牌'],
  },
  'opening_move': {
    id: 'opening_move', name: '攻击序列：起动', description: '你本回合打出的下一张攻击牌费用-1。', cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', nextAttackCostModifier: -1 },
  },
  'tactical_analysis': {
    id: 'tactical_analysis', name: '战场扫描', description: '【衍生】选择一张[瞬斩]或[防御]到手牌中。衍生的卡牌带有消耗。', cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', generateCardChoice: ['quick_slash', 'defend'], generatedCardsExhaust: true }, keywords: ['衍生'],
  },
  'tear_flesh': {
    id: 'tear_flesh',
    name: '撕咬血肉',
    description: '对敌人造成100%攻击力的伤害，并且花费对方所有的[流血]点数，每花费1层，便获得1点格挡。',
    cost: 1,
    rarity: CardRarity.COMMON,
    type: 'attack',
    effect: {
        target: 'enemy',
        damageMultiplier: 1.0,
        consumeStatus: { effectId: 'bleed', gainBlockPerStack: 1 }
    },
    keywords: ['流血'],
  },
  'execution_protocol_recalibrate': {
    id: 'execution_protocol_recalibrate', name: '执行协议：再校准',
    description: '造成70%攻击力伤害。弃1张牌，抽2张牌。获得[再校准协议]。',
    cost: 2, rarity: CardRarity.COMMON, type: 'attack',
    effect: {
        target: 'enemy',
        damageMultiplier: 0.7,
        discardCards: { count: 1, from: 'hand' },
        drawCards: 2,
        selfStatusEffect: 'recalibrate_cp_effect',
        selfStatusEffectDuration: 2,
    }, keywords: ['弃牌', '再校准协议']
  },
  'capacitor_deployment': {
    id: 'capacitor_deployment', name: '电容部署',
    description: '将两张0费的【放电】置入你的卡组。',
    cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', addCardToDeck: ['discharge', 'discharge'] }, keywords: ['衍生']
  },
  'catalyst': {
    id: 'catalyst', name: '催化剂',
    description: '对目标敌人施加2层[中毒]。抽1张牌。',
    cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'enemy', statusEffect: 'poison', statusEffectValue: 2, drawCards: 1 }, keywords: ['中毒']
  },
  'venom_spread': {
    id: 'venom_spread', name: '毒播',
    description: '选择一名敌人。如果其没有[中毒]层数，施加3层[中毒]并且抽一张卡；如果有[中毒]层数，将其身上50%的[中毒]层数施加给所有其他敌人。',
    cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: {
        target: 'enemy',
        conditionalEffect: {
            condition: { targetHasStatus: 'poison' },
            ifTrue: { target: 'enemy', spreadStatus: { effectId: 'poison', ratio: 0.5, from: 'target', to: 'all_other_enemies' } },
            ifFalse: { target: 'enemy', statusEffect: 'poison', statusEffectValue: 3, drawCards: 1 }
        }
    }, keywords: ['中毒']
  },
  'deploy_turret': {
    id: 'deploy_turret', name: '部署-自律炮塔',
    description: '部署一个【自律炮塔】（耐久度3，最大生命值，攻击力，防御力为本体的5%,20%,100%）。',
    cost: 3, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', deployConstruct: 'auto_turret' }, keywords: ['构装体']
  },
  'deploy_field_generator': {
    id: 'deploy_field_generator', name: '部署-力场发生器',
    description: '部署一个【力场发生器】（耐久度3，最大生命值，攻击力，防御力为本体的5%,20%,100%）。',
    cost: 3, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', deployConstruct: 'force_field_generator' }, keywords: ['构装体']
  },
  'exsanguinate_accelerant': {
    id: 'exsanguinate_accelerant',
    name: '失血加速',
    description: '为所有带有[流血]的敌人额外施加3层[流血]。',
    cost: 1,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: {
        target: 'all_enemies',
        applyStatusIfTargetHas: {
            requiredStatus: 'bleed',
            effectToApply: 'bleed',
            value: 3
        }
    },
    keywords: ['流血'],
  },
  'plan_ahead': {
    id: 'plan_ahead',
    name: '筹划',
    description: '下回合开始时，抽2张卡。',
    cost: 1,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: {
        target: 'self',
        selfStatusEffect: 'plan_ahead_draw',
        selfStatusEffectDuration: 2,
    },
    keywords: ['抽牌'],
  },
  'desperate_strike': {
    id: 'desperate_strike',
    name: '舍身击',
    description: '造成100%攻击力的伤害，抽2张卡。回合结束时，弃置2张卡。',
    cost: 1,
    rarity: CardRarity.COMMON,
    type: 'attack',
    effect: {
        target: 'enemy',
        damageMultiplier: 1.0,
        drawCards: 2,
        selfStatusEffect: 'desperate_strike_discard',
        selfStatusEffectDuration: 1,
    },
    keywords: ['弃牌', '抽牌'],
  },
  'aftershock': {
    id: 'aftershock', name: '余震',
    description: '溯源：从你的弃牌堆中选择一张攻击牌。打出它的一张临时复制品，其费用变为0。消耗。',
    cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', trace: { from: 'discard', cardType: 'attack', action: 'play_copy' }, exhausts: true },
    keywords: ['溯源', '消耗'],
  },
  'combo_stab': {
    id: 'combo_stab', name: '连击刺击',
    description: '造成80%攻击力伤害。共鸣：如果上一张打出的牌是攻击牌，额外造成40%攻击力伤害。',
    cost: 1, rarity: CardRarity.COMMON, type: 'attack',
    effect: { 
      target: 'enemy', 
      damageMultiplier: 0.8,
      resonance: { requires: 'attack', effect: { target: 'enemy', damageMultiplier: 0.4 } }
    },
    keywords: ['共鸣'],
  },
  'tactical_link': {
    id: 'tactical_link', name: '战术衔接',
    description: '共鸣：如果上一张打出的牌是技能牌，获得1点CP。',
    cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { 
      target: 'self',
      resonance: { requires: 'skill', effect: { target: 'self', gainCp: 1 } }
    },
    keywords: ['共鸣'],
  },
  'retrieve': {
    id: 'retrieve', name: '检索',
    description: '发现：从你的牌库中发现一张牌。',
    cost: 2, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', discover: { from: 'deck', options: 3 } },
    keywords: ['发现'],
  },
  'charge_pulse': {
    id: 'charge_pulse', name: '充能脉冲',
    description: '获得2点[充能]。共鸣：如果上一张是[充能]牌，抽1张牌。',
    cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    effect: { 
        target: 'self', 
        gainCharge: 2,
        resonance: { requires: 'keyword_charge', effect: { target: 'self', drawCards: 1 } }
    },
    keywords: ['充能', '共鸣'],
  },
  'rhythmic_strike': {
    id: 'rhythmic_strike', name: '节奏打击',
    description: '造成80%攻击力的伤害。共鸣：如果上一张是技能牌，额外获得30%防御力的格挡。',
    cost: 1, rarity: CardRarity.COMMON, type: 'attack',
    effect: { 
        target: 'enemy', 
        damageMultiplier: 0.8,
        resonance: { requires: 'skill', effect: { target: 'self', gainBlockMultiplier: 0.3 } }
    },
    keywords: ['共鸣'],
  },
  'entropy_siphon': {
    id: 'entropy_siphon', name: '熵能汲取',
    description: '消耗4点【扭曲熵能】才能发动。抽1张牌。',
    cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    entropyCost: 4,
    effect: { target: 'self', drawCards: 1 },
    keywords: ['熵能'],
  },
  'entropy_barrier': {
    id: 'entropy_barrier', name: '熵能壁垒',
    description: '消耗3点【扭曲熵能】才能发动。获得160%防御力的格挡。',
    cost: 1, rarity: CardRarity.COMMON, type: 'skill',
    entropyCost: 3,
    effect: { target: 'self', gainBlockMultiplier: 1.6 },
    keywords: ['熵能'],
  },
};