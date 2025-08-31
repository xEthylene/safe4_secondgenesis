





import { Card, CardRarity, StatusEffect, ConstructTemplate } from '../types';

export const MAX_COPIES_PER_RARITY: Record<CardRarity, number> = {
    [CardRarity.COMMON]: 5,
    [CardRarity.RARE]: 3,
    [CardRarity.EPIC]: 2,
};

export const CONSTRUCTS: Record<string, ConstructTemplate> = {
  'auto_turret': {
    id: 'auto_turret',
    name: '自律炮塔',
    description: '在操控者的回合结束时，随机对一个敌人打出【攻击指令】。',
    behavior: { onTurnEnd: { cardId: 'strike', target: 'random_enemy' } },
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
    statScaling: {
      maxHp: { ownerStat: 'maxHp', multiplier: 0.15 },
      attack: { ownerStat: 'attack', multiplier: 0.3 },
      defense: { ownerStat: 'defense', multiplier: 1.0 },
    }
  }
};


export const CARDS: Record<string, Card> = {
  // --- COMMON ---
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
    id: 'spark', name: '点火', description: '造成20%攻击力的伤害。施加3层[烧伤],本回合下一次使用【点火】时费用+1', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 0.2, statusEffect: 'burn', statusEffectValue: 3 }, keywords: ['烧伤'],
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
    id: 'tactical_analysis', name: '战场扫描', description: '【衍生】选择一张临时(使用后移除)的[瞬斩]或[防御]到手牌中。', cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', generateCardChoice: ['quick_slash', 'defend'] }, keywords: ['衍生'],
  },
  'tear_flesh': {
    id: 'tear_flesh',
    name: '撕咬血肉',
    description: '对敌人造成100%攻击力的伤害，并且消耗对方所有的[流血]点数，每消耗1层，便获得1点格挡。',
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
    description: '造成70%攻击力伤害。弃1张牌，抽2张牌。在你的下一个回合开始时，获得1点CP。',
    cost: 1, rarity: CardRarity.COMMON, type: 'attack',
    effect: {
        target: 'enemy',
        damageMultiplier: 0.7,
        discardCards: { count: 1, from: 'hand' },
        drawCards: 2,
        statusEffect: 'recalibrate_cp_effect',
        statusEffectDuration: 2,
    },
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


  // --- RARE ---
  'piercing_strike': {
    id: 'piercing_strike', name: '贯穿打击', description: '造成120%攻击力的伤害。此攻击无视50%的格挡。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.2, pierceMultiplier: 0.5, target: 'enemy' }, keywords: ['贯穿'],
  },
  'preemptive_guard': {
    id: 'preemptive_guard', name: '迎击架势', description: '获得100%防御力的格挡。获得[反击] (回击)。', cost: 2, rarity: CardRarity.RARE, type: 'skill',
    effect: { gainBlockMultiplier: 1.0, grantsCounter: 'counter_strike', target: 'self' }, keywords: ['反击'],
  },
  'overclock_strike': {
    id: 'overclock_strike', name: '极限驱动', description: '消耗8点HP，造成200%攻击力的伤害。此牌不消耗CP。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 2.0, overclockCost: 8, target: 'enemy' }, keywords: ['过载'],
  },
  'release_power': {
    id: 'release_power', name: '核心能量释放', description: '消耗至多3层[充能]。每层[充能]造成80%攻击力的伤害。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { consumeChargeMultiplier: 0.8, maxConsumeCharge: 3, target: 'enemy' }, keywords: ['充能'],
  },
  'tactical_cycle': {
    id: 'tactical_cycle', name: '战斗循环', description: '抽2张牌。', cost: 3, rarity: CardRarity.RARE, type: 'skill',
    effect: { drawCards: 2, target: 'self' },
  },
  'expose_weakness': {
    id: 'expose_weakness', name: '构造解析-弱点揭示', description: '对敌人施加2回合[易伤]。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { statusEffect: 'vulnerable', statusEffectDuration: 3, target: 'enemy' },
  },
  'cp_siphon': {
    id: 'cp_siphon', name: '算力虹吸', description: '造成50%攻击力的伤害。如果此攻击击败敌人，则获得3点CP。', cost: 1, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 0.5, gainCpOnKill: 3, target: 'enemy' }
  },
  'chain_reaction': {
    id: 'chain_reaction', name: '连锁反应', description: '获得3个[连锁]状态', cost: 3, rarity: CardRarity.RARE, type: 'skill',
    effect: { statusEffect: 'chaining', statusEffectDuration: 999, statusEffectValue: 3, target: 'self' }, keywords: ['连锁'],
  },
  'concentrate_fire': {
    id: 'concentrate_fire', name: '集中火力', description: '获得[强化]状态。你的下一张攻击牌伤害提升150%。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { statusEffect: 'empowered', statusEffectDuration: 2, target: 'self' }, keywords: ['强化'],
  },
  'sawtooth_cut': {
    id: 'sawtooth_cut', name: '锯齿切割', description: '造成110%攻击力的伤害。施加10层[流血]。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.1, statusEffect: 'bleed', statusEffectValue: 10, target: 'enemy' }, keywords: ['流血'],
  },
  'searing_ray': {
    id: 'searing_ray', name: '灼热射线', description: '造成110%攻击力的伤害。施加8层[烧伤]。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.1, statusEffect: 'burn', statusEffectValue: 8, target: 'enemy' }, keywords: ['烧伤'],
  },
  'overdrive': {
    id: 'overdrive', name: '超频运转',
    description: '选择一项：\n• 消耗5点[充能]，抽3张牌。\n• 获得5点[充能]，抽1张牌。',
    cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: {
      target: 'self',
      choiceEffect: {
        options: [
          {
            description: '消耗5充能，抽3张牌',
            effect: { target: 'self', chargeCost: 5, drawCards: 3 }
          },
          {
            description: '获得5充能，抽1张牌',
            effect: { target: 'self', gainCharge: 5, drawCards: 1 }
          }
        ]
      }
    }, keywords: ['充能'],
  },
  'cauterize': {
    id: 'cauterize', name: '热能固化', description: '获得80%防御力的格挡。如果目标敌人处于[烧伤]状态，额外获得80%防御力的格挡。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', gainBlockMultiplier: 0.8, bonusEffect: { condition: 'target_has_burn', effect: { gainBlockMultiplier: 0.8 } } }, keywords: ['烧伤'],
  },
  'lightning_reflexes': {
    id: 'lightning_reflexes', name: '反应优化', description: '获得50%防御力的格挡。下回合开始时，获得3点[充能]。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', gainBlockMultiplier: 0.5, statusEffect: 'charge_next_turn', statusEffectDuration: 2, statusEffectValue: 3 }, keywords: ['充能'],
  },
  'hemorrhage': {
    id: 'hemorrhage', name: '动脉破裂', description: '造成70%攻击力的伤害。施加8层[流血]。抽1张牌。', cost: 1, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 0.7, statusEffect: 'bleed', statusEffectValue: 8, drawCards: 1 }, keywords: ['流血'],
  },
  'flesh_and_blood': {
    id: 'flesh_and_blood', name: '血债血偿', description: '消耗至多3层[流血]，每层[流血]造成70%攻击力的伤害。', cost: 1, rarity: CardRarity.RARE, type: 'attack',
    effect: { 
        target: 'enemy', 
        consumeStatus: { effectId: 'bleed', damagePerStackMultiplier: 0.70, maxConsumeStacks: 3 } 
    }, 
    keywords: ['流血'],
  },
  'firewall': {
    id: 'firewall', name: '防火墙', description: '获得100%防御力的格挡。对所有敌人施加3层[烧伤]。', cost: 2, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'all_enemies', gainBlockMultiplier: 1.0, statusEffect: 'burn', statusEffectValue: 3 }, keywords: ['烧伤'],
  },
  'heat_sink': {
    id: 'heat_sink', name: '散热', description: '获得50%防御力的格挡。如果目标敌人处于[烧伤]状态，恢复1点CP。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', gainBlockMultiplier: 0.5, bonusEffect: { condition: 'target_has_burn', effect: { gainCp: 1 } } }, keywords: ['烧伤'],
  },
  'karma_fire': {
    id: 'karma_fire', name: '业火', description: '造成120%攻击力的伤害。若目标敌人处于[烧伤]状态，恢复1点CP并抽1张牌。', cost: 1, rarity: CardRarity.RARE, type: 'attack',
    effect: { 
        target: 'enemy', 
        damageMultiplier: 1.2, 
        bonusEffect: { 
            condition: 'target_has_burn', 
            effect: { 
                gainCp: 1, 
                drawCards: 1
            } 
        }
    }, 
    keywords: ['烧伤'],
  },
  'blood_frenzy': {
    id: 'blood_frenzy', name: '血腥狂乱', description: '抽1张牌。如果目标敌人处于[流血]状态，则额外再抽1张牌并恢复1点CP，然后扣除目标1/3的[流血]层数。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { 
        target: 'enemy', 
        drawCards: 1, 
        bonusEffect: { 
            condition: 'target_has_bleed', 
            effect: { 
                drawCards: 1, 
                gainCp: 1,
                removeStatusRatio: { effectId: 'bleed', ratio: 1/3 }
            } 
        } 
    }, 
    keywords: ['流血'],
  },
  'controlled_burn': {
    id: 'controlled_burn', name: '热量传导', description: '为目标敌人施加等同于你当前格挡值50%的[烧伤]。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', applyStatusFromBlockValue: 'burn' }, keywords: ['烧伤'],
  },
  'all_in': {
    id: 'all_in', name: '逻辑炸弹', description: '弃掉你所有的手牌。每弃掉一张牌，便对随机一名敌人造成60%攻击力的伤害。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'self', discardCards: { count: 99, from: 'all', then: { target: 'random_enemy', damageMultiplier: 0.6 } } }, keywords: ['弃牌'],
  },
  'overheated_warhead': {
    id: 'overheated_warhead', name: '过热弹头', description: '造成80%攻击力的伤害。弃1张牌，若你如此做，则对目标施加5层[烧伤]。', cost: 1, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 0.8, discardCards: { count: 1, from: 'hand', then: { target: 'enemy', statusEffect: 'burn', statusEffectValue: 5 } } }, keywords: ['弃牌', '烧伤'],
  },
  'desperate_move': {
    id: 'desperate_move', name: '孤注一掷', description: '造成80%攻击力的伤害。如果你手牌中的牌不多于2张，抽2张牌。', cost: 1, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 0.8, bonusEffect: { condition: 'hand_size_less_than_or_equal', value: 2, effect: { drawCards: 2 } } },
  },
  'pulse_bomb': {
    id: 'pulse_bomb', name: 'EMP爆破', description: '对所有敌人造成100%攻击力的伤害。被弃置时抽一张牌，对所有敌人造成50%攻击力的伤害。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'all_enemies', damageMultiplier: 1.0, onDiscard: { target: 'all_enemies', drawCards: 1, damageMultiplier: 0.5 } }, keywords: ['弃牌'],
  },
  'magitech_blade_arts_1': {
    id: 'magitech_blade_arts_1', name: '魔导剑术 - 序', description: '造成100%攻击力伤害，那之后这张卡移除本场游戏，并且向牌库加入【魔导剑术 - 破】', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.0, exhausts: true, addCardToDeck: ['magitech_blade_arts_2'] }, keywords: ['衍生'],
  },
  'limit_break': {
    id: 'limit_break', name: '限制解除', description: '获得5层【连锁】，但回合结束时丢弃所有的手牌。', cost: 2, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', statusEffect: 'limit_break', statusEffectDuration: 2 }, keywords: ['连锁'],
  },
  'magitech_terminal_infinite': {
    id: 'magitech_terminal_infinite', name: '魔导终端-无限', description: '消耗2充能抽2张卡，那之后这张卡回到手卡并且本回合+1点cp消耗。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', chargeCost: 2, drawCards: 2, returnsToHand: true, costIncreaseOnUseThisTurn: 1 }, keywords: ['充能', '衍生']
  },
  'overload_cycle': {
    id: 'overload_cycle', name: '超载循环', description: '消耗至多3层[充能]。每消耗1层[充能]，抽1张牌，然后弃1张牌。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', maxConsumeCharge: 3, drawPerChargeConsumed: 1, discardPerChargeConsumed: 1 }, keywords: ['充能', '弃牌'],
  },
  'molten_heart': {
    id: 'molten_heart', name: '熔火之心', description: '所有的敌人都有烧伤时才能发动，抽2张卡。',
    cost: 1, rarity: CardRarity.RARE, type: 'power',
    effect: { target: 'self', playCondition: { allEnemiesMustHaveStatus: 'burn' }, drawCards: 2 }, keywords: ['能力', '烧伤']
  },
  'charge_calibration': {
    id: 'charge_calibration', name: '充能校准', description: '获得2点[充能]。那之后如果你的[充能]层数不低于10，恢复1点cp；如果你的[充能]层数低于10，抽一张牌。',
    cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: {
      target: 'self', gainCharge: 2,
      conditionalEffect: {
        condition: { self: { minCharge: 10 } },
        ifTrue: { target: 'self', gainCp: 1 },
        ifFalse: { target: 'self', drawCards: 1 }
      }
    }, keywords: ['充能'],
  },
  'immediate_action': {
    id: 'immediate_action', name: '立刻行动',
    description: '造成120%攻击力的伤害。若此攻击造成生命伤害，获得120%防御力的格挡；若此攻击被完全格挡，则抽2张牌。',
    cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: {
        target: 'enemy',
        damageMultiplier: 1.2,
        onHpDamageDealt: {
            target: 'self',
            gainBlockMultiplier: 1.2,
        },
        onBlockedByEnemy: {
            target: 'self',
            drawCards: 2,
        }
    },
  },
  'opening_ceremony': {
    id: 'opening_ceremony', name: '开幕仪典',
    description: '抽1张牌。在你的下一个回合开始时，你手牌中所有牌的费用-1。',
    cost: 3, rarity: CardRarity.RARE, type: 'skill',
    effect: {
        target: 'self',
        drawCards: 1,
        statusEffect: 'opening_ceremony_effect',
        statusEffectDuration: 2,
    },
  },
  'magitech_terminal_recursive': {
    id: 'magitech_terminal_recursive', name: '魔导终端-递归回路',
    description: '获得2点充能，那之后这张卡回到手卡。',
    cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', gainCharge: 2, returnsToHand: true }, keywords: ['充能']
  },
  'antagonistic_confluence': {
    id: 'antagonistic_confluence', name: '背反合流',
    description: '抉择： 抽2张牌；或者，获得4点[充能]。\n溢流： 如果你在打出此牌时CP已满，则同时触发两种效果。',
    cost: 2, rarity: CardRarity.RARE, type: 'skill',
    effect: {
      target: 'self',
      choiceEffect: {
        options: [
          { description: '抽2张牌', effect: { target: 'self', drawCards: 2 } },
          { description: '获得4点[充能]', effect: { target: 'self', gainCharge: 4 } }
        ]
      },
      overflowEffect: { target: 'self', drawCards: 2, gainCharge: 4 }
    }, keywords: ['充能', '抉择', '溢流']
  },
  'neurotoxin': {
    id: 'neurotoxin', name: '神经毒素',
    description: '获得80%防御力的格挡。若目标敌人处于[中毒]状态，抽一张卡，再额外获得80%防御力的格挡。',
    cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: {
        target: 'enemy',
        gainBlockMultiplier: 0.8,
        bonusEffect: {
            condition: 'target_has_poison',
            effect: { drawCards: 1, gainBlockMultiplier: 0.8 }
        }
    }, keywords: ['中毒']
  },
  'toxic_backlash': {
    id: 'toxic_backlash', name: '毒性反噬',
    description: '选择一项：对一名敌人造成等同于其[中毒]层数x20%攻击力的伤害；或你恢复等同于其[中毒]层数x2的HP。那之后，移除该敌人一半的[中毒]层数。',
    cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: {
        target: 'enemy',
        choiceEffect: {
            options: [
                {
                    description: '造成伤害',
                    effect: { target: 'enemy', consumeStatus: { effectId: 'poison', damagePerStackMultiplier: 0.2, stacksToRemoveRatio: 0.5 } }
                },
                {
                    description: '恢复HP',
                    effect: { target: 'enemy', consumeStatus: { effectId: 'poison', healPerStack: 2, stacksToRemoveRatio: 0.5 } }
                }
            ]
        }
    }, keywords: ['中毒', '抉择']
  },
  'envenom': {
    id: 'envenom', name: '淬毒',
    description: '本回合所有的攻击牌都为敌人施加1层[中毒]。',
    cost: 2, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', statusEffect: 'envenom_effect', statusEffectDuration: 1 }, keywords: ['中毒']
  },

  // --- EPIC ---
  'annihilate': {
    id: 'annihilate', name: '存在抹消', description: '造成350%攻击力的伤害。', cost: 3, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 3.5, target: 'enemy' },
  },
  'impenetrable_fortress': {
    id: 'impenetrable_fortress', name: '绝对壁垒', description: '获得300%防御力的格挡。', cost: 3, rarity: CardRarity.EPIC, type: 'skill',
    effect: { gainBlockMultiplier: 3.0, target: 'self' },
  },
  'final_spark': {
    id: 'final_spark', name: '终极闪光', description: '消耗至多10层[充能]。每层[充能]造成85%攻击力的伤害，并无视格挡。', cost: 4, rarity: CardRarity.EPIC, type: 'attack',
    effect: { consumeChargeMultiplier: 0.85, maxConsumeCharge: 10, pierceMultiplier: 1.0, target: 'enemy' }, keywords: ['充能', '贯穿'],
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
    id: 'emergency_protocol', name: '紧急规程', description: '获得200%防御力的格挡。抽3张牌。', cost: 4, rarity: CardRarity.EPIC, type: 'skill',
    effect: { gainBlockMultiplier: 2.0, drawCards: 3, target: 'self' }
  },
  'overload_annihilation_beam': {
    id: 'overload_annihilation_beam', name: '超限：湮灭序列', description: '消耗15点HP。对所有敌人造成220%攻击力的伤害。', cost: 0, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 2.2, target: 'all_enemies', overclockCost: 15 }, keywords: ['过载'],
  },
  'final_bastion': {
    id: 'final_bastion', name: '绝对防御', description: '获得400%防御力的格挡。', cost: 4, rarity: CardRarity.EPIC, type: 'skill',
    effect: { gainBlockMultiplier: 4.0, target: 'self' },
  },
  'immolation': {
    id: 'immolation', name: '活体熔炉', description: '消耗至多10层[烧伤]。每层[烧伤]造成65%攻击力的伤害。', cost: 2, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', consumeStatus: { effectId: 'burn', damagePerStackMultiplier: 0.65, maxConsumeStacks: 10 } }, keywords: ['烧伤'],
  },
  'blood_rite': {
    id: 'blood_rite', name: '鲜血圣餐', description: '如果敌人有[流血]则抽2张牌并且消耗目标敌人所有[流血]层数。每层[流血]为你恢复3点HP。', cost: 1, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'enemy', consumeStatus: { effectId: 'bleed', healPerStack: 3 }, bonusEffect: { condition: 'target_has_bleed', effect: { drawCards: 2 } } }, keywords: ['流血'],
  },
  'detonate': {
    id: 'detonate', name: '过载熔毁', description: '消耗目标敌人所有[烧伤]层数。对所有敌人造成等同于消耗层数x5的固定伤害。', cost: 2, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', consumeStatus: { effectId: 'burn', damagePerStack: 5, target: 'all_enemies' } }, keywords: ['烧伤'],
  },
  'rupture': {
    id: 'rupture', name: '深度撕裂', description: '消耗至多10层[流血]。每层[流血]对其造成65%攻击力的伤害。', cost: 2, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', consumeStatus: { effectId: 'bleed', damagePerStackMultiplier: 0.65, maxConsumeStacks: 10 } }, keywords: ['流血'],
  },
  'conflagration': {
    id: 'conflagration', name: '焚尽万象', description: '获得[烈焰焚烧]状态。此牌在本场战斗中移除，并获得一张[爆炎新星]。', cost: 4, rarity: CardRarity.EPIC, type: 'power',
    effect: { target: 'self', statusEffect: 'conflagration_effect', statusEffectDuration: 999, addCardToHand: 'blazing_nova' }, keywords: ['能力', '烧伤'],
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
    description: '打出后这张卡移除本场游戏，进入【狂热计算】状态，并且把两张【狂热突袭】加入牌库。【狂热计算】状态：每当你弃牌时，对随机一名敌人造成30%攻击力的伤害。',
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
    keywords: ['能力', '弃牌'],
  },
  'bloody_legacy': {
    id: 'bloody_legacy', name: '血色遗言', description: '获得等同于目标敌人[流血]层数x50%防御力的格挡。被弃置时对所有敌人施加4层[流血]。', cost: 1, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'enemy', consumeStatus: { effectId: 'bleed', gainBlockPerStackMultiplier: 0.5 }, onDiscard: { target: 'all_enemies', statusEffect: 'bleed', statusEffectValue: 4 } }, keywords: ['弃牌', '流血'],
  },
  'overload_stream': {
    id: 'overload_stream', name: '过载冲流', description: '这张卡在手牌时，其他卡每发动一次都减1点cp消耗。造成500%攻击力的伤害。', cost: 20, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 5.0, costReductionOnCardPlay: 1 }, keywords: ['终结'],
  },
  'scrap_assembly_1': {
    id: 'scrap_assembly_1', name: '废品组装-初', description: '丢弃一张手牌，恢复3cp，那之后这张卡移除本场游戏，并且向牌库加入【废品组装 - 破】。', cost: 2, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', discardCards: { count: 1, from: 'hand' }, gainCp: 3, exhausts: true, addCardToDeck: ['scrap_assembly_2'] }, keywords: ['弃牌', '衍生'],
  },
  'magitech_terminal_prototype': {
    id: 'magitech_terminal_prototype', name: '魔导终端-原型', description: '消耗3充能抽3张卡，那之后这张卡移除本场游戏，并且向牌库加入一张【能量上载】。', cost: 1, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', chargeCost: 3, drawCards: 3, exhausts: true, addCardToDeck: ['charge_up'] }, keywords: ['充能', '衍生'],
  },
  'phase_horizon': {
    id: 'phase_horizon', name: '超现象相位视界', description: '获得150%防御力的格挡。将一张0费的【相位闪现】置入手牌。那之后这张卡在本场游戏中移除。', cost: 3, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', gainBlockMultiplier: 1.5, addCardToHand: 'phase_flash', exhausts: true }, keywords: ['衍生']
  },
  'heat_siphon': {
    id: 'heat_siphon', name: '热能虹吸', description: '移除目标敌人7层[烧伤]才能发动，抽1张牌，那之后这张卡回到手卡。',
    cost: 1, rarity: CardRarity.EPIC, type: 'skill',
    effect: {
      target: 'enemy',
      playCondition: { requiresStatus: { effectId: 'burn', minStacks: 7 } },
      consumeStatus: { effectId: 'burn', stacksToRemove: 7 },
      drawCards: 1,
      returnsToHand: true
    }, keywords: ['烧伤']
  },
  'kindling': {
    id: 'kindling', name: '薪火', description: '进入【薪火】状态。在你的回合开始时，若场上所有敌人身上的[烧伤]层数总和不低于15，抽1张牌，衍生一张临时的【熔火之心】到手牌，然后移除此状态。',
    cost: 3, rarity: CardRarity.EPIC, type: 'power',
    effect: { target: 'self', statusEffect: 'kindling_effect', statusEffectDuration: 999 }, keywords: ['能力', '烧伤']
  },
  'pain_echo': {
    id: 'pain_echo', name: '痛苦回响', description: '(能量牌) 进入【痛苦回响】状态，将2张0费的【苦痛】置入卡组，那之后这张卡从本场游戏移除。每回合结束时，如果本回合有人因流血而受伤，将2张0费的【苦痛】置入卡组。',
    cost: 4, rarity: CardRarity.EPIC, type: 'power',
    effect: {
      target: 'self',
      statusEffect: 'pain_echo_effect',
      statusEffectDuration: 999,
      addCardToDeck: ['pain', 'pain'],
      exhausts: true,
    }, keywords: ['能力', '流血']
  },
  'alchemy': {
    id: 'alchemy', name: '炼金术',
    description: '对一名敌人使用，清除目标所有[中毒]层数，那之后自己抽一张卡。这张卡使用后回到手卡。',
    cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: {
        playCondition: { requiresStatus: { effectId: 'poison', minStacks: 1 } },
        target: 'enemy',
        consumeStatus: { effectId: 'poison', stacksToRemove: 999 },
        drawCards: 1,
        returnsToHand: true
    }, keywords: ['中毒']
  },

  // --- UNOBTAINABLE / GENERATED ---
  'counter_strike': {
    id: 'counter_strike', name: '回击', description: '当被攻击时，对攻击者造成75%攻击力的伤害。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 0.75, target: 'enemy' }, keywords: ['反击'], unobtainable: true,
  },
  'blazing_nova': {
    id: 'blazing_nova', name: '爆炎新星', description: '对所有敌人施加5层[烧伤]。', cost: 2, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'all_enemies', statusEffect: 'burn', statusEffectValue: 5 }, keywords: ['烧伤', '衍生'], unobtainable: true,
  },
  'feverish_strike': {
    id: 'feverish_strike', name: '狂热突袭', description: '对一名敌人造成100%攻击力的伤害，抽1张卡。这张卡被丢弃时，抽一张卡。使用后，回合结束时随机丢弃2张卡。', cost: 1, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.0, drawCards: 1, onDiscard: { target: 'self', drawCards: 1 } }, keywords: ['弃牌', '衍生'], unobtainable: true,
  },
  'magitech_blade_arts_2': {
    id: 'magitech_blade_arts_2', name: '魔导剑术 - 破', description: '造成100%攻击力伤害并且恢复1cp，那之后这张卡移除本场游戏，并且向牌库加入【魔导剑术 - 终】', cost: 1, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.0, gainCp: 1, exhausts: true, addCardToDeck: ['magitech_blade_arts_3'] }, keywords: ['衍生'], unobtainable: true,
  },
  'magitech_blade_arts_3': {
    id: 'magitech_blade_arts_3', name: '魔导剑术 - 终', description: '造成100%攻击力伤害并且恢复1cp.', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.0, gainCp: 1 }, keywords: ['衍生'], unobtainable: true,
  },
  'scrap_assembly_2': {
    id: 'scrap_assembly_2', name: '废品组装-破', description: '丢弃一张手牌，恢复1cp，那之后这张卡移除本场游戏，并且向牌库加入【废品组装 - 终】。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', discardCards: { count: 1, from: 'hand' }, gainCp: 1, exhausts: true, addCardToDeck: ['scrap_assembly_3'] }, keywords: ['弃牌', '衍生'], unobtainable: true,
  },
  'scrap_assembly_3': {
    id: 'scrap_assembly_3', name: '废品组装-终', description: '恢复1cp，那之后这张卡移除本场游戏，并且向牌库加入【废品龙装加农炮】。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', gainCp: 1, exhausts: true, addCardToDeck: ['scrap_dragon_cannon'] }, keywords: ['衍生'], unobtainable: true,
  },
  'scrap_dragon_cannon': {
    id: 'scrap_dragon_cannon', name: '废品龙装加农炮', description: '丢弃一张手牌，对敌人造成150%攻击力的伤害。这张卡使用后回到手卡。【终幕】：恢复1cp.', cost: 0, rarity: CardRarity.EPIC, type: 'attack',
    effect: { target: 'enemy', discardCards: { count: 1, from: 'hand' }, damageMultiplier: 1.5, returnsToHand: true, finisherEffect: { target: 'self', gainCp: 1 } }, keywords: ['弃牌', '衍生', '终幕'], unobtainable: true,
  },
  'phase_flash': {
    id: 'phase_flash', name: '相位闪现', description: '获得50%防御力的格挡。抽1张牌。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', gainBlockMultiplier: 0.5, drawCards: 1 }, keywords: ['衍生'], unobtainable: true,
  },
  'stench': {
    id: 'stench',
    name: '恶臭',
    description: '【状态】抽到这张卡时，受到10%最大生命值的伤害，那之后这张卡移除本场游戏。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: {
        target: 'self',
        onDraw: { damagePercentMaxHp: 0.1, exhausts: true }
    },
    keywords: ['状态'],
    unobtainable: true,
  },
  'confusion': {
    id: 'confusion',
    name: '困惑',
    description: '【状态】恢复1点CP。将自身移除。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: { target: 'self', gainCp: 1, exhausts: true },
    keywords: ['状态'],
    unobtainable: true,
  },
  'pain': {
    id: 'pain', name: '苦痛', description: '抽2张牌。那之后这张卡移除本场游戏。',
    cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', drawCards: 2, exhausts: true }, keywords: ['衍生'], unobtainable: true,
  },
  'discharge': {
    id: 'discharge', name: '放电', description: '获得1点CP。使用后移除本场游戏。',
    cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', gainCp: 1, exhausts: true }, keywords: ['衍生'], unobtainable: true,
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
};

