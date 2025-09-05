import { Draft } from 'immer';
import { GameState, GameStatus, Enemy, StatusEffect, PlayerState, PlayerStats, Card, CardRarity, AnimationType, CardEffect, CombatCard, CombatState, Construct, CombatEvent } from '../types';
import { CARDS, ENEMIES, STATUS_EFFECTS, MISSIONS, COMBAT_SETTINGS, CONSTRUCTS, AGGRO_SETTINGS, EXPECTED_PLAYER_STATS_BY_CHAPTER } from '../constants';
import { playSound } from '../utils/sounds';
import { shuffle } from '../utils/arrayUtils';

let logIdCounter = 0;

const CHARGE_CAP = 20;
const HAND_LIMIT = 9;
const ENTROPY_CAP = 30;

export interface ReducerDependencies {
    getAllCards: () => Record<string, Card>;
    getAllEquipment: () => Record<string, any>;
    getPlayerStats: () => PlayerStats;
    getStage: () => number;
    getCurrentChapter: () => number;
}

export const addLog = (draft: Draft<GameState>, text: string, color?: string) => {
    if (draft.combatState) {
        draft.combatState.log.push({ id: logIdCounter++, text, color });
    }
};

export const triggerAnimation = (draft: Draft<GameState>, entityId: string, type: AnimationType) => {
    if (draft.combatState) {
        draft.combatState.animationTriggers[entityId] = { type, key: Date.now() + Math.random() };
    }
};

export const gainCharge = (draft: Draft<GameState>, deps: ReducerDependencies, amount: number, logMessage: string) => {
    if (!draft.combatState || amount <= 0) return;
    const oldCharge = draft.player.charge;
    draft.player.charge = Math.min(CHARGE_CAP, oldCharge + amount);
    const actualGained = draft.player.charge - oldCharge;
    if (actualGained > 0) {
        addLog(draft, logMessage.replace('{amount}', actualGained.toString()));
    }
};

export const returnToHubAndReset = (draft: Draft<GameState>, deps: ReducerDependencies) => {
    const playerStats = deps.getPlayerStats();
    draft.player.hp = playerStats.maxHp;
    draft.player.cp = playerStats.maxCp;
    draft.player.statusEffects = draft.player.statusEffects.filter(e => e.type === 'buff' && e.duration >= 999);
    draft.player.charge = 0;
    draft.player.entropy = 0;
    draft.player.counterAttack = null;
    draft.player.tideCounter = 0;
    draft.combatState = null;
    
    draft.status = GameStatus.HUB;
    draft.currentMissionId = null;
    draft.currentEventIndex = 0;
    draft.isFirstCombatOfMission = true;
    draft.interimCombatState = undefined;
    draft.missionStartState = undefined;
    draft.sedimentGainedOnDefeat = 0;
    draft.currentMissionIsReplay = false;
};

export const checkForHandOverflow = (draft: Draft<GameState>, deps: ReducerDependencies) => {
    if (!draft.combatState) return;
    const overflow = draft.combatState.hand.length - HAND_LIMIT;
    if (overflow > 0) {
        draft.combatState.phase = 'awaiting_return_to_deck';
        draft.combatState.returnToDeckAction = { count: overflow };
        addLog(draft, `手牌溢出！你需要选择 ${overflow} 张牌放回牌库。`, 'text-yellow-400');
    }
};

export const drawCards = (draft: Draft<GameState>, deps: ReducerDependencies, count: number) => {
    if (!draft.combatState) return;
    if (count > 0) playSound('draw_card');
    for (let i = 0; i < count; i++) {
        if (draft.combatState.hand.length >= HAND_LIMIT) break;
        if (draft.combatState.deck.length === 0) {
            if (draft.combatState.discard.length === 0) break;
            playSound('shuffle_deck');
            draft.combatState.deck = shuffle(draft.combatState.discard);
            draft.combatState.discard = [];
        }
        const card = draft.combatState.deck.pop();
        if (card) {
            if (card.id === 'interference_shard') {
                addLog(draft, `抽到了 [干扰碎片]！`, 'text-red-400');
                const debuff = { ...STATUS_EFFECTS.interference_shard_debuff, duration: 1 };
                draft.player.statusEffects.push(debuff);
                draft.combatState.exhaust.push(card);
                continue;
            }
            if (card.effect.onDraw) {
                const onDrawEffect = card.effect.onDraw;
                addLog(draft, `抽到了 [${card.name}]！`, 'text-red-400');
                if (onDrawEffect.damagePercentMaxHp) {
                    const playerStats = deps.getPlayerStats();
                    const damage = Math.ceil(playerStats.maxHp * onDrawEffect.damagePercentMaxHp);
                    draft.player.hp -= damage;
                    playSound('player_hit');
                    triggerAnimation(draft, 'player', 'hit_hp');
                    addLog(draft, `你因 [${card.name}] 的效果受到了 ${damage} 点伤害。`, 'text-red-400');
                    if (draft.player.hp <= 0) {
                        draft.combatState.phase = 'defeat';
                        break;
                    }
                }
                if (onDrawEffect.exhausts) {
                    draft.combatState.exhaust.push(card);
                    addLog(draft, `[${card.name}] 已被移除。`, 'text-gray-400');
                    continue;
                }
                if (onDrawEffect.autoPlay) {
                    processCardEffect(draft, deps, card.effect, card.id, undefined);
                    continue; 
                }
            }
            draft.combatState.hand.push(card);
        }
    }
    checkForHandOverflow(draft, deps);
};

export const dealBleedDamageAndTriggerEffects = (draft: Draft<GameState>, deps: ReducerDependencies, entity: Draft<PlayerState | Enemy>, entityId: string): boolean => {
    if (!draft.combatState) return false;
    const bleedEffect = entity.statusEffects.find(e => e.id === 'bleed');
    if (!bleedEffect || !bleedEffect.value) return false;

    let bleedDamage = Math.ceil(entity.maxHp * (bleedEffect.value / 100));
    
    if (entityId === 'player') {
        const playerStats = deps.getPlayerStats();
        if (playerStats.derivedEffects.dotReduction) {
            bleedDamage *= (1 - playerStats.derivedEffects.dotReduction);
        }
    }
    bleedDamage = Math.round(bleedDamage);

    if (bleedDamage > 0) {
        const hpBefore = entity.hp;
        entity.hp -= bleedDamage;
        playSound('status_damage');
        triggerAnimation(draft, entityId, 'bleed');
        const entityName = entityId === 'player' ? '你' : (entity as Enemy).name;
        addLog(draft, `${entityName} 因[流血]受到了 ${bleedDamage} 点伤害！`, 'text-red-400');
        draft.combatState.bleedDamageDealtThisTurn = true;
        if (entityId !== 'player' && entity.hp <= 0 && hpBefore > 0) {
            checkForOnKillEffects(draft, deps, entity as Draft<Enemy>);
            return true;
        }
    }
    return false;
};

export const applyStatusEffectsStartOfTurn = (draft: Draft<GameState>, deps: ReducerDependencies, entity: PlayerState | Enemy, isPlayer: boolean) => {
    const effectsToRemove: string[] = [];
    const playerStats = deps.getPlayerStats();

    const hpBefore = entity.hp;

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
            playSound('status_damage');
            triggerAnimation(draft, entityId, 'poison');
            addLog(draft, `${isPlayer ? '你' : (entity as Enemy).name} 因[中毒]受到了 ${damage} 点伤害。`, 'text-purple-400');
            const newStacks = effect.value - 1;
            effect.value = newStacks;
            if (newStacks <= 0) {
                effect.duration = 0;
            }
        }

        if (isPlayer && effect.id === 'charge_next_turn' && typeof effect.value === 'number') {
            gainCharge(draft, deps, effect.value, `你获得了 {amount} 点[充能]。`);
        }
        if (isPlayer && effect.id === 'plan_ahead_draw') {
            addLog(draft, `[筹划] 效果触发，抽2张牌！`, 'text-yellow-400');
            drawCards(draft, deps, 2);
        }
        if (isPlayer && effect.id === 'kindling_effect') {
            if (draft.combatState) {
                const totalBurn = draft.combatState.enemies.reduce((sum, enemy) => {
                    const burn = enemy.statusEffects.find(s => s.id === 'burn');
                    return sum + (burn?.value || 0);
                }, 0);
                if (totalBurn >= 15) {
                    addLog(draft, `[薪火] 效果触发，抽1张牌并衍生[熔火之心]！`, 'text-yellow-500');
                    drawCards(draft, deps, 1);
                    const moltenHeartTemplate = deps.getAllCards()['molten_heart'];
                    if (moltenHeartTemplate) {
                        draft.combatState.hand.push({ ...moltenHeartTemplate, instanceId: `molten_heart_gen_${Date.now()}_${Math.random()}`, temporary: true });
                        checkForHandOverflow(draft, deps);
                    }
                    effectsToRemove.push('kindling_effect');
                }
            }
        }
        if (effect.id === 'burn' && effect.value) {
            const stacks = effect.value;
            let sourceAttack = effect.sourceAttack || 10;
            let damage = Math.max(1, Math.round(stacks * sourceAttack * 0.15));

            if (isPlayer && playerStats.derivedEffects.dotReduction) {
                damage *= (1 - playerStats.derivedEffects.dotReduction);
            } else if (!isPlayer) {
                const burnCritChance = playerStats.derivedEffects.burnCritChance || 0;
                if (Math.random() < burnCritChance) {
                    const critMultiplier = playerStats.derivedEffects.burnCritMultiplier || 1.5;
                    damage = Math.round(damage * critMultiplier);
                    addLog(draft, `[薪火之刃] 效果触发！ [烧伤] 造成了暴击！`, 'text-yellow-400');
                }
            }
            
            damage = Math.round(damage);
            entity.hp -= damage;
            
            playSound('status_damage');
            triggerAnimation(draft, entityId, 'burn');
            addLog(draft, `${isPlayer ? '你' : (entity as Enemy).name} 因[烧伤]受到了 ${damage} 点伤害。`, 'text-orange-400');

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

    if (!isPlayer && entity.hp <= 0 && hpBefore > 0) {
        return true; // Indicates the entity was defeated
    }
    
    entity.statusEffects = entity.statusEffects.filter(e => !effectsToRemove.includes(e.id));
    return false; // Not defeated
};

const triggerConstructOnDestroy = (draft: Draft<GameState>, deps: ReducerDependencies, construct: Draft<Construct>) => {
    if (!draft.combatState) return;
    const template = CONSTRUCTS[construct.templateId];
    if (template?.behavior?.onDestroy) {
        addLog(draft, `[${construct.name}] 被摧毁，触发效果！`);
        processConstructAction(draft, deps, construct, template.behavior.onDestroy);
    }
};

export const processConstructAction = (draft: Draft<GameState>, deps: ReducerDependencies, construct: Draft<Construct>, effectCard: {cardId: string, target: string}) => {
    if (!draft.combatState) return;

    const card = deps.getAllCards()[effectCard.cardId];
    if (!card) return;

    let targetId: string | undefined;
    let targetEnemy: Draft<Enemy> | undefined;
    let targetPlayer = false;

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
        addLog(draft, `[${construct.name}] 无法找到目标，行动失败。`);
        return;
    }

    addLog(draft, `[${construct.name}] 的效果触发，使用了 [${card.name}]。`);

    const effect = card.effect;

    if ((effect.damageMultiplier || effect.fixedDamage) && !targetPlayer) {
        const targetEntity = targetEnemy;
        if (targetEntity) {
            const hpBefore = targetEntity.hp;
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
                 triggerAnimation(draft, targetEntity.id, 'hit_hp');
                 addLog(draft, `[${construct.name}] 对 ${targetEntity.name} 造成了 ${damageToHp} 点伤害。`);
            }
            if (damageToBlock > 0) {
                playSound('enemy_block');
                triggerAnimation(draft, targetEntity.id, 'hit_block');
                addLog(draft, `[${construct.name}] 对 ${targetEntity.name} 的格挡造成了 ${damageToBlock} 点伤害。`);
            }
            if (targetEntity.hp <= 0 && hpBefore > 0) {
                checkForOnKillEffects(draft, deps, targetEntity);
            }
        }
    }

    if (effect.gainBlockMultiplier && targetPlayer) {
        const playerStats = deps.getPlayerStats();
        const blockGained = Math.round(playerStats.blockPower * effect.gainBlockMultiplier);
        draft.combatState.block += blockGained;
        playSound('player_block');
        addLog(draft, `[${construct.name}] 使你获得了 ${blockGained} 点格挡。`);
    }
};

export const processEndOfTurnConstructs = (draft: Draft<GameState>, deps: ReducerDependencies, ownerType: 'player' | 'enemy') => {
    if (!draft.combatState) return;

    const constructsToProcess = draft.combatState.constructs.filter(c => {
        if (c.hp <= 0) return false;
        if (ownerType === 'player') return c.owner === 'player';
        return c.owner !== 'player';
    });
    
    const newlyDestroyedConstructs: Draft<Construct>[] = [];

    for (const construct of constructsToProcess) {
        const template = CONSTRUCTS[construct.templateId];
        if (template.behavior.onTurnEnd) {
            processConstructAction(draft, deps, construct, template.behavior.onTurnEnd);
        }
        
        construct.durability -= 1;
        if (construct.durability <= 0) {
            addLog(draft, `[${construct.name}] 的耐久度耗尽，被摧毁了。`);
            construct.hp = 0;
            newlyDestroyedConstructs.push(construct);
        }
    }
    
    for (const construct of newlyDestroyedConstructs) {
        triggerConstructOnDestroy(draft, deps, construct);
    }
    
    draft.combatState.constructs = draft.combatState.constructs.filter(c => c.hp > 0);
};

