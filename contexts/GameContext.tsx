

import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { GameState, GameAction, GameStatus, Enemy, Character, StatusEffect, EquipmentSlot, PlayerState, PlayerStats, Equipment, Card, CardRarity, AnimationType, AffixEffect, CardEffect, CombatCard, CombatState, Construct } from '../types';
import { PLAYER_INITIAL_STATS, ENEMIES, CARDS, STATUS_EFFECTS, EQUIPMENT, ENEMY_CARDS, MISSIONS, MAX_COPIES_PER_RARITY, SYNC_COSTS, COMBAT_SETTINGS, CONSTRUCTS, AGGRO_SETTINGS, DECK_SIZE } from '../constants';
import { produce, Draft } from 'immer';
import { getEffectivePlayerStats } from '../utils/playerUtils';
import { generateRandomEquipment } from '../utils/equipmentGenerator';
import { generateCardPack } from '../utils/cardGenerator';
import { playSound } from '../utils/sounds';

const GameContext = createContext<{ state: GameState; dispatch: React.Dispatch<GameAction> } | undefined>(undefined);

const SAVE_KEY = 'safe4GameState';

const initialState: GameState = {
  status: GameStatus.TITLE_SCREEN,
  player: {
    ...PLAYER_INITIAL_STATS,
    dreamSediment: 0,
    completedMissions: [],
    cardSyncsSinceLastEpic: 0,
  },
  currentMissionId: null,
  currentEventIndex: 0,
  combatState: null,
  customEquipment: {},
  customCards: {},
  newlyAcquiredCardIds: [],
  newlyAcquiredEquipmentIds: [],
  isFirstCombatOfMission: true,
  sedimentGainedOnDefeat: 0,
};

const loadState = (): GameState => {
  try {
    const serializedState = localStorage.getItem(SAVE_KEY);
    if (serializedState === null) {
      return initialState;
    }
    const loadedState = JSON.parse(serializedState);

    // Migration logic for old save files
    if (loadedState.player && loadedState.player.deck && !loadedState.player.decks) {
        loadedState.player.decks = {
            '1': loadedState.player.deck,
            '2': [],
            '3': [],
        };
        loadedState.player.activeDeckId = '1';
        delete loadedState.player.deck;
    }
    if (loadedState.newlyAcquiredItems) {
        loadedState.newlyAcquiredCardIds = loadedState.newlyAcquiredItems;
        delete loadedState.newlyAcquiredItems;
    }


    const mergedState: GameState = {
      ...initialState,
      ...loadedState,
      player: {
        ...initialState.player,
        ...(loadedState.player || {}),
        equipment: {
          ...initialState.player.equipment,
          ...(loadedState.player?.equipment || {}),
        },
        statusEffects: loadedState.player?.statusEffects || initialState.player.statusEffects,
        cardCollection: loadedState.player?.cardCollection || initialState.player.cardCollection,
        decks: loadedState.player?.decks || initialState.player.decks,
        activeDeckId: loadedState.player?.activeDeckId || initialState.player.activeDeckId,
        inventory: loadedState.player?.inventory || initialState.player.inventory,
        cardSyncsSinceLastEpic: loadedState.player?.cardSyncsSinceLastEpic || 0,
      },
      combatState: loadedState.combatState || initialState.combatState,
      customEquipment: loadedState.customEquipment || initialState.customEquipment,
      customCards: loadedState.customCards || initialState.customCards,
      newlyAcquiredCardIds: loadedState.newlyAcquiredCardIds || initialState.newlyAcquiredCardIds,
      newlyAcquiredEquipmentIds: loadedState.newlyAcquiredEquipmentIds || initialState.newlyAcquiredEquipmentIds,
      isFirstCombatOfMission: loadedState.isFirstCombatOfMission !== undefined ? loadedState.isFirstCombatOfMission : true,
      missionStartState: loadedState.missionStartState || undefined,
      sedimentGainedOnDefeat: loadedState.sedimentGainedOnDefeat || 0,
    };
    
    if (typeof mergedState.status !== 'number' || !mergedState.player) {
      throw new Error("Invalid merged state after hydration");
    }

    return mergedState;
  } catch (err) {
    console.error("Could not load or merge state, resetting game.", err);
    localStorage.removeItem(SAVE_KEY);
    return initialState;
  }
};


const shuffle = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

let logIdCounter = 0;

