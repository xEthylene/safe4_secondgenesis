

import { CardRarity, Equipment, Affix, EquipmentSet, EquipmentSlot, WeaponTemplate, EquipmentTemplate } from '../types';

export const EQUIPMENT_SETS: Record<string, EquipmentSet> = {
  'aegis_defender': {
    id: 'aegis_defender',
    name: '神盾防御者',
    items: ['aegis_gauntlet_item', 'aegis_protocol_equip'],
    bonuses: [
      {
        count: 2,
        description: '回合开始时，获得50%防御力的格挡。',
        effects: { onTurnStart: { gainBlockPercent: 0.5 } },
      }
    ],
  },
};

export const WEAPON_TEMPLATES: Record<string, WeaponTemplate> = {
    'standard_issue': {
        id: 'standard_issue', name: '制式刃', 
        corePassiveDescription: '击败敌人时，恢复8点HP。',
        corePassive: { onKillHeal: 8 }
    },
    'aegis_gauntlet': {
        id: 'aegis_gauntlet', name: '神盾臂铠',
        corePassiveDescription: '你从技能牌获得的格挡值提升20%。',
        corePassive: { skillBlockBonus: 0.20 }
    },
    'pyre_blade': {
        id: 'pyre_blade', name: '薪火之刃',
        corePassiveDescription: '你的[烧伤]造成的伤害有10%的几率造成暴击(150%伤害)。',
        corePassive: { burnCritChance: 0.1, burnCritMultiplier: 1.5 }
    },
    'bleeder_stinger': {
        id: 'bleeder_stinger', name: '放血者之刺',
        corePassiveDescription: '你对处于[流血]状态的敌人造成的攻击伤害提升20%。',
        corePassive: { attackDamageBonusVsBleed: 0.20 }
    },
    'kinetic_converter': {
        id: 'kinetic_converter', name: '动能转换器',
        corePassiveDescription: '每当你消耗[充能]时，获得等同于消耗层数x2的格挡。',
        corePassive: { onChargeConsumedBlock: 2 }
    },
    'data_delete_dagger': {
        id: 'data_delete_dagger', name: '数据删除匕首',
        corePassiveDescription: '每回合你第一次弃牌时，你的下一张攻击牌伤害提升50%。',
        corePassive: { onFirstDiscard: { nextAttackDamageBonus: 0.5 } }
    },
    'hi_freq_blade': {
        id: 'hi_freq_blade', name: '高频振荡刃',
        corePassiveDescription: '你每回合打出的第一张攻击牌会额外攻击一次，造成30%的伤害。',
        corePassive: { firstAttackExtraHit: { damageMultiplier: 0.3 } }
    },
    'entropy_hammer': {
        id: 'entropy_hammer', name: '熵灭重锤',
        corePassiveDescription: '在一场战斗中，你每打出3张不同的攻击牌，便永久为你手牌和牌库中所有同名牌提升5%伤害。',
        corePassive: { onEveryXDifferentAttacks: { count: 3, permanentDamageBonus: 0.05 } }
    },
    'phase_shifter': {
        id: 'phase_shifter', name: '相位穿梭刃',
        corePassiveDescription: '你每回合的第一次攻击无视敌人30%的格挡。',
        corePassive: { firstAttackIgnoresBlock: 0.3 }
    },
    'opportunist_sword': {
        id: 'opportunist_sword', name: '机会主义短剑',
        corePassiveDescription: '你对拥有减益状态（Debuff）的敌人造成的攻击伤害提升15%。',
        corePassive: { attackDamageBonusVsDebuff: 0.15 }
    },
    'berserker_axe': {
        id: 'berserker_axe', name: '狂战士巨斧',
        corePassiveDescription: '你的HP每降低10%，你的攻击力便提升5%。',
        corePassive: { hpLossAttackBonus: { hpPercentage: 10, attackPercentage: 0.05 } }
    },
    'tactical_analyzer': {
        id: 'tactical_analyzer', name: '战术分析仪',
        corePassiveDescription: '当你打出费用为2或更高的攻击牌时，抽1张牌（每回合1次）。',
        corePassive: { onHighCostAttack: { minCost: 2, drawCards: 1 } }
    }
};

