import { StatusEffect } from '../types';

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
    description: '下一张攻击牌伤害提升50%。',
    type: 'buff',
  },
  'annihilation_mode_empowered': {
    id: 'annihilation_mode_empowered',
    name: '歼灭模式',
    description: '所有攻击伤害提升125%。',
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
  },
  'exsanguination': {
    id: 'exsanguination',
    name: '放血',
    description: '每当你的攻击造成生命值伤害时，额外消耗目标敌人1层[流血]，每层造成15%攻击力的额外伤害。',
    type: 'buff'
  },
  'plan_ahead_draw': {
      id: 'plan_ahead_draw',
      name: '筹划',
      description: '下回合开始时，抽2张卡。',
      type: 'buff'
  },
  'desperate_strike_discard': {
      id: 'desperate_strike_discard',
      name: '舍身',
      description: '回合结束时，随机弃置2张卡。',
      type: 'debuff'
  },
  'interference_shard_debuff': {
    id: 'interference_shard_debuff',
    name: '干扰碎片',
    description: '你本回合打出的第一张攻击牌伤害降低50%。',
    type: 'debuff'
  },
  'algae_entangled': {
    id: 'algae_entangled',
    name: '海藻缠绕',
    description: '下一张技能牌费用+2。',
    type: 'debuff',
  },
  'abyssal_echo': {
    id: 'abyssal_echo',
    name: '深渊回响',
    description: '每当一个友方小怪被击败时，获得5点格挡，并有25%几率将1张【腐败之触】洗入玩家的弃牌堆。',
    type: 'buff'
  },
  'bloodthirsty_assimilation': {
    id: 'bloodthirsty_assimilation',
    name: '嗜血同化',
    description: '回合开始时，若玩家带有[流血]状态，则永久获得+2攻击力。',
    type: 'buff'
  },
  'damage_reduction_20': {
    id: 'damage_reduction_20',
    name: '腐化',
    description: '下一张攻击牌伤害降低20%。',
    type: 'debuff'
  },
  'paradox_damage_reduction': {
    id: 'paradox_damage_reduction',
    name: '悖论：衰减',
    description: '所有攻击牌伤害降低50%。',
    type: 'debuff'
  },
  'paradox_skill_cost_increase': {
    id: 'paradox_skill_cost_increase',
    name: '悖论：封锁',
    description: '所有技能牌费用+2。',
    type: 'debuff'
  },
  'paradox_draw_reduction': {
    id: 'paradox_draw_reduction',
    name: '悖论：闭锁',
    description: '下回合抽牌数-1。',
    type: 'debuff'
  },
};