const gameReducer = (state: GameState, action: GameAction): GameState => {
  return produce(state, (draft: Draft<GameState>) => {
    const allCards = { ...CARDS, ...draft.customCards, ...ENEMY_CARDS };
    const allEquipment = { ...EQUIPMENT, ...draft.customEquipment };
    
    const getStage = (): number => {
        return draft.player.completedMissions.length + 1;
    };

    const getPlayerStats = () => getEffectivePlayerStats(draft.player, draft.customEquipment);

    const triggerAnimation = (entityId: string, type: AnimationType) => {
        if (draft.combatState) {
            draft.combatState.animationTriggers[entityId] = { type, key: Date.now() + Math.random() };
        }
    };
    
    const returnToHubAndReset = () => {
        const playerStats = getPlayerStats();
        draft.player.hp = playerStats.maxHp;
        draft.player.cp = playerStats.maxCp;
        // Keep permanent buffs between fights in the same mission
        draft.player.statusEffects = draft.player.statusEffects.filter(e => e.type === 'buff' && e.duration >= 999);
        draft.player.charge = 0;
        draft.player.counterAttack = null;
        draft.player.tideCounter = 0;
        draft.combatState = null;
        
        draft.status = GameStatus.HUB;
        draft.currentMissionId = null;
        draft.currentEventIndex = 0;
        draft.isFirstCombatOfMission = true;
        draft.interimCombatState = undefined;
        draft.missionStartState = undefined; // Clear checkpoint on successful return
        draft.sedimentGainedOnDefeat = 0;
    };

    const HAND_LIMIT = 9;

    const addLog = (text: string, color?: string) => {
        if (draft.combatState) {
            draft.combatState.log.push({ id: logIdCounter++, text, color });
        }
    };

    const checkForHandOverflow = () => {
        if (!draft.combatState) return;
        const overflow = draft.combatState.hand.length - HAND_LIMIT;
        if (overflow > 0) {
            draft.combatState.phase = 'awaiting_return_to_deck';
            draft.combatState.returnToDeckAction = { count: overflow };
            addLog(`手牌溢出！你需要选择 ${overflow} 张牌放回牌库。`, 'text-yellow-400');
        }
    };
    
    const drawCards = (count: number) => {
        if (!draft.combatState) return;
        if (count > 0) playSound('draw_card');
        for (let i = 0; i < count; i++) {
            if (draft.combatState.hand.length >= HAND_LIMIT) break;
            if (draft.combatState.deck.length === 0) {
                if (draft.combatState.discard.length === 0) break; // No cards left to draw
                playSound('shuffle_deck');
                draft.combatState.deck = shuffle(draft.combatState.discard);
                draft.combatState.discard = [];
            }
            const card = draft.combatState.deck.pop();
            if (card) {
                if (card.effect.onDraw) {
                    const onDrawEffect = card.effect.onDraw;
                    addLog(`抽到了 [${card.name}]！`, 'text-red-400');
                    if (onDrawEffect.damagePercentMaxHp) {
                        const playerStats = getPlayerStats();
                        const damage = Math.ceil(playerStats.maxHp * onDrawEffect.damagePercentMaxHp);
                        draft.player.hp -= damage;
                        playSound('player_hit');
                        triggerAnimation('player', 'hit_hp');
                        addLog(`你因 [${card.name}] 的效果受到了 ${damage} 点伤害。`, 'text-red-400');
                    }
                    if (onDrawEffect.exhausts) {
                        draft.combatState.exhaust.push(card);
                        addLog(`[${card.name}] 已被移除。`, 'text-gray-400');
                        continue; // Skip pushing to hand
                    }
                }
                draft.combatState.hand.push(card);
            }
        }
        checkForHandOverflow();
    };

    const dealBleedDamageAndTriggerEffects = (entity: Draft<PlayerState | Enemy>, entityId: string, playerStats: PlayerStats) => {
        if (!draft.combatState) return;
        const bleedEffect = entity.statusEffects.find(e => e.id === 'bleed');
        if (!bleedEffect || !bleedEffect.value) return;

        let bleedDamage = Math.ceil(entity.maxHp * (bleedEffect.value / 100));
        
        if (entityId === 'player' && playerStats.derivedEffects.dotReduction) {
            bleedDamage *= (1 - playerStats.derivedEffects.dotReduction);
        }
        bleedDamage = Math.round(bleedDamage);

        if (bleedDamage > 0) {
            entity.hp -= bleedDamage;
            playSound('status_damage');
            triggerAnimation(entityId, 'bleed');
            const entityName = entityId === 'player' ? '你' : (entity as Enemy).name;
            addLog(`${entityName} 因[流血]受到了 ${bleedDamage} 点伤害！`, 'text-red-400');
            draft.combatState.bleedDamageDealtThisTurn = true;
        }
    };
    
    const applyStatusEffectsStartOfTurn = (entity: PlayerState | Enemy, isPlayer: boolean) => {
        const effectsToRemove: string[] = [];
        const playerStats = getPlayerStats();

        entity.statusEffects.forEach(effect => {
            const entityId = isPlayer ? 'player' : (entity as Enemy).id;
            
            if (effect.id === 'bleed' && effect.value) {
                const newStacks = effect.value - 1;
                effect.value = newStacks;
                if (newStacks <= 0) {
                    effect.duration = 0; 
                }
            }
            if (effect.id === 'poison' && effect.value) {
                const damage = Math.round(entity.maxHp * 0.1);
                entity.hp -= damage;
                addLog(`${isPlayer ? '你' : (entity as Enemy).name} 因[中毒]受到了 ${damage} 点伤害。`, 'text-purple-400');
                const newStacks = effect.value - 1;
                effect.value = newStacks;
                if (newStacks <= 0) {
                    effect.duration = 0;
                }
            }

            if (isPlayer && effect.id === 'charge_next_turn' && typeof effect.value === 'number') {
                (entity as PlayerState).charge += effect.value;
                addLog(`你获得了 ${effect.value} 点[充能]。`, 'text-orange-300');
            }
            if (isPlayer && effect.id === 'kindling_effect') {
                if (draft.combatState) {
                    const totalBurn = draft.combatState.enemies.reduce((sum, enemy) => {
                        const burn = enemy.statusEffects.find(s => s.id === 'burn');
                        return sum + (burn?.value || 0);
                    }, 0);
                    if (totalBurn >= 15) {
                        addLog(`[薪火] 效果触发，抽1张牌并衍生[熔火之心]！`, 'text-yellow-500');
                        drawCards(1);
                        const moltenHeartTemplate = allCards['molten_heart'];
                        if (moltenHeartTemplate) {
                            draft.combatState.hand.push({ ...moltenHeartTemplate, instanceId: `molten_heart_gen_${Date.now()}_${Math.random()}`, temporary: true });
                            checkForHandOverflow();
                        }
                        effectsToRemove.push('kindling_effect');
                    }
                }
            }
            if (effect.id === 'burn' && effect.value) {
                const stacks = effect.value;
                let sourceAttack = effect.sourceAttack || 10;
                let damage = Math.max(1, Math.round(stacks * sourceAttack * 0.15));

                if (isPlayer) {
                    const burnDmgBonus = playerStats.derivedEffects.burnDamageBonus || 0;
                    damage *= (1 + burnDmgBonus);
                     if (playerStats.derivedEffects.dotReduction) {
                        damage *= (1 - playerStats.derivedEffects.dotReduction);
                    }
                } else {
                    const burnCritChance = playerStats.derivedEffects.burnCritChance || 0;
                    if (Math.random() < burnCritChance) {
                        const critMultiplier = playerStats.derivedEffects.burnCritMultiplier || 1.5;
                        damage = Math.round(damage * critMultiplier);
                        addLog(`[薪火之刃] 效果触发！ [烧伤] 造成了暴击！`, 'text-yellow-400');
                    }
                }
                
                damage = Math.round(damage);
                entity.hp -= damage;
                
                playSound('status_damage');
                triggerAnimation(entityId, 'burn');
                addLog(`${isPlayer ? '你' : (entity as Enemy).name} 因[烧伤]受到了 ${damage} 点伤害。`, 'text-orange-400');

                const newStacks = Math.floor(stacks / 2);
                effect.value = newStacks;

                if (newStacks === 0) {
                    effect.duration = 0;
                }
            }

            const isNonDecaying = ['burn', 'bleed', 'chaining', 'poison'].includes(effect.id) || (effect.type === 'buff' && effect.duration >= 999) ;
            if (!isNonDecaying) {
                effect.duration -= 1;
            }

            if (effect.duration <= 0) {
                effectsToRemove.push(effect.id);
            }
        });
        
        entity.statusEffects = entity.statusEffects.filter(e => !effectsToRemove.includes(e.id));
    };

    const processConstructAction = (draft: Draft<GameState>, construct: Draft<Construct>, effectCard: {cardId: string, target: string}) => {
        if (!draft.combatState) return;

        const card = allCards[effectCard.cardId];
        if (!card) return;

        let targetId: string | undefined;
        let targetEnemy: Draft<Enemy> | undefined;
        let targetPlayer = false;

        // Determine target
        if (effectCard.target === 'owner') {
            if (construct.owner === 'player') {
                targetId = 'player';
                targetPlayer = true;
            } else {
                targetEnemy = draft.combatState.enemies.find(e => e.id === construct.owner);
                if (targetEnemy) targetId = targetEnemy.id;
            }
        } else if (effectCard.target === 'random_enemy') {
            const aliveEnemies = draft.combatState.enemies.filter(e => e.hp > 0);
            if (aliveEnemies.length > 0) {
                targetEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                targetId = targetEnemy.id;
            }
        } else if (effectCard.target === 'designated_target') {
             targetId = construct.designatedTargetId;
             if (targetId) {
                if (targetId === 'player') {
                    targetPlayer = true;
                } else {
                    targetEnemy = draft.combatState.enemies.find(e => e.id === targetId);
                }
             }
        }
        
        if (!targetId) {
            addLog(`[${construct.name}] 无法找到目标，行动失败。`);
            return;
        }

        addLog(`[${construct.name}] 的效果触发，使用了 [${card.name}]。`);

        const effect = card.effect;

        // Damage
        if ((effect.damageMultiplier || effect.fixedDamage) && !targetPlayer) {
            const targetEntity = targetEnemy;
            if (targetEntity) {
                let damage = 0;
                if (effect.damageMultiplier) damage = Math.round(construct.attack * effect.damageMultiplier);
                else if (effect.fixedDamage) damage = effect.fixedDamage;

                let damageToBlock = 0;
                if (targetEntity.block > 0) {
                    damageToBlock = Math.min(targetEntity.block, damage);
                    targetEntity.block -= damageToBlock;
                }
                const remainingDamage = damage - damageToBlock;
                let damageToHp = 0;
                if (remainingDamage > 0) {
                    damageToHp = Math.max(1, remainingDamage - targetEntity.defense);
                    targetEntity.hp -= damageToHp;
                }
                
                if (damageToHp > 0) {
                     playSound('enemy_hit');
                     triggerAnimation(targetEntity.id, 'hit_hp');
                     addLog(`[${construct.name}] 对 ${targetEntity.name} 造成了 ${damageToHp} 点伤害。`);
                }
                if (damageToBlock > 0) {
                    playSound('enemy_block');
                    triggerAnimation(targetEntity.id, 'hit_block');
                    addLog(`[${construct.name}] 对 ${targetEntity.name} 的格挡造成了 ${damageToBlock} 点伤害。`);
                }
            }
        }

        // Block
        if (effect.gainBlockMultiplier && targetPlayer) {
            const playerStats = getPlayerStats();
            const blockGained = Math.round(playerStats.blockPower * effect.gainBlockMultiplier);
            draft.combatState.block += blockGained;
            playSound('player_block');
            addLog(`[${construct.name}] 使你获得了 ${blockGained} 点格挡。`);
        }
    };

    const processEndOfTurnConstructs = (ownerType: 'player' | 'enemy') => {
        if (!draft.combatState) return;
    
        const constructsToProcess = draft.combatState.constructs.filter(c => {
            if (ownerType === 'player') return c.owner === 'player';
            return c.owner !== 'player';
        });
    
        const destroyedConstructIds: string[] = [];
    
        for (const construct of constructsToProcess) {
            if (destroyedConstructIds.includes(construct.instanceId)) continue;
            
            const template = CONSTRUCTS[construct.templateId];
            if (template.behavior.onTurnEnd) {
                processConstructAction(draft, construct, template.behavior.onTurnEnd);
            }
            
            construct.durability -= 1;
            if (construct.durability <= 0) {
                addLog(`[${construct.name}] 的耐久度耗尽，被摧毁了。`);
                destroyedConstructIds.push(construct.instanceId);
            }
        }
        
        if (destroyedConstructIds.length > 0) {
            const constructsToDestroy = draft.combatState.constructs.filter(c => destroyedConstructIds.includes(c.instanceId));
            
            for (const construct of constructsToDestroy) {
                const template = CONSTRUCTS[construct.templateId];
                 if (template.behavior.onDestroy) {
                    processConstructAction(draft, construct, template.behavior.onDestroy);
                }
            }
            draft.combatState.constructs = draft.combatState.constructs.filter(c => !destroyedConstructIds.includes(c.instanceId));
        }
    };


    const startPlayerTurn = () => {
        if (!draft.combatState) return;
        
        const playerStats = getPlayerStats();
        const isFirstTurnOfCombat = draft.combatState.turn === 0;

        processEndOfTurnConstructs('enemy');

        draft.player.counterAttack = null;
        draft.combatState.attackingEnemyId = null;
        draft.combatState.sparkCostModifier = 0;
        draft.combatState.cardsPlayedThisTurn = 0;
        draft.combatState.nextAttackCostModifier = 0;
        draft.combatState.firstAttackPlayedThisTurn = false;
        draft.combatState.firstDiscardThisTurn = false;
        draft.combatState.debuffsAppliedThisTurn = 0;
        draft.combatState.damageTakenThisTurn = 0;
        draft.combatState.lastCardPlayedInstanceId = undefined;
        draft.combatState.bleedDamageDealtThisTurn = false;

        const allCardPiles: (keyof Pick<Draft<CombatState>, 'hand' | 'deck' | 'discard' | 'exhaust'>)[] = ['hand', 'deck', 'discard', 'exhaust'];
        allCardPiles.forEach(pileName => {
            draft.combatState[pileName].forEach(card => {
                const cardTemplate = allCards[card.id];
                if (cardTemplate.effect.costIncreaseOnUseThisTurn) {
                    card.costOverride = undefined;
                }
            });
        });

        draft.combatState.phase = 'player_turn';
        draft.combatState.turn += 1;
        draft.combatState.enemyActions = {};

        if (isFirstTurnOfCombat && draft.isFirstCombatOfMission) {
            draft.player.cp = playerStats.maxCp;
        } else {
            draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + playerStats.cpRecovery);
        }

        draft.player.tideCounter = (draft.player.tideCounter || 0) + 1;
        if (draft.player.tideCounter > 0 && draft.player.tideCounter % 3 === 0) {
            draft.player.cp = playerStats.maxCp;
            addLog('潮汐涌动！你的CP已完全恢复！', 'text-cyan-200');
        }
        
        const openingCeremony = draft.player.statusEffects.find(e => e.id === 'opening_ceremony_effect');
        if (openingCeremony) {
            addLog(`[开幕仪典] 效果触发，手牌费用-1！`, 'text-yellow-400');
            if (draft.combatState) {
                draft.combatState.hand.forEach(card => {
                    const currentCost = card.costOverride ?? card.cost;
                    card.costOverride = Math.max(0, currentCost - 1);
                });
            }
            openingCeremony.duration = 0;
        }

        const recalibrateCp = draft.player.statusEffects.find(e => e.id === 'recalibrate_cp_effect');
        if (recalibrateCp) {
            addLog(`[再校准协议] 效果触发，恢复1 CP！`, 'text-cyan-300');
            draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + 1);
            recalibrateCp.duration = 0;
        }
        
        applyStatusEffectsStartOfTurn(draft.player, true);
        
        if (playerStats.derivedEffects.onTurnStart) {
            const { gainBlockPercent, gainCharge } = playerStats.derivedEffects.onTurnStart;
            if (gainBlockPercent) {
                const blockGained = Math.round(playerStats.blockPower * gainBlockPercent);
                draft.combatState.block += blockGained;
                addLog(`[装备效果] 你获得了 ${blockGained} 点格挡。`, 'text-teal-300');
            }
            if (gainCharge) {
                draft.player.charge += gainCharge;
                addLog(`[装备效果] 你获得了 ${gainCharge} 点[充能]。`, 'text-teal-300');
            }
        }
        if (playerStats.derivedEffects.onBurnEnemyBlock) {
            const burningEnemies = draft.combatState.enemies.filter(e => e.hp > 0 && e.statusEffects.some(s => s.id === 'burn')).length;
            if (burningEnemies > 0) {
                const blockPerEnemy = Math.round(playerStats.blockPower * playerStats.derivedEffects.onBurnEnemyBlock);
                const totalBlock = burningEnemies * blockPerEnemy;
                draft.combatState.block += totalBlock;
                addLog(`[隔热装甲] 效果触发，获得 ${totalBlock} 点格挡。`, 'text-teal-300');
            }
        }
        
        if (draft.player.hp <= 0) {
            draft.combatState.phase = 'defeat';
            return;
        }

        draft.combatState.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                const hpPercent = enemy.hp / enemy.maxHp;
                if (enemy.specialAction && !enemy.specialActionTriggered && hpPercent <= enemy.specialAction.hpThreshold) {
                    const specialCard = allCards[enemy.specialAction.cardId];
                    if (specialCard) {
                        enemy.specialActionTriggered = true;
                        draft.combatState.enemyActions[enemy.id] = [specialCard];
                        addLog(`${enemy.name} 的生命值过低，启动了特殊模式！`, 'text-red-500');
                        return;
                    }
                }

                const baseEnemyId = enemy.id.substring(0, enemy.id.lastIndexOf('_'));
                const enemyTemplate = ENEMIES[baseEnemyId];
                if (!enemyTemplate) {
                    console.error(`Could not find enemy template for id: ${baseEnemyId}`);
                    return;
                }
                const isTideTurn = (enemy.tideCounter + 1) % 3 === 0;
                const numActions = enemyTemplate.actionsPerTurn || 1;

                const actions: Card[] = [];
                for (let i = 0; i < numActions; i++) {
                    if (enemy.deck.length === 0) {
                        if (enemy.discard.length === 0) break;
                        enemy.deck = shuffle(enemy.discard);
                        enemy.discard = [];
                        addLog(`${enemy.name} 重洗了牌库。`, 'text-gray-400');
                    }
                    const cardId = enemy.deck.pop();
                    if (cardId) {
                        enemy.hand.push(cardId);
                        actions.push(allCards[cardId]);
                    }
                }
                
                if (isTideTurn && enemyTemplate.tideCard) {
                    const tideCardTemplate = allCards[enemyTemplate.tideCard];
                    if (tideCardTemplate) {
                        actions.push(tideCardTemplate);
                        addLog(`潮汐涌动！ ${enemy.name} 准备发动特殊行动！`, 'text-red-300');
                    }
                }
                draft.combatState.enemyActions[enemy.id] = actions;
            }
        });
        
        addLog(`第 ${draft.combatState.turn} 回合开始。`, 'text-yellow-200');
        
        const equipmentDrawBonus = (playerStats.initialDraw ?? COMBAT_SETTINGS.INITIAL_DRAW_FIRST_COMBAT_FIRST_MISSION) - COMBAT_SETTINGS.INITIAL_DRAW_FIRST_COMBAT_FIRST_MISSION;

        if (isFirstTurnOfCombat) {
            if (draft.isFirstCombatOfMission) {
                drawCards(COMBAT_SETTINGS.INITIAL_DRAW_FIRST_COMBAT_FIRST_MISSION + equipmentDrawBonus);
            } else {
                drawCards(COMBAT_SETTINGS.INITIAL_DRAW_SUBSEQUENT_COMBAT + equipmentDrawBonus);
            }
        } else {
            drawCards(COMBAT_SETTINGS.DRAW_PER_TURN + equipmentDrawBonus);
        }
    };

    const checkForOnKillEffects = (enemy: Enemy) => {
        const playerStats = getPlayerStats();
        if (playerStats.derivedEffects.onKillHeal) {
            draft.player.hp = Math.min(playerStats.maxHp, draft.player.hp + playerStats.derivedEffects.onKillHeal);
            addLog(`[制式刃] 效果触发，你击败了 ${enemy.name} 并恢复了 ${playerStats.derivedEffects.onKillHeal} HP。`, 'text-teal-300');
        }
        if (playerStats.derivedEffects.onKillDraw) {
            addLog(`[装备词缀] 效果触发，击败敌人，抽 ${playerStats.derivedEffects.onKillDraw} 张牌。`, 'text-teal-300');
            drawCards(playerStats.derivedEffects.onKillDraw);
        }
    }
    
    const processCardEffect = (effect: CardEffect, sourceCardId: string, targetId?: string, isDiscardEffect: boolean = false) => {
        if (!draft.combatState) return;

        const playerStats = getPlayerStats();
        const card = allCards[sourceCardId];

        let targetEnemy: Draft<Enemy> | undefined;
        let targetConstruct: Draft<Construct> | undefined;

        if (targetId) {
            if (targetId.startsWith('construct_')) {
                targetConstruct = draft.combatState.constructs.find(c => c.instanceId === targetId);
            } else {
                targetEnemy = draft.combatState.enemies.find(e => e.id === targetId);
            }
        } else if (effect.target === 'enemy' || effect.target === 'all_enemies' || effect.target === 'random_enemy') {
            const aliveEnemies = draft.combatState.enemies.filter(e => e.hp > 0);
            if (aliveEnemies.length > 0) {
                if (effect.target === 'random_enemy') {
                    targetEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                } else {
                    targetEnemy = aliveEnemies[0];
                }
            }
        }

        let baseDamage = 0;
        
        if (effect.damageMultiplier) {
            baseDamage += playerStats.attack * effect.damageMultiplier;
        }

        if (effect.consumeChargeMultiplier) {
             const chargeToConsume = Math.min(draft.player.charge, effect.maxConsumeCharge || draft.player.charge);
             if (chargeToConsume > 0) {
                baseDamage += playerStats.attack * effect.consumeChargeMultiplier * chargeToConsume;
                addLog(`消耗 ${chargeToConsume} 层充能！`, 'text-orange-400');

                if(effect.drawPerChargeConsumed) {
                    drawCards(chargeToConsume * effect.drawPerChargeConsumed);
                }
                if(effect.discardPerChargeConsumed && draft.combatState) {
                    const cardsToDiscard = chargeToConsume * effect.discardPerChargeConsumed;
                    if(cardsToDiscard > 0) {
                         draft.combatState.phase = 'awaiting_discard';
                         draft.combatState.discardAction = {
                             count: cardsToDiscard,
                             from: 'hand',
                             sourceCardInstanceId: "dummy_instance_id_for_charge_consume", // This is not a real card
                         };
                    }
                }

                if (!playerStats.derivedEffects.chargeNoDecay) {
                    draft.player.charge -= chargeToConsume;
                }
                if (playerStats.derivedEffects.onChargeConsumedBlock) {
                    const blockGained = chargeToConsume * playerStats.derivedEffects.onChargeConsumedBlock;
                    draft.combatState.block += blockGained;
                    addLog(`[动能转换器] 效果触发, 获得 ${blockGained} 点格挡。`, 'text-teal-300');
                }
             }
        }
        
        const isEmpowered = draft.player.statusEffects.some(e => e.id === 'empowered');
        if (isEmpowered && card.type === 'attack') {
            baseDamage *= 2.5;
            addLog(`强化效果发动！`, 'text-yellow-500');
            draft.player.statusEffects = draft.player.statusEffects.filter(e => e.id !== 'empowered');
        }
        
        if (baseDamage > 0 && card.type === 'attack') {
            const targets = effect.target === 'all_enemies' 
                ? draft.combatState.enemies.filter(e => e.hp > 0) 
                : (targetEnemy ? [targetEnemy] : []);

            for (const enemy of targets) {
                let finalDamage = baseDamage;

                if (playerStats.derivedEffects.attackDamageBonusVsBleed && enemy.statusEffects.some(e => e.id === 'bleed')) {
                    finalDamage *= (1 + playerStats.derivedEffects.attackDamageBonusVsBleed);
                }
                const hasDebuff = enemy.statusEffects.some(e => e.type === 'debuff');
                if (playerStats.derivedEffects.attackDamageBonusVsDebuff && hasDebuff) {
                    finalDamage *= (1 + playerStats.derivedEffects.attackDamageBonusVsDebuff);
                }
                 const hpPercent = (enemy.hp / enemy.maxHp) * 100;
                if (playerStats.derivedEffects.damageBonusVsHighHealth && hpPercent > playerStats.derivedEffects.damageBonusVsHighHealth.threshold) {
                    finalDamage *= (1 + playerStats.derivedEffects.damageBonusVsHighHealth.bonus);
                }
                if (playerStats.derivedEffects.damageBonusVsLowHealth && hpPercent < playerStats.derivedEffects.damageBonusVsLowHealth.threshold) {
                    finalDamage *= (1 + playerStats.derivedEffects.damageBonusVsLowHealth.bonus);
                }

                const isVulnerable = enemy.statusEffects.some(e => e.id === 'vulnerable');
                if (isVulnerable) {
                    finalDamage += playerStats.attack * 0.5;
                }
                
                finalDamage = Math.round(finalDamage);
                
                let damageToBlock = 0;
                let damageToHp = 0;
                
                let pierceMultiplier = effect.pierceMultiplier || 0;
                if (!draft.combatState.firstAttackPlayedThisTurn && playerStats.derivedEffects.firstAttackIgnoresBlock) {
                    pierceMultiplier = Math.max(pierceMultiplier, playerStats.derivedEffects.firstAttackIgnoresBlock);
                }

                const pierceDamage = Math.round(finalDamage * pierceMultiplier);
                const normalDamage = finalDamage - pierceDamage;

                if (enemy.block > 0 && normalDamage > 0) {
                    const blockReduced = Math.min(enemy.block, normalDamage);
                    damageToBlock = blockReduced;
                    enemy.block -= blockReduced;
                }
                
                const remainingDamage = (normalDamage - damageToBlock) + pierceDamage;

                if (remainingDamage > 0) {
                    const finalDamageAfterDefense = Math.max(1, remainingDamage - enemy.defense);
                    damageToHp = Math.round(finalDamageAfterDefense);
                    enemy.hp -= damageToHp;
                }
                
                const wasFullyBlocked = remainingDamage <= 0;

                if (damageToHp > 0) {
                    playSound('enemy_hit');
                    triggerAnimation(enemy.id, 'hit_hp');
                    addLog(`你对 ${enemy.name} 造成了 ${damageToHp} 点伤害。`, 'text-green-400');
                    if (card.effect.onHpDamageDealt) {
                        addLog(`[${card.name}] 效果触发！`, 'text-yellow-400');
                        processCardEffect(card.effect.onHpDamageDealt, card.id, enemy.id);
                    }
                } else if (damageToBlock > 0) {
                    playSound('enemy_block');
                    triggerAnimation(enemy.id, 'hit_block');
                    addLog(`你对 ${enemy.name} 的格挡造成了 ${damageToBlock} 点伤害。`, 'text-blue-300');
                    if (wasFullyBlocked && card.effect.onBlockedByEnemy) {
                        addLog(`[${card.name}] 被完全格挡，效果触发！`, 'text-yellow-400');
                        processCardEffect(card.effect.onBlockedByEnemy, card.id, enemy.id);
                    }
                }
                
                // Envenom check
                const envenomEffect = draft.player.statusEffects.find(e => e.id === 'envenom_effect');
                if(envenomEffect) {
                    const poisonTemplate = STATUS_EFFECTS['poison'];
                    const existingPoison = enemy.statusEffects.find(e => e.id === 'poison');
                    if (existingPoison) {
                        existingPoison.value = (existingPoison.value || 0) + 1;
                    } else {
                        enemy.statusEffects.push({ ...poisonTemplate, duration: 999, value: 1 });
                    }
                    addLog(`[淬毒] 效果触发，对 ${enemy.name} 施加了1层[中毒]！`, 'text-purple-300');
                }

                const applyBurn = playerStats.derivedEffects.applyBurnOnHit;
                if(applyBurn && Math.random() < applyBurn.chance) {
                    const existingBurn = enemy.statusEffects.find(e => e.id === 'burn');
                    if (existingBurn) {
                        existingBurn.value = (existingBurn.value || 0) + applyBurn.value;
                    } else {
                        enemy.statusEffects.push({ ...STATUS_EFFECTS['burn'], duration: applyBurn.duration, value: applyBurn.value, sourceAttack: playerStats.attack });
                    }
                    addLog(`[装备效果] 对 ${enemy.name} 施加了 ${applyBurn.value} 层[烧伤]！`, 'text-teal-300');
                }
                const applyBleed = playerStats.derivedEffects.applyBleedOnHit;
                if(applyBleed && Math.random() < applyBleed.chance) {
                     const existingBleed = enemy.statusEffects.find(e => e.id === 'bleed');
                    if (existingBleed) {
                        existingBleed.value = (existingBleed.value || 0) + applyBleed.value;
                    } else {
                        enemy.statusEffects.push({ ...STATUS_EFFECTS['bleed'], duration: applyBleed.duration, value: applyBleed.value, sourceAttack: playerStats.attack });
                    }
                    addLog(`[装备效果] 对 ${enemy.name} 施加了 ${applyBleed.value} 层[流血]！`, 'text-teal-300');
                }
                
                if (enemy.hp <= 0) {
                    if (card.effect.onKillRecast) {
                        addLog(`[${card.name}] 击败了 ${enemy.name}，再次释放！`, 'text-yellow-500');
                        processCardEffect(card.effect, card.id, undefined);
                    }
                    if (effect.gainCpOnKill) {
                        draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + effect.gainCpOnKill);
                        addLog(`你击败了 ${enemy.name} 并恢复了 ${effect.gainCpOnKill} CP。`, 'text-cyan-300');
                    }
                    checkForOnKillEffects(enemy);
                }
            }
        }
        
        let blockGained = 0;
    
        if (effect.gainBlockMultiplier) {
            let multiplier = effect.gainBlockMultiplier;
            if (card.type === 'skill' && playerStats.derivedEffects.skillBlockBonus) {
                multiplier *= (1 + playerStats.derivedEffects.skillBlockBonus);
            }
            blockGained += Math.round(playerStats.blockPower * multiplier);
        }

        if (effect.gainBlockPerChargeMultiplier) {
            const blockFromCharge = Math.round(playerStats.blockPower * effect.gainBlockPerChargeMultiplier * draft.player.charge);
            if (blockFromCharge > 0) {
                blockGained += blockFromCharge;
                addLog(`你从[充能]中额外获得了 ${blockFromCharge} 点格挡。`, 'text-blue-300');
            }
        }
        
        if (effect.bonusEffect && (targetEnemy || effect.bonusEffect.condition === 'target_has_bleed')) {
            const hasBurn = targetEnemy?.statusEffects.some(e => e.id === 'burn');
            const hasBleed = targetEnemy?.statusEffects.some(e => e.id === 'bleed');
            const hasPoison = targetEnemy?.statusEffects.some(e => e.id === 'poison');
            const handSize = draft.combatState.hand.length;

            let conditionMet = false;
            if (effect.bonusEffect.condition === 'target_has_burn' && hasBurn) conditionMet = true;
            if (effect.bonusEffect.condition === 'target_has_bleed' && hasBleed) conditionMet = true;
            if (effect.bonusEffect.condition === 'target_has_poison' && hasPoison) conditionMet = true;
            if (effect.bonusEffect.condition === 'hand_size_less_than_or_equal' && handSize <= (effect.bonusEffect.value || 0)) conditionMet = true;


            if (conditionMet) {
                const bonus = effect.bonusEffect.effect;
                if (bonus.gainBlockMultiplier) {
                    const bonusBlock = Math.round(playerStats.blockPower * bonus.gainBlockMultiplier);
                    blockGained += bonusBlock;
                    addLog(`[${card.name}] 效果触发，额外获得 ${bonusBlock} 点格挡。`, 'text-yellow-400');
                }
                if (bonus.gainCp) {
                    draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + bonus.gainCp);
                    addLog(`[${card.name}] 效果触发，恢复了 ${bonus.gainCp} 点CP。`, 'text-cyan-300');
                }
                if (bonus.drawCards) {
                    addLog(`[${card.name}] 效果触发，抽 ${bonus.drawCards} 张牌。`, 'text-yellow-400');
                    drawCards(bonus.drawCards);
                }
                if (bonus.statusEffect && targetEnemy) {
                    const effectTemplate = STATUS_EFFECTS[bonus.statusEffect];
                    if (effectTemplate) {
                       const newEffect: StatusEffect = {
                           ...effectTemplate,
                           duration: bonus.statusEffectDuration || 1,
                           value: bonus.statusEffectValue,
                           sourceAttack: playerStats.attack,
                       };
                       targetEnemy.statusEffects.push(newEffect);
                       addLog(`${targetEnemy.name} 获得了 [${newEffect.name}] 状态。`, 'text-red-300');
                    }
                }
                if (bonus.removeStatusRatio && targetEnemy) {
                    const { effectId, ratio } = bonus.removeStatusRatio;
                    const status = targetEnemy.statusEffects.find(e => e.id === effectId);
                    if (status && status.value) {
                        const stacksToRemove = Math.floor(status.value * ratio);
                        if (stacksToRemove > 0) {
                            status.value -= stacksToRemove;
                             addLog(`[${card.name}] 效果触发，移除了 ${targetEnemy.name} 的 ${stacksToRemove} 层[${status.name}]。`, 'text-yellow-400');
                            if (status.value <= 0) {
                                targetEnemy.statusEffects = targetEnemy.statusEffects.filter(e => e.id !== effectId);
                            }
                        }
                    }
                }
            }
        }

        if (blockGained > 0) {
            playSound('player_block');
            draft.combatState.block += blockGained;
            addLog(`你获得了 ${blockGained} 点格挡。`, 'text-blue-300');
        }
        
        if (effect.consumeStatus && targetEnemy) {
            const { effectId, damagePerStack, damagePerStackMultiplier, healPerStack, gainBlockPerStackMultiplier, gainBlockPerStack, target: consumeTarget, maxConsumeStacks, stacksToRemove, stacksToRemoveRatio } = effect.consumeStatus;
            const statusEffect = targetEnemy.statusEffects.find(e => e.id === effectId);

            if (statusEffect && statusEffect.value) {
                const stacks = statusEffect.value;
                const stacksToConsume = stacksToRemoveRatio 
                    ? Math.floor(stacks * stacksToRemoveRatio)
                    : (stacksToRemove ? Math.min(stacks, stacksToRemove) : Math.min(stacks, maxConsumeStacks || stacks));

                
                if (damagePerStackMultiplier) {
                    let baseDmg = playerStats.attack * damagePerStackMultiplier;
                    if (effectId === 'bleed' && playerStats.derivedEffects.bleedDamageBonus) {
                        baseDmg *= (1 + playerStats.derivedEffects.bleedDamageBonus);
                    }
                     if (effectId === 'burn' && playerStats.derivedEffects.burnDamageBonus) {
                        baseDmg *= (1 + playerStats.derivedEffects.burnDamageBonus);
                    }
                    const damage = Math.round(stacksToConsume * baseDmg);
                    const targets = consumeTarget === 'all_enemies' ? draft.combatState.enemies.filter(e => e.hp > 0) : [targetEnemy];
                    for (const tgt of targets) {
                        tgt.hp -= damage;
                        playSound('status_damage');
                        triggerAnimation(tgt.id, effectId === 'burn' ? 'burn' : 'bleed');
                    }
                    if (consumeTarget === 'all_enemies') {
                        addLog(`消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，对所有敌人造成 ${damage} 点爆发伤害！`, 'text-red-500');
                    } else {
                        addLog(`消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，造成 ${damage} 点爆发伤害！`, 'text-red-500');
                    }

                } else if (damagePerStack) {
                    const damage = stacksToConsume * damagePerStack;
                    const targets = consumeTarget === 'all_enemies' ? draft.combatState.enemies.filter(e => e.hp > 0) : [targetEnemy];
                    
                    for (const tgt of targets) {
                        tgt.hp -= damage;
                        playSound('status_damage');
                        triggerAnimation(tgt.id, effectId === 'burn' ? 'burn' : 'bleed');
                    }
                    if (consumeTarget === 'all_enemies') {
                         addLog(`消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，对所有敌人造成 ${damage} 点爆发伤害！`, 'text-red-500');
                    } else {
                         addLog(`消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，造成 ${damage} 点爆发伤害！`, 'text-red-500');
                    }
                }

                if (healPerStack) {
                    const healing = stacksToConsume * healPerStack;
                    draft.player.hp = Math.min(playerStats.maxHp, draft.player.hp + healing);
                    addLog(`消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，你恢复了 ${healing} 点HP！`, 'text-green-400');
                }

                if (gainBlockPerStackMultiplier) {
                    const block = Math.round(stacksToConsume * gainBlockPerStackMultiplier * playerStats.blockPower);
                    draft.combatState.block += block;
                    addLog(`消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，你获得了 ${block} 点格挡！`, 'text-blue-400');
                }

                if (gainBlockPerStack) {
                    const block = stacksToConsume * gainBlockPerStack;
                    draft.combatState.block += block;
                    addLog(`消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，你获得了 ${block} 点格挡！`, 'text-blue-400');
                }
                
                statusEffect.value -= stacksToConsume;
                if (statusEffect.value <= 0) {
                    targetEnemy.statusEffects = targetEnemy.statusEffects.filter(e => e.id !== effectId);
                }
            }
        }

        if (effect.multiplyStatus && targetEnemy) {
            const { effectId, multiplier } = effect.multiplyStatus;
            const statusToMultiply = targetEnemy.statusEffects.find(e => e.id === effectId);
            if (statusToMultiply && statusToMultiply.value) {
                const oldStacks = statusToMultiply.value;
                statusToMultiply.value = Math.floor(oldStacks * multiplier);
                addLog(`${targetEnemy.name} 的 [${statusToMultiply.name}] 层数翻倍至 ${statusToMultiply.value}！`, 'text-red-400');
            }
        }
        
        if (effect.applyStatusFromBlockValue && targetEnemy && draft.combatState.block > 0) {
            const statusId = effect.applyStatusFromBlockValue;
            const stacks = Math.floor(draft.combatState.block * 0.5);
            const effectTemplate = STATUS_EFFECTS[statusId];
            if (effectTemplate && stacks > 0) {
                const existingEffect = targetEnemy.statusEffects.find(e => e.id === statusId);
                if (existingEffect) {
                    existingEffect.value = (existingEffect.value || 0) + stacks;
                    existingEffect.sourceAttack = playerStats.attack;
                } else {
                    targetEnemy.statusEffects.push({
                        ...effectTemplate,
                        duration: 999,
                        value: stacks,
                        sourceAttack: playerStats.attack,
                    });
                }
                addLog(`你对 ${targetEnemy.name} 施加了 ${stacks} 层[${effectTemplate.name}]。`, 'text-red-300');
            }
        }
    
        if (effect.spreadStatus && targetEnemy) {
            const { effectId, ratio } = effect.spreadStatus;
            const sourceStatus = targetEnemy.statusEffects.find(e => e.id === effectId);
            if (sourceStatus && sourceStatus.value) {
                const stacksToSpread = Math.floor(sourceStatus.value * ratio);
                if (stacksToSpread > 0) {
                    const otherEnemies = draft.combatState.enemies.filter(e => e.id !== targetEnemy.id && e.hp > 0);
                    const effectTemplate = STATUS_EFFECTS[effectId];
                    if (effectTemplate) {
                        otherEnemies.forEach(otherEnemy => {
                            const existingEffect = otherEnemy.statusEffects.find(e => e.id === effectId);
                            if (existingEffect) {
                                existingEffect.value = (existingEffect.value || 0) + stacksToSpread;
                                existingEffect.sourceAttack = playerStats.attack;
                            } else {
                                otherEnemy.statusEffects.push({
                                    ...effectTemplate,
                                    duration: 999,
                                    value: stacksToSpread,
                                    sourceAttack: playerStats.attack,
                                });
                            }
                        });
                        addLog(`[${card.name}] 效果触发，将 ${stacksToSpread} 层[${effectTemplate.name}]扩散至其他敌人。`, 'text-yellow-400');
                    }
                }
            }
        }

        if (effect.drawCards) {
            drawCards(effect.drawCards);
        }

        if (effect.gainCharge) {
            let chargeGained = effect.gainCharge;
            if (playerStats.derivedEffects.extraChargeGain) {
                chargeGained += playerStats.derivedEffects.extraChargeGain;
            }
            draft.player.charge += chargeGained;
            addLog(`你获得了 ${chargeGained} 层充能。`, 'text-orange-300');
        }
        
        if (effect.grantsCounter) {
            draft.player.counterAttack = effect.grantsCounter;
            addLog(`你进入了反击架势。`, 'text-yellow-400');
        }
        
        if (effect.gainCp) {
            draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + effect.gainCp);
            addLog(`你恢复了 ${effect.gainCp} 点CP。`, 'text-cyan-300');
        }
        
        if (effect.statusEffect) {
             const effectTemplate = STATUS_EFFECTS[effect.statusEffect];
             if (effectTemplate) {
                const isStacking = ['burn', 'bleed', 'chaining', 'poison'].includes(effectTemplate.id);
                const newEffect: StatusEffect = {
                    ...effectTemplate,
                    duration: isStacking ? 999 : (effect.statusEffectDuration || 1),
                    value: effect.statusEffectValue,
                    sourceAttack: playerStats.attack,
                    data: card.id === 'feverish_calculation' ? { cardsToAdd: ['feverish_strike', 'feverish_strike'] } : undefined
                };

                const applyEffect = (entity: PlayerState | Enemy) => {
                    const existingEffect = entity.statusEffects.find(e => e.id === newEffect.id);
                    if (existingEffect) {
                        if (isStacking) {
                            existingEffect.value = (existingEffect.value || 0) + (newEffect.value || 0);
                            existingEffect.sourceAttack = playerStats.attack;
                        }
                         if (!isStacking) {
                            existingEffect.duration = Math.max(existingEffect.duration, newEffect.duration);
                        }
                    } else {
                        entity.statusEffects.push(newEffect);
                    }
                    if (effectTemplate.type === 'debuff' && entity !== draft.player) {
                        draft.combatState.debuffsAppliedThisTurn++;
                        if (playerStats.derivedEffects.onDebuffGainCharge) {
                            draft.player.charge += playerStats.derivedEffects.onDebuffGainCharge;
                            addLog(`[状态分析仪] 效果触发，你获得了 ${playerStats.derivedEffects.onDebuffGainCharge} 点[充能]。`, 'text-teal-300');
                        }
                    }

                    if (effect.statusEffect === 'burn' && entity !== draft.player) {
                        const hasConflagration = draft.player.statusEffects.some(e => e.id === 'conflagration_effect');
                        if (hasConflagration) {
                            addLog(`[焚尽万象] 效果触发，抽 1 张牌！`, 'text-yellow-500');
                            drawCards(1);
                        }
                    }
                };

                if (effect.target === 'self') {
                    applyEffect(draft.player);
                    addLog(`你获得了 [${newEffect.name}] 状态。`, 'text-green-300');
                } else if(targetEnemy || effect.target === 'all_enemies') {
                    const targets = effect.target === 'all_enemies' ? draft.combatState.enemies.filter(e => e.hp > 0) : (targetEnemy ? [targetEnemy] : []);
                    for (const enemy of targets) {
                        applyEffect(enemy);
                        addLog(`${enemy.name} 获得了 [${newEffect.name}] 状态。`, 'text-red-300');
                         if (effect.statusEffect === 'bleed' && playerStats.derivedEffects.onBleedApplyVulnerable && draft.combatState.debuffsAppliedThisTurn === 1) {
                            const { duration } = playerStats.derivedEffects.onBleedApplyVulnerable;
                            const vulnerableEffect = enemy.statusEffects.find(e => e.id === 'vulnerable');
                            if (vulnerableEffect) {
                                vulnerableEffect.duration = Math.max(vulnerableEffect.duration, duration + 1);
                            } else {
                                enemy.statusEffects.push({ ...STATUS_EFFECTS.vulnerable, duration: duration + 1 });
                            }
                            addLog(`[痛苦放大器] 效果触发，对 ${enemy.name} 施加了 [易伤]！`, 'text-teal-300');
                        }
                    }
                }
            }
        }

        if (effect.conditionalEffect) {
            const cond = effect.conditionalEffect.condition;
            let conditionMet = false;
            
            if (cond.self?.minCharge !== undefined) {
                conditionMet = draft.player.charge >= cond.self.minCharge;
            }
            if (cond.targetHasStatus === 'poison') {
                const hasPoison = targetEnemy?.statusEffects.some(e => e.id === 'poison' && (e.value || 0) > 0);
                conditionMet = !!hasPoison;
            }
        
            const effectToApply = conditionMet ? effect.conditionalEffect.ifTrue : effect.conditionalEffect.ifFalse;
            if (effectToApply) {
                addLog(`[${card.name}] 的条件效果触发！`, 'text-yellow-400');
                processCardEffect(effectToApply, sourceCardId, targetId, isDiscardEffect);
            }
        }
        
        if (effect.addCardToHand) {
            const newCard = allCards[effect.addCardToHand];
            draft.combatState.hand.push({ ...newCard, instanceId: `${newCard.id}_${Date.now()}_${Math.random()}`});
            addLog(`你获得了 [${newCard.name}]。`, 'text-yellow-300');
            checkForHandOverflow();
        }

        if (effect.addCardToDeck) {
            effect.addCardToDeck.forEach(cardId => {
                const newCard = allCards[cardId];
                draft.combatState.deck.push({ ...newCard, instanceId: `${newCard.id}_${Date.now()}_${Math.random()}` });
            });
            draft.combatState.deck = shuffle(draft.combatState.deck);
        }

        if (effect.addCardToDiscard) {
            effect.addCardToDiscard.forEach(cardId => {
                const newCardTemplate = allCards[cardId];
                if (newCardTemplate) {
                    const newCard: CombatCard = {
                        ...newCardTemplate,
                        instanceId: `${cardId}_gen_${Date.now()}_${Math.random()}`
                    };
                    draft.combatState.discard.push(newCard);
                    addLog(`一张 [${newCard.name}] 被洗入了你的弃牌堆。`, 'text-purple-300');
                }
            });
        }

        if (effect.nextAttackCostModifier) {
            draft.combatState.nextAttackCostModifier += effect.nextAttackCostModifier;
        }

        if (effect.deployConstruct) {
            if (draft.combatState.constructs.length >= 3) {
                addLog('构装体部署失败：战场上已达到最大数量。', 'text-yellow-400');
            } else {
                const template = CONSTRUCTS[effect.deployConstruct];
                const owner = draft.player;
                const ownerStats = getPlayerStats();
                const newConstruct: Construct = {
                    instanceId: `construct_player_${template.id}_${Date.now()}`,
                    templateId: template.id,
                    name: template.name,
                    owner: 'player',
                    maxHp: Math.round(ownerStats.maxHp * template.statScaling.maxHp.multiplier),
                    hp: Math.round(ownerStats.maxHp * template.statScaling.maxHp.multiplier),
                    attack: Math.round(ownerStats.attack * template.statScaling.attack.multiplier),
                    defense: Math.round(ownerStats.defense * template.statScaling.defense.multiplier),
                    block: 0,
                    statusEffects: [],
                    durability: 3, // Default durability
                    designatedTargetId: targetEnemy ? targetEnemy.id : undefined,
                };
                draft.combatState.constructs.push(newConstruct);
                addLog(`你部署了 [${newConstruct.name}]！`, 'text-green-300');
            }
        }

        if (!isDiscardEffect) {
            if(card.type === 'skill' && playerStats.derivedEffects.onSkillHeal) {
                draft.player.hp = Math.min(playerStats.maxHp, draft.player.hp + playerStats.derivedEffects.onSkillHeal);
                addLog(`[装备词缀] 效果触发，恢复了 ${playerStats.derivedEffects.onSkillHeal} 点HP。`, 'text-teal-300');
            }
            const chainingEffect = draft.player.statusEffects.find(e => e.id === 'chaining');
            if (chainingEffect && card.type === 'attack' && chainingEffect.value && chainingEffect.value > 0) {
                addLog(`连锁反应发动，抽 1 张牌！`, 'text-yellow-500');
                drawCards(1);
                chainingEffect.value -= 1;
                if (chainingEffect.value <= 0) {
                    draft.player.statusEffects = draft.player.statusEffects.filter(e => e.id !== 'chaining');
                }
            }

            const afterCardsPlayedEffect = playerStats.derivedEffects.afterCardsPlayed;
            if(afterCardsPlayedEffect && draft.combatState.cardsPlayedThisTurn > 0 && draft.combatState.cardsPlayedThisTurn % afterCardsPlayedEffect.count === 0) {
                if (afterCardsPlayedEffect.drawCards) {
                    addLog(`[战术目镜] 效果触发, 抽 ${afterCardsPlayedEffect.drawCards} 张牌。`, 'text-teal-300');
                    drawCards(afterCardsPlayedEffect.drawCards);
                }
            }
        }

        const allEnemiesDefeated = draft.combatState.enemies.every(e => e.hp <= 0);
        if (allEnemiesDefeated) {
            draft.combatState.phase = 'victory';
        }
    }


    switch (action.type) {
      case 'START_GAME':
        if (draft.player.completedMissions.length === 0) {
            draft.currentMissionId = 'prologue';
            draft.status = GameStatus.IN_MISSION_DIALOGUE;
        } else {
            draft.status = GameStatus.HUB;
        }
        break;
      
      case 'RESTART_GAME':
        localStorage.removeItem(SAVE_KEY);
        return initialState;

      case 'RESTART_FROM_CHECKPOINT':
        if (state.missionStartState) {
          const { player, customEquipment, customCards } = state.missionStartState;
          return {
            ...initialState, // Reset transient state like combat
            status: GameStatus.HUB,
            player,
            customEquipment,
            customCards,
            // Explicitly reset defeat reward display on checkpoint restart
            sedimentGainedOnDefeat: 0,
          };
        }
        break;

      case 'SELECT_MISSION':
        draft.currentMissionId = action.payload;
        draft.status = GameStatus.MISSION_BRIEFING;
        draft.currentEventIndex = 0;
        draft.isFirstCombatOfMission = true;
        draft.missionStartState = JSON.parse(JSON.stringify(state));
        break;

      case 'ADVANCE_STORY': {
        if (!draft.currentMissionId) break;
        const mission = MISSIONS[draft.currentMissionId];
        if (!mission.events) break;

        const currentEvent = mission.events[draft.currentEventIndex];
        if (currentEvent.type === 'action') {
            switch(currentEvent.action) {
                case 'open_hub':
                    if (!draft.player.completedMissions.includes(draft.currentMissionId)) {
                        draft.player.completedMissions.push(draft.currentMissionId);
                        draft.player.dreamSediment += mission.rewards.dreamSediment;
                    }
                    returnToHubAndReset();
                    break;
                case 'present_choice':
                    draft.status = GameStatus.CHOICE_SCREEN;
                    break;
                case 'game_over':
                    if (!draft.player.completedMissions.includes(draft.currentMissionId)) {
                         draft.player.completedMissions.push(draft.currentMissionId);
                         draft.player.dreamSediment += mission.rewards.dreamSediment;
                    }
                    draft.status = GameStatus.GAME_COMPLETE;
                    break;
            }
            break;
        }
        
        const nextIndex = draft.currentEventIndex + 1;
        if (nextIndex >= mission.events.length) {
            draft.status = GameStatus.MISSION_VICTORY;
            break;
        }
        
        draft.currentEventIndex = nextIndex;
        const nextEvent = mission.events[nextIndex];
        
        if (nextEvent.type === 'combat') {
          draft.status = GameStatus.IN_MISSION_COMBAT;
          
          const stage = getStage();
          const enemies = nextEvent.enemies.map((enemyId, index) => {
              const enemyData = ENEMIES[enemyId];
              const finalHp = Math.round(enemyData.maxHp * (1 + (stage - 1) * 0.08));
              const finalAttack = Math.round(enemyData.attack * (1 + (stage - 1) * 0.06));

              return {
                  ...enemyData,
                  id: `${enemyId}_${index}`,
                  hp: finalHp,
                  maxHp: finalHp,
                  attack: finalAttack,
                  deck: shuffle(enemyData.deck),
                  statusEffects: [],
                  hand: [],
                  discard: [],
                  exhaust: [],
                  block: 0,
                  tideCounter: 0,
                  specialAction: enemyData.specialAction,
                  specialActionTriggered: false,
              };
          });
          
          const deckToUse = draft.player.decks[draft.player.activeDeckId];
          const initialDeck = draft.interimCombatState ? draft.interimCombatState.deck : shuffle(deckToUse).map(cardId => ({
            ...allCards[cardId],
            instanceId: `${cardId}_${Date.now()}_${Math.random()}`
          }));
          const initialHand = draft.interimCombatState ? draft.interimCombatState.hand : [];
          const initialDiscard = draft.interimCombatState ? draft.interimCombatState.discard : [];
          const initialExhaust = draft.interimCombatState ? draft.interimCombatState.exhaust : [];
          const initialConstructs = draft.interimCombatState?.constructs || [];
          
          draft.interimCombatState = undefined;
          draft.player.tideCounter = 0;


          draft.combatState = {
              phase: 'player_turn',
              enemies,
              constructs: initialConstructs,
              log: [{ id: logIdCounter++, text: '战斗开始！' }],
              overclockCooldown: 0,
              turn: 0,
              deck: initialDeck,
              hand: initialHand,
              discard: initialDiscard,
              exhaust: initialExhaust,
              block: 0,
              activeEnemyIndex: null,
              enemyActions: {},
              activeActionIndex: 0,
              attackingEnemyId: null,
              animationTriggers: {},
              sparkCostModifier: 0,
              cardsPlayedThisTurn: 0,
              nextAttackCostModifier: 0,
              firstAttackPlayedThisTurn: false,
              firstDiscardThisTurn: false,
              differentAttacksPlayed: [],
              hpThresholdTriggered: false,
              debuffsAppliedThisTurn: 0,
              damageTakenThisTurn: 0,
          };
          
          startPlayerTurn();
        } else {
          draft.status = GameStatus.IN_MISSION_DIALOGUE;
        }
        break;
      }
      
      case 'SKIP_DIALOGUE': {
        if (!draft.currentMissionId || draft.status !== GameStatus.IN_MISSION_DIALOGUE) break;
        const mission = MISSIONS[draft.currentMissionId];
        if (!mission.events) break;

        let nextInteractiveIndex = -1;
        for (let i = draft.currentEventIndex; i < mission.events.length; i++) {
            const event = mission.events[i];
            if (event.type === 'combat' || (event.type === 'action' && event.action !== 'end_chapter')) {
                nextInteractiveIndex = i;
                break;
            }
        }
        
        if (nextInteractiveIndex !== -1) {
            draft.currentEventIndex = nextInteractiveIndex;
            const event = mission.events[nextInteractiveIndex];

            if (event.type === 'combat') {
              draft.status = GameStatus.IN_MISSION_COMBAT;
              
              const stage = getStage();
              const enemies = event.enemies.map((enemyId, index) => {
                  const enemyData = ENEMIES[enemyId];
                  const finalHp = Math.round(enemyData.maxHp * (1 + (stage - 1) * 0.08));
                  const finalAttack = Math.round(enemyData.attack * (1 + (stage - 1) * 0.06));
                  return {
                      ...enemyData,
                      id: `${enemyId}_${index}`,
                      hp: finalHp,
                      maxHp: finalHp,
                      attack: finalAttack,
                      deck: shuffle(enemyData.deck),
                      statusEffects: [],
                      hand: [],
                      discard: [],
                      exhaust: [],
                      block: 0,
                      tideCounter: 0,
                      specialAction: enemyData.specialAction,
                      specialActionTriggered: false,
                  };
              });
              
              const deckToUse = draft.player.decks[draft.player.activeDeckId];
              const initialDeck = draft.interimCombatState ? draft.interimCombatState.deck : shuffle(deckToUse).map(cardId => ({
                ...allCards[cardId],
                instanceId: `${cardId}_${Date.now()}_${Math.random()}`
              }));
              const initialHand = draft.interimCombatState ? draft.interimCombatState.hand : [];
              const initialDiscard = draft.interimCombatState ? draft.interimCombatState.discard : [];
              const initialExhaust = draft.interimCombatState ? draft.interimCombatState.exhaust : [];
              const initialConstructs = draft.interimCombatState?.constructs || [];

              draft.interimCombatState = undefined;
              draft.player.tideCounter = 0;

              draft.combatState = {
                  phase: 'player_turn',
                  enemies,
                  constructs: initialConstructs,
                  log: [{ id: logIdCounter++, text: '战斗开始！' }],
                  overclockCooldown: 0,
                  turn: 0,
                  deck: initialDeck,
                  hand: initialHand,
                  discard: initialDiscard,
                  exhaust: initialExhaust,
                  block: 0,
                  activeEnemyIndex: null,
                  enemyActions: {},
                  activeActionIndex: 0,
                  attackingEnemyId: null,
                  animationTriggers: {},
                  sparkCostModifier: 0,
                  cardsPlayedThisTurn: 0,
                  nextAttackCostModifier: 0,
                  firstAttackPlayedThisTurn: false,
                  firstDiscardThisTurn: false,
                  differentAttacksPlayed: [],
                  hpThresholdTriggered: false,
                  debuffsAppliedThisTurn: 0,
                  damageTakenThisTurn: 0,
              };
              
              startPlayerTurn();
            } else if (event.type === 'action') {
                switch(event.action) {
                    case 'open_hub':
                        if (!draft.player.completedMissions.includes(draft.currentMissionId)) {
                            draft.player.completedMissions.push(draft.currentMissionId);
                            draft.player.dreamSediment += mission.rewards.dreamSediment;
                        }
                        returnToHubAndReset();
                        break;
                    case 'present_choice':
                        draft.status = GameStatus.CHOICE_SCREEN;
                        break;
                    case 'game_over':
                        if (!draft.player.completedMissions.includes(draft.currentMissionId)) {
                             draft.player.completedMissions.push(draft.currentMissionId);
                             draft.player.dreamSediment += mission.rewards.dreamSediment;
                        }
                        draft.status = GameStatus.GAME_COMPLETE;
                        break;
                }
            }
        } else {
            draft.status = GameStatus.MISSION_VICTORY;
        }
        break;
      }
      
      case 'RETURN_TO_HUB': {
        if (draft.currentMissionId && draft.status === GameStatus.MISSION_VICTORY) {
          if (!draft.player.completedMissions.includes(draft.currentMissionId)) {
            const mission = MISSIONS[draft.currentMissionId];
            if (mission) {
              draft.player.completedMissions.push(draft.currentMissionId);
              draft.player.dreamSediment += mission.rewards.dreamSediment;
            }
          }
        }
        returnToHubAndReset();
        break;
      }
        
      case 'PLAY_CARD': {
        if (!draft.combatState || draft.combatState.phase !== 'player_turn') break;
        
        const { cardInstanceId, targetId } = action.payload;
        const cardIndex = draft.combatState.hand.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndex === -1) break;
        
        const card = draft.combatState.hand[cardIndex];
        const playerStats = getPlayerStats();

        if (card.effect.playCondition?.requiresStatus && targetId) {
          const req = card.effect.playCondition.requiresStatus;
          const targetEnemy = draft.combatState.enemies.find(e => e.id === targetId);
          const status = targetEnemy?.statusEffects.find(e => e.id === req.effectId);
          const statusName = STATUS_EFFECTS[req.effectId]?.name || req.effectId;
          if (!status || (status.value || 0) < req.minStacks) {
              addLog(`[${card.name}] 使用失败，目标[${statusName}]层数不足 ${req.minStacks}。`, 'text-red-400');
              break;
          }
        }

        if (card.effect.playCondition?.allEnemiesMustHaveStatus) {
            const effectId = card.effect.playCondition.allEnemiesMustHaveStatus;
            const aliveEnemies = draft.combatState.enemies.filter(e => e.hp > 0);
            const statusName = STATUS_EFFECTS[effectId]?.name || effectId;
            const allHaveStatus = aliveEnemies.length > 0 && aliveEnemies.every(e => e.statusEffects.some(s => s.id === effectId && (s.value || 0) > 0));
            if (!allHaveStatus) {
                addLog(`[${card.name}] 使用失败，并非所有敌人都处于[${statusName}]状态。`, 'text-red-400');
                break;
            }
        }

        const isOverflow = card.effect.overflowEffect && draft.player.cp === playerStats.maxCp;

        let effectiveCost = card.costOverride ?? (card.id === 'spark' ? card.cost + draft.combatState.sparkCostModifier : card.cost);
        
        const firstAttackCostReduction = playerStats.derivedEffects.firstAttackCostReduction || 0;
        if (card.type === 'attack' && !draft.combatState.firstAttackPlayedThisTurn && firstAttackCostReduction > 0) {
            effectiveCost = Math.max(0, effectiveCost - firstAttackCostReduction);
        }

        if (card.type === 'attack' && draft.combatState.nextAttackCostModifier < 0) {
            effectiveCost += draft.combatState.nextAttackCostModifier;
            effectiveCost = Math.max(0, effectiveCost);
            draft.combatState.nextAttackCostModifier = 0;
        }

        const isBound = draft.player.statusEffects.some(e => e.id === 'bind');
        if (isBound && card.type === 'attack') {
            addLog(`[${card.name}] 使用失败，你处于束缚状态！`, 'text-red-400');
            break;
        }

        if (card.effect.chargeCost && draft.player.charge < card.effect.chargeCost) {
            addLog(`[${card.name}] 使用失败，充能不足。`, 'text-red-400');
            break;
        }
        
        if (card.effect.overclockCost) {
            if (playerStats.hp <= card.effect.overclockCost) {
                addLog(`[${card.name}] 使用失败，HP不足。`, 'text-red-400');
                break;
            }
            draft.player.hp -= card.effect.overclockCost;
            addLog(`你消耗 ${card.effect.overclockCost} HP 使用了 [${card.name}]。`, 'text-yellow-300');
        } else {
            if (playerStats.cp < effectiveCost) {
                addLog(`[${card.name}] 使用失败，CP不足。`, 'text-red-400');
                break;
            }
            draft.player.cp -= effectiveCost;
        }
        
        playSound('play_card');

        if (card.cost >= 3 && playerStats.derivedEffects.onHighCostCardBlock) {
            const { blockMultiplier } = playerStats.derivedEffects.onHighCostCardBlock;
            const blockGained = Math.round(playerStats.blockPower * blockMultiplier);
            draft.combatState.block += blockGained;
            addLog(`[奇点核心] 效果触发, 获得 ${blockGained} 点格挡。`, 'text-teal-300');
        }

        draft.combatState.cardsPlayedThisTurn++;

        // Handle in-hand cost reduction after a card is played
        draft.combatState.hand.forEach(handCard => {
            if (handCard.instanceId !== cardInstanceId && handCard.effect.costReductionOnCardPlay) {
                const currentCost = handCard.costOverride ?? handCard.cost;
                handCard.costOverride = Math.max(0, currentCost - handCard.effect.costReductionOnCardPlay);
            }
        });

        if (card.id === 'spark') {
            draft.combatState.sparkCostModifier++;
        }

        if (card.effect.chargeCost) {
            draft.player.charge -= card.effect.chargeCost;
            addLog(`你消耗了 ${card.effect.chargeCost} 点充能。`, 'text-orange-400');
        }
        
        if (card.type === 'attack') {
            dealBleedDamageAndTriggerEffects(draft.player, 'player', playerStats);
            if (draft.player.hp <= 0) {
                draft.combatState.phase = 'defeat';
                break;
            }
        }
        
        const [playedCard] = draft.combatState.hand.splice(cardIndex, 1);
        draft.combatState.lastCardPlayedInstanceId = playedCard.instanceId;
        
        if (isOverflow && card.effect.overflowEffect) {
            addLog(`[${card.name}] 溢流效果触发！`, 'text-cyan-200');
            processCardEffect(card.effect.overflowEffect, card.id, targetId);
        } else {
            const {
                discardCards,
                generateCardChoice,
                choiceEffect,
                ...immediateEffect
            } = card.effect;
    
            processCardEffect(immediateEffect as CardEffect, card.id, targetId);

            if (choiceEffect) {
                draft.combatState.phase = 'awaiting_effect_choice';
                draft.combatState.effectChoiceAction = {
                    sourceCardInstanceId: playedCard.instanceId,
                    sourceTargetId: targetId,
                    options: choiceEffect.options,
                };
            } else if (discardCards) {
                const discardInfo = discardCards;
                const availableCardsCount = draft.combatState.hand.length;
            
                let numToDiscard = 0;
            
                if (discardInfo.from === 'all') {
                    numToDiscard = availableCardsCount;
                } else { // from: 'hand'
                    numToDiscard = discardInfo.count;
                }
            
                if (availableCardsCount >= numToDiscard && numToDiscard > 0) {
                    draft.combatState.phase = 'awaiting_discard';
                    draft.combatState.discardAction = {
                        count: numToDiscard,
                        from: discardInfo.from,
                        sourceCardInstanceId: playedCard.instanceId,
                        sourceTargetId: targetId,
                    };
                } else {
                    addLog(`没有足够的手牌可供弃置，[${card.name}] 的弃牌效果被跳过。`, 'text-gray-400');
                }
            } else if (generateCardChoice) {
                draft.combatState.phase = 'awaiting_card_choice';
                draft.combatState.cardChoiceAction = {
                    options: generateCardChoice,
                };
            }
        }
        
        if (card.effect.modifyRandomCardCost) {
            const { amount, count } = card.effect.modifyRandomCardCost;
            const modifiableCards = draft.combatState.hand.filter(c => c.instanceId !== playedCard.instanceId);
            for (let i = 0; i < count; i++) {
                if (modifiableCards.length > 0) {
                    const cardToModifyIndex = Math.floor(Math.random() * modifiableCards.length);
                    const cardToModify = modifiableCards[cardToModifyIndex];
                    const handCard = draft.combatState.hand.find(c => c.instanceId === cardToModify.instanceId);
                    if (handCard) {
                        const currentCost = handCard.costOverride ?? handCard.cost;
                        handCard.costOverride = Math.max(0, currentCost + amount);
                        addLog(`[${card.name}] 效果触发, [${handCard.name}] 的费用减少了 ${-amount}。`, 'text-teal-300');
                        modifiableCards.splice(cardToModifyIndex, 1);
                    }
                }
            }
        }
        
        if (card.type === 'power' || card.effect.exhausts || playedCard.temporary) {
            draft.combatState.exhaust.push(playedCard);
            if(card.type === 'power') addLog(`[${card.name}] 效果已激活。`, 'text-purple-300');
        } else if (card.effect.returnsToHand) {
            if (card.effect.costIncreaseOnUseThisTurn) {
                const currentCost = playedCard.costOverride ?? playedCard.cost;
                playedCard.costOverride = currentCost + card.effect.costIncreaseOnUseThisTurn;
            }
            draft.combatState.hand.push(playedCard);
            checkForHandOverflow();
        } else {
            draft.combatState.discard.push(playedCard);
        }
        
        if (card.type === 'attack') {
            draft.combatState.firstAttackPlayedThisTurn = true;
        }

        break;
      }
      
      case 'DISCARD_CARDS': {
        if (!draft.combatState || !draft.combatState.discardAction) break;
        const { cardInstanceIds } = action.payload;
        const { sourceCardInstanceId, sourceTargetId } = draft.combatState.discardAction;
        
        const sourceCard = [...draft.combatState.discard, ...draft.combatState.exhaust].find(c => c.instanceId === sourceCardInstanceId);
        
        const playerStats = getPlayerStats();
        
        const cardsToDiscard = draft.combatState.hand.filter(c => cardInstanceIds.includes(c.instanceId));
        draft.combatState.hand = draft.combatState.hand.filter(c => !cardInstanceIds.includes(c.instanceId));
        cardsToDiscard.forEach(c => draft.combatState.discard.push(c));
        
        cardsToDiscard.forEach(discardedCard => {
            addLog(`你弃掉了 [${discardedCard.name}]。`, 'text-gray-400');

            if (!draft.combatState.firstDiscardThisTurn) {
                if (playerStats.derivedEffects.onFirstDiscard) {
                    const bonus = playerStats.derivedEffects.onFirstDiscard.nextAttackDamageBonus;
                    draft.player.statusEffects.push({
                        id: 'empowered', name: '强化', description: `下一张攻击牌伤害提升${bonus*100}%。`, type: 'buff', duration: 2
                    });
                    addLog(`[数据删除匕首] 效果触发，获得[强化]！`, 'text-teal-300');
                }
                if (playerStats.derivedEffects.onFirstDiscardDraw) {
                    addLog(`[回收处理器] 效果触发，抽 1 张牌。`, 'text-teal-300');
                    drawCards(playerStats.derivedEffects.onFirstDiscardDraw);
                }
                draft.combatState.firstDiscardThisTurn = true;
            }

            if (discardedCard.effect.onDiscard) {
                addLog(`[${discardedCard.name}] 的弃置效果触发！`, 'text-yellow-500');
                processCardEffect(discardedCard.effect.onDiscard, discardedCard.id, sourceTargetId, true);
            }
            const feverishEffect = draft.player.statusEffects.find(e => e.id === 'feverish_calculation');
            if (feverishEffect) {
                addLog(`[狂热演算] 效果触发！`, 'text-yellow-500');
                processCardEffect({ target: 'random_enemy', damageMultiplier: 0.3 }, 'feverish_calculation', undefined, true);
            }
        });
        
        if (sourceCard && sourceCard.effect.discardCards?.then) {
            if (sourceCard.id === 'all_in') {
                for (let i=0; i < cardInstanceIds.length; i++) {
                    processCardEffect(sourceCard.effect.discardCards.then, sourceCard.id, sourceTargetId);
                }
            } else {
                 processCardEffect(sourceCard.effect.discardCards.then, sourceCard.id, sourceTargetId);
            }
        }
        
        draft.combatState.phase = 'player_turn';
        draft.combatState.discardAction = undefined;
        
        const allEnemiesDefeated = draft.combatState.enemies.every(e => e.hp <= 0);
        if (allEnemiesDefeated) {
            draft.combatState.phase = 'victory';
        }
        break;
      }

      case 'RETURN_CARDS_TO_DECK': {
        if (!draft.combatState || draft.combatState.phase !== 'awaiting_return_to_deck') break;
        const { cardInstanceIds } = action.payload;

        const cardsToReturn = draft.combatState.hand.filter(c => cardInstanceIds.includes(c.instanceId));
        draft.combatState.hand = draft.combatState.hand.filter(c => !cardInstanceIds.includes(c.instanceId));
        
        cardsToReturn.forEach(card => {
            draft.combatState.deck.push(card);
            addLog(`[${card.name}] 已返回牌库。`, 'text-gray-400');
        });
        
        draft.combatState.deck = shuffle(draft.combatState.deck);
        
        draft.combatState.phase = 'player_turn';
        draft.combatState.returnToDeckAction = undefined;
        break;
      }
      
      case 'CHOOSE_CARD_TO_GENERATE': {
        if (!draft.combatState || draft.combatState.phase !== 'awaiting_card_choice') break;
        const { cardId } = action.payload;
        const cardTemplate = allCards[cardId];

        if (cardTemplate) {
            const newCard: CombatCard = {
                ...cardTemplate,
                instanceId: `${cardId}_gen_${Date.now()}_${Math.random()}`,
                temporary: true,
            };
            draft.combatState.hand.push(newCard);
            addLog(`你衍生了一张临时的 [${cardTemplate.name}]。`, 'text-yellow-300');
        }

        draft.combatState.phase = 'player_turn';
        draft.combatState.cardChoiceAction = undefined;
        checkForHandOverflow();
        break;
      }

      case 'CHOOSE_EFFECT': {
        if (!draft.combatState || draft.combatState.phase !== 'awaiting_effect_choice' || !draft.combatState.effectChoiceAction) break;
        const { effect } = action.payload;
        const { sourceCardInstanceId, sourceTargetId } = draft.combatState.effectChoiceAction;

        const sourceCard = [...draft.combatState.discard, ...draft.combatState.exhaust].find(c => c.instanceId === sourceCardInstanceId);

        if (sourceCard) {
            processCardEffect(effect, sourceCard.id, sourceTargetId);
        }

        draft.combatState.phase = 'player_turn';
        draft.combatState.effectChoiceAction = undefined;

        const allEnemiesDefeated = draft.combatState.enemies.every(e => e.hp <= 0);
        if (allEnemiesDefeated) {
            draft.combatState.phase = 'victory';
        }
        break;
      }

      case 'END_TURN': {
        if (!draft.combatState || draft.combatState.phase !== 'player_turn') break;
        
        playSound('end_turn');
        const playerStats = getPlayerStats();
        
        const lastCardPlayedInstanceId = draft.combatState.lastCardPlayedInstanceId;
        if (lastCardPlayedInstanceId) {
            const lastCardPlayed = [...draft.combatState.discard, ...draft.combatState.exhaust, ...draft.combatState.hand].find(c => c.instanceId === lastCardPlayedInstanceId);
            if (lastCardPlayed && lastCardPlayed.effect.finisherEffect) {
                addLog(`[${lastCardPlayed.name}] 的【终幕】效果触发！`, 'text-cyan-300');
                processCardEffect(lastCardPlayed.effect.finisherEffect, lastCardPlayed.id, undefined);
            }
        }
        
        if (draft.combatState.damageTakenThisTurn === 0 && playerStats.derivedEffects.onNoHpDamageHeal) {
            const healAmount = playerStats.derivedEffects.onNoHpDamageHeal;
            draft.player.hp = Math.min(playerStats.maxHp, draft.player.hp + healAmount);
            addLog(`[自修复系统] 效果触发, 恢复了 ${healAmount} 点HP。`, 'text-teal-300');
        }

        const feverishStrikeInHand = draft.combatState.hand.find(c => c.id === 'feverish_strike');
        const limitBreakEffect = draft.player.statusEffects.some(e => e.id === 'limit_break');

        if (limitBreakEffect) {
            const cardsToDiscard: CombatCard[] = [...draft.combatState.hand];
            draft.combatState.hand = [];
            cardsToDiscard.forEach(c => {
                 draft.combatState.discard.push(c);
                 addLog(`[限制解除] 效果, 弃掉了 [${c.name}]。`, 'text-red-400');
            });
            cardsToDiscard.forEach(discardedCard => {
                if (discardedCard.effect.onDiscard) {
                    addLog(`[${discardedCard.name}] 的弃置效果触发！`, 'text-yellow-500');
                    processCardEffect(discardedCard.effect.onDiscard, discardedCard.id, undefined, true);
                }
                const feverishEffect = draft.player.statusEffects.find(e => e.id === 'feverish_calculation');
                if (feverishEffect) {
                    addLog(`[狂热演算] 效果触发！`, 'text-yellow-500');
                    processCardEffect({ target: 'random_enemy', damageMultiplier: 0.3 }, 'feverish_calculation', undefined, true);
                }
            });
            draft.player.statusEffects = draft.player.statusEffects.filter(e => e.id !== 'limit_break');
        } else if (feverishStrikeInHand) {
            addLog(`[狂热突袭] 效果触发，回合结束时随机弃掉2张牌。`, 'text-red-400');
            const shuffledHand: CombatCard[] = shuffle(draft.combatState.hand);
            const toDiscard: CombatCard[] = shuffledHand.slice(0, 2);
            const toDiscardInstanceIds = toDiscard.map(c => c.instanceId);

            draft.combatState.hand = draft.combatState.hand.filter(c => !toDiscardInstanceIds.includes(c.instanceId));
            toDiscard.forEach(c => draft.combatState.discard.push(c));
            
            toDiscard.forEach(discardedCard => {
                addLog(`你弃掉了 [${discardedCard.name}]。`, 'text-gray-400');
                if (discardedCard.effect.onDiscard) {
                    addLog(`[${discardedCard.name}] 的弃置效果触发！`, 'text-yellow-500');
                    processCardEffect(discardedCard.effect.onDiscard, discardedCard.id, undefined, true);
                }
                const feverishEffect = draft.player.statusEffects.find(e => e.id === 'feverish_calculation');
                if (feverishEffect) {
                    addLog(`[狂热演算] 效果触发！`, 'text-yellow-500');
                    processCardEffect({ target: 'random_enemy', damageMultiplier: 0.3 }, 'feverish_calculation', undefined, true);
                }
            });
        }

        const feverishPowerEffect = draft.player.statusEffects.find(e => e.id === 'feverish_calculation');
        if (feverishPowerEffect && feverishPowerEffect.data?.cardsToAdd) {
            addLog(`[狂热演算] 效果触发，将卡牌加入弃牌堆。`, 'text-yellow-500');
            (feverishPowerEffect.data.cardsToAdd as string[]).forEach((cardId: string) => {
                const newCardTemplate = allCards[cardId];
                if (newCardTemplate) {
                    const newCard: CombatCard = {
                        ...newCardTemplate,
                        instanceId: `${cardId}_gen_${Date.now()}_${Math.random()}`
                    };
                    draft.combatState.discard.push(newCard);
                }
            });
            if (feverishPowerEffect.data) {
                feverishPowerEffect.data.cardsToAdd = undefined;
            }
        }

        const painEchoEffect = draft.player.statusEffects.find(e => e.id === 'pain_echo_effect');
        if (painEchoEffect && draft.combatState.bleedDamageDealtThisTurn) {
            addLog(`[痛苦回响] 效果触发！`, 'text-yellow-500');
            const painCard = allCards['pain'];
            if(painCard) {
                draft.combatState.deck.push({ ...painCard, instanceId: `pain_${Date.now()}_${Math.random()}`, temporary: true });
                draft.combatState.deck.push({ ...painCard, instanceId: `pain_${Date.now()}_${Math.random()}_2`, temporary: true });
                draft.combatState.deck = shuffle(draft.combatState.deck);
                addLog(`2张 [苦痛] 被洗入了你的牌库。`, 'text-purple-300');
            }
        }

        processEndOfTurnConstructs('player');

        addLog(`你的回合结束。`, 'text-gray-400');
        draft.combatState.phase = 'enemy_turn';
        draft.combatState.activeEnemyIndex = 0;
        draft.combatState.activeActionIndex = 0;
        if (!playerStats.derivedEffects.chargeNoDecay) {
            draft.player.charge = 0;
        }
        break;
      }
      
      case 'PROCESS_ENEMY_ACTION': {
        if (!draft.combatState || draft.combatState.phase !== 'enemy_turn') break;
        
        const currentEnemyIndex = draft.combatState.activeEnemyIndex;
        if (currentEnemyIndex === null || currentEnemyIndex >= draft.combatState.enemies.length) {
            startPlayerTurn();
            break;
        }
        
        const enemy = draft.combatState.enemies[currentEnemyIndex];
        const currentActionIndex = draft.combatState.activeActionIndex;
        const playerStats = getPlayerStats();

        if (enemy.hp > 0) {
            const isFirstActionOfTurn = currentActionIndex === 0;
            if (isFirstActionOfTurn) {
                draft.combatState.attackingEnemyId = enemy.id;
                applyStatusEffectsStartOfTurn(enemy, false);
                enemy.tideCounter = (enemy.tideCounter || 0) + 1;
            }
            
            if (enemy.hp > 0) {
                const actions = draft.combatState.enemyActions[enemy.id];
                if (actions && currentActionIndex < actions.length) {
                    const card = actions[currentActionIndex];
                    const actionCountText = actions.length > 1 ? `(${currentActionIndex + 1}/${actions.length})` : '';
                    addLog(`${enemy.name} 使用了 [${card.name}]。 ${actionCountText}`);
                    playSound('play_card_enemy');

                    if (card.effect.removeAllBlock && draft.combatState.block > 0) {
                        const blockRemoved = draft.combatState.block;
                        draft.combatState.block = 0;
                        addLog(`${enemy.name} 的 [${card.name}] 摧毁了你 ${blockRemoved} 点格挡！`, 'text-red-500');
                    }

                    if (card.effect.forcePlayerDiscard) {
                        const { count } = card.effect.forcePlayerDiscard;
                        if (draft.combatState.hand.length > 0) {
                            const shuffledHand = shuffle([...draft.combatState.hand]);
                            const actualCount = Math.min(count, shuffledHand.length);
                            const cardsToDiscard = shuffledHand.slice(0, actualCount);
                            const cardNames = cardsToDiscard.map(c => c.name).join(', ');
                            const instanceIdsToDiscard = new Set(cardsToDiscard.map(c => c.instanceId));

                            draft.combatState.hand = draft.combatState.hand.filter(handCard => !instanceIdsToDiscard.has(handCard.instanceId));
                            cardsToDiscard.forEach(c => draft.combatState.discard.push(c));
                            
                            addLog(`${enemy.name} 的 [${card.name}] 迫使你弃掉了 ${cardsToDiscard.length} 张牌: [${cardNames}]！`, 'text-purple-400');
                        }
                    }

                    if (card.effect.summonEnemy) {
                        const { enemyId, count } = card.effect.summonEnemy;
                        const enemyTemplate = ENEMIES[enemyId];
                        if (enemyTemplate) {
                            let summonedCount = 0;
                            for (let i = 0; i < count; i++) {
                                if (draft.combatState.enemies.filter(e => e.hp > 0).length >= 3) {
                                    addLog(`${enemy.name} 试图召唤，但战场上已没有空间！`);
                                    break;
                                }
                                const stage = draft.player.completedMissions.length + 1;
                                const finalHp = Math.round(enemyTemplate.maxHp * (1 + (stage - 1) * 0.08));
                                const finalAttack = Math.round(enemyTemplate.attack * (1 + (stage - 1) * 0.06));
                    
                                const newEnemy: Draft<Enemy> = {
                                    ...enemyTemplate,
                                    id: `${enemyId}_summon_${Date.now()}_${i}`,
                                    hp: finalHp,
                                    maxHp: finalHp,
                                    attack: finalAttack,
                                    deck: shuffle(enemyTemplate.deck),
                                    statusEffects: [],
                                    hand: [],
                                    discard: [],
                                    exhaust: [],
                                    block: 0,
                                    tideCounter: 0,
                                    specialAction: enemyTemplate.specialAction,
                                    specialActionTriggered: false,
                                };
                                draft.combatState.enemies.push(newEnemy);
                                draft.combatState.enemyActions[newEnemy.id] = null;
                                summonedCount++;
                            }
                            if (summonedCount > 0) {
                                addLog(`${enemy.name} 召唤了 ${summonedCount} 个 [${enemyTemplate.name}]！`, 'text-green-400');
                            }
                        }
                    }

                    if (card.effect.damageMultiplier) {
                        const isBound = enemy.statusEffects.some(e => e.id === 'bind');
                        if (!isBound) {
                            dealBleedDamageAndTriggerEffects(enemy, enemy.id, playerStats);
                            
                            if (enemy.hp > 0) {
                                const hitCount = card.effect.hitCount || 1;
                                const wasEmpowered = enemy.statusEffects.some(e => e.id === 'empowered');
                                const inAnnihilationMode = enemy.statusEffects.some(e => e.id === 'annihilation_mode_empowered');
                                
                                let targetIdForAction: string = 'player';
                                const isSingleTargetAttack = card.effect.target === 'enemy';
                                
                                if (isSingleTargetAttack) {
                                    const playerConstructs = draft.combatState.constructs.filter(c => c.owner === 'player' && c.hp > 0);
                                    if (playerConstructs.length > 0) {
                                        const targetsWithWeights: { id: string; weight: number }[] = [
                                            { id: 'player', weight: AGGRO_SETTINGS.PLAYER_WEIGHT }
                                        ];
                                        playerConstructs.forEach(c => {
                                            targetsWithWeights.push({ id: c.instanceId, weight: AGGRO_SETTINGS.CONSTRUCT_WEIGHT });
                                        });
                                
                                        const totalWeight = targetsWithWeights.reduce((sum, target) => sum + target.weight, 0);
                                        let random = Math.random() * totalWeight;
                                
                                        for (const target of targetsWithWeights) {
                                            random -= target.weight;
                                            if (random <= 0) {
                                                targetIdForAction = target.id;
                                                break;
                                            }
                                        }
                                        
                                        if (targetIdForAction !== 'player') {
                                            addLog(`${enemy.name} 的攻击目标转向了你的构装体!`);
                                        }
                                    }
                                }


                                for (let i = 0; i < hitCount; i++) {
                                    if (draft.player.hp <= 0 && targetIdForAction === 'player') break;
                                    
                                    let damage = enemy.attack * card.effect.damageMultiplier;
                                    
                                    if(wasEmpowered || inAnnihilationMode) {
                                        damage *= 2.5;
                                        if (i === 0) addLog(`${enemy.name} 的攻击被[强化]了！`, 'text-yellow-400');
                                    }
                                    
                                    let damageToBlock = 0;
                                    let damageToHp = 0;
                                    
                                    if(targetIdForAction === 'player') {
                                        const isVulnerable = draft.player.statusEffects.some(e => e.id === 'vulnerable');
                                        if (isVulnerable) damage += enemy.attack * 0.5;
                                        damage = Math.round(damage);

                                        if (draft.combatState.block > 0) {
                                            const blockReduced = Math.min(draft.combatState.block, damage);
                                            damageToBlock = blockReduced;
                                            draft.combatState.block -= blockReduced;
                                        }
                                        const remainingDamage = damage - damageToBlock;
                                        if (remainingDamage > 0) {
                                            const finalDamageAfterDefense = Math.max(1, remainingDamage - playerStats.defense);
                                            damageToHp = Math.round(finalDamageAfterDefense);
                                            draft.player.hp -= damageToHp;
                                            draft.combatState.damageTakenThisTurn += damageToHp;
                                        }
                                        
                                        if (damageToHp > 0) {
                                            playSound('player_hit');
                                            triggerAnimation('player', 'hit_hp');
                                            addLog(`${enemy.name} 对你造成了 ${damageToHp} 点伤害。${hitCount > 1 ? `(${i + 1}/${hitCount})` : ''}`, 'text-red-400');
                                        } else if (damageToBlock > 0) {
                                            playSound('player_block');
                                            triggerAnimation('player', 'hit_block');
                                            addLog(`${enemy.name} 对你的格挡造成了 ${damageToBlock} 点伤害。${hitCount > 1 ? `(${i + 1}/${hitCount})` : ''}`, 'text-red-400');
                                        }

                                    } else { // Target is a construct
                                        const targetConstruct = draft.combatState.constructs.find(c => c.instanceId === targetIdForAction);
                                        if (targetConstruct && targetConstruct.hp > 0) {
                                            damage = Math.round(damage);
                                            if (targetConstruct.block > 0) {
                                                const blockReduced = Math.min(targetConstruct.block, damage);
                                                damageToBlock = blockReduced;
                                                targetConstruct.block -= blockReduced;
                                            }
                                            const remainingDamage = damage - damageToBlock;
                                            if (remainingDamage > 0) {
                                                const finalDamageAfterDefense = Math.max(1, remainingDamage - targetConstruct.defense);
                                                damageToHp = Math.round(finalDamageAfterDefense);
                                                targetConstruct.hp -= damageToHp;
                                            }

                                            if (damageToHp > 0) {
                                                playSound('enemy_hit');
                                                triggerAnimation(targetConstruct.instanceId, 'hit_hp');
                                                addLog(`${enemy.name} 对 [${targetConstruct.name}] 造成了 ${damageToHp} 点伤害。`, 'text-red-400');
                                            } else if (damageToBlock > 0) {
                                                playSound('enemy_block');
                                                triggerAnimation(targetConstruct.instanceId, 'hit_block');
                                                addLog(`${enemy.name} 对 [${targetConstruct.name}] 的格挡造成了 ${damageToBlock} 点伤害。`, 'text-red-400');
                                            }
                                        }
                                    }
                                    
                                    if (targetIdForAction === 'player' && card.effect.addCardToDeckOnHpDamage && damageToHp > 0) {
                                        card.effect.addCardToDeckOnHpDamage.forEach(cardIdToAdd => {
                                            const newCardTemplate = allCards[cardIdToAdd];
                                            if (newCardTemplate) {
                                                const newCard: CombatCard = {
                                                    ...newCardTemplate,
                                                    instanceId: `${cardIdToAdd}_gen_${Date.now()}_${Math.random()}`
                                                };
                                                draft.combatState.deck.push(newCard);
                                                addLog(`${enemy.name} 的攻击将一张 [${newCard.name}] 洗入了你的牌库！`, 'text-purple-400');
                                            }
                                        });
                                        draft.combatState.deck = shuffle(draft.combatState.deck);
                                    }
                                     if (targetIdForAction === 'player' && playerStats.derivedEffects.onHpBelowThreshold && !draft.combatState.hpThresholdTriggered && damageToHp > 0) {
                                        const hpPercent = (draft.player.hp / playerStats.maxHp) * 100;
                                        const { threshold, gainCp, drawCards: cardsToDraw } = playerStats.derivedEffects.onHpBelowThreshold;
                                        if (hpPercent < threshold) {
                                            draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + gainCp);
                                            drawCards(cardsToDraw);
                                            addLog(`[肾上腺素泵] 效果触发！恢复 ${gainCp} CP并抽 ${cardsToDraw} 张牌！`, 'text-teal-300');
                                            draft.combatState.hpThresholdTriggered = true;
                                        }
                                    }
                                    
                                    if (targetIdForAction === 'player' && damageToHp === 0 && damageToBlock > 0) {
                                        const onBlockEffect = playerStats.derivedEffects.onBlockAllDamage;
                                        if (onBlockEffect) {
                                            if (onBlockEffect.gainCp) {
                                                draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + onBlockEffect.gainCp);
                                                addLog(`[装备效果] 你完全格挡了攻击并恢复了 ${onBlockEffect.gainCp} CP。`, 'text-teal-300');
                                            }
                                            if (onBlockEffect.drawCards) {
                                                addLog(`[装备效果] 你完全格挡了攻击并抽了 ${onBlockEffect.drawCards} 张牌。`, 'text-teal-300');
                                                drawCards(onBlockEffect.drawCards);
                                            }
                                        }
                                    }

                                    if (targetIdForAction === 'player' && draft.player.counterAttack && draft.player.hp > 0) {
                                        const counterCard = allCards[draft.player.counterAttack];
                                        if (counterCard && counterCard.effect.damageMultiplier) {
                                            let counterDamage = Math.round(playerStats.attack * counterCard.effect.damageMultiplier);
                                            const finalCounterDamage = Math.max(1, counterDamage - enemy.defense);
                                            enemy.hp -= finalCounterDamage;
                                            playSound('enemy_hit');
                                            triggerAnimation(enemy.id, 'hit_hp');
                                            addLog(`你发动反击，对 ${enemy.name} 造成了 ${finalCounterDamage} 伤害！`, 'text-yellow-400');
                                            draft.player.counterAttack = null;
                                        }
                                    }
                                }

                                if (wasEmpowered) {
                                    enemy.statusEffects = enemy.statusEffects.filter(e => e.id !== 'empowered');
                                }
                            }
                        } else {
                            addLog(`${enemy.name} 处于束缚状态，无法攻击！`, 'text-green-300');
                        }
                    }

                    if (card.effect.consumeStatus) {
                        const { effectId, gainBlockPerStack, maxConsumeStacks } = card.effect.consumeStatus;
                        // Enemy consume status always targets player
                        const statusEffect = draft.player.statusEffects.find(e => e.id === effectId);
                
                        if (statusEffect && statusEffect.value) {
                            const stacks = statusEffect.value;
                            const stacksToConsume = Math.min(stacks, maxConsumeStacks || stacks);
                
                            if (gainBlockPerStack) {
                                const blockGained = stacksToConsume * gainBlockPerStack;
                                enemy.block += blockGained;
                                addLog(`${enemy.name} 消耗了你的 ${stacksToConsume} 层[${statusEffect.name}]，获得了 ${blockGained} 点格挡！`, 'text-red-400');
                            }
                            
                            statusEffect.value -= stacksToConsume;
                            if (statusEffect.value <= 0) {
                                draft.player.statusEffects = draft.player.statusEffects.filter(e => e.id !== effectId);
                            }
                        }
                    }

                    if (card.effect.gainBlock) {
                        enemy.block += card.effect.gainBlock;
                        addLog(`${enemy.name} 获得了 ${card.effect.gainBlock} 点格挡。`, 'text-blue-300');
                    }
                    
                    if (card.effect.heal) {
                        const healedAmount = Math.min(enemy.maxHp - enemy.hp, card.effect.heal);
                        if (healedAmount > 0) {
                            enemy.hp += healedAmount;
                            addLog(`${enemy.name} 恢复了 ${healedAmount} 点HP。`, 'text-green-300');
                        }
                    }

                    if (card.effect.statusEffect) {
                        const effectTemplate = STATUS_EFFECTS[card.effect.statusEffect];
                        if (effectTemplate) {
                            const isStacking = ['burn', 'bleed', 'poison'].includes(card.effect.statusEffect);
                            const newEffect: StatusEffect = {
                                ...effectTemplate,
                                duration: isStacking ? 999 : (card.effect.statusEffectDuration || 1),
                                value: card.effect.statusEffectValue,
                                sourceAttack: enemy.attack,
                            };

                            const applyToPlayer = card.effect.target !== 'self';
                            const targetEntity = applyToPlayer ? draft.player : enemy;

                            const existingEffect = targetEntity.statusEffects.find(e => e.id === newEffect.id);
                            if (existingEffect) {
                                if (isStacking) {
                                    existingEffect.value = (existingEffect.value || 0) + (newEffect.value || 0);
                                    existingEffect.sourceAttack = enemy.attack;
                                }
                                existingEffect.duration = Math.max(existingEffect.duration, newEffect.duration);
                            } else {
                                targetEntity.statusEffects.push(newEffect);
                            }
                            
                            if (applyToPlayer) {
                                addLog(`你获得了 [${newEffect.name}] 状态。`, 'text-red-300');
                            } else {
                                addLog(`${enemy.name} 获得了 [${newEffect.name}] 状态。`, 'text-green-300');
                            }
                        }
                    }

                    if (card.effect.selfDamageMultiplier) {
                        const selfDamage = Math.round(enemy.attack * card.effect.selfDamageMultiplier);
                        if (selfDamage > 0) {
                            enemy.hp -= selfDamage;
                            playSound('enemy_hit');
                            triggerAnimation(enemy.id, 'hit_hp');
                            addLog(`${enemy.name} 因 [${card.name}] 的反噬受到了 ${selfDamage} 点伤害！`, 'text-orange-400');
                        }
                    }

                    if (card.effect.addCardToDiscard) {
                        card.effect.addCardToDiscard.forEach(cardId => {
                            const newCardTemplate = allCards[cardId];
                            if (newCardTemplate) {
                                const newCard: CombatCard = {
                                    ...newCardTemplate,
                                    instanceId: `${cardId}_gen_${Date.now()}_${Math.random()}`
                                };
                                draft.combatState.discard.push(newCard);
                            }
                        });
                        addLog(`${enemy.name} 将 ${card.effect.addCardToDiscard.length} 张[恶臭]洗入了你的弃牌堆！`, 'text-purple-400');
                    }
                    if (card.effect.addCardToDeck) {
                        card.effect.addCardToDeck.forEach(cardId => {
                            const newCardTemplate = allCards[cardId];
                            if (newCardTemplate) {
                                const newCard: CombatCard = {
                                    ...newCardTemplate,
                                    instanceId: `${cardId}_gen_${Date.now()}_${Math.random()}`
                                };
                                draft.combatState.deck.push(newCard);
                            }
                        });
                        draft.combatState.deck = shuffle(draft.combatState.deck);
                        addLog(`${enemy.name} 将 ${card.effect.addCardToDeck.length} 张[恶臭]洗入了你的牌库！`, 'text-purple-400');
                    }
                    
                    if (card.effect.deployConstruct) {
                        if (draft.combatState.constructs.length < 3) {
                            const template = CONSTRUCTS[card.effect.deployConstruct];
                            const newConstruct: Construct = {
                                instanceId: `construct_enemy_${template.id}_${Date.now()}`,
                                templateId: template.id,
                                name: template.name,
                                owner: enemy.id,
                                maxHp: Math.round(enemy.maxHp * template.statScaling.maxHp.multiplier),
                                hp: Math.round(enemy.maxHp * template.statScaling.maxHp.multiplier),
                                attack: Math.round(enemy.attack * template.statScaling.attack.multiplier),
                                defense: Math.round(enemy.defense * template.statScaling.defense.multiplier),
                                block: 0, statusEffects: [],
                                durability: 3,
                                designatedTargetId: 'player',
                            };
                            draft.combatState.constructs.push(newConstruct);
                            addLog(`${enemy.name} 部署了 [${newConstruct.name}]！`);
                        }
                    }

                    const cardIdPlayedIndex = enemy.hand.indexOf(card.id);
                    if (cardIdPlayedIndex > -1) {
                        const [cardIdPlayed] = enemy.hand.splice(cardIdPlayedIndex, 1);
                        if (card.effect.exhausts) {
                            enemy.exhaust.push(cardIdPlayed);
                            addLog(`[${card.name}] 已被消耗。`, 'text-gray-400');
                        } else {
                            enemy.discard.push(cardIdPlayed);
                        }
                    }
                }
            }
        }

        if (draft.player.hp <= 0) {
            draft.combatState.phase = 'defeat';
            break;
        }
        
        const allEnemiesDefeated = draft.combatState.enemies.every(e => e.hp <= 0);
        if (allEnemiesDefeated) {
            draft.combatState.phase = 'victory';
            break;
        }

        const currentEnemyActions = draft.combatState.enemyActions[enemy.id];
        const nextActionIndex = currentActionIndex + 1;

        if (currentEnemyActions && nextActionIndex < currentEnemyActions.length) {
            draft.combatState.activeActionIndex = nextActionIndex;
        } else {
            draft.combatState.activeActionIndex = 0;
            draft.combatState.activeEnemyIndex = currentEnemyIndex + 1;
        }
        break;
      }
      
      case 'START_PLAYER_TURN': {
        startPlayerTurn();
        break;
      }
      
      case 'COMBAT_VICTORY': {
        if (!draft.currentMissionId || !draft.combatState) break;
        const mission = MISSIONS[draft.currentMissionId];
        if (!mission.events) break;

        let rewardSediment = 0;
        draft.combatState.enemies.forEach(e => {
            rewardSediment += e.reward.dreamSediment;
        });
        draft.player.dreamSediment += rewardSediment;
        
        draft.player.statusEffects = draft.player.statusEffects.filter(
            effect => effect.type === 'buff' && effect.duration >= 999
        );
        draft.player.charge = 0;
        draft.player.counterAttack = null;
        
        const nextIndex = draft.currentEventIndex + 1;
        if (nextIndex >= mission.events.length) {
            draft.combatState = null;
            draft.status = GameStatus.MISSION_VICTORY;
        } else {
            draft.interimCombatState = {
                deck: draft.combatState.deck,
                hand: draft.combatState.hand,
                discard: draft.combatState.discard,
                exhaust: draft.combatState.exhaust,
                constructs: draft.combatState.constructs.filter(c => c.owner === 'player'),
            };
            draft.combatState = null;
            draft.currentEventIndex = nextIndex;
            draft.status = GameStatus.IN_MISSION_DIALOGUE;
        }
        
        draft.isFirstCombatOfMission = false;
        
        break;
      }

      case 'COMBAT_DEFEAT': {
        let sedimentReward = 0;
        if (draft.combatState) {
            draft.combatState.enemies.forEach(enemy => {
                if (enemy.hp <= 0) {
                    // Grant 50% of the sediment for defeated enemies
                    sedimentReward += Math.round(enemy.reward.dreamSediment * 0.5);
                }
            });
        }

        draft.player.dreamSediment += sedimentReward;
        draft.sedimentGainedOnDefeat = sedimentReward;
        draft.status = GameStatus.GAME_OVER;
        draft.interimCombatState = undefined;
        break;
      }

      case 'ADD_TO_DECK': {
        const { cardId, deckId } = action.payload;
        const deck = draft.player.decks[deckId];
        if (deck && deck.length < DECK_SIZE) {
            const collectionCount = draft.player.cardCollection.filter(c => c === cardId).length;
            const deckCount = deck.filter(c => c === cardId).length;
            if (deckCount < collectionCount) {
                deck.push(cardId);
            }
        }
        break;
      }

      case 'REMOVE_FROM_DECK': {
        const { deckId, cardIndex } = action.payload;
        const deck = draft.player.decks[deckId];
        if (deck && cardIndex > -1 && cardIndex < deck.length) {
            deck.splice(cardIndex, 1);
        }
        break;
      }

      case 'SET_ACTIVE_DECK': {
        draft.player.activeDeckId = action.payload.deckId;
        break;
      }

      case 'EQUIP_ITEM': {
        const { itemId } = action.payload;
        const item = allEquipment[itemId];
        if (!item) break;
        
        const currentItemId = draft.player.equipment[item.slot];
        if (currentItemId) {
            draft.player.inventory.push(currentItemId);
        }
        
        draft.player.inventory = draft.player.inventory.filter(id => id !== item.id);
        draft.player.equipment[item.slot] = item.id;
        break;
      }
      
      case 'UNEQUIP_ITEM': {
          const { slot } = action.payload;
          const itemId = draft.player.equipment[slot];
          if(itemId) {
              draft.player.equipment[slot] = null;
              draft.player.inventory.push(itemId);
          }
          break;
      }
      
      case 'SYNCHRONIZE_WEAPON': {
        const cost = SYNC_COSTS.weapon;
        if (draft.player.dreamSediment >= cost) {
            draft.player.dreamSediment -= cost;
            const stage = getStage();
            const newWeapon = generateRandomEquipment(stage, 'weapon');
            draft.customEquipment[newWeapon.id] = newWeapon;
            draft.player.inventory.push(newWeapon.id);
            draft.newlyAcquiredEquipmentIds = [newWeapon.id];
        }
        break;
      }

      case 'SYNCHRONIZE_EQUIPMENT': {
        const cost = SYNC_COSTS.equipment;
        if (draft.player.dreamSediment >= cost) {
            draft.player.dreamSediment -= cost;
            const stage = getStage();
            const newEquipment = generateRandomEquipment(stage, 'equipment');
            draft.customEquipment[newEquipment.id] = newEquipment;
            draft.player.inventory.push(newEquipment.id);
            draft.newlyAcquiredEquipmentIds = [newEquipment.id];
        }
        break;
      }

      case 'SYNCHRONIZE_CARD': {
        const cost = SYNC_COSTS.card;
        if (draft.player.dreamSediment >= cost) {
            draft.player.dreamSediment -= cost;
            const cardSyncs = (draft.player.cardSyncsSinceLastEpic || 0) + 1;
            const forceEpic = cardSyncs >= 2;

            const newCards = generateCardPack(draft.player.cardCollection, forceEpic);
            const hasEpic = newCards.some(id => allCards[id]?.rarity === CardRarity.EPIC);

            if (hasEpic) {
                draft.player.cardSyncsSinceLastEpic = 0;
            } else {
                draft.player.cardSyncsSinceLastEpic = cardSyncs;
            }

            newCards.forEach(cardId => draft.player.cardCollection.push(cardId));
            draft.newlyAcquiredCardIds = newCards;
        }
        break;
      }
      
      case 'CLEAR_NEW_CARDS': {
        draft.newlyAcquiredCardIds = [];
        break;
      }
      
      case 'CLEAR_NEW_EQUIPMENT': {
        draft.newlyAcquiredEquipmentIds = [];
        break;
      }

      case 'DECOMPOSE_ITEM': {
        const { itemId } = action.payload;
        const isEquipped = Object.values(draft.player.equipment).includes(itemId);
        if (isEquipped) break;

        const inventoryIndex = draft.player.inventory.indexOf(itemId);
        if (inventoryIndex > -1) {
            draft.player.inventory.splice(inventoryIndex, 1);
            const sedimentGain = 25;
            draft.player.dreamSediment += sedimentGain;
            delete draft.customEquipment[itemId];
        }
        break;
      }
      
      case 'DECOMPOSE_CARD': {
          const { cardId } = action.payload;
          const collectionCount = draft.player.cardCollection.filter(c => c === cardId).length;
          
          let totalDeckCount = 0;
          Object.values(draft.player.decks).forEach(deck => {
              if(Array.isArray(deck)) {
                totalDeckCount += deck.filter(c => c === cardId).length;
              }
          });
          
          if (collectionCount > totalDeckCount) {
              const collectionIndex = draft.player.cardCollection.findIndex(c => c === cardId);
              if (collectionIndex > -1) {
                  draft.player.cardCollection.splice(collectionIndex, 1);
                  const sedimentGain = 15;
                  draft.player.dreamSediment += sedimentGain;
                  
                  if (cardId.startsWith('gen_') && !draft.player.cardCollection.includes(cardId)) {
                      delete draft.customCards[cardId];
                  }
              }
          }
          break;
      }

      case 'DEBUG_ADD_SEDIMENT':
          draft.player.dreamSediment += action.payload;
          break;

      case 'DEBUG_JUMP_TO_CHAPTER': {
        const { chapter } = action.payload;
        draft.player.dreamSediment = 9999;

        const missionsToComplete = Object.values(MISSIONS)
            .filter(mission => mission.chapter && mission.chapter < chapter)
            .map(mission => mission.id);
        
        const completed = new Set([...draft.player.completedMissions, ...missionsToComplete]);
        draft.player.completedMissions = Array.from(completed);
        
        draft.status = GameStatus.HUB;
        draft.currentMissionId = null;
        draft.currentEventIndex = 0;
        draft.combatState = null;
        break;
      }
    }
  });
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState);

  useEffect(() => {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, serializedState);
    } catch (err) {
      console.error("Could not save state", err);
    }
  }, [state]);
  
  const enhancedDispatch = (action: GameAction) => {
      if (action.type === 'PROCESS_ENEMY_ACTION') {
        setTimeout(() => {
            dispatch(action);
        }, 1400);
    } else {
        dispatch(action);
    }
  };

  return (
    <GameContext.Provider value={{ state, dispatch: enhancedDispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};