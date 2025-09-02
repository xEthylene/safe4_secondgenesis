

export enum GameStatus {
  TITLE_SCREEN,
  PROLOGUE_START,
  HUB,
  MISSION_BRIEFING,
  MISSION_START,
  IN_MISSION_DIALOGUE,
  COMBAT_START,
  IN_MISSION_COMBAT,
  MISSION_VICTORY,
  GAME_OVER,
  CHOICE_SCREEN,
  GAME_COMPLETE,
  SUPPLY_STOP,
}

export enum Character {
  Player = "我",
  System = "系统音",
  StrangeVoice = "奇怪的声音",
  Adela = "阿德拉",
  Yuedai = "雨宫•月代",
  Markus = "马库斯",
  MysteriousVoice = "神秘的声音",
  BlackThrushCrow = "黑喉鹊鸦",
  EchoGuard = "回声的押运员",
  SilentCharon = "送葬者 ”沉默的卡戎“",
  ImmortalGangMember = "永生帮成员",
  Rex = "雷克斯",
  Garcia = "加西亚",
  Prowell = "普罗威尔",
  Koroel = '"金翅雀"可珞儿',
  RangerA = "游骑兵A",
  OldDogDaniel = "“老狗”丹尼尔",
  SouthwestHunterLeader = "黑帮首领",
  SouthwestHunterMember = "黑帮成员",
  NightOwlLogisticsA = "夜枭后勤人员A",
  NightOwlLogisticsB = "夜枭后勤人员B",
  GarciaSubordinate = "？？？",
  InvestigatorHaiyan = "调查员“海燕”",
  InvestigatorFengbao = "调查员“风暴”",
  InvestigatorXinfeng = "调查员“信风”",
  UNCommander = "指挥官？",
  UNHQ = "指挥部？",
  Astaroth = '"无感动"亚斯塔洛特',
  Belphegor = '"丑恶"贝芬格',
  DreitonAdela = "(Dreiton)阿德拉",
  Log = "音频日志片段",
  GangLeader = "黑帮首領",
  GangMember = "黑帮成员",
  NightOwlMember1 = "？？？",
  NightOwlMember2 = "？？？",
  NightOwlMember3 = "？？？",
  NightOwlMember4 = "？？？",
}


export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  duration: number;
  type: 'buff' | 'debuff';
  value?: number; // for stacks/percentage
  sourceAttack?: number;
  data?: any; // For storing extra info, like cards to discard at EOT
}

// --- NEW CONSTRUCT SYSTEM ---
export interface ConstructBehavior {
  onTurnEnd?: {
    cardId: string;
    target: 'random_enemy' | 'owner';
  };
  onDestroy?: {
    cardId: string;
    target: 'designated_target' | 'all_enemies' | 'all_allies';
  }
}

export interface ConstructTemplate {
  id: string;
  name: string;
  description: string;
  behavior: ConstructBehavior;
  statScaling: {
    maxHp: { ownerStat: 'maxHp', multiplier: number };
    attack: { ownerStat: 'attack', multiplier: number };
    defense: { ownerStat: 'defense', multiplier: number };
  };
}

export interface Construct {
  instanceId: string;
  templateId: string;
  name: string;
  owner: 'player' | string; // 'player' or enemy instance ID
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  block: number;
  statusEffects: StatusEffect[];
  durability: number;
  designatedTargetId?: string; // For things like homing missiles
}


// --- NEW EQUIPMENT SYSTEM ---
export interface WeaponTemplate {
    id: string;
    name: string;
    corePassiveDescription: string;
    corePassive: AffixEffect;
}

export interface EquipmentTemplate {
    id: string;
    name: string;
    corePassiveDescription: string;
    corePassive: AffixEffect;
}


export interface AffixEffect {
  // Simple Stats (Flat)
  maxHp?: number;
  maxCp?: number;
  attack?: number;
  defense?: number;
  blockPower?: number;
  cpRecovery?: number;
  initialDraw?: number;

  // Simple Stats (Percentage)
  maxHpPercent?: number;
  maxCpPercent?: number;
  attackPercent?: number;
  defensePercent?: number;
  blockPowerPercent?: number;

