

import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { GameState, GameAction, GameStatus, Enemy, Character, StatusEffect, EquipmentSlot, PlayerState, PlayerStats, Equipment, Card, CardRarity, AnimationType, AffixEffect, CardEffect, CombatCard, CombatState, CombatEvent, GameEvent } from '../types';
import { PLAYER_INITIAL_STATS, ENEMIES, CARDS, STATUS_EFFECTS, EQUIPMENT, ENEMY_CARDS, MISSIONS, MAX_COPIES_PER_RARITY, SYNC_COSTS, COMBAT_SETTINGS, CONSTRUCTS, AGGRO_SETTINGS, DECK_SIZE, EXPECTED_PLAYER_STATS_BY_CHAPTER } from '../constants';
import { produce, Draft } from 'immer';
import { getEffectivePlayerStats } from '../utils/playerUtils';
import { generateRandomEquipment } from '../utils/equipmentGenerator';
import { generateCardPack } from '../utils/cardGenerator';
import { playSound } from '../utils/sounds';
import * as reducerLogic from '../logic/reducerLogic';

const GameContext = createContext<{ state: GameState; dispatch: React.Dispatch<GameAction> } | undefined>(undefined);

const SAVE_KEY = 'safe4GameState';

const initialState: GameState = {
  status: GameStatus.TITLE_SCREEN,
  player: {
    ...PLAYER_INITIAL_STATS,
    dreamSediment: 0,
    completedMissions: [],
    cardSyncsSinceLastEpic: 0,
    cardEvolutionProgress: {},
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
  combatStartInfo: undefined,
  currentMissionIsReplay: false,
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
        cardEvolutionProgress: loadedState.player?.cardEvolutionProgress || {},
      },
      combatState: loadedState.combatState || initialState.combatState,
      customEquipment: loadedState.customEquipment || initialState.customEquipment,
      customCards: loadedState.customCards || initialState.customCards,
      newlyAcquiredCardIds: loadedState.newlyAcquiredCardIds || initialState.newlyAcquiredCardIds,
      newlyAcquiredEquipmentIds: loadedState.newlyAcquiredEquipmentIds || initialState.newlyAcquiredEquipmentIds,
      isFirstCombatOfMission: loadedState.isFirstCombatOfMission !== undefined ? loadedState.isFirstCombatOfMission : true,
      missionStartState: loadedState.missionStartState || undefined,
      sedimentGainedOnDefeat: loadedState.sedimentGainedOnDefeat || 0,
      combatStartInfo: loadedState.combatStartInfo || undefined,
      currentMissionIsReplay: loadedState.currentMissionIsReplay || false,
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


const gameReducer = (state: GameState, action: GameAction): GameState => {
  return produce(state, (draft: Draft<GameState>) => {
    const deps: reducerLogic.ReducerDependencies = {
        getAllCards: () => ({ ...CARDS, ...draft.customCards, ...ENEMY_CARDS }),
        getAllEquipment: () => ({ ...EQUIPMENT, ...draft.customEquipment }),
        getPlayerStats: () => getEffectivePlayerStats(draft.player, draft.customEquipment),
        getStage: () => draft.player.completedMissions.length + 1,
        getCurrentChapter: () => {
            const completedMissions = draft.player.completedMissions;
            const availableMissions = Object.values(MISSIONS).filter(mission => {
                if (completedMissions.includes(mission.id) || mission.id === 'prologue') return false;
                if (!mission.requires || mission.requires.length === 0) return true;
                return mission.requires.every(reqId => completedMissions.includes(reqId));
            });
            if (availableMissions.length === 0) {
                const lastCompleted = completedMissions.length > 0 ? MISSIONS[completedMissions.length - 1] : null;
                return lastCompleted?.chapter || 1;
            }
            const minChapter = Math.min(...availableMissions.map(m => m.chapter || 99));
            return minChapter === 99 ? 1 : minChapter;
        },
    };

    switch (action.type) {
        case 'START_GAME':
            draft.status = GameStatus.PROLOGUE_START;
            break;
        case 'FINISH_PROLOGUE_START':
            draft.status = GameStatus.IN_MISSION_DIALOGUE;
            draft.currentMissionId = 'prologue';
            draft.currentEventIndex = 0;
            break;
        case 'SELECT_MISSION':
            draft.currentMissionId = action.payload.missionId;
            draft.currentMissionIsReplay = action.payload.isReplay || false;
            draft.status = GameStatus.MISSION_BRIEFING;
            draft.currentEventIndex = 0;
            draft.missionStartState = JSON.parse(JSON.stringify(draft));
            break;
        case 'START_MISSION':
            draft.status = GameStatus.MISSION_START;
            break;
        case 'ADVANCE_STORY': {
            reducerLogic.advanceStory(draft, deps);
            break;
        }
        case 'SKIP_DIALOGUE': {
             if (draft.currentMissionId) {
                const mission = MISSIONS[draft.currentMissionId];
                if (mission.events) {
                    let nextIndex = draft.currentEventIndex;
                    while (nextIndex < mission.events.length - 1) {
                        const nextEvent = mission.events[nextIndex];
                        if (nextEvent.type !== 'dialogue' && nextEvent.type !== 'title') {
                            break;
                        }
                        nextIndex++;
                    }
                    draft.currentEventIndex = nextIndex - 1; // Position before the non-dialogue event
                    reducerLogic.advanceStory(draft, deps);
                }
            }
            break;
        }
        case 'RETURN_TO_HUB': {
            if (draft.currentMissionId && !draft.player.completedMissions.includes(draft.currentMissionId) && draft.status === GameStatus.MISSION_VICTORY) {
                const mission = MISSIONS[draft.currentMissionId];
                const reward = draft.currentMissionIsReplay 
                    ? Math.round(mission.rewards.dreamSediment * 0.5) 
                    : mission.rewards.dreamSediment;
                draft.player.dreamSediment += reward;
                if (!draft.currentMissionIsReplay) {
                    draft.player.completedMissions.push(draft.currentMissionId);
                }
            }
            reducerLogic.returnToHubAndReset(draft, deps);
            break;
        }
        case 'START_COMBAT': {
            if (draft.currentMissionId) {
                const mission = MISSIONS[draft.currentMissionId];
                const event = mission.events![draft.currentEventIndex] as CombatEvent;
                reducerLogic.setupCombat(draft, deps, event);
                draft.status = GameStatus.IN_MISSION_COMBAT;
            }
            break;
        }
        case 'PLAY_CARD':
            reducerLogic.playCard(draft, deps, action.payload.cardInstanceId, action.payload.targetId);
            break;
        case 'END_TURN':
            reducerLogic.endTurn(draft, deps);
            break;
        case 'APPLY_ENEMY_TURN_STATUS_EFFECTS':
            reducerLogic.applyEnemyTurnStatusEffects(draft, deps);
            break;
        case 'ADVANCE_ENEMY_TURN':
            reducerLogic.advanceEnemyTurn(draft, deps);
            break;
        case 'APPLY_ENEMY_EFFECT':
            reducerLogic.applyEnemyEffect(draft, deps);
            break;
        case 'START_PLAYER_TURN':
            reducerLogic.startPlayerTurn(draft, deps);
            break;
        case 'COMBAT_VICTORY': {
            if (draft.combatState) {
                draft.interimCombatState = {
                    deck: draft.combatState.deck,
                    hand: draft.combatState.hand,
                    discard: draft.combatState.discard,
                    exhaust: draft.combatState.exhaust,
                    constructs: draft.combatState.constructs,
                };
                
                draft.combatState.enemies.forEach(enemy => {
                    draft.player.dreamSediment += enemy.reward.dreamSediment;
                });
                draft.isFirstCombatOfMission = false;
            }
            reducerLogic.advanceStory(draft, deps);
            break;
        }
        case 'COMBAT_DEFEAT':
            draft.status = GameStatus.GAME_OVER;
            draft.sedimentGainedOnDefeat = Math.round(draft.player.dreamSediment * 0.2);
            if (draft.missionStartState) {
                const checkpointState = JSON.parse(JSON.stringify(draft.missionStartState)) as GameState;
                checkpointState.player.dreamSediment += draft.sedimentGainedOnDefeat;
                draft.missionStartState = checkpointState;
            }
            break;
        case 'ADD_TO_DECK': {
            const deck = draft.player.decks[action.payload.deckId];
            if (deck.length < DECK_SIZE) {
                deck.push(action.payload.cardId);
            }
            break;
        }
        case 'REMOVE_FROM_DECK': {
            const deck = draft.player.decks[action.payload.deckId];
            deck.splice(action.payload.cardIndex, 1);
            break;
        }
        case 'SET_ACTIVE_DECK':
            draft.player.activeDeckId = action.payload.deckId;
            break;
        case 'EQUIP_ITEM': {
            const item = { ...EQUIPMENT, ...draft.customEquipment }[action.payload.itemId];
            if (item) {
                const oldItemId = draft.player.equipment[item.slot];
                if (oldItemId) {
                    draft.player.inventory.push(oldItemId);
                }
                draft.player.equipment[item.slot] = item.id;
                draft.player.inventory = draft.player.inventory.filter(id => id !== item.id);
            }
            break;
        }
        case 'UNEQUIP_ITEM': {
            const itemId = draft.player.equipment[action.payload.slot];
            if (itemId) {
                draft.player.inventory.push(itemId);
                draft.player.equipment[action.payload.slot] = null;
            }
            break;
        }
        case 'SYNCHRONIZE_WEAPON': {
            if (draft.player.dreamSediment >= SYNC_COSTS.weapon) {
                draft.player.dreamSediment -= SYNC_COSTS.weapon;
                const newItem = generateRandomEquipment(deps.getStage(), 'weapon', deps.getCurrentChapter());
                draft.customEquipment[newItem.id] = newItem;
                draft.player.inventory.push(newItem.id);
                draft.newlyAcquiredEquipmentIds.push(newItem.id);
            }
            break;
        }
        case 'SYNCHRONIZE_EQUIPMENT': {
            if (draft.player.dreamSediment >= SYNC_COSTS.equipment) {
                draft.player.dreamSediment -= SYNC_COSTS.equipment;
                const newItem = generateRandomEquipment(deps.getStage(), 'equipment', deps.getCurrentChapter());
                draft.customEquipment[newItem.id] = newItem;
                draft.player.inventory.push(newItem.id);
                draft.newlyAcquiredEquipmentIds.push(newItem.id);
            }
            break;
        }
        case 'SYNCHRONIZE_CARD': {
            if (draft.player.dreamSediment >= SYNC_COSTS.card) {
                draft.player.dreamSediment -= SYNC_COSTS.card;
                draft.player.cardSyncsSinceLastEpic = (draft.player.cardSyncsSinceLastEpic || 0) + 1;
                const forceEpic = draft.player.cardSyncsSinceLastEpic >= 2;
                const newCards = generateCardPack(draft.player.cardCollection, forceEpic);
                if (forceEpic || newCards.some(id => CARDS[id].rarity === CardRarity.EPIC)) {
                    draft.player.cardSyncsSinceLastEpic = 0;
                }
                draft.player.cardCollection.push(...newCards);
                draft.newlyAcquiredCardIds.push(...newCards);
            }
            break;
        }
        case 'CLEAR_NEW_CARDS':
            draft.newlyAcquiredCardIds = [];
            break;
        case 'CLEAR_NEW_EQUIPMENT':
            draft.newlyAcquiredEquipmentIds = [];
            break;
        case 'DECOMPOSE_ITEM': {
            const item = { ...EQUIPMENT, ...draft.customEquipment }[action.payload.itemId];
            if (item) {
                let sediment = 10;
                if (item.rarity === CardRarity.RARE) sediment = 25;
                if (item.rarity === CardRarity.EPIC) sediment = 50;
                draft.player.dreamSediment += sediment;
                draft.player.inventory = draft.player.inventory.filter(id => id !== item.id);
            }
            break;
        }
        case 'DECOMPOSE_CARD': {
            const index = draft.player.cardCollection.lastIndexOf(action.payload.cardId);
            if (index !== -1) {
                draft.player.cardCollection.splice(index, 1);
                const card = deps.getAllCards()[action.payload.cardId];
                let sediment = 2;
                if (card.rarity === CardRarity.RARE) sediment = 5;
                if (card.rarity === CardRarity.EPIC) sediment = 10;
                draft.player.dreamSediment += sediment;
            }
            break;
        }
        case 'DEBUG_ADD_SEDIMENT':
            draft.player.dreamSediment += action.payload;
            break;
        case 'RESTART_GAME':
            Object.assign(draft, initialState);
            break;
        case 'RESTART_FROM_CHECKPOINT':
            if (draft.missionStartState) {
                 const checkpointState = JSON.parse(JSON.stringify(draft.missionStartState));
                 Object.assign(draft, checkpointState);
            }
            break;
        case 'DISCARD_CARDS':
            reducerLogic.handleManualDiscard(draft, deps, action.payload.cardInstanceIds);
            break;
        case 'RETURN_CARDS_TO_DECK':
             reducerLogic.handleReturnToDeck(draft, deps, action.payload.cardInstanceIds);
             break;
        case 'CHOOSE_CARD_TO_GENERATE':
            reducerLogic.handleCardChoice(draft, deps, action.payload.cardId);
            break;
        case 'CHOOSE_TRACE_CARD':
            reducerLogic.handleTraceChoice(draft, deps, action.payload.cardInstanceId);
            break;
        case 'CHOOSE_EFFECT':
            reducerLogic.handleEffectChoice(draft, deps, action.payload.effect);
            break;
        case 'DEBUG_JUMP_TO_CHAPTER': {
            const targetChapter = action.payload.chapter;

            // Always complete the prologue, as it's the gateway to the hub.
            if (!draft.player.completedMissions.includes('prologue')) {
                draft.player.completedMissions.push('prologue');
            }

            Object.values(MISSIONS).forEach(mission => {
                // Skip prologue since we handled it above.
                if (mission.id === 'prologue') return;
                
                if (mission.chapter && mission.chapter < targetChapter && !draft.player.completedMissions.includes(mission.id)) {
                    draft.player.completedMissions.push(mission.id);
                }
            });
            draft.player.dreamSediment = 9999;
            draft.status = GameStatus.HUB;
            break;
        }
        case 'APPLY_SUPPLY_STOP':
             const playerStats = deps.getPlayerStats();
             draft.player.hp = playerStats.maxHp;
             draft.player.cp = playerStats.maxCp;
             break;
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
    dispatch(action);
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
