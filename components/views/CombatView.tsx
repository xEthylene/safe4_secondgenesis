
import React, { useEffect, useState, useRef, CSSProperties } from 'react';
import { useGame } from '../../contexts/GameContext';
import { Enemy, Card as CardType, StatusEffect, CardRarity, CombatLogEntry, PlayerStats, CombatCard, CardEffect, Construct } from '../../types';
import { CARDS, ENEMY_CARDS, CONSTRUCTS } from '../../constants';
import { DocumentDuplicateIcon, ArchiveBoxIcon, ShieldCheckIcon, RectangleStackIcon, HandRaisedIcon, ExclamationTriangleIcon, PlusIcon, CubeIcon, CpuChipIcon } from '@heroicons/react/24/solid';
import { getDynamicCardDescription } from '../../utils/cardUtils';
import { getEffectivePlayerStats } from '../../utils/playerUtils';
import TurnBanner from '../TurnBanner';

const getRarityColor = (rarity: CardRarity) => {
    switch (rarity) {
        case CardRarity.COMMON: return 'border-gray-500 bg-gray-800/80';
        case CardRarity.RARE: return 'border-blue-500 bg-blue-900/80';
        case CardRarity.EPIC: return 'border-purple-600 bg-purple-900/80';
        default: return 'border-gray-700 bg-gray-800/80';
    }
};

