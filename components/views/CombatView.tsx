import React, { useEffect, useState, useRef, CSSProperties } from 'react';
import { useGame } from '../../contexts/GameContext';
import { Enemy, Card as CardType, StatusEffect, CardRarity, CombatLogEntry, PlayerStats, CombatCard, CardEffect, Construct } from '../../types';
import { CARDS, ENEMY_CARDS, CONSTRUCTS } from '../../constants';
import { DocumentDuplicateIcon, ArchiveBoxIcon, ShieldCheckIcon, RectangleStackIcon, HandRaisedIcon, ExclamationTriangleIcon, PlusIcon, CubeIcon } from '@heroicons/react/24/solid';
import { getDynamicCardDescription } from '../../utils/cardUtils';
import { getEffectivePlayerStats } from '../../utils/playerUtils';
import TurnBanner from '../TurnBanner';

const getRarityColor = (rarity: CardRarity) => {
    switch (rarity) {
        case CardRarity.COMMON: return 'border-gray-500 bg-gray-800';
        case CardRarity.RARE: return 'border-blue-500 bg-blue-900';
        case CardRarity.EPIC: return 'border-purple-600 bg-purple-900';
        default: return 'border-gray-700 bg-gray-800';
    }
};

const Card: React.FC<{ card: CombatCard; stats?: Partial<PlayerStats>; style?: CSSProperties; className?: string, effectiveCost?: number }> = ({ card, stats, style, className, effectiveCost }) => {
    const description = stats ? getDynamicCardDescription(card, stats) : card.description;
    const displayCost = card.costOverride ?? (effectiveCost !== undefined ? effectiveCost : card.cost);

    return (
        <div
            style={style}
            className={`w-40 h-56 border-4 ${getRarityColor(card.rarity)} rounded-lg p-3 flex flex-col justify-between text-left shadow-lg ${className}`}
        >
            <div>
                <h3 className="font-bold text-base text-white">{card.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{card.rarity.toLowerCase()} {card.type}</p>
            </div>
            <p className="text-sm text-gray-200 flex-grow mt-2 whitespace-pre-wrap">{description}</p>
            <p className="text-lg font-bold text-cyan-400 self-end">{card.cost === 0 && card.effect.overclockCost ? `${card.effect.overclockCost} HP` : `${displayCost} CP`}</p>
        </div>
    )
};

const FloatingText: React.FC<{ text: string; color: string }> = ({ text, color }) => (
    <div className={`absolute top-0 left-1/2 -translate-x-1/2 font-bold text-2xl animate-float-up ${color}`} style={{ textShadow: '1px 1px 2px black' }}>
        {text}
    </div>
);

type FloatingTextItem = { id: number; text: string; color: string };

const StatusEffectIcon: React.FC<{ effect: StatusEffect; parentAnimationClass: string; }> = ({ effect, parentAnimationClass }) => {
    const pulseClass =
      parentAnimationClass === 'animate-burn' && effect.id === 'burn' ? 'animate-burn' :
      parentAnimationClass === 'animate-bleed' && effect.id === 'bleed' ? 'animate-bleed' : '';
      
    return (
        <div className="group relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${effect.type === 'buff' ? 'bg-green-600' : 'bg-red-600'} border-2 border-black/50 ${pulseClass}`}>
                {effect.name.slice(0, 1)}
                <span className="absolute -top-1 -right-1 text-xs bg-gray-900 px-1 rounded-full">{effect.value || effect.duration}</span>
            </div>
            <div className="absolute bottom-full mb-2 w-48 p-2 text-xs text-center text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <p className="font-bold">{effect.name} ({effect.id === 'burn' || effect.id === 'bleed' || effect.id === 'poison' ? `${effect.value}层` : `${effect.duration}回合`})</p>
                <p>{effect.description}</p>
            </div>
        </div>
    );
};

const useCombatEntityAnimation = (entityId: string, currentHp: number, currentBlock: number) => {
    const { state } = useGame();
    const { combatState } = state;
    const trigger = combatState?.animationTriggers[entityId];

    const [animationClass, setAnimationClass] = useState('');
    const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
    
    const prevHpRef = useRef(currentHp);
    const prevBlockRef = useRef(currentBlock);

    useEffect(() => {
        if (!trigger) return;
        
        const className = `animate-${trigger.type}`;
        
        setAnimationClass(className);
        const timer = setTimeout(() => setAnimationClass(''), 500); 

        return () => clearTimeout(timer);
    }, [trigger]);

    useEffect(() => {
        const hpChange = prevHpRef.current - currentHp;
        const blockChange = prevBlockRef.current - currentBlock;
        const newTexts: Omit<FloatingTextItem, 'id'>[] = [];

        const triggerType = trigger?.type;
        
        if (hpChange > 0) {
            let color = 'text-red-500';
            if (triggerType === 'burn') color = 'text-orange-400';
            if (triggerType === 'bleed') color = 'text-red-600';
            newTexts.push({ text: `-${hpChange}`, color });
        } else if (hpChange < 0) {
            newTexts.push({ text: `+${-hpChange}`, color: 'text-green-400' });
        }
        
        if (blockChange > 0) {
            newTexts.push({ text: `-${blockChange}`, color: 'text-gray-400' });
        } else if (blockChange < 0) {
            newTexts.push({ text: `+${-blockChange}`, color: 'text-blue-400' });
        }
        
        if (newTexts.length > 0) {
            setFloatingTexts(texts => [...texts, ...newTexts.map(t => ({...t, id: Date.now() + Math.random()}))]);
        }

        prevHpRef.current = currentHp;
        prevBlockRef.current = currentBlock;

    }, [currentHp, currentBlock, trigger]);
    
    useEffect(() => {
        if (floatingTexts.length > 0) {
            const timer = setTimeout(() => setFloatingTexts(texts => texts.slice(1)), 1200);
            return () => clearTimeout(timer);
        }
    }, [floatingTexts]);

    return { animationClass, floatingTexts };
};

const ActionIntentIcon: React.FC<{ card: CardType; enemy: Enemy }> = ({ card, enemy }) => {
    let icon = <HandRaisedIcon className="w-4 h-4 text-gray-400" />;
    let value: string | number | null = null;

    const isEmpowered = enemy.statusEffects.some(e => e.id === 'empowered');
    
    if (card.effect.damageMultiplier) {
        let damage = Math.round(enemy.attack * card.effect.damageMultiplier * (isEmpowered ? 2.0 : 1.0));
        value = damage * (card.effect.hitCount || 1);
        icon = <HandRaisedIcon className="w-4 h-4 text-red-400" />;
    } else if (card.effect.gainBlock) {
        value = card.effect.gainBlock;
        icon = <ShieldCheckIcon className="w-4 h-4 text-blue-400" />;
    } else if (card.effect.statusEffect && card.effect.target !== 'self') {
        icon = <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
    } else if (card.effect.statusEffect && card.effect.target === 'self') {
        icon = <PlusIcon className="w-4 h-4 text-green-400" />;
    }

    return (
        <div className="flex items-center bg-gray-900/80 px-2 py-1 rounded-md text-xs border border-gray-600 cursor-pointer">
            {icon}
            {value !== null && <span className="ml-1 font-mono">{value}</span>}
        </div>
    );
};

const EnemySprite: React.FC<{ 
    enemy: Enemy; 
    isSelected: boolean; 
    onSelect: () => void; 
    isTargeting: boolean; 
    actionCards: CardType[] | null; 
    isAttacking: boolean; 
    currentActionIndex: number;
    onActionIntentEnter: (e: React.MouseEvent, card: CardType, enemy: Enemy) => void;
    onActionIntentLeave: () => void;
}> = ({ enemy, isSelected, onSelect, isTargeting, actionCards, isAttacking, currentActionIndex, onActionIntentEnter, onActionIntentLeave }) => {
    const hpPercentage = (enemy.hp / enemy.maxHp) * 100;
    const { animationClass, floatingTexts } = useCombatEntityAnimation(enemy.id, enemy.hp, enemy.block);
    
    const isDefeated = enemy.hp <= 0;
    const selectionClass = isSelected && !isDefeated ? 'border-yellow-400 scale-105' : 'border-red-500/50';
    const targetingClass = isTargeting && !isDefeated ? 'cursor-pointer hover:border-yellow-400 ring-2 ring-yellow-400 animate-pulse' : '';
    const defeatedClass = isDefeated ? 'animate-dissolve' : '';
    const attackingClass = isAttacking ? 'animate-enemy-attack' : '';

    const cardBeingPlayed = isAttacking && actionCards ? actionCards[currentActionIndex] : null;
    
    const tideDisplay = (enemy.tideCounter % 3 === 0 && enemy.tideCounter > 0) ? 3 : enemy.tideCounter % 3;

    return (
        <div
            className={`flex flex-col items-center transition-transform duration-200 relative ${defeatedClass}`}
            onClick={isTargeting && !isDefeated ? onSelect : undefined}
        >
            <div className="absolute -top-16 w-full flex justify-center items-center gap-1 z-10 h-8">
                 {!isAttacking && actionCards && actionCards.map((card, index) => (
                    <div
                        key={index}
                        onMouseEnter={(e) => onActionIntentEnter(e, card, enemy)}
                        onMouseLeave={onActionIntentLeave}
                    >
                        <ActionIntentIcon card={card} enemy={enemy} />
                    </div>
                ))}
            </div>
             <div className="absolute -top-10 h-10 w-full">
                {floatingTexts.map(ft => <FloatingText key={ft.id} text={ft.text} color={ft.color} />)}
            </div>
            <div className="absolute top-0 right-1/2 translate-x-1/2 z-20 h-56 flex items-center pointer-events-none">
                {cardBeingPlayed && (
                    <div key={`${enemy.id}-${currentActionIndex}`} className="animate-enemy-play-card">
                        <Card card={cardBeingPlayed as CombatCard} stats={{ attack: enemy.attack }}/>
                    </div>
                )}
            </div>
            <div className="absolute -top-6 right-0 flex items-center bg-gray-900/80 px-2 py-1 rounded-md text-xs z-10">
                <span className="font-bold text-blue-300 mr-2">潮汐: {tideDisplay}/3</span>
                <RectangleStackIcon className="w-4 h-4 mr-1 text-gray-300" />
                <span className="font-bold">{enemy.hand.length + enemy.deck.length}</span>
            </div>
            <div className={`w-32 h-32 bg-red-900/50 border-4 rounded-full flex items-center justify-center mb-2 relative transition-all duration-200 ${selectionClass} ${targetingClass} ${animationClass} ${attackingClass}`}>
                <span className="text-4xl">💀</span>
                {enemy.block > 0 && 
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold">
                        <ShieldCheckIcon className="w-5 h-5 absolute opacity-30" />
                        {enemy.block}
                    </div>
                }
            </div>
            <p className="font-bold text-lg">{enemy.name}</p>
            <div className="w-40 bg-gray-700 rounded-full h-3 mt-1 relative">
                <div className="bg-red-600 h-3 rounded-full transition-all duration-500" style={{ width: `${hpPercentage}%` }}></div>
                <span className="absolute inset-0 w-full text-center text-xs font-mono text-white">{enemy.hp}/{enemy.maxHp}</span>
            </div>
            <div className="flex space-x-1 mt-2 h-8">
                {enemy.statusEffects.map(effect => <StatusEffectIcon key={effect.id + effect.duration} effect={effect} parentAnimationClass={animationClass} />)}
            </div>
        </div>
    );
}

const ConstructSprite: React.FC<{
    construct: Construct;
    isSelected: boolean;
    onSelect: () => void;
    isTargeting: boolean;
}> = ({ construct, isSelected, onSelect, isTargeting }) => {
    const hpPercentage = (construct.hp / construct.maxHp) * 100;
    const { animationClass, floatingTexts } = useCombatEntityAnimation(construct.instanceId, construct.hp, construct.block);
    
    const isDefeated = construct.hp <= 0;
    const selectionClass = isSelected && !isDefeated ? 'border-yellow-400 scale-105' : 'border-gray-500/50';
    const targetingClass = isTargeting && !isDefeated ? 'cursor-pointer hover:border-yellow-400 ring-2 ring-yellow-400 animate-pulse' : '';
    const defeatedClass = isDefeated ? 'animate-dissolve' : '';
    const template = CONSTRUCTS[construct.templateId];

    return (
        <div
            className={`flex flex-col items-center transition-transform duration-200 relative ${defeatedClass}`}
            onClick={isTargeting && !isDefeated ? onSelect : undefined}
        >
             <div className="absolute -top-10 h-10 w-full">
                {floatingTexts.map(ft => <FloatingText key={ft.id} text={ft.text} color={ft.color} />)}
            </div>
            <div className="group absolute -top-6 right-0 flex items-center bg-gray-900/80 px-2 py-1 rounded-md text-xs z-10">
                <span className="font-bold text-orange-300">耐久: {construct.durability}</span>
                 <div className="absolute bottom-full mb-2 w-48 p-2 text-xs text-center text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <p className="font-bold">{construct.name}</p>
                    <p>{template.description}</p>
                </div>
            </div>
            <div className={`w-24 h-24 bg-gray-900/50 border-4 rounded-md flex items-center justify-center mb-2 relative transition-all duration-200 ${selectionClass} ${targetingClass} ${animationClass}`}>
                <CubeIcon className="w-16 h-16 text-cyan-400 opacity-70" />
                {construct.block > 0 && 
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-sm">
                        <ShieldCheckIcon className="w-4 h-4 absolute opacity-30" />
                        {construct.block}
                    </div>
                }
            </div>
            <p className="font-bold text-sm">{construct.name}</p>
            <div className="w-28 bg-gray-700 rounded-full h-2.5 mt-1 relative">
                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${hpPercentage}%` }}></div>
                <span className="absolute inset-0 w-full text-center text-xs font-mono text-white">{construct.hp}/{construct.maxHp}</span>
            </div>
            <div className="flex space-x-1 mt-2 h-8">
                {construct.statusEffects.map(effect => <StatusEffectIcon key={effect.id + effect.duration} effect={effect} parentAnimationClass={animationClass} />)}
            </div>
        </div>
    );
}


const CombatLog: React.FC<{ log: CombatLogEntry[] }> = ({ log }) => {
    const logEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [log]);
    
    return (
        <div className="w-64 h-full bg-gray-900/70 border-l border-gray-700 p-2 flex flex-col">
            <h2 className="text-center font-bold text-gray-400 border-b border-gray-600 pb-1 mb-2">战斗记录</h2>
            <div className="flex-grow overflow-y-auto pr-1 text-sm space-y-1">
                {log.map(entry => (
                    <p key={entry.id} className={entry.color || 'text-gray-300'}>{entry.text}</p>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

const CardChoiceOverlay: React.FC = () => {
    const { state, dispatch } = useGame();
    const { combatState, player, customEquipment } = state;
    const allCards = { ...CARDS };
    const playerStats = getEffectivePlayerStats(player, customEquipment);

    if (combatState?.phase !== 'awaiting_card_choice' || !combatState.cardChoiceAction) {
        return null;
    }

    const { options } = combatState.cardChoiceAction;

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center animate-fadeIn">
            <h2 className="text-3xl font-bold text-yellow-300 mb-8 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">选择一张卡牌衍生</h2>
            <div className="flex gap-6">
                {options.map(cardId => {
                    const card = allCards[cardId];
                    if (!card) return null;
                    return (
                        <div key={cardId} className="transform hover:scale-110 transition-transform duration-200 cursor-pointer" onClick={() => dispatch({ type: 'CHOOSE_CARD_TO_GENERATE', payload: { cardId } })}>
                             <Card card={card as CombatCard} stats={playerStats} />
                        </div>
                    );
                })}
            </div>
        </div>
    )
};

const EffectChoiceOverlay: React.FC = () => {
    const { state, dispatch } = useGame();
    const { combatState } = state;

    if (combatState?.phase !== 'awaiting_effect_choice' || !combatState.effectChoiceAction) {
        return null;
    }

    const { options } = combatState.effectChoiceAction;

    const handleChoice = (effect: CardEffect) => {
        dispatch({ type: 'CHOOSE_EFFECT', payload: { effect } });
    };

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center animate-fadeIn">
            <h2 className="text-3xl font-bold text-yellow-300 mb-8 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">选择一个效果</h2>
            <div className="flex flex-col gap-4 w-full max-w-md">
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleChoice(option.effect)}
                        className="p-4 bg-gray-800 text-white text-lg font-semibold rounded-md border-2 border-gray-700 hover:border-cyan-500 hover:bg-cyan-900/50 transition-all duration-200 transform hover:scale-105"
                    >
                        {option.description}
                    </button>
                ))}
            </div>
        </div>
    );
};


const CombatView: React.FC = () => {
    const { state, dispatch } = useGame();
    const { player, combatState, customCards, customEquipment } = state;
    const [selectedCardInstanceId, setSelectedCardInstanceId] = useState<string | null>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
    const [actionTooltip, setActionTooltip] = useState<{
        card: CardType;
        enemy: Enemy;
        top: number;
        left: number;
    } | null>(null);
    const [animatingPlayedCard, setAnimatingPlayedCard] = useState<CombatCard | null>(null);
    
    // State for new selection UIs
    const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);

    const [shake, setShake] = useState(false);
    const playerTrigger = combatState?.animationTriggers['player'];
    useEffect(() => {
        if (playerTrigger?.type === 'hit_hp') {
            setShake(true);
            setTimeout(() => setShake(false), 300);
        }
    }, [playerTrigger]);
    
    const [bannerText, setBannerText] = useState<string | null>(null);
    const prevTurnRef = useRef(combatState?.turn);
    const prevPhaseRef = useRef(combatState?.phase);

    useEffect(() => {
        if (!combatState) return;

        if (combatState.phase === 'player_turn' && (combatState.turn !== prevTurnRef.current || prevPhaseRef.current !== 'player_turn')) {
            setBannerText('你的回合');
            const timer = setTimeout(() => setBannerText(null), 1500);
            return () => clearTimeout(timer);
        } else if (combatState.phase === 'enemy_turn' && prevPhaseRef.current === 'player_turn') {
            setBannerText('敌人回合');
            const timer = setTimeout(() => setBannerText(null), 1500);
            return () => clearTimeout(timer);
        }
        prevTurnRef.current = combatState.turn;
        prevPhaseRef.current = combatState.phase;
    }, [combatState?.turn, combatState?.phase]);

    const allCards = { ...CARDS, ...customCards, ...ENEMY_CARDS };
    const playerStats = getEffectivePlayerStats(player, customEquipment);
    const { animationClass: playerAnimationClass, floatingTexts: playerFloatingTexts } = useCombatEntityAnimation('player', player.hp, combatState?.block || 0);

    const isSelectionPhase = combatState?.phase === 'awaiting_discard' || combatState?.phase === 'awaiting_return_to_deck' || combatState?.phase === 'awaiting_effect_choice';

    const handleActionIntentEnter = (e: React.MouseEvent, card: CardType, enemy: Enemy) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setActionTooltip({
            card,
            enemy,
            top: rect.bottom,
            left: rect.left + rect.width / 2,
        });
    };

    const handleActionIntentLeave = () => {
        setActionTooltip(null);
    };

    useEffect(() => {
        if (!isSelectionPhase) {
            setSelectedInstanceIds([]);
        }
    }, [isSelectionPhase]);

    useEffect(() => {
        if (combatState?.enemies.length) {
            const firstAliveEnemy = combatState.enemies.find(e => e.hp > 0);
            if (firstAliveEnemy && !selectedTargetId) setSelectedTargetId(firstAliveEnemy.id);
        }
    }, [combatState?.enemies, selectedTargetId]);

    useEffect(() => {
        if (combatState?.phase === 'enemy_turn' && combatState.activeEnemyIndex !== null) {
            dispatch({ type: 'PROCESS_ENEMY_ACTION' });
        } else if (combatState?.phase === 'enemy_turn' && combatState.activeEnemyIndex === null) {
            dispatch({ type: 'START_PLAYER_TURN' });
        }
    }, [combatState?.phase, combatState?.activeEnemyIndex, dispatch]);

    useEffect(() => {
        if (combatState?.phase === 'victory' || combatState?.phase === 'defeat') {
            const timer = setTimeout(() => {
                dispatch({ type: combatState.phase === 'victory' ? 'COMBAT_VICTORY' : 'COMBAT_DEFEAT' });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [combatState?.phase, dispatch]);
    
    if (!combatState) return <div>Loading Combat...</div>;
    
    const selectedCard = selectedCardInstanceId ? combatState.hand.find(c => c.instanceId === selectedCardInstanceId) : null;
    const isTargeting = selectedCard && selectedCard.effect.target !== 'self';
    const handSize = combatState.hand.length;

    const isCardPlayable = (card: CombatCard) => {
        let effectiveCost = card.costOverride ?? (card.id === 'spark' ? card.cost + combatState.sparkCostModifier : card.cost);
        
        if (card.type === 'attack' && combatState.nextAttackCostModifier < 0) {
            effectiveCost = Math.max(0, effectiveCost + combatState.nextAttackCostModifier);
        }
        const isBound = player.statusEffects.some(e => e.id === 'bind');
        if (isBound && card.type === 'attack') return false;
        if (card.effect.overclockCost && player.hp <= card.effect.overclockCost) return false;
        if (!card.effect.overclockCost && player.cp < effectiveCost) return false;
        return true;
    };

    const handleCardPlay = (cardInstanceId: string, targetId?: string) => {
        const card = combatState.hand.find(c => c.instanceId === cardInstanceId);
        if (!card || !isCardPlayable(card)) {
            setSelectedCardInstanceId(null);
            return;
        }

        setAnimatingPlayedCard(card);
        setTimeout(() => {
            setAnimatingPlayedCard(null);
        }, 1000); // Animation duration is 1s

        dispatch({ type: 'PLAY_CARD', payload: { cardInstanceId, targetId } });
        setSelectedCardInstanceId(null);
    };

    const handleCardClick = (card: CombatCard) => {
        if (isSelectionPhase) return;
        if (combatState.phase !== 'player_turn') return;

        if (card.effect.target === 'self' || card.effect.target === 'all_enemies' || card.effect.target === 'random_enemy' || card.effect.generateCardChoice || card.effect.choiceEffect || card.effect.deployConstruct) {
            handleCardPlay(card.instanceId, selectedTargetId ?? undefined);
        } else {
            setSelectedCardInstanceId(card.instanceId);
        }
    };

    const handleSelectionClick = (instanceId: string) => {
        if (combatState.phase !== 'awaiting_discard' && combatState.phase !== 'awaiting_return_to_deck') return;

        const requiredCount = combatState.phase === 'awaiting_discard'
            ? combatState.discardAction!.count
            : combatState.returnToDeckAction!.count;
        
        const index = selectedInstanceIds.indexOf(instanceId);
        if (index > -1) {
            setSelectedInstanceIds(selectedInstanceIds.filter(id => id !== instanceId));
        } else if (selectedInstanceIds.length < requiredCount) {
            setSelectedInstanceIds([...selectedInstanceIds, instanceId]);
        }
    }
    
    const handleTargetSelect = (targetId: string) => {
        setSelectedTargetId(targetId);
        if (selectedCardInstanceId) {
            handleCardPlay(selectedCardInstanceId, targetId);
        }
    };
    
    const getCardStyle = (card: CombatCard, index: number): CSSProperties => {
        const isHovered = hoveredCardIndex === index;
        const totalCards = handSize;
        const baseOverlap = totalCards > 6 ? -80 : -60;
        const hoverShift = 30;

        let xOffset = 0;
        let yOffset = 0;

        if (combatState.phase === 'awaiting_discard' || combatState.phase === 'awaiting_return_to_deck') {
             if (selectedInstanceIds.includes(card.instanceId)) {
                yOffset = -20;
             }
        } else {
            if (hoveredCardIndex !== null) {
                if (index < hoveredCardIndex) {
                    xOffset = -hoverShift;
                } else if (index > hoveredCardIndex) {
                    xOffset = hoverShift;
                }
            }
             if (isHovered) {
                yOffset = -40;
            }
        }


        return {
            marginLeft: index > 0 ? `${baseOverlap}px` : '0px',
            transition: 'transform 0.2s ease-out, margin-left 0.2s ease-out',
            zIndex: isHovered ? 100 : index,
            transform: `translateY(${yOffset}px) translateX(${xOffset}px) scale(${isHovered ? '1.1' : '1'})`,
        };
    };

    const handleConfirmSelection = () => {
        if (combatState.phase === 'awaiting_discard') {
            dispatch({ type: 'DISCARD_CARDS', payload: { cardInstanceIds: selectedInstanceIds } });
        } else if (combatState.phase === 'awaiting_return_to_deck') {
            dispatch({ type: 'RETURN_CARDS_TO_DECK', payload: { cardInstanceIds: selectedInstanceIds } });
        }
    };
    
    const tideDisplay = (player.tideCounter % 3 === 0 && player.tideCounter > 0) ? 3 : player.tideCounter % 3;

    const renderEndTurnButton = () => {
        if (combatState.phase === 'awaiting_discard' || combatState.phase === 'awaiting_return_to_deck') {
            const action = combatState.phase === 'awaiting_discard' ? combatState.discardAction! : combatState.returnToDeckAction!;
            const isReady = selectedInstanceIds.length === action.count;
            const buttonText = combatState.phase === 'awaiting_discard' ? '弃置' : '确认';
            return (
                 <button 
                    onClick={handleConfirmSelection}
                    disabled={!isReady}
                    className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-md enabled:hover:bg-cyan-500 disabled:opacity-50 transition-all duration-300 transform enabled:hover:scale-105 active:scale-95"
                >
                    {buttonText} ({selectedInstanceIds.length}/{action.count})
                </button>
            )
        }
        return (
             <button 
                onClick={() => dispatch({ type: 'END_TURN' })}
                disabled={combatState.phase !== 'player_turn'}
                className="px-8 py-3 bg-red-700 text-white font-bold rounded-md enabled:hover:bg-red-600 disabled:opacity-50 transition-all duration-300 transform enabled:hover:scale-105 active:scale-95"
            >
                结束回合
            </button>
        )
    }

    const playerConstructs = combatState.constructs.filter(c => c.owner === 'player');
    const enemyConstructs = combatState.constructs.filter(c => c.owner !== 'player');

    return (
         <div className={`h-full flex animate-fadeIn pt-16 ${shake ? 'animate-screen-shake' : ''}`}>
            <TurnBanner text={bannerText || ''} />
            {actionTooltip && (
                <div
                    className="fixed p-0 text-left text-white z-50 pointer-events-none"
                    style={{
                        top: actionTooltip.top,
                        left: actionTooltip.left,
                        transform: 'translate(-50%, 8px)',
                    }}
                >
                    <Card 
                        card={actionTooltip.card as CombatCard} 
                        stats={{ attack: actionTooltip.enemy.attack, defense: actionTooltip.enemy.defense }} 
                    />
                </div>
            )}
            {animatingPlayedCard && (
                <div
                    key={animatingPlayedCard.instanceId}
                    className="absolute bottom-64 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
                >
                    <div className="animate-player-play-card">
                        <Card card={animatingPlayedCard} stats={playerStats} />
                    </div>
                </div>
            )}
            <div className="flex-grow flex flex-col relative">
                {combatState.phase === 'victory' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-4xl font-bold text-green-400 z-50">序列执行成功</div>}
                {combatState.phase === 'defeat' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-4xl font-bold text-red-500 z-50">系统崩溃</div>}
                {(combatState.phase === 'awaiting_discard' || combatState.phase === 'awaiting_return_to_deck') && (
                    <div className="absolute top-1/2 -translate-y-full left-0 right-0 text-center z-30 pointer-events-none">
                        <h2 className="text-3xl font-bold text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                            {combatState.phase === 'awaiting_discard' ? `选择 ${combatState.discardAction?.count} 张牌弃置` : `选择 ${combatState.returnToDeckAction?.count} 张牌返回牌库`}
                        </h2>
                    </div>
                )}


                <div className="absolute top-1/2 left-1/4 w-1/2 h-10 pointer-events-none z-30">
                     {playerFloatingTexts.map(ft => <FloatingText key={ft.id} text={ft.text} color={ft.color} />)}
                </div>

                <div className="flex-grow flex flex-col px-4">
                    {/* Top row for enemy constructs */}
                    <div className="h-1/3 flex items-end justify-center gap-6">
                        {enemyConstructs.map(construct => (
                            <ConstructSprite 
                                key={construct.instanceId}
                                construct={construct}
                                isSelected={selectedTargetId === construct.instanceId}
                                onSelect={() => handleTargetSelect(construct.instanceId)}
                                isTargeting={!!isTargeting && !isSelectionPhase}
                            />
                        ))}
                    </div>
                     {/* Middle row for enemies */}
                    <div className="h-1/3 flex items-center justify-around">
                        {combatState.enemies.map(enemy => (
                            <EnemySprite
                                key={enemy.id}
                                enemy={enemy}
                                actionCards={combatState.enemyActions[enemy.id] || null}
                                isSelected={selectedTargetId === enemy.id}
                                onSelect={() => handleTargetSelect(enemy.id)}
                                isTargeting={!!isTargeting && !isSelectionPhase}
                                isAttacking={combatState.attackingEnemyId === enemy.id}
                                currentActionIndex={combatState.activeActionIndex}
                                onActionIntentEnter={handleActionIntentEnter}
                                onActionIntentLeave={handleActionIntentLeave}
                            />
                        ))}
                    </div>
                     {/* Bottom row for player constructs */}
                    <div className="h-1/3 flex items-start justify-center gap-6">
                        {playerConstructs.map(construct => (
                            <ConstructSprite 
                                key={construct.instanceId}
                                construct={construct}
                                isSelected={selectedTargetId === construct.instanceId}
                                onSelect={() => handleTargetSelect(construct.instanceId)}
                                isTargeting={!!isTargeting && !isSelectionPhase}
                            />
                        ))}
                    </div>
                </div>

                <div 
                    className="h-64 flex justify-center items-end"
                    style={{ pointerEvents: isTargeting && !isSelectionPhase ? 'none' : 'auto'}}
                    onMouseLeave={() => setHoveredCardIndex(null)}
                >
                    <div className={`flex justify-center items-end max-w-4xl mx-auto p-4 ${combatState.phase !== 'player_turn' ? 'opacity-50' : ''}`}>
                        {combatState.hand.map((card, index) => {
                            const isPlayable = isCardPlayable(card);
                            const isSelectedForAction = selectedCardInstanceId === card.instanceId;
                            const isSelectedForSelection = selectedInstanceIds.includes(card.instanceId);
                             let effectiveCost = card.costOverride ?? (card.id === 'spark' ? card.cost + combatState.sparkCostModifier : card.cost);
                             if (card.type === 'attack' && combatState.nextAttackCostModifier < 0) {
                                effectiveCost = Math.max(0, effectiveCost + combatState.nextAttackCostModifier);
                             }

                            return (
                                <div
                                    key={card.instanceId}
                                    style={getCardStyle(card, index)}
                                    className={`${(combatState.phase === 'awaiting_discard' || combatState.phase === 'awaiting_return_to_deck') ? 'cursor-pointer' : ''}`}
                                    onMouseEnter={() => !isSelectionPhase && setHoveredCardIndex(index)}
                                    onClick={() => (combatState.phase === 'awaiting_discard' || combatState.phase === 'awaiting_return_to_deck') ? handleSelectionClick(card.instanceId) : (isPlayable && handleCardClick(card))}
                                >
                                    <Card
                                        card={card}
                                        stats={playerStats}
                                        className={`${!isPlayable && !isSelectionPhase ? 'opacity-50 filter grayscale' : 'cursor-pointer'} ${isSelectedForAction ? 'ring-4 ring-yellow-400' : ''} ${isSelectedForSelection ? 'ring-4 ring-yellow-400' : ''}`}
                                        effectiveCost={effectiveCost}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={`h-24 bg-black/50 backdrop-blur-md border-t border-cyan-500/20 flex items-center justify-between px-4 z-20 relative rounded-lg ${playerAnimationClass}`}>
                    <div className="flex-1 flex items-center gap-4 text-lg">
                        <div className="flex items-center gap-2" title="抽牌堆">
                            <DocumentDuplicateIcon className="w-6 h-6 text-gray-400" />
                            <span className="font-mono font-bold">{combatState.deck.length}</span>
                        </div>
                         <div className="flex items-center gap-2" title="弃牌堆">
                            <ArchiveBoxIcon className="w-6 h-6 text-gray-400" />
                            <span className="font-mono font-bold">{combatState.discard.length}</span>
                        </div>
                         <div className="flex items-center gap-2 text-blue-300" title="潮汐计数">
                            <span className="font-bold text-sm">潮汐</span>
                            <span className="font-mono font-bold">{tideDisplay}/3</span>
                        </div>
                         {combatState.block > 0 && <div className="flex items-center gap-2 text-blue-400" title="格挡">
                            <ShieldCheckIcon className="w-6 h-6" />
                            <span className="font-mono font-bold">{combatState.block}</span>
                        </div>}
                         {player.charge > 0 && <div className="flex items-center gap-2 text-orange-400" title="充能">
                            <span className="font-bold text-sm">⚡</span>
                            <span className="font-mono font-bold">{player.charge}</span>
                        </div>}
                    </div>
                    <div className="flex-shrink-0 mx-4">
                       {renderEndTurnButton()}
                    </div>
                    <div className="flex-1 flex justify-end space-x-1 h-8">
                         {player.statusEffects.map(effect => <StatusEffectIcon key={effect.id + effect.duration} effect={effect} parentAnimationClass={playerAnimationClass} />)}
                    </div>
                </div>
            </div>

             <div className="flex-shrink-0">
                <CombatLog log={combatState.log} />
            </div>
            <CardChoiceOverlay />
            <EffectChoiceOverlay />
        </div>
    );
};

export default CombatView;