export const ENEMY_CARDS: Record<string, Card> = {
  // Basic
  'enemy_strike': {
    id: 'enemy_strike', name: '攻击', description: '造成100%攻击力的伤害。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: { damageMultiplier: 1.0, target: 'enemy' },
  },
  'enemy_defend': {
    id: 'enemy_defend', name: '防御', description: '获得8点格挡。', cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { gainBlock: 8, target: 'self' },
  },
  'enemy_heavy_strike': {
    id: 'enemy_heavy_strike', name: '蓄力重击', description: '造成150%攻击力的伤害。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: { damageMultiplier: 1.5, target: 'enemy' },
  },
  'enemy_reinforce': {
    id: 'enemy_reinforce', name: '自我修复', description: '获得15点格挡。', cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { gainBlock: 15, target: 'self' },
  },
  'enemy_furious_assault': {
    id: 'enemy_furious_assault', name: '狂怒攻击', description: '造成120%攻击力的伤害。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: { damageMultiplier: 1.2, target: 'enemy' },
  },
  
  // Debuffs
  'enemy_expose_weakness': {
    id: 'enemy_expose_weakness', name: '揭露弱点', description: '对目标施加2回合[易伤]。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { statusEffect: 'vulnerable', statusEffectDuration: 3, target: 'enemy' },
  },
  'enemy_debilitate': {
    id: 'enemy_debilitate', name: '削弱', description: '对目标施加2回合[弱化]。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { statusEffect: 'weakened', statusEffectDuration: 3, target: 'enemy' },
  },

  // Thematic & Boss Cards
  'crystal_barrage': {
    id: 'crystal_barrage', name: '晶体弹幕', description: '造成2次60%攻击力的伤害。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 0.6, hitCount: 2, target: 'enemy' },
  },
  'festering_bite': {
    id: 'festering_bite', name: '腐烂啃咬', description: '造成80%攻击力的伤害并施加3层[流血]。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 0.8, statusEffect: 'bleed', statusEffectValue: 3, target: 'enemy' },
  },
  'system_purge': {
    id: 'system_purge', name: '系统净化', description: '造成120%攻击力的伤害，无视30%的格挡。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.2, pierceMultiplier: 0.3, target: 'enemy' },
  },
  'entropic_blast': {
    id: 'entropic_blast', name: '熵能爆破', description: '造成140%攻击力的伤害并施加2回合[弱化]。', cost: 0, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 1.4, statusEffect: 'weakened', statusEffectDuration: 3, target: 'enemy' },
  },
  'night_owl_ambush': {
    id: 'night_owl_ambush', name: '夜枭伏击', description: '造成50%攻击力的伤害并施加2回合[易伤]。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 0.5, statusEffect: 'vulnerable', statusEffectDuration: 3, target: 'enemy' },
  },
  'runic_overload': {
    id: 'runic_overload', name: '符文过载', description: '造成200%攻击力的伤害。', cost: 0, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 2.0, target: 'enemy' },
  },
  'abyssal_tendrils': {
    id: 'abyssal_tendrils', name: '深渊触须', description: '造成100%攻击力的伤害并施加1回合[束缚]。', cost: 0, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 1.0, statusEffect: 'bind', statusEffectDuration: 2, target: 'enemy' },
  },
  'bloody_claw': {
      id: 'bloody_claw',
      name: '血腥爪击',
      description: '造成90%攻击力的伤害并施加3层[流血]。',
      cost: 0,
      rarity: CardRarity.COMMON,
      type: 'attack',
      effect: { damageMultiplier: 0.9, statusEffect: 'bleed', statusEffectValue: 3, target: 'enemy' },
  },
  'target_lock': {
      id: 'target_lock',
      name: '目标锁定',
      description: '对目标施加2回合[易伤]。',
      cost: 0,
      rarity: CardRarity.RARE,
      type: 'skill',
      effect: { statusEffect: 'vulnerable', statusEffectDuration: 3, target: 'enemy' },
  },
  'crystal_fortify': {
      id: 'crystal_fortify',
      name: '晶态加固',
      description: '获得12点格挡。对攻击者造成5点伤害。',
      cost: 0,
      rarity: CardRarity.RARE,
      type: 'skill',
      effect: { gainBlock: 12, target: 'self' /* Thorns/Retaliate needs engine support */ }, 
  },
  'tactical_advantage': {
      id: 'tactical_advantage',
      name: '战术优势',
      description: '自身获得[强化]。',
      cost: 0,
      rarity: CardRarity.RARE,
      type: 'skill',
      effect: { statusEffect: 'empowered', statusEffectDuration: 2, target: 'self' },
  },
  'enemy_tear_flesh': {
    id: 'enemy_tear_flesh',
    name: '撕咬血肉',
    description: '造成100%攻击力的伤害，并且消耗对方所有的[流血]点数，每消耗1层，便获得1点格挡。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'attack',
    effect: {
        target: 'enemy',
        damageMultiplier: 1.0,
        consumeStatus: { effectId: 'bleed', gainBlockPerStack: 1 }
    },
  },
  'corrupting_miasma': {
    id: 'corrupting_miasma',
    name: '腐败瘴气',
    description: '将2张0费的【恶臭】洗入玩家的牌库，那之后这张卡移除本场游戏。',
    cost: 0,
    rarity: CardRarity.RARE,
    type: 'skill',
    effect: {
        target: 'enemy',
        addCardToDeck: ['stench', 'stench'],
        exhausts: true,
    },
    unobtainable: true,
  },
  'block_attack': {
    id: 'block_attack',
    name: '格挡攻击',
    description: '造成100%攻击力的伤害，并且获得4点格挡。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'attack',
    effect: { damageMultiplier: 1.0, gainBlock: 4, target: 'enemy' },
  },
  'heavy_blow': {
    id: 'heavy_blow',
    name: '沉重一击',
    description: '造成140%攻击力的伤害，如果这张卡造成了生命值伤害，将1张【困惑】洗入对方的牌库。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'attack',
    effect: { damageMultiplier: 1.4, addCardToDeckOnHpDamage: ['confusion'], target: 'enemy' },
  },
  'consciousness_backup': {
    id: 'consciousness_backup',
    name: '意识备份',
    description: '恢复5点HP。',
    cost: 0,
    rarity: CardRarity.RARE,
    type: 'skill',
    effect: { heal: 5, target: 'self' },
  },
  'annihilation_mode_activate': {
    id: 'annihilation_mode_activate',
    name: '歼灭模式-启动',
    description: '获得50点格挡与永久的[强化]状态。',
    cost: 0,
    rarity: CardRarity.EPIC,
    type: 'skill',
    effect: {
      target: 'self',
      gainBlock: 50,
      statusEffect: 'annihilation_mode_empowered',
      statusEffectDuration: 999,
      exhausts: true,
    },
  },
  'launch_drone': {
    id: 'launch_drone', name: '启动巡飞弹',
    description: '指定一个敌人，生成一个构装体【巡飞弹】（耐久度3）。',
    cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', deployConstruct: 'patrol_drone' }
  },
  'fever_jet': {
    id: 'fever_jet', name: '狂热喷射', description: '造成80%攻击力的伤害，并施加3层[烧伤]。',
    cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: { damageMultiplier: 0.8, statusEffect: 'burn', statusEffectValue: 3, target: 'enemy' }
  },
  'destructive_assault': {
    id: 'destructive_assault', name: '毁灭式袭击',
    description: '造成120%攻击力的伤害，并施加3层[烧伤]，对自己造成100%攻击力伤害。',
    cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.2, statusEffect: 'burn', statusEffectValue: 3, selfDamageMultiplier: 1.0, target: 'enemy' }
  },
  'martyrdom_blast': {
    id: 'martyrdom_blast', name: '殉爆',
    description: '对目标造成200%攻击力伤害，并施加5层[烧伤]，对自己造成1000%攻击力伤害。',
    cost: 0, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 2.0, statusEffect: 'burn', statusEffectValue: 5, selfDamageMultiplier: 10.0, target: 'enemy', exhausts: true }
  },
};