export const startPlayerTurn = (draft: Draft<GameState>, deps: ReducerDependencies) => {
    if (!draft.combatState) return;

    // --- Enemy Entropy Decay ---
    draft.combatState.enemies.forEach(e => {
        if (e.hp > 0) {
            e.entropy = Math.max(0, e.entropy - 3);
        }
    });
    // -------------------------

    // Reset block at the start of the player's turn.
    draft.combatState.block = Math.round(draft.combatState.block / 2);
    
    const playerStats = deps.getPlayerStats();
    const isFirstTurnOfCombat = draft.combatState.turn === 0;

    processEndOfTurnConstructs(draft, deps, 'enemy');

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
    draft.combatState.activeEnemyIndex = 0;
    draft.combatState.activeActionIndex = 0;
    draft.combatState.lastCardPlayedType = undefined;
    draft.combatState.lastCardPlayedKeywords = undefined;

    const allCardPiles: (keyof Pick<Draft<CombatState>, 'hand' | 'deck' | 'discard' | 'exhaust'>)[] = ['hand', 'deck', 'discard', 'exhaust'];
    allCardPiles.forEach(pileName => {
        (draft.combatState![pileName] as Draft<CombatCard>[]).forEach(card => {
            const cardTemplate = deps.getAllCards()[card.id];
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
        addLog(draft, '潮汐涌动！你的CP已完全恢复！', 'text-cyan-200');
    }
    
    const openingCeremony = draft.player.statusEffects.find(e => e.id === 'opening_ceremony_effect');
    if (openingCeremony) {
        addLog(draft, `[开幕仪典] 效果触发，手牌费用-1！`, 'text-yellow-400');
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
        addLog(draft, `[再校准协议] 效果触发，恢复1 CP！`, 'text-cyan-300');
        draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + 1);
        recalibrateCp.duration = 0;
    }
    
    applyStatusEffectsStartOfTurn(draft, deps, draft.player, true);
    
    if (playerStats.derivedEffects.onTurnStart) {
        const { gainBlockPercent, gainCharge: chargeToGain } = playerStats.derivedEffects.onTurnStart;
        if (gainBlockPercent) {
            const blockGained = Math.round(playerStats.blockPower * gainBlockPercent);
            draft.combatState.block += blockGained;
            addLog(draft, `[装备效果] 你获得了 ${blockGained} 点格挡。`, 'text-teal-300');
        }
        if (chargeToGain) {
            gainCharge(draft, deps, chargeToGain, `[装备效果] 你获得了 {amount} 点[充能]。`);
        }
    }
    if (playerStats.derivedEffects.onBurnEnemyBlock) {
        const burningEnemies = draft.combatState.enemies.filter(e => e.hp > 0 && e.statusEffects.some(s => s.id === 'burn')).length;
        if (burningEnemies > 0) {
            const blockPerEnemy = Math.round(playerStats.blockPower * playerStats.derivedEffects.onBurnEnemyBlock);
            const totalBlock = burningEnemies * blockPerEnemy;
            draft.combatState.block += totalBlock;
            addLog(draft, `[隔热装甲] 效果触发，获得 ${totalBlock} 点格挡。`, 'text-teal-300');
        }
    }
    
    if (draft.player.hp <= 0) {
        draft.combatState.phase = 'defeat';
        return;
    }

    draft.combatState.enemies.forEach(enemy => {
        if (enemy.hp > 0) {
             if (enemy.aiType === 'garcia_entropy') {
                const entropyActions: Card[] = [];
                const standardActions: Card[] = [];
                const allCards = deps.getAllCards();

                // Action 1: Entropy AI
                let entropyCardId = '';
                if (enemy.entropy >= 20) {
                    entropyCardId = 'entropy_outburst';
                } else if (enemy.entropy >= 10) {
                    entropyCardId = 'entropy_siphon_enemy';
                } else if (enemy.block < 20) {
                    entropyCardId = 'entropy_shield';
                } else {
                    entropyCardId = 'twisted_pulse';
                }
                entropyActions.push(allCards[entropyCardId]);

                // Action 2: Standard Draw
                if (enemy.deck.length === 0) {
                    if (enemy.discard.length > 0) {
                        enemy.deck = shuffle(enemy.discard);
                        enemy.discard = [];
                    }
                }
                const standardCardId = enemy.deck.pop();
                if (standardCardId) {
                    enemy.hand.push(standardCardId);
                    standardActions.push(allCards[standardCardId]);
                }
                
                draft.combatState.enemyActions[enemy.id] = [...entropyActions, ...standardActions];
                return;
            }

            if (enemy.aiType === 'entropy_user' && enemy.entropy >= 10 && enemy.entropyCards) {
                const probability = 0.5 + (enemy.entropy - 10) * 0.05;
                if (Math.random() < probability) {
                    const entropyCardId = enemy.entropyCards[Math.floor(Math.random() * enemy.entropyCards.length)];
                    const entropyCard = deps.getAllCards()[entropyCardId];
                    if (entropyCard) {
                        draft.combatState.enemyActions[enemy.id] = [entropyCard];
                        addLog(draft, `${enemy.name} 被扭曲熵能影响，准备发动特殊行动！`, 'text-purple-400');
                        return; // Action decided, skip normal draw
                    }
                }
            }

            const hpPercent = enemy.hp / enemy.maxHp;
            if (enemy.specialAction && !enemy.specialActionTriggered && hpPercent <= enemy.specialAction.hpThreshold) {
                const specialCard = deps.getAllCards()[enemy.specialAction.cardId];
                if (specialCard) {
                    enemy.specialActionTriggered = true;
                    draft.combatState.enemyActions[enemy.id] = [specialCard];
                    addLog(draft, `${enemy.name} 的生命值过低，启动了特殊模式！`, 'text-red-500');
                    return;
                }
            }

            let baseEnemyId: string;
            if (enemy.id.includes('_reinforcement_')) {
                baseEnemyId = enemy.id.split('_reinforcement_')[0];
            } else if (enemy.id.includes('_summon_')) {
                baseEnemyId = enemy.id.split('_summon_')[0];
            } else {
                baseEnemyId = enemy.id.substring(0, enemy.id.lastIndexOf('_'));
            }

            const enemyTemplate = ENEMIES[baseEnemyId];
            if (!enemyTemplate) {
                console.error(`Could not find enemy template for id: ${baseEnemyId} (from instance id: ${enemy.id})`);
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
                    addLog(draft, `${enemy.name} 重洗了牌库。`, 'text-gray-400');
                }
                const cardId = enemy.deck.pop();
                if (cardId) {
                    enemy.hand.push(cardId);
                    actions.push(deps.getAllCards()[cardId]);
                }
            }
            
            if (isTideTurn && enemyTemplate.tideCard) {
                const tideCardTemplate = deps.getAllCards()[enemyTemplate.tideCard];
                if (tideCardTemplate) {
                    actions.push(tideCardTemplate);
                    addLog(draft, `潮汐涌动！ ${enemy.name} 准备发动特殊行动！`, 'text-red-300');
                }
            }
            draft.combatState.enemyActions[enemy.id] = actions;
        }
    });
    
    addLog(draft, `第 ${draft.combatState.turn} 回合开始。`, 'text-yellow-200');
    
    const equipmentDrawBonus = (playerStats.initialDraw ?? COMBAT_SETTINGS.INITIAL_DRAW_FIRST_COMBAT_FIRST_MISSION) - COMBAT_SETTINGS.INITIAL_DRAW_FIRST_COMBAT_FIRST_MISSION;

    if (isFirstTurnOfCombat) {
        if (draft.isFirstCombatOfMission) {
            drawCards(draft, deps, COMBAT_SETTINGS.INITIAL_DRAW_FIRST_COMBAT_FIRST_MISSION + equipmentDrawBonus);
        } else {
            drawCards(draft, deps, COMBAT_SETTINGS.INITIAL_DRAW_SUBSEQUENT_COMBAT + equipmentDrawBonus);
        }
    } else {
        drawCards(draft, deps, COMBAT_SETTINGS.DRAW_PER_TURN + equipmentDrawBonus);
    }
};

export const handleReinforcements = (draft: Draft<GameState>, deps: ReducerDependencies) => {
    if (!draft.combatState || !draft.combatState.maxEnemiesOnField || draft.combatState.enemyReinforcements.length === 0) {
        return;
    }

    const aliveEnemiesCount = draft.combatState.enemies.filter(e => e.hp > 0).length;
    const reinforcementsNeeded = draft.combatState.maxEnemiesOnField - aliveEnemiesCount;

    if (reinforcementsNeeded > 0) {
        const chapter = deps.getCurrentChapter();
        const expectedStats = EXPECTED_PLAYER_STATS_BY_CHAPTER[chapter] || EXPECTED_PLAYER_STATS_BY_CHAPTER[1];
        
        const reinforcementsToSpawn = draft.combatState.enemyReinforcements.splice(0, reinforcementsNeeded);
        
        if (reinforcementsToSpawn.length > 0) {
            addLog(draft, '增援抵达！', 'text-yellow-400');
            playSound('combat_start');
        }

        reinforcementsToSpawn.forEach(enemyId => {
            const enemyData = ENEMIES[enemyId];
            const finalHp = enemyData.maxHp < expectedStats.maxHp ? Math.round((enemyData.maxHp + expectedStats.maxHp) / 2) : enemyData.maxHp;
            const finalAttack = enemyData.attack < expectedStats.attack ? Math.round((enemyData.attack + expectedStats.attack) / 2) : enemyData.attack;
            const finalDefense = enemyData.defense < expectedStats.defense ? Math.round((enemyData.defense + expectedStats.defense) / 2) : enemyData.defense;

            const newEnemy: Draft<Enemy> = {
                ...enemyData,
                id: `${enemyId}_reinforcement_${Date.now()}_${Math.random()}`,
                hp: finalHp,
                maxHp: finalHp,
                attack: finalAttack,
                defense: finalDefense,
                deck: shuffle(enemyData.deck),
                statusEffects: [],
                hand: [],
                discard: [],
                exhaust: [],
                block: 0,
                tideCounter: 0,
                entropy: 0,
                specialAction: enemyData.specialAction,
                specialActionTriggered: false,
            };
            draft.combatState!.enemies.push(newEnemy);
        });
    }
};

export const checkForOnKillEffects = (draft: Draft<GameState>, deps: ReducerDependencies, enemy: Draft<Enemy>) => {
    const enemyIndex = draft.combatState!.enemies.findIndex(e => e.id === enemy.id);
    if (enemyIndex === -1) {
        return; 
    }

    const playerStats = deps.getPlayerStats();
    if (playerStats.derivedEffects.onKillHeal) {
        draft.player.hp = Math.min(playerStats.maxHp, draft.player.hp + playerStats.derivedEffects.onKillHeal);
        addLog(draft, `[制式刃] 效果触发，你击败了 ${enemy.name} 并恢复了 ${playerStats.derivedEffects.onKillHeal} HP。`, 'text-teal-300');
    }
    if (playerStats.derivedEffects.onKillDraw) {
        addLog(draft, `[装备词缀] 效果触发，击败敌人，抽 ${playerStats.derivedEffects.onKillDraw} 张牌。`, 'text-teal-300');
        drawCards(draft, deps, playerStats.derivedEffects.onKillDraw);
    }

    const isSummon = enemy.id.includes('_summon_');
    if (isSummon) {
        const prowell = draft.combatState!.enemies.find(e => e.hp > 0 && e.statusEffects.some(s => s.id === 'abyssal_echo'));
        if (prowell) {
            prowell.block += 5;
            addLog(draft, `[深渊回响] 触发，${prowell.name} 获得了 5 点格挡。`, 'text-blue-300');
            if (Math.random() < 0.25) {
                const curseCardTemplate = deps.getAllCards()['corrupting_touch'];
                if (curseCardTemplate) {
                    const newCard: CombatCard = {
                        ...curseCardTemplate,
                        instanceId: `curse_gen_${Date.now()}_${Math.random()}`
                    };
                    draft.combatState!.discard.push(newCard);
                    addLog(draft, `[深渊回响] 触发，一张 [${curseCardTemplate.name}] 被洗入了你的弃牌堆！`, 'text-purple-400');
                }
            }
        }
    }

    if (isSummon) {
        const currentIndex = draft.combatState!.enemies.findIndex(e => e.id === enemy.id);
        if (currentIndex !== -1) {
             const [removedEnemy] = draft.combatState!.enemies.splice(currentIndex, 1);
             addLog(draft, `${removedEnemy.name} 从战场上消失了。`);
        }
    }
};

// ... More functions to be moved here (processCardEffect, setupCombat, etc.)
// Due to length limitations, I'll stop here but the pattern is established.
// I need to copy ALL the functions.

export const setupCombat = (draft: Draft<GameState>, deps: ReducerDependencies, combatEvent: CombatEvent) => {
    const chapter = deps.getCurrentChapter();
    const expectedStats = EXPECTED_PLAYER_STATS_BY_CHAPTER[chapter] || EXPECTED_PLAYER_STATS_BY_CHAPTER[1];

    let fieldEnemyIds = [...combatEvent.enemies].filter(id => id !== 'wave_break');
    let reinforcements: string[] = [];

    if (combatEvent.maxEnemiesOnField && combatEvent.maxEnemiesOnField < fieldEnemyIds.length) {
        reinforcements = fieldEnemyIds.splice(combatEvent.maxEnemiesOnField);
    }

    const enemies = fieldEnemyIds.map((enemyId, index) => {
        const enemyData = ENEMIES[enemyId];
        
        const finalHp = enemyData.maxHp < expectedStats.maxHp ? Math.round((enemyData.maxHp + expectedStats.maxHp) / 2) : enemyData.maxHp;
        const finalAttack = enemyData.attack < expectedStats.attack ? Math.round((enemyData.attack + expectedStats.attack) / 2) : enemyData.attack;
        const finalDefense = enemyData.defense < expectedStats.defense ? Math.round((enemyData.defense + expectedStats.defense) / 2) : enemyData.defense;

        return {
            ...enemyData,
            id: `${enemyId}_${index}`,
            hp: finalHp,
            maxHp: finalHp,
            attack: finalAttack,
            defense: finalDefense,
            deck: shuffle(enemyData.deck),
            statusEffects: [],
            hand: [],
            discard: [],
            exhaust: [],
            block: 0,
            tideCounter: 0,
            entropy: 0,
            specialAction: enemyData.specialAction,
            specialActionTriggered: false,
        };
    });
    
    const allCards = deps.getAllCards();
    const deckToUse = draft.player.decks[draft.player.activeDeckId];
    const playerHasEntropyCards = deckToUse.some(cardId => allCards[cardId]?.keywords?.includes('熵能'));

    const initialDeck = draft.interimCombatState ? draft.interimCombatState.deck : shuffle(deckToUse).map(cardId => ({
      ...deps.getAllCards()[cardId],
      instanceId: `${cardId}_${Date.now()}_${Math.random()}`
    }));
    const initialHand = draft.interimCombatState ? draft.interimCombatState.hand : [];
    const initialDiscard = draft.interimCombatState ? draft.interimCombatState.discard : [];
    const initialExhaust = draft.interimCombatState ? draft.interimCombatState.exhaust : [];
    const initialConstructs = draft.interimCombatState?.constructs || [];
    
    draft.interimCombatState = undefined;
    draft.player.tideCounter = 0;
    draft.player.entropy = 0;

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
        activeEnemyIndex: 0,
        enemyActions: {},
        activeActionIndex: 0,
        attackingEnemyId: null,
        animationTriggers: {},
        sparkCostModifier: 0,
        cardsPlayedThisTurn: 0,
        playerHasEntropyCards,
        nextAttackCostModifier: 0,
        firstAttackPlayedThisTurn: false,
        firstDiscardThisTurn: false,
        differentAttacksPlayed: [],
        hpThresholdTriggered: false,
        debuffsAppliedThisTurn: 0,
        damageTakenThisTurn: 0,
        enemyReinforcements: reinforcements,
        maxEnemiesOnField: combatEvent.maxEnemiesOnField,
    };
    
    startPlayerTurn(draft, deps);
};

