import { Card, CardRarity, StatusEffect } from '../types';

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
  'twisted_erosion': { 
    id:'twisted_erosion',
    name: '扭曲侵蚀',
    description: '造成150%攻击力 的伤害，消耗所有【扭曲熵能】。每消耗1点，额外造成5%攻击力的伤害。',
    cost: 0,
    rarity: CardRarity.RARE,
    type: 'attack',
    effect: {
      damageMultiplier: 1.5,
      target: 'enemy'
    },
    unobtainable: true,
  },
    'twisted_barrier': {
    id: 'twisted_barrier',
    name: '扭曲屏障',
    description: '消耗所有【扭曲熵能】。获得200%防御力的格挡。',
    cost: 0,
    rarity: CardRarity.RARE,
    type: 'skill',
    effect: {
      target: 'self'
    },
    unobtainable: true,
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
    id: 'abyssal_tendrils', name: '深渊触须', description: '造成100%攻击力的伤害。若此攻击命中玩家生命，则将1张0费的【海藻缠绕】洗入玩家的抽牌库。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.0, target: 'enemy' },
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
      effect: { statusEffect: 'empowered', statusEffectDuration: 1, target: 'self', statusEffectValue: 0.5 },
  },
  'enemy_tear_flesh': {
    id: 'enemy_tear_flesh',
    name: '撕咬血肉',
    description: '造成100%攻击力的伤害，并且花费对方所有的[流血]点数，每花费1层，便获得1点格挡。',
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
    description: '将2张0费的【恶臭】洗入玩家的牌库。消耗。',
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
  'slam': {
      id: 'slam',
      name: '猛击',
      description: '造成120%攻击力的伤害，如果目标有护盾，额外造成80%攻击力伤害',
      cost: 0,
      rarity: CardRarity.RARE,
      type: 'attack',
      effect: {
        target: 'enemy',
        conditionalEffect: {
          condition: {
            targetHasBlock: true 
          },
          ifTrue: {
            target: 'enemy',
            damageMultiplier: 2.0 
          },
          ifFalse: {
            target: 'enemy',
            damageMultiplier: 1.2 
          }
        }
      }
    },
  'annihilation_mode_activate': {
    id: 'annihilation_mode_activate',
    name: '歼灭模式-启动',
    description: '获得50点格挡与[歼灭模式]状态。消耗。',
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
    description: '对目标造成200%攻击力伤害，并施加5层[烧伤]，对自己造成1000%攻击力伤害。消耗。',
    cost: 0, rarity: CardRarity.EPIC, type: 'attack',
    effect: { damageMultiplier: 2.0, statusEffect: 'burn', statusEffectValue: 5, selfDamageMultiplier: 10.0, target: 'enemy', exhausts: true }
  },
  'shield_shatter': {
    id: 'shield_shatter',
    name: '护盾粉碎',
    description: '摧毁玩家所有格挡。',
    cost: 0,
    rarity: CardRarity.EPIC,
    type: 'skill',
    effect: { removeAllBlock: true, target: 'enemy' },
    unobtainable: true,
  },
  'corrupting_slam': {
    id: 'corrupting_slam',
    name: '腐化猛击',
    description: '造成180%攻击力的伤害，并将1张[恶臭]洗入玩家的弃牌堆。',
    cost: 0,
    rarity: CardRarity.EPIC,
    type: 'attack',
    effect: { damageMultiplier: 1.8, addCardToDiscard: ['stench'], target: 'enemy' },
    unobtainable: true,
  },
  'entropic_field': {
    id: 'entropic_field',
    name: '熵能领域',
    description: '获得15点格挡并对玩家施加2回合[弱化]。',
    cost: 0,
    rarity: CardRarity.RARE,
    type: 'skill',
    effect: { gainBlock: 15, statusEffect: 'weakened', statusEffectDuration: 3, target: 'enemy' },
    unobtainable: true,
  },
  'mana_disruption': {
    id: 'mana_disruption',
    name: '魔导扰乱',
    description: '迫使目标弃掉1张手牌。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: { target: 'enemy', forcePlayerDiscard: { count: 1 } },
  },
  'mind_shatter': {
    id: 'mind_shatter',
    name: '心智破碎',
    description: '造成120%攻击力的伤害，并迫使目标弃掉2张手牌。',
    cost: 0,
    rarity: CardRarity.RARE,
    type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.2, forcePlayerDiscard: { count: 2 } },
  },
  'algae_regeneration': {
    id: 'algae_regeneration',
    name: '藻类再生',
    description: '恢复25点HP。',
    cost: 0,
    rarity: CardRarity.RARE,
    type: 'skill',
    effect: { target: 'self', heal: 25 },
  },
  'endless_tide': {
    id: 'endless_tide',
    name: '无尽绿潮',
    description: '召唤1个[绿藻聚合物]。',
    cost: 0,
    rarity: CardRarity.EPIC,
    type: 'skill',
    effect: { target: 'self', summonEnemy: { enemyId: 'green_algae_polymer', count: 1 } },
  },
  'minor_regeneration': {
    id: 'minor_regeneration',
    name: '微弱再生',
    description: '恢复10点HP。',
    cost: 0,
    rarity: CardRarity.COMMON,
    type: 'skill',
    effect: { target: 'self', heal: 10 },
  },
  'magitech_lock': {
    id: 'magitech_lock', name: '魔导锁定',
    description: '抉择。玩家被迫弃掉1张牌。若弃掉的是攻击牌，则失去3点cp；若弃掉的是技能牌，使用者获得150%防御力的护盾。',
    cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: {
      target: 'enemy',
      forcePlayerDiscard: {
        count: 1,
        consequences: [
          { ifType: 'attack', effect: { target: 'self', loseCp: 3 } },
          { ifType: 'skill', effect: { target: 'self', gainBlockMultiplier: 1.5 } }
        ]
      }
    }
  },
  'crystal_pierce': {
    id: 'crystal_pierce', name: '晶体穿刺',
    description: '造成80%攻击力的伤害。若此攻击造成生命伤害，友方所有人获得50%防御力的护盾。',
    cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: {
      target: 'enemy',
      damageMultiplier: 0.8,
      onHpDamageDealt: {
        target: 'all_allies',
        gainBlockMultiplier: 0.5
      }
    }
  },
  // Garcia Entropy AI Cards
  'entropy_outburst': {
      id: 'entropy_outburst', name: '熵能爆发', description: '造成150%攻击力的伤害。消耗所有【扭曲熵能】。每消耗1点，额外造成10%攻击力的伤害。', cost: 0, rarity: CardRarity.EPIC, type: 'attack',
      effect: { damageMultiplier: 1.5, target: 'enemy' } // Special logic will be handled in reducer
  },
  'entropy_siphon_enemy': {
      id: 'entropy_siphon_enemy', name: '熵能汲取', description: '消耗10点【扭曲熵能】。随机移除玩家手牌中2张牌。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
      effect: { target: 'enemy', removeCardsFromHand: 2 } // Special logic for cost
  },
  'entropy_shield': {
      id: 'entropy_shield', name: '熵能护盾', description: '消耗5点【扭曲熵能】。获得自身防御力x2的格挡。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
      effect: { target: 'self' } // Special logic for cost and effect
  },
  'twisted_pulse': {
      id: 'twisted_pulse', name: '扭曲脉冲', description: '造成100%攻击力的伤害，并施加1层[过热]。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
      effect: { damageMultiplier: 1.0, statusEffect: 'overheated', statusEffectDuration: 2, target: 'enemy' }
  },
  // Garcia Standard Pool
  'crystallized_skin': {
      id: 'crystallized_skin', name: '晶化皮肤', description: '获得自身防御力x2的格挡。如果自身已有格挡，对随机一名敌人施加4层[烧伤]。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
      effect: { target: 'self' } // Special logic in reducer
  },
  'memory_shard': {
      id: 'memory_shard', name: '记忆碎片', description: '将1张0费的【干扰碎片】洗入玩家的抽牌库。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
      effect: { target: 'enemy', addCardToDeck: ['interference_shard'] }
  },
  'assimilate_strike': {
      id: 'assimilate_strike', name: '同化打击', description: '造成120%攻击力的伤害。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
      effect: { damageMultiplier: 1.2, target: 'enemy' }
  },
  'resonance_strike': {
      id: 'resonance_strike', name: '共鸣打击', description: '造成100%攻击力的伤害。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
      effect: { damageMultiplier: 1.0, target: 'enemy' }
  },
  // New Reworked Enemy Cards
  'algae_entanglement': {
    id: 'algae_entanglement', name: '海藻缠绕', description: '【诅咒】抽到此牌时自动打出，本回合你打出的下一张技能牌费用+2。消耗。', cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'self', onDraw: { autoPlay: true, exhausts: true }, selfStatusEffect: 'algae_entangled', selfStatusEffectDuration: 1 }, unobtainable: true,
  },
  'tide_surge': {
    id: 'tide_surge', name: '潮汐涌动', description: '对目标施加3回合[过热]。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', statusEffect: 'overheated', statusEffectDuration: 4 },
  },
  'abyssal_grapple': {
    id: 'abyssal_grapple', name: '深渊触击', description: '造成120%攻击力的伤害。若此攻击命中玩家生命，则施加1层[束缚]，并额外为目标施加3层[流血]。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.2, target: 'enemy' },
  },
  'ink_volley': {
    id: 'ink_volley', name: '墨汁喷吐', description: '造成2次100%攻击力的伤害。随机选择玩家手牌中的一张牌，使其费用在本回合结束前+2。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.0, hitCount: 2, target: 'enemy' },
  },
  'energy_drain': {
    id: 'energy_drain', name: '能量汲取', description: '移除玩家1点CP。若CP不足，转为受到5点伤害。', cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'enemy' },
  },
  'overload_feedback': {
    id: 'overload_feedback', name: '过载反馈', description: '造成100%攻击力的伤害。若玩家有护盾，则额外造成50%伤害。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: { damageMultiplier: 1.0, target: 'enemy' },
  },
  'reinforced_armor_v1': {
    id: 'reinforced_armor_v1', name: '强化装甲', description: '获得自身防御力x1.2的格挡。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', gainBlockFromDefenseMultiplier: 1.2 },
  },
  'reinforced_armor_v2': {
    id: 'reinforced_armor_v2', name: '强化装甲', description: '获得自身防御力x2的格挡。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', gainBlockFromDefenseMultiplier: 2.0 },
  },
  'lock_on_strike': {
    id: 'lock_on_strike', name: '锁定打击', description: '造成150%攻击力的伤害。若场上存在友方构装体，则额外造成50%攻击力的伤害。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { damageMultiplier: 1.5, target: 'enemy' },
  },
  'emergency_deployment': {
    id: 'emergency_deployment', name: '紧急部署', description: '部署1个【哨兵无人机】。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', deployConstruct: 'sentry_drone' },
  },
  'drone_apply_weak': {
    id: 'drone_apply_weak', name: '削弱光线', description: '对目标施加1回合[弱化]。', cost: 0, rarity: CardRarity.COMMON, type: 'skill',
    effect: { target: 'enemy', statusEffect: 'weakened', statusEffectDuration: 2 }, unobtainable: true,
  },
  // PROWELL REWORK
  'abyssal_summon': {
    id: 'abyssal_summon', name: '深渊召唤', description: '召唤1个【深潜幼体】。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', summonEnemy: { enemyId: 'deep_one_larva', count: 1 } },
  },
  'abyssal_torrent': {
    id: 'abyssal_torrent', name: '深渊洪流', description: '对敌方所有人造成120%攻击力的伤害。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.2 },
  },
  'deep_sea_siphon_tide': {
    id: 'deep_sea_siphon_tide', name: '潮汐：深海汲取', description: '消耗场上所有友方小怪的生命值。每消耗10点HP，普罗威尔恢复5点HP。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { 
      target: 'self', 
      customEffect: 'deep_sea_siphon' 
  },
  },
  'great_abyss_shield': {
    id: 'great_abyss_shield', name: '大渊护盾', description: '获得自身防御力x2的格挡，并施加1回合[护盾]。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', gainBlockFromDefenseMultiplier: 2.0, statusEffect: 'shielded', statusEffectDuration: 2 },
  },
  'abyssal_weaken': {
    id: 'abyssal_weaken', name: '深渊诅咒', description: '对玩家施加2回合[弱化]。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', statusEffect: 'weakened', statusEffectDuration: 3 },
  },
  'abyssal_vulnerable': {
    id: 'abyssal_vulnerable', name: '深渊诅咒', description: '对玩家施加2回合[易伤]。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', statusEffect: 'vulnerable', statusEffectDuration: 3 },
  },
  'abyssal_tentacle': {
    id: 'abyssal_tentacle', name: '深渊触手', description: '造成120%攻击力的伤害，并随机丢弃玩家一张卡。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.2, forcePlayerDiscard: { count: 1 } },
  },
  // ASTAROTH REWORK
  'blood_sacrifice_strike': {
    id: 'blood_sacrifice_strike', name: '血祭强袭', description: '造成150%攻击力的伤害。此攻击会根据玩家的[流血]层数造成大量额外伤害。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 2.5 },
  },
  'blood_siphon_catalyst': {
    id: 'blood_siphon_catalyst', name: '汲血触媒', description: '施加10层[流血]，并恢复16点HP。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'enemy', statusEffect: 'bleed', statusEffectValue: 10, heal: 16 },
  },
  'bloody_offering_tide': {
    id: 'bloody_offering_tide', name: '潮汐：血腥献祭', description: '消耗玩家的[流血]状态，恢复大量生命值并获得永久[强化]。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'self', heal: 50, statusEffect: 'empowered', statusEffectValue: 1.0, statusEffectDuration: 999 },
  },
  'flesh_rend': {
    id: 'flesh_rend', name: '血肉裂解', description: '造成100%攻击力的伤害，并施加5层[流血]。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.0, statusEffect: 'bleed', statusEffectValue: 5 },
  },
  // BELPHEGOR REWORK
  'scorching_core': {
    id: 'scorching_core', name: '炽热核心', description: '获得自身防御力x2的格挡。若自身带有[烧伤]状态，额外获得自身防御力的格挡。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', gainBlockFromDefenseMultiplier: 3.0 },
  },
  'lava_eruption': {
    id: 'lava_eruption', name: '熔岩喷涌', description: '造成120%攻击力的伤害，并对玩家施加5层[烧伤]。', cost: 0, rarity: CardRarity.COMMON, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 1.2, statusEffect: 'burn', statusEffectValue: 5 },
  },
  'incinerate_all_tide': {
    id: 'incinerate_all_tide', name: '潮汐：焚尽一切', description: '移除自身所有[烧伤]层数，对所有敌人造成毁灭性的固定伤害，并永久强化自身。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'enemy', fixedDamage: 100, statusEffect: 'empowered', statusEffectValue: 0.5, statusEffectDuration: 999 },
  },
  // MARKUS REWORK
  'entropy_overload_strike_markus': {
      id: 'entropy_overload_strike_markus', name: '熵能超载冲击', description: '造成150%攻击力的伤害。消耗所有【扭曲熵能】。每消耗1点，额外造成10%攻击力的伤害。', cost: 0, rarity: CardRarity.EPIC, type: 'attack',
      effect: { damageMultiplier: 1.5, target: 'enemy' }
  },
  'entropy_siphon_enemy_markus': {
      id: 'entropy_siphon_enemy_markus', name: '熵能汲取', description: '消耗10点【扭曲熵能】。随机移除玩家手牌中2张牌。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
      effect: { target: 'enemy', removeCardsFromHand: 2 }
  },
  'annihilation_sequence': {
    id: 'annihilation_sequence', name: '湮灭序列', description: '造成200%攻击力的伤害，无视50%的格挡。', cost: 0, rarity: CardRarity.RARE, type: 'attack',
    effect: { target: 'enemy', damageMultiplier: 2.0, pierceMultiplier: 0.5 },
  },
  'system_optimization': {
    id: 'system_optimization', name: '系统优化', description: '获得自身防御力x2的格挡，并移除自身所有负面状态。', cost: 0, rarity: CardRarity.RARE, type: 'skill',
    effect: { target: 'self', gainBlockFromDefenseMultiplier: 2.0 },
  },
  'singularity_paradox_tide': {
    id: 'singularity_paradox_tide', name: '潮汐：奇点悖论', description: '消耗所有【扭曲熵能】，对玩家施加一个随机的【悖论】效果，扭曲战斗规则。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'enemy', statusEffect: 'paradox_damage_reduction', statusEffectDuration: 2 },
  },
  'desperate_counter_entropy': {
    id: 'desperate_counter_entropy', name: '绝望反击：熵能潮汐', description: '立即将自己的【扭曲熵能】量表提升20点，并获得一个随机的【悖论】效果。', cost: 0, rarity: CardRarity.EPIC, type: 'skill',
    effect: { target: 'enemy', statusEffect: 'paradox_draw_reduction', statusEffectDuration: 2 },
  },
};