  // Weapon Template Core Passives
  onKillHeal?: number;
  skillBlockBonus?: number; // percentage
  burnCritChance?: number; // percentage chance
  burnCritMultiplier?: number; // e.g. 1.5 for 150%
  attackDamageBonusVsBleed?: number; // percentage
  onChargeConsumedBlock?: number; // flat block per charge consumed
  onFirstDiscard?: { nextAttackDamageBonus: number }; // percentage
  firstAttackExtraHit?: { damageMultiplier: number };
  onEveryXDifferentAttacks?: { count: number; permanentDamageBonus: number }; // percentage
  firstAttackIgnoresBlock?: number; // percentage
  attackDamageBonusVsDebuff?: number; // percentage
  hpLossAttackBonus?: { hpPercentage: number; attackPercentage: number };
  onHighCostAttack?: { minCost: number; drawCards: number };
  
  // Equipment Template Core Passives
  onNoHpDamageHeal?: number;
  afterCardsPlayed?: { count: number, drawCards: number };
  chargeNoDecay?: boolean;
  onBurnEnemyBlock?: number; // % blockpower per burning enemy
  onBleedApplyVulnerable?: { duration: number };
  onFirstDiscardDraw?: number;
  onHighCostCardBlock?: { minCost: number; blockMultiplier: number };
  onHpBelowThreshold?: { threshold: number; gainCp: number; drawCards: number };
  onDebuffGainCharge?: number;
  
  // Weapon Affixes
  applyBurnStacks?: number;
  applyBleedStacks?: number;
  extraChargeGain?: number;
  burnDamageBonus?: number; // percentage
  bleedDamageBonus?: number; // percentage
  applyWeakOnHit?: { chance: number; duration: number };
  applyVulnerableOnHit?: { chance: number; duration: number };
  applyBurnOnHit?: { chance: number; value: number; duration: number };
  applyBleedOnHit?: { chance: number; value: number; duration: number };
  damageBonusVsHighHealth?: { threshold: number; bonus: number }; // percentage
  damageBonusVsLowHealth?: { threshold: number; bonus: number }; // percentage
  onKillDraw?: number;
  firstAttackCostReduction?: number;
  
  // Equipment Affixes
  onBlockAllDamage?: { gainCp?: number, drawCards?: number };
  debuffDurationBonus?: number;
  buffDurationBonus?: number;
  onTurnStart?: { gainBlockPercent?: number, gainCharge?: number };
  onSkillHeal?: number;
  dotReduction?: number; // percentage

  // For tracking applied set bonuses
  setId?: string;
  setCount?: number;
}


export interface Affix {
  description: string;
  effect: AffixEffect;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  rarity: CardRarity;
  baseEffects: Omit<AffixEffect, 'initialDraw'>; // Base stats of the item
  affixes: Affix[];
  setId?: string;
  templateId?: string; // For weapons and equipment
}

export interface EquipmentSet {
  id: string;
  name: string;
  items: string[];
  bonuses: {
    count: number;
    description:string;
    effects: AffixEffect;
  }[];
}


export interface PlayerStats {
  hp: number;
  maxHp: number;
  cp: number;
  maxCp: number;
  cpRecovery: number;
  attack: number;
  defense: number;
  blockPower: number;
  initialDraw?: number;
  derivedEffects: AffixEffect; // Aggregated effects from affixes and sets
}


// Equipment System
export type EquipmentSlot = 'weapon' | 'equipment';


// Card System
export enum CardRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
}