export const processCardEffect = (draft: Draft<GameState>, deps: ReducerDependencies, originalEffect: CardEffect, sourceCardId: string, targetId?: string, isDiscardEffect: boolean = false) => {
    if (!draft.combatState) return;

    const playerStats = deps.getPlayerStats();
    const card = deps.getAllCards()[sourceCardId];
    
    const effect = { ...originalEffect };

    if (effect.resonance && !isDiscardEffect) {
        let resonanceMet = false;
        if (effect.resonance.requires === 'keyword_charge') {
            if (draft.combatState.lastCardPlayedKeywords?.includes('充能')) {
                resonanceMet = true;
            }
        } else if (draft.combatState.lastCardPlayedType === effect.resonance.requires) {
            resonanceMet = true;
        }

        if (resonanceMet) {
            addLog(draft, `[${card.name}] 的共鸣效果触发！`, 'text-yellow-400');
            const resonanceEffect = effect.resonance.effect;

            if (resonanceEffect.damageMultiplier) {
                effect.damageMultiplier = (effect.damageMultiplier || 0) + resonanceEffect.damageMultiplier;
            }
            if (resonanceEffect.gainCp) {
                effect.gainCp = (effect.gainCp || 0) + resonanceEffect.gainCp;
            }
             if (resonanceEffect.gainBlockMultiplier) {
                effect.gainBlockMultiplier = (effect.gainBlockMultiplier || 0) + resonanceEffect.gainBlockMultiplier;
            }
             if (resonanceEffect.drawCards) {
                effect.drawCards = (effect.drawCards || 0) + resonanceEffect.drawCards;
            }
        }
    }

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
    
    if (effect.damageMultiplierFromContext) {
        const contextCard = draft.combatState.contextCardForEffect;
        if (contextCard && contextCard.effect.damageMultiplier) {
            baseDamage += playerStats.attack * contextCard.effect.damageMultiplier * effect.damageMultiplierFromContext.ratio;
        }
    }

    if (effect.consumeChargeMultiplier) {
         const chargeToConsume = Math.min(draft.player.charge, effect.maxConsumeCharge || draft.player.charge);
         if (chargeToConsume > 0) {
            baseDamage += playerStats.attack * effect.consumeChargeMultiplier * chargeToConsume;
            addLog(draft, `消耗 ${chargeToConsume} 层充能！`, 'text-orange-400');

            if(effect.drawPerChargeConsumed) {
                drawCards(draft, deps, chargeToConsume * effect.drawPerChargeConsumed);
            }
            if(effect.discardPerChargeConsumed && draft.combatState) {
                const cardsToDiscard = chargeToConsume * effect.discardPerChargeConsumed;
                if(cardsToDiscard > 0) {
                     draft.combatState.phase = 'awaiting_discard';
                     draft.combatState.discardAction = {
                         count: cardsToDiscard,
                         from: 'hand',
                         sourceCardInstanceId: "dummy_instance_id_for_charge_consume",
                     };
                }
            }

            if (!playerStats.derivedEffects.chargeNoDecay) {
                draft.player.charge -= chargeToConsume;
            }
            if (playerStats.derivedEffects.onChargeConsumedBlock) {
                const blockGained = chargeToConsume * playerStats.derivedEffects.onChargeConsumedBlock;
                draft.combatState.block += blockGained;
                addLog(draft, `[动能转换器] 效果触发, 获得 ${blockGained} 点格挡。`, 'text-teal-300');
            }
         }
    }
    
    const empoweredEffect = draft.player.statusEffects.find(e => e.id === 'empowered');
    if (empoweredEffect && card.type === 'attack') {
        const bonus = empoweredEffect.value || 0.5;
        baseDamage *= (1 + bonus);
        addLog(draft, `强化效果发动！`, 'text-yellow-500');
        draft.player.statusEffects = draft.player.statusEffects.filter(e => e.id !== 'empowered');
    }
    
    if (baseDamage > 0 && card.type === 'attack') {
        const debuffIndex = draft.player.statusEffects.findIndex(e => e.id === 'interference_shard_debuff' || e.id === 'damage_reduction_20');
        if (debuffIndex > -1) {
            const debuff = draft.player.statusEffects[debuffIndex];
            const reduction = debuff.id === 'damage_reduction_20' ? 0.8 : 0.5;
            baseDamage *= reduction;
            addLog(draft, `[${debuff.name}] 效果触发，你的攻击伤害降低了${(1-reduction)*100}%！`, 'text-red-400');
            draft.player.statusEffects.splice(debuffIndex, 1);
        }

        const targets = effect.target === 'all_enemies' 
            ? draft.combatState.enemies.filter(e => e.hp > 0) 
            : (targetEnemy ? [targetEnemy] : []);
        
        for (const enemy of [...targets]) { // Iterate over a copy in case of modifications
            const enemyRef = draft.combatState.enemies.find(e => e.id === enemy.id);
            if (!enemyRef) continue;

            const hpBefore = enemyRef.hp;
            let finalDamage = baseDamage;

            if (playerStats.derivedEffects.attackDamageBonusVsBleed && enemyRef.statusEffects.some(e => e.id === 'bleed')) {
                finalDamage *= (1 + playerStats.derivedEffects.attackDamageBonusVsBleed);
            }
            const hasDebuff = enemyRef.statusEffects.some(e => e.type === 'debuff');
            if (playerStats.derivedEffects.attackDamageBonusVsDebuff && hasDebuff) {
                finalDamage *= (1 + playerStats.derivedEffects.attackDamageBonusVsDebuff);
            }
             const hpPercent = (enemyRef.hp / enemyRef.maxHp) * 100;
            if (playerStats.derivedEffects.damageBonusVsHighHealth && hpPercent > playerStats.derivedEffects.damageBonusVsHighHealth.threshold) {
                finalDamage *= (1 + playerStats.derivedEffects.damageBonusVsHighHealth.bonus);
            }
            if (playerStats.derivedEffects.damageBonusVsLowHealth && hpPercent < playerStats.derivedEffects.damageBonusVsLowHealth.threshold) {
                finalDamage *= (1 + playerStats.derivedEffects.damageBonusVsLowHealth.bonus);
            }

            const isVulnerable = enemyRef.statusEffects.some(e => e.id === 'vulnerable');
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

            if (enemyRef.block > 0 && normalDamage > 0) {
                const blockReduced = Math.min(enemyRef.block, normalDamage);
                damageToBlock = blockReduced;
                enemyRef.block -= blockReduced;
            }
            
            const remainingDamage = (normalDamage - damageToBlock) + pierceDamage;

            if (remainingDamage > 0) {
                const finalDamageAfterDefense = Math.max(1, remainingDamage - enemyRef.defense);
                damageToHp = Math.round(finalDamageAfterDefense);
                enemyRef.hp -= damageToHp;
            }
            
            const wasFullyBlocked = remainingDamage <= 0;

            if (damageToHp > 0) {
                playSound('enemy_hit');
                triggerAnimation(draft, enemyRef.id, 'hit_hp');
                addLog(draft, `你对 ${enemyRef.name} 造成了 ${damageToHp} 点伤害。`, 'text-green-400');
                
                const exsanguinationEffect = draft.player.statusEffects.find(e => e.id === 'exsanguination');
                if (exsanguinationEffect && damageToHp > 0) {
                    const bleedEffect = enemyRef.statusEffects.find(e => e.id === 'bleed');
                    if (bleedEffect && bleedEffect.value && bleedEffect.value > 0) {
                        const stacksToConsume = 1;
                        bleedEffect.value -= stacksToConsume;
                        const extraDamage = Math.round(playerStats.attack * 0.15 * stacksToConsume);
                        enemyRef.hp -= extraDamage;
                        triggerAnimation(draft, enemyRef.id, 'bleed');
                        addLog(draft, `[放血] 效果触发，消耗了1层[流血]，造成了 ${extraDamage} 点额外伤害！`, 'text-yellow-400');
                        if (bleedEffect.value <= 0) {
                            enemyRef.statusEffects = enemyRef.statusEffects.filter(e => e.id !== 'bleed');
                        }
                    }
                }

                if (card.effect.onHpDamageDealt) {
                    addLog(draft, `[${card.name}] 效果触发！`, 'text-yellow-400');
                    processCardEffect(draft, deps, card.effect.onHpDamageDealt, card.id, enemyRef.id);
                }
            } else if (damageToBlock > 0) {
                playSound('enemy_block');
                triggerAnimation(draft, enemyRef.id, 'hit_block');
                addLog(draft, `你对 ${enemyRef.name} 的格挡造成了 ${damageToBlock} 点伤害。`, 'text-blue-300');
                if (wasFullyBlocked && card.effect.onBlockedByEnemy) {
                    addLog(draft, `[${card.name}] 被完全格挡，效果触发！`, 'text-yellow-400');
                    processCardEffect(draft, deps, card.effect.onBlockedByEnemy, card.id, enemyRef.id);
                }
            }
            
            const envenomEffect = draft.player.statusEffects.find(e => e.id === 'envenom_effect');
            if(envenomEffect) {
                const poisonTemplate = STATUS_EFFECTS['poison'];
                const existingPoison = enemyRef.statusEffects.find(e => e.id === 'poison');
                if (existingPoison) {
                    existingPoison.value = (existingPoison.value || 0) + 1;
                } else {
                    enemyRef.statusEffects.push({ ...poisonTemplate, duration: 999, value: 1 });
                }
                addLog(draft, `[淬毒] 效果触发，对 ${enemyRef.name} 施加了1层[中毒]！`, 'text-purple-300');
            }

            const applyBurn = playerStats.derivedEffects.applyBurnOnHit;
            if(applyBurn && Math.random() < applyBurn.chance) {
                const existingBurn = enemyRef.statusEffects.find(e => e.id === 'burn');
                if (existingBurn) {
                    existingBurn.value = (existingBurn.value || 0) + applyBurn.value;
                } else {
                    enemyRef.statusEffects.push({ ...STATUS_EFFECTS['burn'], duration: applyBurn.duration, value: applyBurn.value, sourceAttack: playerStats.attack });
                }
                addLog(draft, `[装备效果] 对 ${enemyRef.name} 施加了 ${applyBurn.value} 层[烧伤]！`, 'text-teal-300');
            }
            const applyBleed = playerStats.derivedEffects.applyBleedOnHit;
            if(applyBleed && Math.random() < applyBleed.chance) {
                 const existingBleed = enemyRef.statusEffects.find(e => e.id === 'bleed');
                if (existingBleed) {
                    existingBleed.value = (existingBleed.value || 0) + applyBleed.value;
                } else {
                    enemyRef.statusEffects.push({ ...STATUS_EFFECTS['bleed'], duration: applyBleed.duration, value: applyBleed.value, sourceAttack: playerStats.attack });
                }
                addLog(draft, `[装备效果] 对 ${enemyRef.name} 施加了 ${applyBleed.value} 层[流血]！`, 'text-teal-300');
            }
            
            if (enemyRef.hp <= 0 && hpBefore > 0) {
                addLog(draft, `你击败了 ${enemyRef.name}！`);
                if (card.effect.onKillRecast) {
                    addLog(draft, `[${card.name}] 击败了 ${enemyRef.name}，再次释放！`, 'text-yellow-500');
                    processCardEffect(draft, deps, card.effect, card.id, undefined);
                }
                if (effect.gainCpOnKill) {
                    draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + effect.gainCpOnKill);
                    addLog(draft, `你击败了 ${enemyRef.name} 并恢复了 ${effect.gainCpOnKill} CP。`, 'text-cyan-300');
                }
                checkForOnKillEffects(draft, deps, enemyRef);
            }
        }
        handleReinforcements(draft, deps);
        
        if (targetConstruct) {
            const hpBefore = targetConstruct.hp;
            let finalDamage = Math.round(baseDamage);
            
            let damageToBlock = 0;
            if (targetConstruct.block > 0) {
                damageToBlock = Math.min(targetConstruct.block, finalDamage);
                targetConstruct.block -= damageToBlock;
            }

            const remainingDamage = finalDamage - damageToBlock;
            let damageToHp = 0;
            if (remainingDamage > 0) {
                damageToHp = Math.max(1, remainingDamage - targetConstruct.defense);
                targetConstruct.hp -= damageToHp;
            }
            
            if (damageToHp > 0) {
                playSound('enemy_hit');
                triggerAnimation(draft, targetConstruct.instanceId, 'hit_hp');
                addLog(draft, `你对 [${targetConstruct.name}] 造成了 ${damageToHp} 点伤害。`, 'text-green-400');
            } else if (damageToBlock > 0) {
                playSound('enemy_block');
                triggerAnimation(draft, targetConstruct.instanceId, 'hit_block');
                addLog(draft, `你对 [${targetConstruct.name}] 的格挡造成了 ${damageToBlock} 点伤害。`, 'text-blue-300');
            }

            if (targetConstruct.hp <= 0 && hpBefore > 0) {
                triggerConstructOnDestroy(draft, deps, targetConstruct);
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
            addLog(draft, `你从[充能]中额外获得了 ${blockFromCharge} 点格挡。`, 'text-blue-300');
        }
    }
    
    if (effect.bonusEffect) {
        const hasBurn = targetEnemy?.statusEffects.some(e => e.id === 'burn');
        const hasBleed = targetEnemy?.statusEffects.some(e => e.id === 'bleed');
        const hasPoison = targetEnemy?.statusEffects.some(e => e.id === 'poison');
        const hasBlock = targetEnemy && targetEnemy.block > 0;
        const handSize = draft.combatState.hand.length;

        let conditionMet = false;
        if (effect.bonusEffect.condition === 'target_has_burn' && hasBurn) conditionMet = true;
        if (effect.bonusEffect.condition === 'target_has_bleed' && hasBleed) conditionMet = true;
        if (effect.bonusEffect.condition === 'target_has_poison' && hasPoison) conditionMet = true;
        if (effect.bonusEffect.condition === 'target_has_block' && hasBlock) conditionMet = true;
        if (effect.bonusEffect.condition === 'hand_size_less_than_or_equal' && handSize <= (effect.bonusEffect.value || 0)) conditionMet = true;

        if (conditionMet) {
            const bonus = effect.bonusEffect.effect;
            if (bonus.gainBlockMultiplier) {
                const bonusBlock = Math.round(playerStats.blockPower * bonus.gainBlockMultiplier);
                blockGained += bonusBlock;
                addLog(draft, `[${card.name}] 效果触发，额外获得 ${bonusBlock} 点格挡。`, 'text-yellow-400');
            }
            if (bonus.gainCp) {
                draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + bonus.gainCp);
                addLog(draft, `[${card.name}] 效果触发，恢复了 ${bonus.gainCp} 点CP。`, 'text-cyan-300');
            }
            if (bonus.drawCards) {
                addLog(draft, `[${card.name}] 效果触发，抽 ${bonus.drawCards} 张牌。`, 'text-yellow-400');
                drawCards(draft, deps, bonus.drawCards);
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
                   addLog(draft, `${targetEnemy.name} 获得了 [${newEffect.name}] 状态。`, 'text-red-300');
                }
            }
            if (bonus.removeStatusRatio && targetEnemy) {
                const { effectId, ratio } = bonus.removeStatusRatio;
                const status = targetEnemy.statusEffects.find(e => e.id === effectId);
                if (status && status.value) {
                    const stacksToRemove = Math.floor(status.value * ratio);
                    if (stacksToRemove > 0) {
                        status.value -= stacksToRemove;
                         addLog(draft, `[${card.name}] 效果触发，移除了 ${targetEnemy.name} 的 ${stacksToRemove} 层[${status.name}]。`, 'text-yellow-400');
                        if (status.value <= 0) {
                            targetEnemy.statusEffects = targetEnemy.statusEffects.filter(e => e.id !== effectId);
                        }
                    }
                }
            }
            if(bonus.addCardToDeck) {
                 bonus.addCardToDeck.forEach(cardId => {
                    const newCard = deps.getAllCards()[cardId];
                    draft.combatState.deck.push({ ...newCard, instanceId: `${newCard.id}_${Date.now()}_${Math.random()}` });
                });
                draft.combatState.deck = shuffle(draft.combatState.deck);
                 addLog(draft, `[${card.name}] 效果触发，将 ${bonus.addCardToDeck.length} 张牌洗入牌库。`, 'text-yellow-400');
            }
        }
    }

    if (blockGained > 0) {
        playSound('player_block');
        draft.combatState.block += blockGained;
        addLog(draft, `你获得了 ${blockGained} 点格挡。`, 'text-blue-300');
    }
    
    if (effect.consumeStatus && targetEnemy) {
        const { effectId, damagePerStack, damagePerStackMultiplier, healPerStack, gainBlockPerStackMultiplier, gainBlockPerStack, target: consumeTarget, maxConsumeStacks, stacksToRemove, stacksToRemoveRatio, gainCpOnConsume } = effect.consumeStatus;
        const statusEffect = targetEnemy.statusEffects.find(e => e.id === effectId);

        if (statusEffect && statusEffect.value) {
            const stacks = statusEffect.value;
            const stacksToConsume = stacksToRemoveRatio 
                ? Math.floor(stacks * stacksToRemoveRatio)
                : (stacksToRemove ? Math.min(stacks, stacksToRemove) : Math.min(stacks, maxConsumeStacks || stacks));
            
            if (stacksToConsume > 0) {
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
                    for (const tgt of [...targets]) {
                        const tgtRef = draft.combatState.enemies.find(e => e.id === tgt.id);
                        if (!tgtRef) continue;
                        const hpBefore = tgtRef.hp;
                        tgtRef.hp -= damage;
                        playSound('status_damage');
                        triggerAnimation(draft, tgtRef.id, effectId === 'burn' ? 'burn' : 'bleed');
                        if (tgtRef.hp <= 0 && hpBefore > 0) {
                            addLog(draft, `你击败了 ${tgtRef.name}！`);
                            checkForOnKillEffects(draft, deps, tgtRef);
                        }
                    }
                    if (consumeTarget === 'all_enemies') {
                        addLog(draft, `消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，对所有敌人造成 ${damage} 点爆发伤害！`, 'text-red-500');
                    } else {
                        addLog(draft, `消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，造成 ${damage} 点爆发伤害！`, 'text-red-500');
                    }

                } else if (damagePerStack) {
                    const damage = stacksToConsume * damagePerStack;
                    const targets = consumeTarget === 'all_enemies' ? draft.combatState.enemies.filter(e => e.hp > 0) : [targetEnemy];
                    
                    for (const tgt of [...targets]) {
                        const tgtRef = draft.combatState.enemies.find(e => e.id === tgt.id);
                        if (!tgtRef) continue;
                        const hpBefore = tgtRef.hp;
                        tgtRef.hp -= damage;
                        playSound('status_damage');
                        triggerAnimation(draft, tgtRef.id, effectId === 'burn' ? 'burn' : 'bleed');
                         if (tgtRef.hp <= 0 && hpBefore > 0) {
                            addLog(draft, `你击败了 ${tgtRef.name}！`);
                            checkForOnKillEffects(draft, deps, tgtRef);
                        }
                    }
                    if (consumeTarget === 'all_enemies') {
                         addLog(draft, `消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，对所有敌人造成 ${damage} 点爆发伤害！`, 'text-red-500');
                    } else {
                         addLog(draft, `消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，造成 ${damage} 点爆发伤害！`, 'text-red-500');
                    }
                }

                if (healPerStack) {
                    const healing = stacksToConsume * healPerStack;
                    draft.player.hp = Math.min(playerStats.maxHp, draft.player.hp + healing);
                    addLog(draft, `消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，你恢复了 ${healing} 点HP！`, 'text-green-400');
                }

                if (gainBlockPerStackMultiplier) {
                    const block = Math.round(stacksToConsume * gainBlockPerStackMultiplier * playerStats.blockPower);
                    draft.combatState.block += block;
                    addLog(draft, `消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，你获得了 ${block} 点格挡！`, 'text-blue-400');
                }

                if (gainBlockPerStack) {
                    const block = stacksToConsume * gainBlockPerStack;
                    draft.combatState.block += block;
                    addLog(draft, `消耗了 ${targetEnemy.name} 的 ${stacksToConsume} 层[${statusEffect.name}]，你获得了 ${block} 点格挡！`, 'text-blue-400');
                }
                
                if (gainCpOnConsume) {
                    draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + gainCpOnConsume);
                    addLog(draft, `你恢复了 ${gainCpOnConsume} 点CP。`, 'text-cyan-300');
                }
                
                handleReinforcements(draft, deps);

                statusEffect.value -= stacksToConsume;
                if (statusEffect.value <= 0) {
                    targetEnemy.statusEffects = targetEnemy.statusEffects.filter(e => e.id !== effectId);
                }
            }
        }
    }

    if (effect.multiplyStatus && targetEnemy) {
        const { effectId, multiplier } = effect.multiplyStatus;
        const statusToMultiply = targetEnemy.statusEffects.find(e => e.id === effectId);
        if (statusToMultiply && statusToMultiply.value) {
            const oldStacks = statusToMultiply.value;
            statusToMultiply.value = Math.floor(oldStacks * multiplier);
            addLog(draft, `${targetEnemy.name} 的 [${statusToMultiply.name}] 层数翻倍至 ${statusToMultiply.value}！`, 'text-red-400');
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
            addLog(draft, `你对 ${targetEnemy.name} 施加了 ${stacks} 层[${effectTemplate.name}]。`, 'text-red-300');
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
                    addLog(draft, `[${card.name}] 效果触发，将 ${stacksToSpread} 层[${effectTemplate.name}]扩散至其他敌人。`, 'text-yellow-400');
                }
            }
        }
    }
    
    if (effect.applyStatusIfTargetHas) {
        const targets = effect.target === 'all_enemies' 
            ? draft.combatState.enemies.filter(e => e.hp > 0) 
            : (targetEnemy ? [targetEnemy] : []);
    
        for (const enemy of targets) {
            const hasRequired = enemy.statusEffects.some(se => se.id === effect.applyStatusIfTargetHas!.requiredStatus);
            if (hasRequired) {
                const { effectToApply, value, duration } = effect.applyStatusIfTargetHas!;
                const effectTemplate = STATUS_EFFECTS[effectToApply];
                if (effectTemplate) {
                    const existingEffect = enemy.statusEffects.find(e => e.id === effectToApply);
                    if (existingEffect && existingEffect.value !== undefined) {
                        existingEffect.value += value;
                    } else {
                         enemy.statusEffects.push({
                            ...effectTemplate,
                            duration: duration || 999,
                            value: value,
                            sourceAttack: playerStats.attack,
                        });
                    }
                    addLog(draft, `${enemy.name} 获得了额外的 ${value} 层[${effectTemplate.name}]。`, 'text-red-300');
                }
            }
        }
    }

    if (effect.drawCards) {
        drawCards(draft, deps, effect.drawCards);
    }

    if (effect.gainCharge) {
        let chargeGained = effect.gainCharge;
        if (playerStats.derivedEffects.extraChargeGain) {
            chargeGained += playerStats.derivedEffects.extraChargeGain;
        }
        gainCharge(draft, deps, chargeGained, `你获得了 {amount} 层充能。`);
    }
    
    if (effect.grantsCounter) {
        draft.player.counterAttack = effect.grantsCounter;
        addLog(draft, `你进入了反击架势。`, 'text-yellow-400');
    }
    
    if (effect.gainCp) {
        draft.player.cp = Math.min(playerStats.maxCp, draft.player.cp + effect.gainCp);
        addLog(draft, `你恢复了 ${effect.gainCp} 点CP。`, 'text-cyan-300');
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

            const applyEffect = (entity: Draft<PlayerState | Enemy>) => {
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
                        gainCharge(draft, deps, playerStats.derivedEffects.onDebuffGainCharge, `[状态分析仪] 效果触发，你获得了 {amount} 点[充能]。`);
                    }
                }

                if (effect.statusEffect === 'burn' && entity !== draft.player) {
                    const hasConflagration = draft.player.statusEffects.some(e => e.id === 'conflagration_effect');
                    if (hasConflagration) {
                        addLog(draft, `[焚尽万象] 效果触发，抽 1 张牌！`, 'text-yellow-500');
                        drawCards(draft, deps, 1);
                    }
                }
            };

            if (effect.target === 'self') {
                applyEffect(draft.player);
                addLog(draft, `你获得了 [${newEffect.name}] 状态。`, 'text-green-300');
            } else if(targetEnemy || effect.target === 'all_enemies') {
                const targets = effect.target === 'all_enemies' ? draft.combatState.enemies.filter(e => e.hp > 0) : (targetEnemy ? [targetEnemy] : []);
                for (const enemy of targets) {
                    applyEffect(enemy);
                    addLog(draft, `${enemy.name} 获得了 [${newEffect.name}] 状态。`, 'text-red-300');
                     if (effect.statusEffect === 'bleed' && playerStats.derivedEffects.onBleedApplyVulnerable && draft.combatState.debuffsAppliedThisTurn === 1) {
                        const { duration } = playerStats.derivedEffects.onBleedApplyVulnerable;
                        const vulnerableEffect = enemy.statusEffects.find(e => e.id === 'vulnerable');
                        if (vulnerableEffect) {
                            vulnerableEffect.duration = Math.max(vulnerableEffect.duration, duration + 1);
                        } else {
                            enemy.statusEffects.push({ ...STATUS_EFFECTS.vulnerable, duration: duration + 1 });
                        }
                        addLog(draft, `[痛苦放大器] 效果触发，对 ${enemy.name} 施加了 [易伤]！`, 'text-teal-300');
                    }
                }
            }
        }
    }

    if (effect.selfStatusEffect) {
        const effectTemplate = STATUS_EFFECTS[effect.selfStatusEffect];
        if (effectTemplate) {
            const isStacking = ['burn', 'bleed', 'chaining', 'poison'].includes(effectTemplate.id);
            const newEffect: StatusEffect = {
                ...effectTemplate,
                duration: isStacking ? 999 : (effect.selfStatusEffectDuration || 1),
                value: effect.selfStatusEffectValue,
                sourceAttack: playerStats.attack,
            };
    
            const existingEffect = draft.player.statusEffects.find(e => e.id === newEffect.id);
            if (existingEffect) {
                if (isStacking) {
                    existingEffect.value = (existingEffect.value || 0) + (newEffect.value || 0);
                    existingEffect.sourceAttack = playerStats.attack;
                } else if (!isStacking) {
                    existingEffect.duration = Math.max(existingEffect.duration, newEffect.duration);
                }
            } else {
                draft.player.statusEffects.push(newEffect);
            }
            addLog(draft, `你获得了 [${newEffect.name}] 状态。`, 'text-green-300');
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
        if (cond.targetHasBlock !== undefined) {
            const hasBlock = targetEnemy ? targetEnemy.block > 0 : false;
            conditionMet = hasBlock === cond.targetHasBlock;
        }
    
        const effectToApply = conditionMet ? effect.conditionalEffect.ifTrue : effect.conditionalEffect.ifFalse;
        if (effectToApply) {
            addLog(draft, `[${card.name}] 的条件效果触发！`, 'text-yellow-400');
            processCardEffect(draft, deps, effectToApply, sourceCardId, targetId, isDiscardEffect);
        }
    }
    
    if (effect.addCardToHand) {
        const newCard = deps.getAllCards()[effect.addCardToHand];
        draft.combatState.hand.push({ ...newCard, instanceId: `${newCard.id}_${Date.now()}_${Math.random()}`});
        addLog(draft, `你获得了 [${newCard.name}]。`, 'text-yellow-300');
        checkForHandOverflow(draft, deps);
    }

    if (effect.addCardToDeck) {
        effect.addCardToDeck.forEach(cardId => {
            const newCard = deps.getAllCards()[cardId];
            draft.combatState.deck.push({ ...newCard, instanceId: `${newCard.id}_${Date.now()}_${Math.random()}` });
        });
        draft.combatState.deck = shuffle(draft.combatState.deck);
    }

    if (effect.addCardToDiscard) {
        effect.addCardToDiscard.forEach(cardId => {
            const newCardTemplate = deps.getAllCards()[cardId];
            if (newCardTemplate) {
                const newCard: CombatCard = {
                    ...newCardTemplate,
                    instanceId: `${cardId}_gen_${Date.now()}_${Math.random()}`
                };
                draft.combatState.discard.push(newCard);
                addLog(draft, `一张 [${newCard.name}] 被洗入了你的弃牌堆。`, 'text-purple-300');
            }
        });
    }

    if (effect.nextAttackCostModifier) {
        draft.combatState.nextAttackCostModifier += effect.nextAttackCostModifier;
    }

    if (effect.deployConstruct) {
        if (draft.combatState.constructs.length >= 3) {
            addLog(draft, '构装体部署失败：战场上已达到最大数量。', 'text-yellow-400');
        } else {
            const template = CONSTRUCTS[effect.deployConstruct];
            const owner = draft.player;
            const ownerStats = deps.getPlayerStats();
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
                durability: template.durability,
                designatedTargetId: targetEnemy ? targetEnemy.id : undefined,
            };
            draft.combatState.constructs.push(newConstruct);
            addLog(draft, `你部署了 [${newConstruct.name}]！`, 'text-green-300');
        }
    }

    if (effect.generateCardChoice) {
        draft.combatState.phase = 'awaiting_card_choice';
        draft.combatState.cardChoiceAction = {
            options: effect.generateCardChoice,
            exhaustGenerated: effect.generatedCardsExhaust,
        };
        addLog(draft, '请选择要衍生的卡牌。', 'text-yellow-400');
    }

    if (effect.discover) {
        const { from, options, addExhaust, makeCopy, modify } = effect.discover;
        let cardPool: string[] = [];

        if (from === 'deck') {
            const deckAndDiscardIds = [
                ...draft.combatState.deck.map(c => c.id),
                ...draft.combatState.discard.map(c => c.id)
            ];
            cardPool = [...new Set(deckAndDiscardIds)];
        } else if (from === 'all_rare_burn') {
            const allCards = deps.getAllCards();
            cardPool = Object.values(allCards)
                .filter(c => c.rarity === CardRarity.RARE && c.keywords?.includes('烧伤') && !c.unobtainable)
                .map(c => c.id);
        } else if (from === 'all_rare_epic_poison') {
            const allCards = deps.getAllCards();
            cardPool = Object.values(allCards)
                .filter(c => (c.rarity === CardRarity.RARE || c.rarity === CardRarity.EPIC) && c.keywords?.includes('中毒') && !c.unobtainable)
                .map(c => c.id);
        }

        if (cardPool.length > 0) {
            const shuffledPool = shuffle(cardPool);
            const choiceOptions = shuffledPool.slice(0, options);
            
            if (choiceOptions.length > 0) {
                draft.combatState.phase = 'awaiting_card_choice';
                draft.combatState.cardChoiceAction = {
                    options: choiceOptions,
                    source: from,
                    exhaustGenerated: addExhaust,
                    makeCopy: makeCopy,
                    modify: modify,
                };
                addLog(draft, '发现：请选择一张卡牌。', 'text-yellow-400');
            } else {
                 addLog(draft, '发现失败：没有符合条件的卡牌。', 'text-gray-400');
            }
        } else {
            addLog(draft, '发现失败：没有符合条件的卡牌。', 'text-gray-400');
        }
    }

    if (effect.choiceEffect) {
        draft.combatState.phase = 'awaiting_effect_choice';
        draft.combatState.effectChoiceAction = {
            sourceCardInstanceId: draft.combatState.lastCardPlayedInstanceId!,
            sourceTargetId: targetId,
            options: effect.choiceEffect.options,
        };
        addLog(draft, '请选择一个效果。', 'text-yellow-400');
    }

    if (effect.trace) {
        const { from, cardType, action, costModifier, postChoiceEffect } = effect.trace;
        const cardPool = from === 'discard' 
            ? draft.combatState.discard.filter(c => c.type === cardType)
            : [];
        
        if (cardPool.length > 0) {
            draft.combatState.phase = 'awaiting_trace_choice';
            draft.combatState.traceAction = {
                sourceCardInstanceId: draft.combatState.lastCardPlayedInstanceId!,
                from,
                cardType,
                action,
                costModifier,
                postChoiceEffect,
            };
            addLog(draft, '请选择一张牌进行溯源。', 'text-yellow-400');
        } else {
            addLog(draft, '没有符合溯源条件的卡牌。', 'text-gray-400');
        }
    }

    if (!isDiscardEffect) {
        if(card.type === 'skill' && playerStats.derivedEffects.onSkillHeal) {
            draft.player.hp = Math.min(playerStats.maxHp, draft.player.hp + playerStats.derivedEffects.onSkillHeal);
            addLog(draft, `[装备词缀] 效果触发，恢复了 ${playerStats.derivedEffects.onSkillHeal} 点HP。`, 'text-teal-300');
        }
        const chainingEffect = draft.player.statusEffects.find(e => e.id === 'chaining');
        if (chainingEffect && card.type === 'attack' && chainingEffect.value && chainingEffect.value > 0) {
            addLog(draft, `连锁反应发动，抽 1 张牌！`, 'text-yellow-500');
            drawCards(draft, deps, 1);
            chainingEffect.value -= 1;
            if (chainingEffect.value <= 0) {
                draft.player.statusEffects = draft.player.statusEffects.filter(e => e.id !== 'chaining');
            }
        }

        const afterCardsPlayedEffect = playerStats.derivedEffects.afterCardsPlayed;
        if(afterCardsPlayedEffect && draft.combatState.cardsPlayedThisTurn > 0 && draft.combatState.cardsPlayedThisTurn % afterCardsPlayedEffect.count === 0) {
            if (afterCardsPlayedEffect.drawCards) {
                addLog(draft, `[战术目镜] 效果触发, 抽 ${afterCardsPlayedEffect.drawCards} 张牌。`, 'text-teal-300');
                drawCards(draft, deps, afterCardsPlayedEffect.drawCards);
            }
        }
    }

    const allEnemiesDefeated = draft.combatState.enemies.every(e => e.hp <= 0) && draft.combatState.enemyReinforcements.length === 0;
    if (allEnemiesDefeated) {
        draft.combatState.phase = 'victory';
    }
    
    if (draft.combatState) {
        draft.combatState.constructs = draft.combatState.constructs.filter(c => c.hp > 0);
    }
};