export const STATUS_EFFECTS: Record<string, Omit<StatusEffect, 'duration' | 'value' | 'sourceAttack'>> = {
  'weakened': {
    id: 'weakened',
    name: '弱化',
    description: '防御力降低50%。',
    type: 'debuff'
  },
  'vulnerable': {
    id: 'vulnerable',
    name: '易伤',
    description: '受到的攻击伤害增加等同于攻击者50%攻击力的数值。',
    type: 'debuff'
  },
  'bind': {
    id: 'bind',
    name: '束缚',
    description: '无法使用攻击牌。',
    type: 'debuff'
  },
  'chaining': {
    id: 'chaining',
    name: '连锁',
    description: '每次攻击消耗1层,抽一张卡',
    type: 'buff'
  },
  'shielded': {
    id: 'shielded',
    name: '护盾',
    description: '防御力提升100%。',
    type: 'buff'
  },
  'overheated': {
    id: 'overheated',
    name: '过热',
    description: '下一回合CP恢复量减半。',
    type: 'debuff'
  },
  'burn': {
    id: 'burn',
    name: '烧伤',
    description: '回合开始时，受到等同于(层数 x 施加者攻击力 x 15%)的伤害(最少1点)，然后层数减半（向下取整）。',
    type: 'debuff'
  },
  'poison': {
    id: 'poison',
    name: '中毒',
    description: '回合开始时，受到10%最大生命值的伤害，之后层数-1。',
    type: 'debuff'
  },
  'bleed': {
    id: 'bleed',
    name: '流血',
    description: '拥有此状态的角色使用攻击牌时，会受到等同于[流血]层数 x 1% 最大生命值的伤害。回合开始时层数-1。',
    type: 'debuff'
  },
  'empowered': {
    id: 'empowered',
    name: '强化',
    description: '下一张攻击牌伤害提升150%。',
    type: 'buff',
  },
  'annihilation_mode_empowered': {
    id: 'annihilation_mode_empowered',
    name: '歼灭模式',
    description: '所有攻击伤害提升150%。',
    type: 'buff',
  },
  'charge_next_turn': {
    id: 'charge_next_turn',
    name: '蓄能',
    description: '下回合开始时获得3点[充能]。',
    type: 'buff',
  },
  'conflagration_effect': {
    id: 'conflagration_effect',
    name: '烈焰焚烧',
    description: '每当你对一名敌人施加[烧伤]时，你抽1张牌。',
    type: 'buff',
  },
  'feverish_calculation': {
    id: 'feverish_calculation',
    name: '狂热计算',
    description: '每当你弃牌时，对随机一名敌人造成30%攻击力的伤害。',
    type: 'buff',
  },
  'limit_break': {
    id: 'limit_break',
    name: '限制解除',
    description: '回合结束时，弃掉所有手牌。',
    type: 'debuff',
  },
  'kindling_effect': {
    id: 'kindling_effect', name: '薪火',
    description: '在你的回合开始时，若场上所有敌人身上的[烧伤]层数总和不低于15，抽1张牌，衍生一张临时的【熔火之心】到手牌，然后移除此状态。',
    type: 'buff'
  },
  'pain_echo_effect': {
    id: 'pain_echo_effect', name: '痛苦回响',
    description: '每回合结束时，如果本回合有人因流血而受伤，将2张0费的【苦痛】置入卡组。',
    type: 'buff'
  },
  'opening_ceremony_effect': {
    id: 'opening_ceremony_effect', name: '开幕仪典',
    description: '下回合开始时，你手牌中所有牌的费用-1。',
    type: 'buff'
  },
  'recalibrate_cp_effect': {
    id: 'recalibrate_cp_effect', name: '再校准协议',
    description: '下回合开始时，恢复1点CP。',
    type: 'buff'
  },
  'envenom_effect': {
    id: 'envenom_effect', name: '淬毒',
    description: '本回合你使用的所有攻击牌都会为敌人施加1层[中毒]。',
    type: 'buff'
  }
};