export const EQUIPMENT_TEMPLATES: Record<string, EquipmentTemplate> = {
    'standard_reactor': {
        id: 'standard_reactor', name: '标准反应堆', baseStat: 'maxHp',
        corePassiveDescription: '最大HP +{随进度成长的数值}。',
        corePassive: {}
    },
    'cp_capacitor': {
        id: 'cp_capacitor', name: '算力电容', baseStat: 'maxCp',
        corePassiveDescription: '最大CP +{随进度成长的数值}。',
        corePassive: {}
    },
    'aegis_protocol': {
        id: 'aegis_protocol', name: '神盾协议', baseStat: 'maxHp',
        corePassiveDescription: '你从卡牌获得的格挡值提升25%。',
        corePassive: { skillBlockBonus: 0.25 }
    },
    'self_repair_system': {
        id: 'self_repair_system', name: '自修复系统', baseStat: 'maxHp',
        corePassiveDescription: '回合结束时，若你本回合未受到生命伤害，则恢复5点HP。',
        corePassive: { onNoHpDamageHeal: 5 }
    },
    'tactical_scope': {
        id: 'tactical_scope', name: '战术目镜', baseStat: 'maxCp',
        corePassiveDescription: '每当你使用3张牌后，抽1张牌。',
        corePassive: { afterCardsPlayed: { count: 3, drawCards: 1 } }
    },
    'overload_capacitor': {
        id: 'overload_capacitor', name: '超载电容器', baseStat: 'maxCp',
        corePassiveDescription: '你的[充能]层数不会在回合结束时清空。',
        corePassive: { chargeNoDecay: true }
    },
    'thermal_armor': {
        id: 'thermal_armor', name: '隔热装甲', baseStat: 'maxHp',
        corePassiveDescription: '回合开始时，场上每有一个处于[烧伤]状态的敌人，便获得20%防御力的格挡。',
        corePassive: { onBurnEnemyBlock: 0.2 }
    },
    'pain_amplifier': {
        id: 'pain_amplifier', name: '痛苦放大器', baseStat: 'maxHp',
        corePassiveDescription: '你对敌人施加[流血]时，也会对其施加1回合[易伤]（每回合1次）。',
        corePassive: { onBleedApplyVulnerable: { duration: 1 } }
    },
    'recycling_processor': {
        id: 'recycling_processor', name: '回收处理器', baseStat: 'maxCp',
        corePassiveDescription: '每回合你第一次弃牌时，抽1张牌。',
        corePassive: { onFirstDiscardDraw: 1 }
    },
    'singularity_core': {
        id: 'singularity_core', name: '奇点核心', baseStat: 'maxHp',
        corePassiveDescription: '当你打出费用为3或更高的牌时，获得50%防御力的格挡。',
        corePassive: { onHighCostCardBlock: { minCost: 3, blockMultiplier: 0.5 } }
    },
    'adrenaline_pump': {
        id: 'adrenaline_pump', name: '肾上腺素泵', baseStat: 'maxHp',
        corePassiveDescription: '当你的生命值首次低于50%时，立刻获得2点CP并抽2张牌。',
        corePassive: { onHpBelowThreshold: { threshold: 50, gainCp: 2, drawCards: 2 } }
    },
    'status_analyzer': {
        id: 'status_analyzer', name: '状态分析仪', baseStat: 'maxCp',
        corePassiveDescription: '每当你对敌人施加一个减益状态（Debuff）时，获得1点[充能]。',
        corePassive: { onDebuffGainCharge: 1 }
    }
};

export const WEAPON_AFFIX_POOL: Affix[] = [
    // --- Basic Stats ---
    { description: '攻击力 +{value}', effect: { attack: 5 } },
    { description: '防御 +{value}', effect: { defense: 3 } },
    { description: '防御力 +{value}', effect: { blockPower: 4 } },
    { description: '最大HP +{value}', effect: { maxHp: 10 } },
    // --- Keyword Synergy ---
    { description: '你施加的[烧伤]层数+{value}', effect: { applyBurnStacks: 2 } },
    { description: '你施加的[流血]层数+{value}', effect: { applyBleedStacks: 2 } },
    { description: '你的[充能]获取量+{value}', effect: { extraChargeGain: 1 } },
    { description: '[烧伤]造成的伤害提升20%。', effect: { burnDamageBonus: 0.20 } },
    { description: '[流血]造成的伤害提升20%。', effect: { bleedDamageBonus: 0.20 } },
    // --- Triggered Effects ---
    { description: '击中时有20%几率施加4层[烧伤]', effect: { applyBurnOnHit: { chance: 0.2, value: 4, duration: 999 } } },
    { description: '击中时有20%几率施加3层[流血]', effect: { applyBleedOnHit: { chance: 0.2, value: 3, duration: 999 } } },
    { description: '击中时有15%几率施加1回合[弱化]', effect: { applyWeakOnHit: { chance: 0.15, duration: 2 } } },
    { description: '击中时有15%几率施加1回合[易伤]', effect: { applyVulnerableOnHit: { chance: 0.15, duration: 2 } } },
    // --- Tactical ---
    { description: '对生命值高于80%的敌人，伤害提升25%。', effect: { damageBonusVsHighHealth: { threshold: 80, bonus: 0.25 } } },
    { description: '对生命值低于40%的敌人，伤害提升25%。', effect: { damageBonusVsLowHealth: { threshold: 40, bonus: 0.25 } } },
    { description: '击败敌人时，抽1张牌。', effect: { onKillDraw: 1 } },
    { description: '你的第一张攻击牌费用-1。', effect: { firstAttackCostReduction: 1 } },
];