export const playCard = (draft: Draft<GameState>, deps: ReducerDependencies, cardInstanceId: string, targetId?: string) => {
    if (!draft.combatState || draft.combatState.phase !== 'player_turn') return;

    const cardIndex = draft.combatState.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (cardIndex === -1) return;

    const card = draft.combatState.hand[cardIndex];
    const playerStats = deps.getPlayerStats();
    
    if (card.entropyCost && draft.player.entropy < card.entropyCost) {
        addLog(draft, `扭曲熵能不足，无法打出 [${card.name}]。`);
        return;
    }

    let effectiveCost = card.costOverride ?? card.cost;
    if (card.id === 'spark') {
        effectiveCost += draft.combatState.sparkCostModifier;
    }
    if (card.type === 'attack' && draft.combatState.nextAttackCostModifier < 0) {
        effectiveCost = Math.max(0, effectiveCost + draft.combatState.nextAttackCostModifier);
        draft.combatState.nextAttackCostModifier = 0;
    }
    
    if (card.effect.overclockCost) {
        if (draft.player.hp <= card.effect.overclockCost) return;
        draft.player.hp -= card.effect.overclockCost;
        triggerAnimation(draft, 'player', 'hit_hp');
        addLog(draft, `你支付了 ${card.effect.overclockCost} 点HP发动 [${card.name}]。`, 'text-red-400');
        if (draft.player.hp <= 0) {
            draft.combatState.phase = 'defeat';
            return;
        }
    } else {
        if (draft.player.cp < effectiveCost) return;
        draft.player.cp -= effectiveCost;
    }

    if (card.entropyCost) {
        draft.player.entropy -= card.entropyCost;
        addLog(draft, `你消耗了 ${card.entropyCost} 点扭曲熵能。`, 'text-purple-400');
    }

    if (card.effect.chargeCost) {
        if (draft.player.charge < card.effect.chargeCost) return;
        draft.player.charge -= card.effect.chargeCost;
    }
    
    if (card.type === 'attack') {
        dealBleedDamageAndTriggerEffects(draft, deps, draft.player, 'player');
    }

    playSound('play_card');
    addLog(draft, `你打出了 [${card.name}]。`);

    // --- Entropy Gain ---
    draft.player.entropy = Math.min(ENTROPY_CAP, draft.player.entropy + 1);
    draft.combatState.enemies.forEach(e => {
        if (e.hp > 0) e.entropy = Math.min(ENTROPY_CAP, e.entropy + 1);
    });
    if (draft.combatState.playerHasEntropyCards) {
        addLog(draft, '战场熵能逸散，所有单位的扭曲熵能+1。', 'text-purple-200');
    }
    // --------------------

    draft.combatState.lastCardPlayedInstanceId = card.instanceId;
    draft.combatState.cardsPlayedThisTurn++;

    if (card.type === 'attack') {
        if (playerStats.derivedEffects.onEveryXDifferentAttacks && !draft.combatState.differentAttacksPlayed.includes(card.id)) {
            draft.combatState.differentAttacksPlayed.push(card.id);
            const effectInfo = playerStats.derivedEffects.onEveryXDifferentAttacks;
            if (draft.combatState.differentAttacksPlayed.length % effectInfo.count === 0) {
                // This part is tricky to implement with Immer as it modifies templates.
                // For now, let's log it. A more robust solution is needed for permanent upgrades.
                addLog(draft, `[熵灭重锤] 效果触发！`, 'text-teal-300');
            }
        }
        draft.combatState.firstAttackPlayedThisTurn = true;
    }
    
    if (card.effect.costIncreaseOnUseThisTurn) {
        card.costOverride = (card.costOverride ?? card.cost) + card.effect.costIncreaseOnUseThisTurn;
    }

    if (card.id === 'spark') {
        draft.combatState.sparkCostModifier++;
    }

    processCardEffect(draft, deps, card.effect, card.id, targetId);

    draft.combatState.lastCardPlayedType = card.type;
    draft.combatState.lastCardPlayedKeywords = card.keywords;

    draft.combatState.hand.splice(cardIndex, 1);
    
    if (card.effect.exhausts) {
        draft.combatState.exhaust.push(card);
    } else if (!card.effect.returnsToHand) {
        draft.combatState.discard.push(card);
    } else {
        draft.combatState.hand.push(card);
    }

    if (draft.combatState.phase === 'player_turn') {
        const afterCardsPlayed = playerStats.derivedEffects.afterCardsPlayed;
        if(afterCardsPlayed && draft.combatState.cardsPlayedThisTurn % afterCardsPlayed.count === 0) {
            drawCards(draft, deps, afterCardsPlayed.drawCards);
        }
    }
};