export interface CardEffect {
    target: 'enemy' | 'self' | 'all_enemies' | 'random_enemy' | 'owner' | 'designated_target';
    damageMultiplier?: number;
    selfDamageMultiplier?: number;
    fixedDamage?: number;
    pierceMultiplier?: number; // Percentage of damage that ignores block (0 to 1)
    statusEffect?: string;
    statusEffectDuration?: number;
    statusEffectValue?: number;
    drawCards?: number;
    gainBlock?: number; // For fixed block (enemies)
    gainBlockMultiplier?: number; // For percentage-based block (player)
    overclockCost?: number; // Pay HP instead of CP
    gainCharge?: number; // Gain charge points
    consumeChargeMultiplier?: number; // Multiplies damage per charge consumed, then resets charge
    maxConsumeCharge?: number;
    isCycle?: boolean; // Card returns to hand after being played
    grantsCounter?: string; // ID of the card to be used as a counter-attack
    gainCpOnKill?: number; // Gain CP if this attack defeats an enemy
    gainCp?: number; // Gain CP directly
    chargeCost?: number; // Pay Charge to play card
    gainBlockPerChargeMultiplier?: number; // For percentage-based block per charge (player)
    hitCount?: number; // For multi-hit attacks
    bonusEffect?: { 
        condition: 'target_has_burn' | 'target_has_bleed' | 'hand_size_less_than_or_equal' | 'target_has_poison'; 
        value?: number;
        effect: { 
            gainBlockMultiplier?: number; 
            gainCp?: number; 
            drawCards?: number; 
            statusEffect?: string;
            statusEffectDuration?: number;
            statusEffectValue?: number;
            removeStatusRatio?: {
              effectId: 'burn' | 'bleed' | 'poison';
              ratio: number;
            };
        } 
    };
    consumeStatus?: {
        effectId: 'burn' | 'bleed' | 'poison';
        damagePerStack?: number;
        damagePerStackMultiplier?: number;
        healPerStack?: number;
        gainBlockPerStackMultiplier?: number;
        gainBlockPerStack?: number;
        target?: 'enemy' | 'all_enemies';
        maxConsumeStacks?: number;
        stacksToRemove?: number;
        stacksToRemoveRatio?: number;
    };
    addCardToHand?: string;
    addCardToDeck?: string[];
    addCardToDiscard?: string[];
    multiplyStatus?: {
        effectId: 'burn' | 'bleed' | 'poison';
        multiplier: number;
    };
    applyStatusFromBlockValue?: 'burn' | 'bleed' | 'poison';
    spreadStatus?: {
      effectId: 'burn' | 'bleed' | 'poison';
      ratio: number;
      from: 'target';
      to: 'all_other_enemies';
    };
    // Discard Mechanics
    discardCards?: {
        count: number;
        from: 'hand' | 'all';
        then?: CardEffect; // Effect to apply after discard
    };
    onDiscard?: CardEffect;
    exhausts?: boolean;
    nextAttackCostModifier?: number;
    // Discover Mechanic
    generateCardChoice?: string[];
    // Finisher Mechanic
    finisherEffect?: CardEffect;
    // Recast Mechanic
    onKillRecast?: boolean;
    // Cost Modification
    modifyRandomCardCost?: {
        amount: number;
        count: number;
    };
    // In-hand reduction
    costReductionOnCardPlay?: number;
    // Return to hand
    returnsToHand?: boolean;
    costIncreaseOnUseThisTurn?: number;
    // Charge-based draw/discard
    drawPerChargeConsumed?: number;
    discardPerChargeConsumed?: number;
    onDraw?: {
        damagePercentMaxHp?: number;
        exhausts?: boolean;
    };
    heal?: number;
    addCardToDeckOnHpDamage?: string[];
    playCondition?: { 
      requiresStatus?: { 
        effectId: 'burn' | 'bleed' | 'poison';
        minStacks: number;
      };
      allEnemiesMustHaveStatus?: 'burn' | 'bleed' | 'poison';
      hasStatus?: {
        effectId: 'burn' | 'bleed' | 'poison';
        target: 'self' | 'enemy';
      };
    };
    onHpDamageDealt?: CardEffect;
    onBlockedByEnemy?: CardEffect;
    choiceEffect?: {
        options: {
            description: string;
            effect: CardEffect;
        }[];
    };
    conditionalEffect?: {
        condition: {
            self?: { minCharge?: number; };
            targetHasStatus?: 'poison';
        };
        ifTrue: CardEffect;
        ifFalse?: CardEffect;
    };
    overflowEffect?: CardEffect;
    deployConstruct?: string;
    removeAllBlock?: boolean;
    forcePlayerDiscard?: {
        count: number;
    };
    summonEnemy?: {
        enemyId: string;
        count: number;
    };
}