export const EQUIPMENT_AFFIX_POOL: Affix[] = [
    // --- Basic Stats ---
    { description: '最大HP +{value}', effect: { maxHp: 20 } },
    { description: '最大CP +{value}', effect: { maxCp: 3 } },
    { description: '防御 +{value}', effect: { defense: 3 } },
    { description: '防御力 +{value}', effect: { blockPower: 5 } },
    // --- Resource Management ---
    { description: 'CP恢复 +1', effect: { cpRecovery: 1 } },
    { description: '战斗开始时，额外抽1张牌', effect: { initialDraw: 1 } },
    { description: '当你格挡所有攻击伤害时，抽1张牌', effect: { onBlockAllDamage: { drawCards: 1 } } },
    // --- Keyword Synergy ---
    { description: '每当你获得[充能]时，额外获得1点', effect: { extraChargeGain: 1 } },
    { description: '你施加的所有减益状态持续时间+1回合', effect: { debuffDurationBonus: 1 } },
    { description: '你对自己施加的所有增益状态持续时间+1回合', effect: { buffDurationBonus: 1 } },
    { description: '[烧伤]造成的伤害提升20%', effect: { burnDamageBonus: 0.20 } },
    { description: '[流血]造成的伤害提升20%', effect: { bleedDamageBonus: 0.20 } },
    // --- Tactical ---
    { description: '回合开始时，获得1点[充能]', effect: { onTurnStart: { gainCharge: 1 } } },
    { description: '回合开始时，获得30%防御力的格挡', effect: { onTurnStart: { gainBlockPercent: 0.3 } } },
    { description: '使用技能牌后，恢复3点HP', effect: { onSkillHeal: 3 } },
    { description: '受到的[烧伤]和[流血]伤害降低25%', effect: { dotReduction: 0.25 } },
];


export const EQUIPMENT: Record<string, Equipment> = {
  // --- STARTER GEAR ---
  'basic_blade': {
    id: 'basic_blade',
    name: '制式刃',
    description: WEAPON_TEMPLATES['standard_issue'].corePassiveDescription,
    slot: 'weapon',
    rarity: CardRarity.COMMON,
    templateId: 'standard_issue',
    baseEffects: { attack: 10 },
    affixes: [],
  },
  'starter_reactor': {
    id: 'starter_reactor',
    name: '标准反应堆',
    description: EQUIPMENT_TEMPLATES['standard_reactor'].corePassiveDescription,
    slot: 'equipment',
    rarity: CardRarity.COMMON,
    templateId: 'standard_reactor',
    baseEffects: { maxHp: 15 },
    affixes: [],
  },
  'starter_capacitor': {
    id: 'starter_capacitor',
    name: '算力电容',
    description: EQUIPMENT_TEMPLATES['cp_capacitor'].corePassiveDescription,
    slot: 'equipment',
    rarity: CardRarity.COMMON,
    templateId: 'cp_capacitor',
    baseEffects: { maxCp: 2 },
    affixes: [],
  },

  // --- SET: AEGIS DEFENDER ---
  'aegis_gauntlet_item': {
    id: 'aegis_gauntlet_item',
    name: '神盾臂铠',
    description: WEAPON_TEMPLATES['aegis_gauntlet'].corePassiveDescription,
    slot: 'weapon',
    rarity: CardRarity.RARE,
    setId: 'aegis_defender',
    templateId: 'aegis_gauntlet',
    baseEffects: { attack: -2, defense: 3, blockPower: 5 },
    affixes: [],
  },
  'aegis_protocol_equip': {
    id: 'aegis_protocol_equip',
    name: '神盾协议',
    description: EQUIPMENT_TEMPLATES['aegis_protocol'].corePassiveDescription,
    slot: 'equipment',
    rarity: CardRarity.RARE,
    setId: 'aegis_defender',
    templateId: 'aegis_protocol',
    baseEffects: { maxHp: 20, defense: 5 },
    affixes: [],
  },
};