export const endTurn = (draft: Draft<GameState>, deps: ReducerDependencies) => {
    if (!draft.combatState || draft.combatState.phase !== 'player_turn') return;
    playSound('end_turn');

    const playerStats = deps.getPlayerStats();
    if (!playerStats.derivedEffects.chargeNoDecay) {
        draft.player.charge = Math.max(0, draft.player.charge - 3);
    }

    const desperateStrikeEffect = draft.player.statusEffects.find(e => e.id === 'desperate_strike_discard');
    if (desperateStrikeEffect && draft.combatState.hand.length > 0) {
        const discardCount = Math.min(2, draft.combatState.hand.length);
        const handCopy = [...draft.combatState.hand];
        const discardedCards: CombatCard[] = [];
        for (let i = 0; i < discardCount; i++) {
            const randomIndex = Math.floor(Math.random() * handCopy.length);
            const [cardToDiscard] = handCopy.splice(randomIndex, 1);
            discardedCards.push(cardToDiscard);
        }
        
        addLog(draft, `[舍身击] 效果触发，随机弃置了 ${discardCount} 张牌: ${discardedCards.map(c => c.name).join(', ')}`);
    
        draft.combatState.discard.push(...discardedCards);
        draft.combatState.hand = handCopy;

        discardedCards.forEach(card => {
            if (!draft.combatState.firstDiscardThisTurn) {
                 if (playerStats.derivedEffects.onFirstDiscard) {
                    const damageBonus = playerStats.derivedEffects.onFirstDiscard.nextAttackDamageBonus;
                    const empoweredEffect = { ...STATUS_EFFECTS.empowered, duration: 2, value: damageBonus };
                    draft.player.statusEffects.push(empoweredEffect);
                    addLog(draft, `[数据删除匕首] 效果触发，你的下一张攻击牌伤害提升${damageBonus * 100}%。`, 'text-teal-300');
                 }
                 if(playerStats.derivedEffects.onFirstDiscardDraw) {
                    addLog(draft, `[回收处理器] 效果触发，抽1张牌。`, 'text-teal-300');
                    drawCards(draft, deps, playerStats.derivedEffects.onFirstDiscardDraw);
                 }
                 draft.combatState.firstDiscardThisTurn = true;
            }

            const feverishCalculation = draft.player.statusEffects.find(e => e.id === 'feverish_calculation');
            if (feverishCalculation) {
                addLog(draft, `[狂热计算] 效果触发！`);
                const aliveEnemies = draft.combatState.enemies.filter(e => e.hp > 0);
                if (aliveEnemies.length > 0) {
                    const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                    const damage = Math.round(deps.getPlayerStats().attack * 0.3);
                    const hpBefore = randomEnemy.hp;
                    randomEnemy.hp -= damage;
                    playSound('enemy_hit');
                    addLog(draft, `对 ${randomEnemy.name} 造成了 ${damage} 点伤害。`);
                    if(randomEnemy.hp <= 0 && hpBefore > 0) {
                        checkForOnKillEffects(draft, deps, randomEnemy);
                    }
                }
            }

            if (card.effect.onDiscard) {
                addLog(draft, `[${card.name}] 的弃牌效果触发！`, 'text-yellow-400');
                processCardEffect(draft, deps, card.effect.onDiscard, card.id, undefined, true);
            }
        });

        draft.player.statusEffects = draft.player.statusEffects.filter(e => e.id !== 'desperate_strike_discard');
    }

    processEndOfTurnConstructs(draft, deps, 'player');

    // --- Entropy Decay ---
    const oldEntropy = draft.player.entropy;
    draft.player.entropy = Math.max(0, draft.player.entropy - 3);
    const entropyLost = oldEntropy - draft.player.entropy;
    if (entropyLost > 0 && draft.combatState.playerHasEntropyCards) {
        addLog(draft, `回合结束，你的扭曲熵能消散了${entropyLost}点。`, 'text-purple-300');
    }
    // -------------------

    draft.combatState.phase = 'enemy_turn_start';
    draft.combatState.activeEnemyIndex = 0;
    draft.combatState.activeActionIndex = 0;

    const limitBreak = draft.player.statusEffects.find(e => e.id === 'limit_break');
    if (limitBreak) {
        addLog(draft, `[限制解除] 效果触发，弃掉所有手牌。`);
        draft.combatState.discard.push(...draft.combatState.hand);
        draft.combatState.hand = [];
    }

    const allEnemiesDefeated = draft.combatState.enemies.every(e => e.hp <= 0);
    if (allEnemiesDefeated) {
        draft.combatState.phase = 'victory';
    }
};