export interface Card {
  id: string;
  name:string;
  description: string;
  cost: number;
  rarity: CardRarity;
  type: 'attack' | 'skill' | 'power';
  effect: CardEffect;
  keywords?: string[];
  unobtainable?: boolean;
}

export interface CombatCard extends Card {
    instanceId: string;
    temporary?: boolean;
    costOverride?: number;
}


export interface PlayerState extends Omit<PlayerStats, 'derivedEffects'> {
  dreamSediment: number;
  completedMissions: string[];
  activeProxy: string;
  statusEffects: StatusEffect[];
  cardCollection: string[]; // All cards owned by player
  decks: Record<string, string[]>; // Player-built decks
  activeDeckId: string;
  equipment: Record<EquipmentSlot, string | null>;
  inventory: string[]; // Array of equipment IDs
  charge: number;
  counterAttack: string | null; // ID of card to use for counter
  tideCounter: number;
  cardSyncsSinceLastEpic?: number;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  reward: {
    dreamSediment: number;
  };
  statusEffects: StatusEffect[];
  // Card system for enemies
  deck: string[];
  hand: string[];
  discard: string[];
  exhaust: string[];
  block: number;
  tideCounter: number;
  actionsPerTurn?: number;
  tideCard?: string;
  specialAction?: {
    hpThreshold: number; // e.g., 0.3 for 30%
    cardId: string;
  };
  specialActionTriggered?: boolean;
}

export interface DialogueEvent {
  type: 'dialogue';
  character: Character | string;
  text: string;
  image?: string;
}

export interface CombatEvent {
  type: 'combat';
  enemies: string[]; // Array of enemy IDs
  maxEnemiesOnField?: number;
}

export interface SupplyStopEvent {
  type: 'supply_stop';
}

export interface TitleEvent {
  type: 'title';
  text: string;
}

export interface Choice {
  missionId: string;
  text: string;
}

export interface ActionEvent {
  type: 'action';
  action: 'end_chapter' | 'open_hub' | 'present_choice' | 'game_over';
  choices?: Choice[];
}

export type GameEvent = DialogueEvent | CombatEvent | TitleEvent | ActionEvent | SupplyStopEvent;

export interface Mission {
  id: string;
  title: string;
  type: 'main' | 'secondary';
  issuer: string;
  description: string[];
  operator?: string;
  rewards: {
    dreamSediment: number;
  };
  events?: GameEvent[];
  chapter?: number;
  requires?: string[];
  victoryText?: string;
}

export interface CombatLogEntry {
    id: number;
    text: string;
    color?: string;
}

export type AnimationType = 'hit_hp' | 'hit_block' | 'burn' | 'bleed' | 'poison';

export interface CombatState {
    phase: 'player_turn' | 'enemy_turn' | 'victory' | 'defeat' | 'awaiting_discard' | 'awaiting_return_to_deck' | 'awaiting_card_choice' | 'awaiting_effect_choice';
    enemies: Enemy[];
    constructs: Construct[];
    log: CombatLogEntry[];
    overclockCooldown: number;
    turn: number;
    deck: CombatCard[];
    hand: CombatCard[];
    discard: CombatCard[];
    exhaust: CombatCard[];
    block: number;
    activeEnemyIndex: number | null;
    enemyActions: Record<string, Card[] | null>;
    activeActionIndex: number;
    attackingEnemyId: string | null;
    animationTriggers: Record<string, { type: AnimationType; key: number }>; // Maps entity ID to an animation event
    sparkCostModifier: number;
    cardsPlayedThisTurn: number;
    discardAction?: {
      count: number;
      from: 'hand' | 'all';
      sourceCardInstanceId: string;
      sourceTargetId?: string;
    };
    returnToDeckAction?: {
        count: number;
    };
    cardChoiceAction?: {
        options: string[];
    };
    effectChoiceAction?: {
        sourceCardInstanceId: string;
        sourceTargetId?: string;
        options: {
            description: string;
            effect: CardEffect;
        }[];
    };
    nextAttackCostModifier: number;
    // New trackers for weapon/equipment passives
    firstAttackPlayedThisTurn: boolean;
    firstDiscardThisTurn: boolean;
    differentAttacksPlayed: string[];
    hpThresholdTriggered: boolean;
    debuffsAppliedThisTurn: number;
    damageTakenThisTurn: number;
    lastCardPlayedInstanceId?: string;
    bleedDamageDealtThisTurn?: boolean;
    // New Reinforcement System
    enemyReinforcements: string[];
    maxEnemiesOnField?: number;
}