const Card: React.FC<{ card: CombatCard; stats?: Partial<PlayerStats>; style?: CSSProperties; className?: string, effectiveCost?: number }> = ({ card, stats, style, className, effectiveCost }) => {
    const description = stats ? getDynamicCardDescription(card, stats) : card.description;
    const displayCost = card.costOverride ?? (effectiveCost !== undefined ? effectiveCost : card.cost);

    return (
        <div
            style={style}
            className={`w-40 h-56 border-2 md:border-4 ${getRarityColor(card.rarity)} rounded-lg p-3 flex flex-col justify-between text-left shadow-lg backdrop-blur-sm ${className}`}
        >
            <div>
                <h3 className="font-bold text-base text-white">{card.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{card.rarity.toLowerCase()} {card.type}</p>
            </div>
            <p className="text-sm text-gray-200 flex-grow mt-2 whitespace-pre-wrap">{description}</p>
            <p className="text-lg font-bold text-blue-300 self-end">{card.cost === 0 && card.effect.overclockCost ? `${card.effect.overclockCost} H` : `${displayCost}`}</p>
        </div>
    )
};

// New MobileCard component for compact display
const MobileCard: React.FC<{ card: CombatCard; stats?: Partial<PlayerStats>; className?: string, effectiveCost?: number; style?: CSSProperties; }> = ({ card, stats, className, effectiveCost, style }) => {
    const description = stats ? getDynamicCardDescription(card, stats) : card.description;
    const displayCost = card.costOverride ?? (effectiveCost !== undefined ? effectiveCost : card.cost);

    return (
        <div
            style={style}
            className={`w-24 h-36 border-2 ${getRarityColor(card.rarity)} rounded-md p-1.5 flex flex-col justify-between text-left shadow-md backdrop-blur-sm ${className}`}
        >
            <div>
                <h3 className="font-bold text-[11px] text-white truncate">{card.name}</h3>
                <p className="text-[9px] text-gray-400 capitalize">{card.rarity.toLowerCase()} {card.type}</p>
            </div>
            <p className="text-[10px] text-gray-200 flex-grow mt-1 whitespace-pre-wrap overflow-hidden leading-tight">{description}</p>
            <p className="text-sm font-bold text-blue-300 self-end">{card.cost === 0 && card.effect.overclockCost ? `${card.effect.overclockCost} H` : `${displayCost}`}</p>
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
        let damage = Math.round(enemy.attack * card.effect.damageMultiplier * (isEmpowered ? 2.5 : 1.0));
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
    onActionIntentHover: (card: CardType, enemy: Enemy) => void;
    onActionIntentLeave: () => void;
    onActionIntentClick: (card: CardType, enemy: Enemy) => void;
}> = ({ enemy, isSelected, onSelect, isTargeting, actionCards, isAttacking, currentActionIndex, onActionIntentHover, onActionIntentLeave, onActionIntentClick }) => {
    const hpPercentage = (enemy.hp / enemy.maxHp) * 100;
    const { animationClass, floatingTexts } = useCombatEntityAnimation(enemy.id, enemy.hp, enemy.block);
    
    const isDefeated = enemy.hp <= 0;
    const selectionClass = isSelected && !isDefeated ? 'border-yellow-400 scale-105' : 'border-red-800';
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
            <div className="absolute -top-12 w-full flex justify-center items-center gap-1 z-20 h-8">
                 {!isAttacking && actionCards && actionCards.map((card, index) => (
                    <div
                        key={index}
                        onMouseEnter={() => onActionIntentHover(card, enemy)}
                        onMouseLeave={onActionIntentLeave}
                        onClick={(e) => { e.stopPropagation(); onActionIntentClick(card, enemy); }}
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
            <div className="hidden md:flex absolute -top-5 left-0 items-center bg-gray-900/80 px-2 py-1 rounded-md text-xs z-10">
                <span className="font-bold text-blue-300 mr-2">潮汐: {tideDisplay}/3</span>
                <RectangleStackIcon className="w-4 h-4 mr-1 text-gray-300" />
                <span className="font-bold">{enemy.hand.length + enemy.deck.length}</span>
            </div>
            <div className={`w-20 h-20 md:w-28 md:h-28 bg-red-900/50 border-4 rounded-full flex items-center justify-center mb-2 relative transition-all duration-200 ${selectionClass} ${targetingClass} ${animationClass} ${attackingClass}`}>
                <span className="text-4xl">💀</span>
                {enemy.block > 0 && 
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold">
                        <ShieldCheckIcon className="w-5 h-5 absolute opacity-30" />
                        {enemy.block}
                    </div>
                }
            </div>
            <p className="font-bold text-base">{enemy.name}</p>
            <div className="w-24 md:w-32 bg-gray-700 rounded-full h-3 mt-1 relative">
                <div className="bg-red-500 h-3 rounded-full transition-all duration-500" style={{ width: `${hpPercentage}%` }}></div>
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
            <div className={`w-20 h-20 bg-gray-900/50 border-4 rounded-md flex items-center justify-center mb-2 relative transition-all duration-200 ${selectionClass} ${targetingClass} ${animationClass}`}>
                <CubeIcon className="w-12 h-12 text-blue-400 opacity-70" />
                {construct.block > 0 && 
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-sm">
                        <ShieldCheckIcon className="w-4 h-4 absolute opacity-30" />
                        {construct.block}
                    </div>
                }
            </div>
            <p className="font-bold text-xs">{construct.name}</p>
            <div className="w-24 bg-gray-700 rounded-full h-2.5 mt-1 relative">
                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${hpPercentage}%` }}></div>
                <span className="absolute inset-0 w-full text-center text-xs font-mono text-white">{construct.hp}/{construct.maxHp}</span>
            </div>
            <div className="flex space-x-1 mt-2 h-8">
                {construct.statusEffects.map(effect => <StatusEffectIcon key={effect.id + effect.duration} effect={effect} parentAnimationClass={animationClass} />)}
            </div>
        </div>
    );
}

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
                        className="p-4 bg-gray-800 text-white text-lg font-semibold rounded-md border-2 border-gray-700 hover:border-blue-500 hover:bg-blue-900/50 transition-all duration-200 transform hover:scale-105"
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
    const [mobileSelectedCardId, setMobileSelectedCardId] = useState<string | null>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
    const [mobileHoveredCardIndex, setMobileHoveredCardIndex] = useState<number | null>(null);
    const [hoveredCardInfo, setHoveredCardInfo] = useState<{ card: CardType; stats: Partial<PlayerStats> } | null>(null);
    const [mobileDetailCard, setMobileDetailCard] = useState<{ card: CardType; stats: Partial<PlayerStats> } | null>(null);
    const [animatingPlayedCard, setAnimatingPlayedCard] = useState<CombatCard | null>(null);
    
    const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);

    const [shake, setShake] = useState(false);
    const [isHandDrawerOpen, setIsHandDrawerOpen] = useState(false);
    const [showMobileLog, setShowMobileLog] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [combatState?.log, showMobileLog]);

    useEffect(() => {
        if (!combatState) return;

        if (combatState.phase === 'player_turn' && (combatState.turn !== prevTurnRef.current || prevPhaseRef.current !== 'player_turn')) {
            setBannerText('你的回合');
            setSelectedCardInstanceId(null);
            setMobileSelectedCardId(null);
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

    const handleActionIntentHover = (card: CardType, enemy: Enemy) => {
        if (!isMobile) setHoveredCardInfo({ card, stats: { attack: enemy.attack, defense: enemy.defense } });
    };
    const handleActionIntentLeave = () => setHoveredCardInfo(null);
    const handleActionIntentClick = (card: CardType, enemy: Enemy) => {
        if (isMobile) setMobileDetailCard({ card, stats: { attack: enemy.attack, defense: enemy.defense } });
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
    const isTargeting = selectedCard;
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
        if (!card) return;

        setAnimatingPlayedCard(card);
        setTimeout(() => {
            setAnimatingPlayedCard(null);
        }, 1000); // Animation duration is 1s

        dispatch({ type: 'PLAY_CARD', payload: { cardInstanceId, targetId } });
        setSelectedCardInstanceId(null);
        setMobileSelectedCardId(null);
        setIsHandDrawerOpen(false); // Close drawer on card play
    };

    const handleCardClick = (card: CombatCard) => {
        if (isSelectionPhase || combatState.phase !== 'player_turn' || !isCardPlayable(card)) return;

        const needsTarget = card.effect.target === 'enemy' || card.effect.target === 'designated_target';
        
        if (isMobile) {
            if (needsTarget) {
                setSelectedCardInstanceId(card.instanceId);
                setMobileSelectedCardId(null);
            } else {
                setSelectedCardInstanceId(null);
                setMobileSelectedCardId(card.instanceId);
            }
        } else { // Desktop
            if (needsTarget) {
                setSelectedCardInstanceId(card.instanceId);
            } else {
                handleCardPlay(card.instanceId, selectedTargetId ?? undefined);
            }
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
    
    const getDesktopCardStyle = (index: number): CSSProperties => {
        const isHovered = hoveredCardIndex === index;
        const totalCards = handSize;
        const baseOverlap = totalCards > 6 ? -80 : -60;
        const hoverShift = 30;

        let xOffset = 0;
        let yOffset = 0;

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
        
        return {
            marginLeft: index > 0 ? `${baseOverlap}px` : '0px',
            transition: 'transform 0.2s ease-out, margin-left 0.2s ease-out',
            zIndex: isHovered ? 100 : index,
            transform: `translateY(${yOffset}px) translateX(${xOffset}px) scale(${isHovered ? '1.1' : '1'})`,
        };
    };

    const getMobileCardStyle = (index: number): CSSProperties => {
        const isHovered = mobileHoveredCardIndex === index;
        const totalCards = handSize;
        const baseOverlap = -35 - totalCards * 4;
        const hoverShift = 30;

        let xOffset = 0;
        let yOffset = 0;

        if (mobileHoveredCardIndex !== null) {
            if (index < mobileHoveredCardIndex) {
                xOffset = -hoverShift;
            } else if (index > mobileHoveredCardIndex) {
                xOffset = hoverShift;
            }
        }
         if (isHovered) {
            yOffset = -40;
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
        setIsHandDrawerOpen(false);
    };
    
    const tideDisplay = (player.tideCounter % 3 === 0 && player.tideCounter > 0) ? 3 : player.tideCounter % 3;

    const renderEndTurnButton = () => {
        const mobileSelectedCardForConfirmation = isMobile && mobileSelectedCardId ? combatState.hand.find(c => c.instanceId === mobileSelectedCardId) : null;
        if (mobileSelectedCardForConfirmation) {
            return (
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            handleCardPlay(mobileSelectedCardForConfirmation.instanceId, selectedTargetId ?? undefined);
                        }}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-500 transition-all duration-300 text-base"
                    >
                        使用
                    </button>
                    <button
                        onClick={() => setMobileSelectedCardId(null)}
                        className="px-6 py-2 bg-gray-600 text-white font-bold rounded-md hover:bg-gray-500 transition-all duration-300 text-base"
                    >
                        取消
                    </button>
                </div>
            );
        }

        if (combatState.phase === 'awaiting_discard' || combatState.phase === 'awaiting_return_to_deck') {
            const action = combatState.phase === 'awaiting_discard' ? combatState.discardAction! : combatState.returnToDeckAction!;
            const isReady = selectedInstanceIds.length === action.count;
            const buttonText = combatState.phase === 'awaiting_discard' ? '弃置' : '确认';
            return (
                 <button 
                    onClick={handleConfirmSelection}
                    disabled={!isReady}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md enabled:hover:bg-blue-500 disabled:opacity-50 transition-all duration-300 transform enabled:hover:scale-105 active:scale-95 text-lg"
                >
                    {buttonText} ({selectedInstanceIds.length}/{action.count})
                </button>
            )
        }
        return (
             <button 
                onClick={() => {
                    dispatch({ type: 'END_TURN' });
                    setIsHandDrawerOpen(false);
                }}
                disabled={combatState.phase !== 'player_turn'}
                className="px-8 py-3 bg-red-600 text-white font-bold rounded-md enabled:hover:bg-red-500 disabled:opacity-50 transition-all duration-300 transform enabled:hover:scale-105 active:scale-95 text-xl"
            >
                结束回合
            </button>
        )
    }

    const playerConstructs = combatState.constructs.filter(c => c.owner === 'player');
    const enemyConstructs = combatState.constructs.filter(c => c.owner !== 'player');

    return (
         <div className={`h-full flex flex-col md:flex-row animate-fadeIn pt-16 ${shake ? 'animate-screen-shake' : ''}`}>
            <TurnBanner text={bannerText || ''} />
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
             <button onClick={() => setShowMobileLog(true)} className="md:hidden fixed top-[4.25rem] left-2 z-30 p-2 bg-gray-800/70 rounded-full">
                <DocumentDuplicateIcon className="w-5 h-5 text-gray-300" />
            </button>

            {showMobileLog && (
                <div className="md:hidden fixed inset-0 bg-black/70 z-50 flex flex-col p-4 pt-16 animate-fadeIn" onClick={() => setShowMobileLog(false)}>
                    <div className="w-full h-full bg-gray-900 rounded-lg p-2 flex flex-col" onClick={e => e.stopPropagation()}>
                        <h2 className="text-center font-bold text-gray-400 border-b border-gray-600 pb-1 mb-2 flex-shrink-0">战斗记录</h2>
                        <div className="flex-grow overflow-y-auto pr-1 text-sm space-y-1">
                            {combatState.log.map(entry => ( <p key={entry.id} className={entry.color || 'text-gray-300'}>{entry.text}</p> ))}
                            <div ref={logEndRef} />
                        </div>
                        <button onClick={() => setShowMobileLog(false)} className="mt-2 flex-shrink-0 py-2 bg-red-600 text-white font-bold rounded-md">关闭</button>
                    </div>
                </div>
            )}
            {isMobile && mobileDetailCard && (
                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn" onClick={() => setMobileDetailCard(null)}>
                     <div className="w-48 h-64" onClick={e => e.stopPropagation()}>
                         <Card card={mobileDetailCard.card as CombatCard} stats={mobileDetailCard.stats} />
                     </div>
                 </div>
            )}
            <div className="md:hidden">
                {(mobileHoveredCardIndex !== null) && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none p-2 animate-fadeIn">
                        <MobileCard card={combatState.hand[mobileHoveredCardIndex]} stats={playerStats} />
                    </div>
                )}
            </div>
            <div className="flex-grow flex flex-col relative overflow-hidden">
                {combatState.phase === 'victory' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-4xl font-bold text-green-400 z-50">序列执行成功</div>}
                {combatState.phase === 'defeat' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-4xl font-bold text-red-500 z-50">系统崩溃</div>}
                {(combatState.phase === 'awaiting_discard' || combatState.phase === 'awaiting_return_to_deck') && (
                    <div className="absolute top-1/2 -translate-y-full left-0 right-0 text-center z-30 pointer-events-none">
                        <h2 className="text-3xl font-bold text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                            {combatState.phase === 'awaiting_discard' ? `选择 ${combatState.discardAction?.count} 张牌弃置` : `选择 ${combatState.returnToDeckAction?.count} 张牌返回牌库`}
                        </h2>
                    </div>
                )}
                 {isMobile && isTargeting && (
                    <div className="absolute bottom-[11rem] left-0 right-0 text-center p-2 bg-yellow-900/80 text-yellow-200 z-40 animate-fadeIn">
                        请在战场上选择一个目标
                    </div>
                )}

                <div className="absolute top-1/2 left-1/4 w-1/2 h-10 pointer-events-none z-30">
                     {playerFloatingTexts.map(ft => <FloatingText key={ft.id} text={ft.text} color={ft.color} />)}
                </div>
                
                <div className="flex-grow flex flex-col justify-center items-center relative px-2 overflow-hidden pt-8 md:pt-12">
                     <div className="w-full grid grid-cols-3 gap-2 place-items-end md:flex md:flex-row md:items-end md:justify-center md:gap-4">
                        {combatState.enemies.map(enemy => (
                            <EnemySprite
                                key={enemy.id} enemy={enemy}
                                actionCards={combatState.enemyActions[enemy.id] || null}
                                isSelected={selectedTargetId === enemy.id}
                                onSelect={() => handleTargetSelect(enemy.id)}
                                isTargeting={!!isTargeting && !isSelectionPhase}
                                isAttacking={combatState.attackingEnemyId === enemy.id}
                                currentActionIndex={combatState.activeActionIndex}
                                onActionIntentHover={handleActionIntentHover}
                                onActionIntentLeave={handleActionIntentLeave}
                                onActionIntentClick={handleActionIntentClick}
                            />
                        ))}
                        {[...playerConstructs, ...enemyConstructs].map(construct => (
                             <ConstructSprite 
                                key={construct.instanceId} construct={construct}
                                isSelected={selectedTargetId === construct.instanceId}
                                onSelect={() => handleTargetSelect(construct.instanceId)}
                                isTargeting={!!isTargeting && !isSelectionPhase}
                            />
                        ))}
                    </div>
                </div>

                <div 
                    className="hidden md:flex h-64 justify-center items-end flex-shrink-0"
                    style={{ pointerEvents: isTargeting && !isSelectionPhase ? 'none' : 'auto'}}
                    onMouseLeave={() => {
                        setHoveredCardIndex(null);
                        setHoveredCardInfo(null);
                    }}
                >
                    <div className={`flex justify-center items-end max-w-4xl mx-auto p-4 ${combatState.phase !== 'player_turn' ? 'opacity-50' : ''}`}>
                        {combatState.hand.map((card, index) => {
                            const isPlayable = isCardPlayable(card);
                            const isSelectedForAction = selectedCardInstanceId === card.instanceId;
                            let effectiveCost = card.costOverride ?? (card.id === 'spark' ? card.cost + combatState.sparkCostModifier : card.cost);
                             if (card.type === 'attack' && combatState.nextAttackCostModifier < 0) {
                                effectiveCost = Math.max(0, effectiveCost + combatState.nextAttackCostModifier);
                             }

                            return (
                                <div
                                    key={card.instanceId}
                                    style={getDesktopCardStyle(index)}
                                    className={`${(combatState.phase === 'awaiting_discard' || combatState.phase === 'awaiting_return_to_deck') ? 'cursor-pointer' : ''}`}
                                    onMouseEnter={() => {
                                        if (!isSelectionPhase) setHoveredCardIndex(index);
                                        setHoveredCardInfo({ card, stats: playerStats });
                                    }}
                                    onClick={() => (combatState.phase === 'awaiting_discard' || combatState.phase === 'awaiting_return_to_deck') ? handleSelectionClick(card.instanceId) : (isPlayable && handleCardClick(card))}
                                >
                                    <Card
                                        card={card} stats={playerStats}
                                        className={`${!isPlayable && !isSelectionPhase ? 'opacity-50 filter grayscale' : 'cursor-pointer'} ${isSelectedForAction ? 'ring-4 ring-yellow-400' : ''} ${selectedInstanceIds.includes(card.instanceId) ? 'ring-4 ring-yellow-400' : ''}`}
                                        effectiveCost={effectiveCost}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={`hidden md:flex h-24 bg-black/50 backdrop-blur-md border-t border-blue-500/20 items-center justify-between px-4 z-20 relative flex-shrink-0 ${playerAnimationClass}`}>
                    <div className="flex-1 flex items-center gap-3 md:gap-4 text-lg">
                        <div className="flex items-center gap-2" title="抽牌堆/弃牌堆">
                            <RectangleStackIcon className="w-6 h-6 text-gray-400" />
                            <span className="font-mono font-bold text-sm">{combatState.deck.length}/{combatState.discard.length}</span>
                        </div>
                         <div className="flex items-center gap-2 text-blue-300" title="潮汐计数">
                            <span className="font-bold text-sm">潮汐</span>
                            <span className="font-mono font-bold">{tideDisplay}/3</span>
                        </div>
                    </div>
                    <div className="flex-shrink-0 mx-2 md:mx-4 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-blue-300 font-mono font-bold text-xl mb-1">
                          <CpuChipIcon className="w-6 h-6" />
                          <span>{player.cp} / {playerStats.maxCp}</span>
                        </div>
                       {renderEndTurnButton()}
                    </div>
                    <div className="flex-1 flex justify-end items-center space-x-4 h-8">
                         {combatState.block > 0 && <div className="flex items-center gap-2 text-blue-400" title="格挡"><ShieldCheckIcon className="w-6 h-6" /><span className="font-mono font-bold">{combatState.block}</span></div>}
                         {player.charge > 0 && <div className="flex items-center gap-2 text-orange-400" title="充能"><span className="font-bold text-sm">⚡</span><span className="font-mono font-bold">{player.charge}</span></div>}
                         {player.statusEffects.map(effect => <StatusEffectIcon key={effect.id + effect.duration} effect={effect} parentAnimationClass={playerAnimationClass} />)}
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 w-64 bg-gray-900/70 border-l border-gray-700 hidden md:flex flex-col">
                <div className="flex-1 h-1/2 flex flex-col p-2 overflow-hidden">
                    <h2 className="text-center font-bold text-gray-400 border-b border-gray-600 pb-1 mb-2 flex-shrink-0">战斗记录</h2>
                    <div className="flex-grow overflow-y-auto pr-1 text-sm space-y-1">
                        {combatState.log.map(entry => (
                            <p key={entry.id} className={entry.color || 'text-gray-300'}>{entry.text}</p>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
                <div className="flex-none h-1/2 border-t border-gray-700 p-2 flex flex-col">
                    <h2 className="text-center font-bold text-gray-400 border-b border-gray-600 pb-1 mb-2 flex-shrink-0">卡牌详情</h2>
                    <div className="flex-grow flex items-center justify-center p-2">
                        {hoveredCardInfo ? (
                            <Card card={hoveredCardInfo.card as CombatCard} stats={hoveredCardInfo.stats} />
                        ) : (
                            <p className="text-gray-500 text-center text-sm p-4">[ 将鼠标悬停在卡牌上以查看详情 ]</p>
                        )}
                    </div>
                </div>
            </div>

            {isHandDrawerOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-30 drawer-backdrop" onClick={() => setIsHandDrawerOpen(false)}></div>}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${isHandDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-6rem)]'}`}>
                <div className={`h-24 bg-black/50 backdrop-blur-md border-t border-blue-500/20 flex items-center justify-between px-4 rounded-t-lg cursor-pointer relative ${playerAnimationClass}`} onClick={() => setIsHandDrawerOpen(!isHandDrawerOpen)}>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-500 rounded-full"></div>
                    <div className="flex-1 flex items-center gap-3 text-lg">
                        <div className="flex items-center gap-1" title="抽牌堆/弃牌堆">
                           <RectangleStackIcon className="w-5 h-5 text-gray-400" />
                            <span className="font-mono font-bold text-xs">{combatState.deck.length}/{combatState.discard.length}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-300" title="潮汐计数">
                           <span className="font-bold text-xs">潮汐</span>
                            <span className="font-mono font-bold text-xs">{tideDisplay}/3</span>
                        </div>
                    </div>
                    <div className="flex-shrink-0 mx-2 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-blue-300 font-mono font-bold text-base mb-1">
                           <CpuChipIcon className="w-5 h-5" />
                           <span>{player.cp}/{playerStats.maxCp}</span>
                        </div>
                        {renderEndTurnButton()}
                    </div>
                    <div className="flex-1 flex justify-end items-center space-x-1 h-8">
                         {player.statusEffects.map(effect => <StatusEffectIcon key={effect.id + effect.duration} effect={effect} parentAnimationClass={playerAnimationClass} />)}
                    </div>
                </div>
                <div 
                    className="h-48 bg-gray-900/80 flex justify-center items-end pb-4 overflow-x-auto px-4" 
                    onMouseLeave={() => setMobileHoveredCardIndex(null)}
                >
                     {combatState.hand.map((card, index) => {
                         const isPlayable = isCardPlayable(card);
                         let effectiveCost = card.costOverride ?? (card.id === 'spark' ? card.cost + combatState.sparkCostModifier : card.cost);
                         if (card.type === 'attack' && combatState.nextAttackCostModifier < 0) {
                            effectiveCost = Math.max(0, effectiveCost + combatState.nextAttackCostModifier);
                         }
                        return (
                            <div
                                key={card.instanceId}
                                className="flex-shrink-0"
                                style={getMobileCardStyle(index)}
                                onMouseEnter={() => {
                                    setMobileHoveredCardIndex(index);
                                    setHoveredCardInfo({ card, stats: playerStats });
                                }}
                                onClick={() => {
                                    if (isSelectionPhase) handleSelectionClick(card.instanceId);
                                    else if (isPlayable) handleCardClick(card);
                                }}
                            >
                                <MobileCard card={card} stats={playerStats} effectiveCost={effectiveCost} className={`${!isPlayable && !isSelectionPhase ? 'opacity-50 filter grayscale' : 'cursor-pointer'} ${selectedCardInstanceId === card.instanceId || selectedInstanceIds.includes(card.instanceId) || mobileSelectedCardId === card.instanceId ? 'ring-2 ring-yellow-400' : ''}`} />
                            </div>
                        )
                    })}
                </div>
            </div>

            <CardChoiceOverlay />
            <EffectChoiceOverlay />
        </div>
    );
};

export default CombatView;