export const applyEnemyTurnStatusEffects = (draft: Draft<GameState>, deps: ReducerDependencies) => {
    if (!draft.combatState) return;

    let anEnemyDied = false;
    draft.combatState.enemies.forEach(enemy => {
        if (enemy.hp > 0) {
            enemy.tideCounter = (enemy.tideCounter || 0) + 1;

            if (enemy.statusEffects.some(e => e.id === 'bloodthirsty_assimilation')) {
                const playerHasBleed = draft.player.statusEffects.some(s => s.id === 'bleed' && s.value && s.value > 0);
                if (playerHasBleed) {
                    enemy.attack += 2;
                    addLog(draft, `[嗜血同化] 触发，${enemy.name} 的攻击力永久提升了！`, 'text-yellow-400');
                }
            }
            
            const wasDefeated = applyStatusEffectsStartOfTurn(draft, deps, enemy, false);
            if (wasDefeated) {
                addLog(draft, `${enemy.name} 被状态效果击败了！`);
                checkForOnKillEffects(draft, deps, enemy);
                anEnemyDied = true;
            }
        }
    });

    if (anEnemyDied) {
        handleReinforcements(draft, deps);
    }

    const allEnemiesDefeated = draft.combatState.enemies.every(e => e.hp <= 0) && draft.combatState.enemyReinforcements.length === 0;
    if (allEnemiesDefeated) {
        draft.combatState.phase = 'victory';
        return;
    }

    draft.combatState.phase = 'enemy_turn_processing_statuses';
};


export const advanceEnemyTurn = (draft: Draft<GameState>, deps: ReducerDependencies) => {
    if (!draft.combatState) return;

    const { enemies } = draft.combatState;
    let currentEnemyIndex = draft.combatState.activeEnemyIndex;
    let currentActionIndex = draft.combatState.activeActionIndex;

    // Find the next action, starting from the current position
    while (currentEnemyIndex < enemies.length) {
        const enemy = enemies[currentEnemyIndex];
        if (enemy.hp > 0) {
            const actions = draft.combatState.enemyActions[enemy.id];
            if (actions && currentActionIndex < actions.length) {
                // Found the next action
                draft.combatState.activeEnemyIndex = currentEnemyIndex;
                draft.combatState.activeActionIndex = currentActionIndex;
                draft.combatState.attackingEnemyId = enemy.id;
                
                const card = actions[currentActionIndex];
                addLog(draft, `${enemy.name} 准备使用 [${card.name}]。`);
                playSound('play_card_enemy');
                
                draft.combatState.phase = 'enemy_action_animation';
                return;
            }
        }
        // Move to the next enemy, reset action index
        currentEnemyIndex++;
        currentActionIndex = 0;
    }

    // No more actions for any enemy this turn
    startPlayerTurn(draft, deps);
};