interface InterimCombatState {
    deck: CombatCard[];
    hand: CombatCard[];
    discard: CombatCard[];
    exhaust: CombatCard[];
    constructs?: Construct[];
}

export interface GameState {
  status: GameStatus;
  player: PlayerState;
  currentMissionId: string | null;
  currentEventIndex: number;
  combatState: CombatState | null;
  customEquipment: Record<string, Equipment>;
  customCards: Record<string, Card>;
  newlyAcquiredCardIds: string[];
  newlyAcquiredEquipmentIds: string[];
  isFirstCombatOfMission: boolean;
  interimCombatState?: InterimCombatState;
  missionStartState?: GameState;
  sedimentGainedOnDefeat?: number;
  combatStartInfo?: {
    enemies: number;
    waves: number;
  };
  currentMissionIsReplay?: boolean;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'FINISH_PROLOGUE_START' }
  | { type: 'SELECT_MISSION'; payload: { missionId: string; isReplay?: boolean } }
  | { type: 'START_MISSION' }
  | { type: 'ADVANCE_STORY' }
  | { type: 'SKIP_DIALOGUE' }
  | { type: 'RETURN_TO_HUB' }
  | { type: 'START_COMBAT' }
  | { type: 'PLAY_CARD'; payload: { cardInstanceId: string; targetId?: string } }
  | { type: 'END_TURN' }
  | { type: 'PROCESS_ENEMY_ACTION' }
  | { type: 'START_PLAYER_TURN' }
  | { type: 'COMBAT_VICTORY' }
  | { type: 'COMBAT_DEFEAT' }
  | { type: 'ADD_TO_DECK'; payload: { cardId: string; deckId: string } }
  | { type: 'REMOVE_FROM_DECK'; payload: { cardId: string; deckId: string; cardIndex: number } }
  | { type: 'SET_ACTIVE_DECK'; payload: { deckId: string } }
  | { type: 'EQUIP_ITEM'; payload: { itemId: string } }
  | { type: 'UNEQUIP_ITEM'; payload: { slot: EquipmentSlot } }
  | { type: 'SYNCHRONIZE_WEAPON' }
  | { type: 'SYNCHRONIZE_EQUIPMENT' }
  | { type: 'SYNCHRONIZE_CARD' }
  | { type: 'CLEAR_NEW_CARDS' }
  | { type: 'CLEAR_NEW_EQUIPMENT' }
  | { type: 'DECOMPOSE_ITEM'; payload: { itemId: string } }
  | { type: 'DECOMPOSE_CARD'; payload: { cardId: string } }
  | { type: 'DEBUG_ADD_SEDIMENT'; payload: number }
  | { type: 'RESTART_GAME' }
  | { type: 'DISCARD_CARDS'; payload: { cardInstanceIds: string[] } }
  | { type: 'RETURN_CARDS_TO_DECK'; payload: { cardInstanceIds: string[] } }
  | { type: 'CHOOSE_CARD_TO_GENERATE'; payload: { cardId: string } }
  | { type: 'CHOOSE_EFFECT'; payload: { effect: CardEffect } }
  | { type: 'DEBUG_JUMP_TO_CHAPTER'; payload: { chapter: number } }
  | { type: 'RESTART_FROM_CHECKPOINT' }
  | { type: 'APPLY_SUPPLY_STOP' };
