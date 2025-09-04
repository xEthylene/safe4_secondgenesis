import { Card, CardRarity } from '../types';

export const RARE_CARDS: Record<string, Card> = {
  'piercing_strike': {
    id: 'piercing_strike', name: '贯穿打击', description: '造成120%攻击力的伤害。此攻击无视50%的格挡。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.2, pierceMultiplier: 0.5, target: 'enemy' }, keywords: ['贯穿'],
  },
  'preemptive_guard': {
    id: 'preemptive_guard', name: '迎击架势', description: '获得100%防御力的格挡。获得[反击] (回击)。', cost: 2, rarity: CardRarity.RARE, type: 'skill',
    effect: { gainBlockMultiplier: 1.0, grantsCounter: 'counter_strike', target: 'self' }, keywords: ['反击'],
  },
  'overclock_strike': {
    id: 'overclock_strike', name: '极限驱动', description: '花费8点HP，造成200%攻击力的伤害。此牌不消耗CP。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 2.0, overclockCost: 8, target: 'enemy' }, keywords: ['过载'],
  },
  'release_power': {
    id: 'release_power', name: '核心能量释放', description: '花费至多3层[充能]。每层[充能]造成80%攻击力的伤害。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 0, consumeChargeMultiplier: 0.8, maxConsumeCharge: 3, target: 'enemy' }, keywords: ['充能'],
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
    id: 'chain_reaction', name: '连锁反应', description: '获得3层[连锁]状态。', cost: 3, rarity: CardRarity.RARE, type: 'skill',
    effect: { statusEffect: 'chaining', statusEffectDuration: 999, statusEffectValue: 3, target: 'self' }, keywords: ['连锁'],
  },
  'concentrate_fire': {
    id: 'concentrate_fire', name: '集中火力', description: '获得[强化]状态。你的下一张攻击牌伤害提升50%。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { statusEffect: 'empowered', statusEffectDuration: 2, statusEffectValue: 0.5, target: 'self' }, keywords: ['强化'],
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
    description: '抉择：\n• 花费5点[充能]，抽3张牌。\n• 获得3点[充能]，抽1张牌。',
    cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: {
      target: 'self',
      choiceEffect: {
        options: [
          {
            description: '花费5充能，抽3张牌',
            effect: { target: 'self', chargeCost: 5, drawCards: 3 }
          },
          {
            description: '获得3充能，抽1张牌',
            effect: { target: 'self', gainCharge: 3, drawCards: 1 }
          }
        ]
      }
    }, keywords: ['充能', '抉择'],
  },
  'cauterize': {
    id: 'cauterize', name: '热能固化', description: '获得80%防御力的格挡。如果目标敌人处于[烧伤]状态，额外获得80%防御力的格挡。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', gainBlockMultiplier: 0.8, bonusEffect: { condition: 'target_has_burn', effect: { gainBlockMultiplier: 0.8 } } }, keywords: ['烧伤'],
  },
  'lightning_reflexes': {
    id: 'lightning_reflexes', name: '反应优化', description: '获得50%防御力的格挡。获得[蓄能]。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', gainBlockMultiplier: 0.5, statusEffect: 'charge_next_turn', statusEffectDuration: 2, statusEffectValue: 3 }, keywords: ['充能', '蓄能'],
  },
  'hemorrhage': {
    id: 'hemorrhage', name: '动脉破裂', description: '造成70%攻击力的伤害。施加8层[流血]。抽1张牌。', cost: 1, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 0.7, statusEffect: 'bleed', statusEffectValue: 8, drawCards: 1 }, keywords: ['流血'],
  },
  'flesh_and_blood': {
    id: 'flesh_and_blood',
    name: '血债血偿',
    description: '消耗至多3层[流血]，每层造成70%攻击力的伤害。若以此法消耗了至少1层[流血]，恢复1点CP。',
    cost: 1,
    rarity: CardRarity.RARE,
    type: 'attack',
    effect: { 
        target: 'enemy', 
        consumeStatus: { effectId: 'bleed', damagePerStackMultiplier: 0.70, maxConsumeStacks: 3, gainCpOnConsume: 1 } 
    }, 
    keywords: ['流血'],
  },
  'firewall': {
    id: 'firewall', name: '防火墙', description: '获得100%防御力的格挡。对所有敌人施加3层[烧伤]。', cost: 3, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'all_enemies', gainBlockMultiplier: 1.0, statusEffect: 'burn', statusEffectValue: 3 }, keywords: ['烧伤'],
  },
  'heat_sink': {
    id: 'heat_sink', name: '散热', description: '获得50%防御力的格挡。如果目标敌人处于[烧伤]状态，恢复1点CP。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', gainBlockMultiplier: 0.5, bonusEffect: { condition: 'target_has_burn', effect: { gainCp: 1 } } }, keywords: ['烧伤'],
  },
  'karma_fire': {
    id: 'karma_fire', name: '业火', description: '造成120%攻击力的伤害。若目标敌人处于[烧伤]状态，获得2张【罪业】放入卡组并抽1张牌。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { 
        target: 'enemy', 
        damageMultiplier: 1.2, 
        bonusEffect: { 
            condition: 'target_has_burn', 
            effect: { 
                addCardToDeck: ['sin_card', 'sin_card'],
                drawCards: 1
            } 
        }
    }, 
    keywords: ['烧伤'],
  },
  'blood_frenzy': {
    id: 'blood_frenzy',
    name: '血之狂潮',
    description: '获得[放血]状态（3回合）。\n【放血】(状态): 每当你的攻击造成生命值伤害时，额外消耗目标敌人1层[流血]，每层造成15%攻击力的额外伤害。',
    cost: 2,
    rarity: CardRarity.RARE,
    type: 'power',
    effect: {
        target: 'self',
        exhausts: true,
        selfStatusEffect: 'exsanguination',
        selfStatusEffectDuration: 4,
    },
    keywords: ['流血', '能力', '消耗'],
  },
  'blood_frenzy_old': {
    id: 'blood_frenzy_old', name: '血腥狂乱', description: '抽1张牌。如果目标敌人处于[流血]状态，则额外再抽1张牌并恢复1点CP，然后扣除目标1/3的[流血]层数。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
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
    id: 'pulse_bomb', name: 'EMP爆破', description: '对所有敌人造成100%攻击力的伤害。被弃置时抽1张牌，对所有敌人造成50%攻击力的伤害。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'all_enemies', damageMultiplier: 1.0, onDiscard: { target: 'all_enemies', drawCards: 1, damageMultiplier: 0.5 } }, keywords: ['弃牌'],
  },
  'magitech_blade_arts_1': {
    id: 'magitech_blade_arts_1', name: '魔导剑术 - 序', description: '造成100%攻击力伤害，并且向牌库加入【魔导剑术 - 破】。消耗。', cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.0, exhausts: true, addCardToDeck: ['magitech_blade_arts_2'] }, keywords: ['衍生', '消耗'],
  },
  'limit_break': {
    id: 'limit_break', name: '限制解除', description: '获得5层[连锁]。获得[限制解除]状态。', cost: 2, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', statusEffect: 'limit_break', statusEffectDuration: 2 }, keywords: ['连锁', '限制解除'],
  },
  'magitech_terminal_infinite': {
    id: 'magitech_terminal_infinite', name: '魔导终端-无限', description: '花费2点[充能]抽2张牌。无限。递增。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', chargeCost: 2, drawCards: 2, returnsToHand: true, costIncreaseOnUseThisTurn: 1 }, keywords: ['充能', '衍生', '无限', '递增']
  },
  'overload_cycle': {
    id: 'overload_cycle', name: '超载循环', description: '花费至多3层[充能]。每花费1层[充能]，抽1张牌，然后弃1张牌。', cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', maxConsumeCharge: 3, drawPerChargeConsumed: 1, discardPerChargeConsumed: 1 }, keywords: ['充能', '弃牌'],
  },
  'molten_heart': {
    id: 'molten_heart', name: '熔火之心', description: '所有的敌人都有[烧伤]时才能发动，抽2张卡。',
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
    description: '抽1张牌。获得[开幕仪典]状态。',
    cost: 3, rarity: CardRarity.RARE, type: 'skill',
    effect: {
        target: 'self',
        drawCards: 1,
        statusEffect: 'opening_ceremony_effect',
        statusEffectDuration: 2,
    }, keywords: ['开幕仪典'],
  },
  'magitech_terminal_recursive': {
    id: 'magitech_terminal_recursive', name: '魔导终端-递归回路',
    description: '获得2点[充能]。无限。',
    cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', gainCharge: 2, returnsToHand: true }, keywords: ['充能', '无限']
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
    description: '抉择：对一名敌人造成等同于其[中毒]层数x20%攻击力的伤害；或你恢复等同于其[中毒]层数x2的HP。那之后，移除该敌人一半的[中毒]层数。',
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
    description: '获得[淬毒]状态。',
    cost: 2, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', statusEffect: 'envenom_effect', statusEffectDuration: 1 }, keywords: ['中毒', '淬毒']
  },
  'tome_of_hellfire': {
    id: 'tome_of_hellfire', name: '业火之魔导书',
    description: '发现：从所有稀有的[烧伤]卡牌中发现一张。发现的卡牌获得[消耗]效果。',
    cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', discover: { from: 'all_rare_burn', options: 3, addExhaust: true } },
    keywords: ['发现', '烧伤'],
  },
  'scroll_of_wisdom': {
    id: 'scroll_of_wisdom', name: '智慧卷轴',
    description: '抽1张牌。演化(5): 当此牌累计为你抽了5张牌后，此牌将永久演化为【洞见卷轴】。',
    cost: 1, rarity: CardRarity.RARE, type: 'skill',
    effect: { 
      target: 'self', 
      drawCards: 1,
      evolve: { 
        condition: { type: 'cards_drawn_by_this', threshold: 5 },
        to: 'scroll_of_insight',
        progressKey: 'wisdom_scroll_drawn'
      }
    },
    keywords: ['演化'],
  },
  'laplaces_railgun': {
    id: 'laplaces_railgun', name: '拉普拉斯的磁轨炮',
    description: '抽1张牌。造成230%攻击力伤害，并为敌人施加1层[弱化]。演化(2): 当此牌使用2次后，将永久演化为【拉普拉斯的充能炮】。',
    cost: 2, rarity: CardRarity.RARE, type: 'attack',
    effect: { 
      target: 'enemy',
      drawCards: 1,
      damageMultiplier: 2.3,
      statusEffect: 'weakened',
      statusEffectDuration: 2,
      evolve: {
        condition: { type: 'times_played', threshold: 2 },
        to: 'laplaces_charge_cannon',
        progressKey: 'laplace_railgun_used'
      }
    },
    keywords: ['演化'],
  },
  'foresight': {
    id: 'foresight',
    name: '预见',
    description: '发现：从你的牌库中发现一张牌的复制品。消耗。',
    cost: 1,
    rarity: CardRarity.RARE,
    type: 'skill',
    effect: {
      target: 'self',
      discover: { from: 'deck', options: 3, makeCopy: true },
      exhausts: true
    },
    keywords: ['发现', '消耗'],
  },
  'blood_trail': {
    id: 'blood_trail', name: '寻血',
    description: '溯源：从你的弃牌堆中选择一张攻击牌置入手牌，其费用-1。造成等同于所选牌基础攻击力50%的伤害，并施加5层[流血]。',
    cost: 2, rarity: CardRarity.RARE, type: 'skill',
    effect: {
        target: 'self',
        trace: {
            from: 'discard',
            cardType: 'attack',
            action: 'add_to_hand_with_mod',
            costModifier: -1,
            postChoiceEffect: {
                target: 'enemy',
                damageMultiplierFromContext: { ratio: 0.5 },
                statusEffect: 'bleed',
                statusEffectValue: 5,
            }
        }
    },
    keywords: ['溯源', '流血'],
  },
};