export const applyEnemyEffect = (draft: Draft<GameState>, deps: ReducerDependencies) => {
    if (!draft.combatState || draft.combatState.phase !== 'enemy_action_animation' || !draft.combatState.attackingEnemyId) return;

    const enemy = draft.combatState.enemies.find(e => e.id === draft.combatState.attackingEnemyId);
    if (!enemy) return;

    const actions = draft.combatState.enemyActions[enemy.id];
    const card = actions ? actions[draft.combatState.activeActionIndex] : null;
    if (!card) return;

    // Handle Garcia's special card logic
    if (enemy.aiType === 'garcia_entropy') {
        if (card.id === 'entropy_outburst') {
            const extraDamageMultiplier = enemy.entropy * 0.1;
            card.effect.damageMultiplier = 1.5 + extraDamageMultiplier;
            addLog(draft, `加西亚消耗了 ${enemy.entropy} 点熵能！`, 'text-purple-500');
            enemy.entropy = 0;
        } else if (card.id === 'entropy_siphon_enemy') {
            enemy.entropy = Math.max(0, enemy.entropy - 10);
        } else if (card.id === 'entropy_shield') {
            enemy.entropy = Math.max(0, enemy.entropy - 5);
            const blockGained = enemy.defense * 2;
            enemy.block += blockGained;
            addLog(draft, `${enemy.name} 获得了 ${blockGained} 点格挡。`, 'text-blue-300');
        } else if (card.id === 'crystallized_skin') {
            const blockBefore = enemy.block;
            const blockGained = enemy.defense * 2;
            enemy.block += blockGained;
            addLog(draft, `${enemy.name} 获得了 ${blockGained} 点格挡。`, 'text-blue-300');
            if (blockBefore > 0) {
                const burnEffect = { ...STATUS_EFFECTS.burn, duration: 999, value: 4, sourceAttack: enemy.attack };
                draft.player.statusEffects.push(burnEffect);
                addLog(draft, `晶化皮肤反击！你获得了4层[烧伤]！`, 'text-orange-400');
            }
        }
    }

    if (card.effect.removeCardsFromHand) {
        const count = card.effect.removeCardsFromHand;
        const hand = draft.combatState.hand;
        if (hand.length > 0) {
            const removedCards: string[] = [];
            for (let i = 0; i < count && hand.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * hand.length);
                const [removedCard] = hand.splice(randomIndex, 1);
                draft.combatState.discard.push(removedCard);
                removedCards.push(removedCard.name);
            }
            if (removedCards.length > 0) {
                addLog(draft, `${enemy.name} 使你弃置了 [${removedCards.join(', ')}]！`, 'text-red-400');
            }
        }
    }

    // --- Entropy Gain ---
    draft.player.entropy = Math.min(ENTROPY_CAP, draft.player.entropy + 1);
    draft.combatState.enemies.forEach(e => {
        if (e.hp > 0) e.entropy = Math.min(ENTROPY_CAP, e.entropy + 1);
    });
    if (draft.combatState.playerHasEntropyCards) {
        addLog(draft, '战场熵能逸散，所有单位的扭曲熵能+1。', 'text-purple-200');
    }
    // --------------------

    if (card.type === 'attack') {
        const defeatedByBleed = dealBleedDamageAndTriggerEffects(draft, deps, enemy, enemy.id);
        if (defeatedByBleed) {
            addLog(draft, `${enemy.name} 在攻击时因[流血]而亡！`);
            handleReinforcements(draft, deps);
            
            const allEnemiesDefeated = draft.combatState.enemies.every(e => e.hp <= 0) && draft.combatState.enemyReinforcements.length === 0;
            if (allEnemiesDefeated) {
                draft.combatState.phase = 'victory';
                return;
            }
            
            draft.combatState.activeActionIndex++;
            draft.combatState.phase = 'enemy_action_resolving';
            return;
        }
    }

    // --- Targeting Logic ---
    const playerConstructs = draft.combatState.constructs.filter(c => c.owner === 'player' && c.hp > 0);
    const potentialTargets = [{ id: 'player', weight: AGGRO_SETTINGS.PLAYER_WEIGHT }, ...playerConstructs.map(c => ({ id: c.instanceId, weight: AGGRO_SETTINGS.CONSTRUCT_WEIGHT }))];
    const totalWeight = potentialTargets.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    let targetId = 'player';
    for (const target of potentialTargets) {
        if (random < target.weight) {
            targetId = target.id;
            break;
        }
        random -= target.weight;
    }
    
    const isTargetingPlayer = targetId === 'player';
    let targetEntityHpBefore = 0;
    if (isTargetingPlayer) {
        targetEntityHpBefore = draft.player.hp;
    } else {
        const construct = draft.combatState.constructs.find(c => c.instanceId === targetId);
        if(construct) targetEntityHpBefore = construct.hp;
    }

    // --- Effect Application ---
    if (card.type === 'attack') {
        let damage = card.effect.damageMultiplier ? Math.round(enemy.attack * card.effect.damageMultiplier) : 0;
        
        if (card.id === 'twisted_erosion') {
            const extraDamage = Math.round(enemy.attack * (enemy.entropy * 0.05));
            damage += extraDamage;
            addLog(draft, `${enemy.name} 消耗了 ${enemy.entropy} 点熵能，造成了额外伤害！`, 'text-purple-500');
            enemy.entropy = 0;
        }

        if (enemy.statusEffects.some(e => e.id === 'weakened')) {
            damage = Math.round(damage * 0.5);
        }
        
        const hitCount = card.effect.hitCount || 1;
        for (let i = 0; i < hitCount; i++) {
            if (isTargetingPlayer) {
                const pierceAmount = Math.round(damage * (card.effect.pierceMultiplier || 0));
                const normalDamage = damage - pierceAmount;
                const damageToBlock = Math.min(draft.combatState.block, normalDamage);
                draft.combatState.block -= damageToBlock;
                const remainingDamage = (normalDamage - damageToBlock) + pierceAmount;
                if(remainingDamage > 0) {
                    const damageToHp = Math.max(1, remainingDamage - deps.getPlayerStats().defense);
                    draft.player.hp -= damageToHp;
                }
            } else {
                const construct = draft.combatState.constructs.find(c => c.instanceId === targetId);
                if (construct) {
                    const hpBefore = construct.hp;
                    const pierceAmount = Math.round(damage * (card.effect.pierceMultiplier || 0));
                    const normalDamage = damage - pierceAmount;
                    const damageToBlock = Math.min(construct.block, normalDamage);
                    construct.block -= damageToBlock;
                    const remainingDamage = (normalDamage - damageToBlock) + pierceAmount;
                    if(remainingDamage > 0) {
                        const damageToHp = Math.max(1, remainingDamage - construct.defense);
                        construct.hp -= damageToHp;
                        if (construct.hp <= 0 && hpBefore > 0) {
                            addLog(draft, `${enemy.name} 摧毁了你的 [${construct.name}]！`, 'text-red-500');
                            triggerConstructOnDestroy(draft, deps, construct);
                        }
                    }
                }
            }
        }
    }
    
    let targetEntityHpAfter = 0;
    if(isTargetingPlayer) {
        targetEntityHpAfter = draft.player.hp;
    } else {
        const construct = draft.combatState.constructs.find(c => c.instanceId === targetId);
        if(construct) targetEntityHpAfter = construct.hp;
    }

    if (targetEntityHpAfter < targetEntityHpBefore) {
        playSound(isTargetingPlayer ? 'player_hit' : 'enemy_hit');
        triggerAnimation(draft, targetId, 'hit_hp');
    } else {
        playSound(isTargetingPlayer ? 'player_block' : 'enemy_block');
        triggerAnimation(draft, targetId, 'hit_block');
    }

    if (card.effect.onHpDamageDealt && targetEntityHpAfter < targetEntityHpBefore) {
        if (card.effect.onHpDamageDealt.target === 'all_allies') {
            draft.combatState.enemies.forEach(ally => {
                if (ally.hp > 0 && card.effect.onHpDamageDealt!.gainBlockMultiplier) {
                    const blockGained = Math.round(ally.defense * card.effect.onHpDamageDealt!.gainBlockMultiplier);
                    ally.block += blockGained;
                }
            });
            addLog(draft, `${enemy.name} 的效果触发，所有友军获得了护盾！`, 'text-blue-300');
        }
    }

    if (card.effect.addCardToDeckOnHpDamage && targetEntityHpAfter < targetEntityHpBefore) {
        card.effect.addCardToDeckOnHpDamage.forEach((cardId: string) => {
            const newCardTemplate = deps.getAllCards()[cardId];
            if (newCardTemplate) {
                draft.combatState.deck.push({ ...newCardTemplate, instanceId: `${newCardTemplate.id}_gen_${Date.now()}_${Math.random()}` });
            }
        });
        draft.combatState.deck = shuffle(draft.combatState.deck);
    }
    if (card.effect.forcePlayerDiscard) {
        if (draft.combatState.hand.length > 0) {
            const count = card.effect.forcePlayerDiscard.count;
            const handCopy = [...draft.combatState.hand];
            const cardsToDiscard: CombatCard[] = [];

            for (let i = 0; i < count && handCopy.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * handCopy.length);
                const [card] = handCopy.splice(randomIndex, 1);
                cardsToDiscard.push(card);
            }

            if (cardsToDiscard.length > 0) {
                addLog(draft, `${enemy.name} 使你随机弃置了 [${cardsToDiscard.map(c => c.name).join(', ')}]！`, 'text-red-400');
                
                draft.combatState.hand = draft.combatState.hand.filter(handCard => !cardsToDiscard.some(discarded => discarded.instanceId === handCard.instanceId));
                draft.combatState.discard.push(...cardsToDiscard);

                for (const discardedCard of cardsToDiscard) {
                    if (!draft.combatState.firstDiscardThisTurn) {
                        const playerStats = deps.getPlayerStats();
                        if (playerStats.derivedEffects.onFirstDiscard) {
                            const damageBonus = playerStats.derivedEffects.onFirstDiscard.nextAttackDamageBonus;
                            const empoweredEffect = { ...STATUS_EFFECTS.empowered, duration: 2, value: damageBonus };
                            draft.player.statusEffects.push(empoweredEffect);
                            addLog(draft, `[装备效果] 效果触发，你的下一张攻击牌伤害提升${damageBonus * 100}%。`, 'text-teal-300');
                        }
                        if (playerStats.derivedEffects.onFirstDiscardDraw) {
                            addLog(draft, `[装备效果] 效果触发，抽1张牌。`, 'text-teal-300');
                            drawCards(draft, deps, playerStats.derivedEffects.onFirstDiscardDraw);
                        }
                        draft.combatState.firstDiscardThisTurn = true;
                    }

                    const feverishCalculation = draft.player.statusEffects.find(e => e.id === 'feverish_calculation');
                    if (feverishCalculation) {
                        addLog(draft, `[狂热计算] 效果触发！`);
                        const aliveEnemies = draft.combatState.enemies.filter(e => e.hp > 0);
                        if (aliveEnemies.length > 0) {
                            const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                            const damage = Math.round(deps.getPlayerStats().attack * 0.3);
                            const hpBefore = randomEnemy.hp;
                            randomEnemy.hp -= damage;
                            playSound('enemy_hit');
                            addLog(draft, `对 ${randomEnemy.name} 造成了 ${damage} 点伤害。`);
                            if(randomEnemy.hp <= 0 && hpBefore > 0) {
                                checkForOnKillEffects(draft, deps, randomEnemy);
                                handleReinforcements(draft, deps);
                                if (draft.combatState.enemies.every(e => e.hp <= 0) && draft.combatState.enemyReinforcements.length === 0) {
                                    draft.combatState.phase = 'victory';
                                    break;
                                }
                            }
                        }
                    }

                    if (discardedCard.effect.onDiscard) {
                        addLog(draft, `[${discardedCard.name}] 的弃牌效果触发！`, 'text-yellow-400');
                        processCardEffect(draft, deps, discardedCard.effect.onDiscard, discardedCard.id, undefined, true);
                    }
                    
                    if ((draft.combatState.phase as string) === 'victory') break;
                }
            }
        }
    }

    if (card.effect.summonEnemy) {
        const { enemyId, count } = card.effect.summonEnemy;
        const enemyTemplate = ENEMIES[enemyId];
        if (enemyTemplate) {
            let summonedCount = 0;
            for (let i = 0; i < count; i++) {
                const maxEnemies = draft.combatState.maxEnemiesOnField || 3;
                if (draft.combatState.enemies.filter(e => e.hp > 0).length >= maxEnemies) {
                    break;
                }

                const newEnemy: Draft<Enemy> = {
                    ...enemyTemplate,
                    id: `${enemyId}_summon_${Date.now()}_${Math.random()}`,
                    hp: enemyTemplate.maxHp,
                    deck: shuffle(enemyTemplate.deck),
                    statusEffects: [...(enemyTemplate.statusEffects || [])],
                    hand: [],
                    discard: [],
                    exhaust: [],
                    block: 0,
                    tideCounter: 0,
                    entropy: 0,
                    specialAction: enemyTemplate.specialAction,
                    specialActionTriggered: false,
                };
                draft.combatState.enemies.push(newEnemy);
                summonedCount++;
            }
            if (summonedCount > 0) {
                addLog(draft, `${enemy.name} 召唤了 ${summonedCount}个 [${enemyTemplate.name}]！`, 'text-red-400');
            } else {
                addLog(draft, `${enemy.name} 试图召唤，但战场上已没有空间！`);
            }
        }
    }

    if (card.effect.gainBlock) {
        enemy.block += card.effect.gainBlock;
    }

    if (card.id === 'twisted_barrier') {
        const blockGained = Math.round(enemy.defense * 2.0);
        enemy.block += blockGained;
        addLog(draft, `${enemy.name} 消耗了 ${enemy.entropy} 点熵能，获得了 ${blockGained} 点格挡。`, 'text-purple-500');
        enemy.entropy = 0;
    }

    if (card.effect.statusEffect) {
        const effectTemplate = STATUS_EFFECTS[card.effect.statusEffect];
        if (effectTemplate) {
            if (card.effect.target !== 'self') { // Targeting the player
                const isStacking = ['burn', 'bleed', 'poison', 'chaining'].includes(effectTemplate.id);
                const existingEffect = draft.player.statusEffects.find(e => e.id === effectTemplate.id);
    
                if (existingEffect) {
                    if (isStacking) {
                        existingEffect.value = (existingEffect.value || 0) + (card.effect.statusEffectValue || 0);
                        if (['burn', 'bleed'].includes(effectTemplate.id)) {
                            existingEffect.sourceAttack = enemy.attack;
                        }
                    } else {
                        existingEffect.duration = Math.max(existingEffect.duration, card.effect.statusEffectDuration || 1);
                    }
                } else {
                    const newEffect: StatusEffect = {
                        ...effectTemplate,
                        duration: isStacking ? 999 : (card.effect.statusEffectDuration || 1),
                        value: card.effect.statusEffectValue,
                        sourceAttack: enemy.attack,
                    };
                    draft.player.statusEffects.push(newEffect);
                }
            } else if (card.effect.target === 'self') {
                const newEffect = { ...effectTemplate, duration: card.effect.statusEffectDuration || 1, value: card.effect.statusEffectValue };
                enemy.statusEffects.push(newEffect);
            }
        }
    }
    
    if (card.effect.deployConstruct) {
        const template = CONSTRUCTS[card.effect.deployConstruct];
        const newConstruct: Construct = {
            instanceId: `construct_${enemy.id}_${template.id}_${Date.now()}`,
            templateId: template.id,
            name: template.name,
            owner: enemy.id,
            maxHp: Math.round(enemy.maxHp * template.statScaling.maxHp.multiplier),
            hp: Math.round(enemy.maxHp * template.statScaling.maxHp.multiplier),
            attack: Math.round(enemy.attack * template.statScaling.attack.multiplier),
            defense: Math.round(enemy.defense * template.statScaling.defense.multiplier),
            block: 0,
            statusEffects: [],
            durability: template.durability,
            designatedTargetId: targetId,
        };
        draft.combatState.constructs.push(newConstruct);
        addLog(draft, `${enemy.name} 部署了 [${newConstruct.name}]！`, 'text-red-400');
    }

    enemy.hand = enemy.hand.filter(id => id !== card.id);
    if(card.effect.exhausts) {
        enemy.exhaust.push(card.id);
    } else {
        enemy.discard.push(card.id);
    }

    if (draft.player.hp <= 0) {
        draft.combatState.phase = 'defeat';
        return;
    }
    
    draft.combatState.constructs = draft.combatState.constructs.filter(c => c.hp > 0);
    
    // --- Cleanup and advance ---
    draft.combatState.activeActionIndex++;
    draft.combatState.phase = 'enemy_action_resolving';
};


export const handleManualDiscard = (draft: Draft<GameState>, deps: ReducerDependencies, cardInstanceIds: string[]) => {
    if (!draft.combatState || draft.combatState.phase !== 'awaiting_discard') return;

    const { sourceCardInstanceId, sourceTargetId, consequences, sourceEnemyId } = draft.combatState.discardAction!;
    const initialPhase = draft.combatState.phase;

    for (const instanceId of cardInstanceIds) {
        if (draft.combatState.phase !== initialPhase) return;

        const cardIndex = draft.combatState.hand.findIndex(c => c.instanceId === instanceId);
        if (cardIndex === -1) continue;

        const [cardToDiscard] = draft.combatState.hand.splice(cardIndex, 1);
        addLog(draft, `你弃置了 [${cardToDiscard.name}]。`);

        if (consequences && sourceEnemyId) {
            const consequence = consequences.find(c => c.ifType === cardToDiscard.type);
            if (consequence) {
                const enemy = draft.combatState.enemies.find(e => e.id === sourceEnemyId);
                if (consequence.effect.loseCp) {
                    draft.player.cp = Math.max(0, draft.player.cp - consequence.effect.loseCp);
                    addLog(draft, `你弃置了攻击牌，失去了 ${consequence.effect.loseCp} 点CP！`, 'text-red-400');
                }
                if (consequence.effect.gainBlockMultiplier && enemy) {
                    const blockGained = Math.round(enemy.defense * consequence.effect.gainBlockMultiplier);
                    enemy.block += blockGained;
                    addLog(draft, `${enemy.name} 因你弃置了技能牌而获得了 ${blockGained} 点格挡！`, 'text-blue-300');
                }
            }
        }

        if (!draft.combatState.firstDiscardThisTurn) {
            const playerStats = deps.getPlayerStats();
            if (playerStats.derivedEffects.onFirstDiscard) {
                const damageBonus = playerStats.derivedEffects.onFirstDiscard.nextAttackDamageBonus;
                const empoweredEffect = { ...STATUS_EFFECTS.empowered, duration: 2, value: damageBonus };
                draft.player.statusEffects.push(empoweredEffect);
                addLog(draft, `[装备效果] 效果触发，你的下一张攻击牌伤害提升${damageBonus * 100}%。`, 'text-teal-300');
            }
            if (playerStats.derivedEffects.onFirstDiscardDraw) {
                addLog(draft, `[装备效果] 效果触发，抽1张牌。`, 'text-teal-300');
                drawCards(draft, deps, playerStats.derivedEffects.onFirstDiscardDraw);
            }
            draft.combatState.firstDiscardThisTurn = true;
        }

        const feverishCalculation = draft.player.statusEffects.find(e => e.id === 'feverish_calculation');
        if (feverishCalculation) {
            addLog(draft, `[狂热计算] 效果触发！`);
            const aliveEnemies = draft.combatState.enemies.filter(e => e.hp > 0);
            if (aliveEnemies.length > 0) {
                const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                const damage = Math.round(deps.getPlayerStats().attack * 0.3);
                const hpBefore = randomEnemy.hp;
                randomEnemy.hp -= damage;
                playSound('enemy_hit');
                addLog(draft, `对 ${randomEnemy.name} 造成了 ${damage} 点伤害。`);
                if (randomEnemy.hp <= 0 && hpBefore > 0) {
                    checkForOnKillEffects(draft, deps, randomEnemy);
                    handleReinforcements(draft, deps);
                    const allEnemiesDefeatedAfterFeverish = draft.combatState.enemies.every(e => e.hp <= 0) && draft.combatState.enemyReinforcements.length === 0;
                    if (allEnemiesDefeatedAfterFeverish) {
                        draft.combatState.phase = 'victory';
                        return;
                    }
                }
            }
        }

        if (cardToDiscard.effect.onDiscard) {
            processCardEffect(draft, deps, cardToDiscard.effect.onDiscard, cardToDiscard.id, undefined, true);
            if (draft.combatState.phase !== initialPhase) {
                return;
            }
        }
        draft.combatState.discard.push(cardToDiscard);
    }
    
    if (draft.combatState.phase !== initialPhase) return;

    const sourceCard = deps.getAllCards()[sourceCardInstanceId];
    if (sourceCard && sourceCard.effect.discardCards?.then) {
        processCardEffect(draft, deps, sourceCard.effect.discardCards.then, sourceCardInstanceId, sourceTargetId);
    }
    
    const allEnemiesDefeated = draft.combatState.enemies.every(e => e.hp <= 0) && draft.combatState.enemyReinforcements.length === 0;
    if (allEnemiesDefeated) {
        draft.combatState.phase = 'victory';
        return;
    }

    draft.combatState.phase = 'player_turn';
    draft.combatState.discardAction = undefined;
};

export const handleReturnToDeck = (draft: Draft<GameState>, deps: ReducerDependencies, cardInstanceIds: string[]) => {
    if (!draft.combatState || draft.combatState.phase !== 'awaiting_return_to_deck') return;

    cardInstanceIds.forEach(instanceId => {
        const cardIndex = draft.combatState.hand.findIndex(c => c.instanceId === instanceId);
        if (cardIndex !== -1) {
            const [cardToReturn] = draft.combatState.hand.splice(cardIndex, 1);
            draft.combatState.deck.push(cardToReturn);
            addLog(draft, `你将 [${cardToReturn.name}] 放回了牌库。`);
        }
    });

    draft.combatState.deck = shuffle(draft.combatState.deck);
    draft.combatState.phase = 'player_turn';
    draft.combatState.returnToDeckAction = undefined;
};

export const handleCardChoice = (draft: Draft<GameState>, deps: ReducerDependencies, cardId: string) => {
    if (!draft.combatState || draft.combatState.phase !== 'awaiting_card_choice' || !draft.combatState.cardChoiceAction) return;
    
    const { source, exhaustGenerated, makeCopy, modify } = draft.combatState.cardChoiceAction;

    if (modify && modify.permanent) {
        const originalCard = deps.getAllCards()[cardId];
        if (originalCard) {
            const customCardId = `${cardId}_permamod_${Date.now()}`;
            const newCardDef: Card = {
                ...originalCard,
                id: customCardId,
                name: `${originalCard.name}+`,
                cost: Math.max(0, originalCard.cost + modify.cost),
                description: originalCard.description + `\n(费用已永久调整)`
            };
            draft.customCards[customCardId] = newCardDef;
            draft.player.cardCollection.push(customCardId);

            const newCardInstance: CombatCard = {
                ...newCardDef,
                instanceId: `${customCardId}_gen_${Date.now()}`
            };
            draft.combatState.hand.push(newCardInstance);
            addLog(draft, `你发现了 [${originalCard.name}] 的一个永久改良版本！`);
        }
    } else if (source === 'deck' && !makeCopy) {
        // Find and move the actual card instance instead of creating a copy
        let cardInstance: CombatCard | undefined;
        let foundIn: 'deck' | 'discard' | null = null;
        
        let cardIndex = draft.combatState.discard.findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
            [cardInstance] = draft.combatState.discard.splice(cardIndex, 1);
            foundIn = 'discard';
        } else {
            cardIndex = draft.combatState.deck.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                [cardInstance] = draft.combatState.deck.splice(cardIndex, 1);
                foundIn = 'deck';
            }
        }

        if (cardInstance) {
            draft.combatState.hand.push(cardInstance);
            addLog(draft, `你从${foundIn === 'deck' ? '牌库' : '弃牌堆'}中选择了 [${cardInstance.name}]。`);
        }
    } else {
        const newCardTemplate = deps.getAllCards()[cardId];
        if (newCardTemplate) {
            const newCard: CombatCard = {
                ...newCardTemplate,
                instanceId: `${cardId}_gen_${Date.now()}_${Math.random()}`,
                temporary: exhaustGenerated
            };
            if (modify && modify.cost !== 0) {
                newCard.costOverride = Math.max(0, newCard.cost + modify.cost);
            }
            draft.combatState.hand.push(newCard);
            addLog(draft, `你获得了 [${newCard.name}]。`);
        }
    }

    draft.combatState.phase = 'player_turn';
    draft.combatState.cardChoiceAction = undefined;
    checkForHandOverflow(draft, deps);
};

// FIX: Add missing 'advanceStory' function to handle game progression.
export const advanceStory = (draft: Draft<GameState>, deps: ReducerDependencies) => {
    if (!draft.currentMissionId) {
        returnToHubAndReset(draft, deps);
        return;
    }

    const mission = MISSIONS[draft.currentMissionId];
    if (!mission.events || draft.currentEventIndex >= mission.events.length - 1) {
        // Mission complete
        draft.status = GameStatus.MISSION_VICTORY;
        return;
    }

    draft.currentEventIndex++;
    const nextEvent = mission.events[draft.currentEventIndex];

    switch (nextEvent.type) {
        case 'dialogue':
        case 'title':
            draft.status = GameStatus.IN_MISSION_DIALOGUE;
            break;
        case 'combat':
            const waves = mission.events.slice(draft.currentEventIndex).filter(e => e.type === 'combat').length;
            draft.combatStartInfo = {
                enemies: nextEvent.enemies.length,
                waves: waves,
            };
            draft.status = GameStatus.COMBAT_START;
            break;
        case 'action':
            switch (nextEvent.action) {
                case 'open_hub':
                    // FIX: Mark mission as complete and grant rewards before returning to hub.
                    // This is for missions that end directly with an 'open_hub' action, like the prologue.
                    if (draft.currentMissionId && !draft.player.completedMissions.includes(draft.currentMissionId)) {
                        if (!draft.currentMissionIsReplay) {
                             draft.player.completedMissions.push(draft.currentMissionId);
                        }
                        const reward = draft.currentMissionIsReplay 
                            ? Math.round(mission.rewards.dreamSediment * 0.5) 
                            : mission.rewards.dreamSediment;
                        draft.player.dreamSediment += reward;
                    }
                    returnToHubAndReset(draft, deps);
                    break;
                case 'present_choice':
                    draft.status = GameStatus.CHOICE_SCREEN;
                    break;
                case 'game_over':
                    draft.status = GameStatus.GAME_OVER;
                    break;
                case 'end_chapter':
                    draft.status = GameStatus.MISSION_VICTORY;
                    break;
            }
            break;
        case 'supply_stop':
            draft.status = GameStatus.SUPPLY_STOP;
            break;
        default:
            returnToHubAndReset(draft, deps);
            break;
    }
};

// FIX: Add missing 'handleTraceChoice' function for the 'Trace' card keyword.
export const handleTraceChoice = (draft: Draft<GameState>, deps: ReducerDependencies, chosenCardInstanceId: string) => {
    if (!draft.combatState || draft.combatState.phase !== 'awaiting_trace_choice' || !draft.combatState.traceAction) return;

    const { sourceCardInstanceId, from, action, costModifier, postChoiceEffect } = draft.combatState.traceAction;

    draft.combatState.phase = 'player_turn';
    const traceActionCopy = { ...draft.combatState.traceAction };
    draft.combatState.traceAction = undefined;

    if (!chosenCardInstanceId) {
        addLog(draft, '你没有选择任何牌进行溯源。');
        return;
    }

    const cardPool = from === 'discard' ? draft.combatState.discard : [];
    const cardIndex = cardPool.findIndex(c => c.instanceId === chosenCardInstanceId);

    if (cardIndex === -1) {
        addLog(draft, '溯源失败：未找到所选卡牌。');
        return;
    }
    
    const tracedCard = cardPool[cardIndex];
    addLog(draft, `你溯源了 [${tracedCard.name}]。`);

    if (action === 'play_copy') {
        const cardCopy: CombatCard = { ...tracedCard, instanceId: `${tracedCard.id}_traced_copy_${Date.now()}`, temporary: true, costOverride: 0 };
        addLog(draft, `打出一张临时的0费 [${cardCopy.name}]。`);
        processCardEffect(draft, deps, cardCopy.effect, cardCopy.id, draft.combatState.enemies.find(e => e.hp > 0)?.id);
    } else if (action === 'add_to_hand_with_mod') {
        const [cardToMove] = cardPool.splice(cardIndex, 1);
        const newCost = Math.max(0, cardToMove.cost + (costModifier || 0));
        cardToMove.costOverride = newCost;
        draft.combatState.hand.push(cardToMove);
        addLog(draft, `将 [${cardToMove.name}] 加入手牌，费用调整为 ${newCost}。`);
        checkForHandOverflow(draft, deps);
    }
    
    if (postChoiceEffect) {
        const sourceCardInHand = draft.combatState.hand.find(c => c.instanceId === traceActionCopy.sourceCardInstanceId);
        const sourceCardInDiscard = draft.combatState.discard.find(c => c.instanceId === traceActionCopy.sourceCardInstanceId);
        const sourceCardInExhaust = draft.combatState.exhaust.find(c => c.instanceId === traceActionCopy.sourceCardInstanceId);
        const sourceCard = sourceCardInHand || sourceCardInDiscard || sourceCardInExhaust;

        if (sourceCard) {
            draft.combatState.contextCardForEffect = tracedCard;
            processCardEffect(draft, deps, postChoiceEffect, sourceCard.id, draft.combatState.enemies.find(e => e.hp > 0)?.id);
            draft.combatState.contextCardForEffect = undefined;
        }
    }
};

// FIX: Add missing 'handleEffectChoice' function for the 'Choice' card keyword.
export const handleEffectChoice = (draft: Draft<GameState>, deps: ReducerDependencies, chosenEffect: CardEffect) => {
    if (!draft.combatState || draft.combatState.phase !== 'awaiting_effect_choice' || !draft.combatState.effectChoiceAction) return;
    
    const { sourceCardInstanceId, sourceTargetId } = draft.combatState.effectChoiceAction;

    draft.combatState.phase = 'player_turn';
    draft.combatState.effectChoiceAction = undefined;

    const sourceCardInDiscard = draft.combatState.discard.find(c => c.instanceId === sourceCardInstanceId);
    const sourceCardInExhaust = draft.combatState.exhaust.find(c => c.instanceId === sourceCardInstanceId);
    const sourceCard = sourceCardInDiscard || sourceCardInExhaust;
    
    if (sourceCard) {
        addLog(draft, `你为 [${sourceCard.name}] 选择了效果。`);
        processCardEffect(draft, deps, chosenEffect, sourceCard.id, sourceTargetId);
    } else {
        addLog(draft, '错误：无法找到触发选择效果的卡牌。');
    }
};