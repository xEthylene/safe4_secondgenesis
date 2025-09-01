import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { GameStatus, Card as CardType, CardRarity, PlayerStats, Equipment } from '../types';
import { CARDS, EQUIPMENT } from '../constants';
import TitleScreen from '../components/views/TitleScreen';
import HubView from '../components/views/HubView';
import MissionBriefingView from '../components/views/MissionBriefingView';
import DialogueView from '../components/views/DialogueView';
import CombatView from '../components/views/CombatView';
import MissionVictoryView from '../components/views/MissionVictoryView';
import PlayerStatusDisplay from '../components/PlayerStatusDisplay';
import ChoiceView from '../components/views/ChoiceView';
import SupplyStopView from '../components/views/SupplyStopView';
import CombatStartView from '../components/views/CombatStartView';
import { getDynamicCardDescription } from '../utils/cardUtils';
import { getEffectivePlayerStats } from '../utils/playerUtils';

const KEYWORDS_TO_HIGHLIGHT = [
    '消耗', '无限', '递增', '充能', '烧伤', '流血', '中毒', '弃牌', 
    '衍生', '反击', '过载', '贯穿', '连锁', '强化', '能力', '终幕', 
    '抉择', '溢流', '状态', '构装体', '弱化', '易伤', '束缚', '护盾', 
    '过热', '歼灭模式', '蓄能', '烈焰焚烧', '狂热计算', '限制解除', 
    '薪火', '痛苦回响', '开幕仪典', '再校准协议', '淬毒'
];

const renderHighlightedText = (text: string): React.ReactNode => {
    if (!text) return text;
    const keywordRegex = new RegExp(`(\\[[^\\]]+\\]|${KEYWORDS_TO_HIGHLIGHT.join('|')})`, 'g');
    const parts = text.split(keywordRegex);

    return (
        <>
            {parts.map((part, index) => {
                if (!part) return null;
                const isBracketed = part.startsWith('[') && part.endsWith(']');
                const cleanPart = isBracketed ? part.substring(1, part.length - 1) : part;

                if (KEYWORDS_TO_HIGHLIGHT.includes(cleanPart)) {
                    return <strong key={index} className="font-bold text-yellow-300">{part}</strong>;
                }
                return part;
            })}
        </>
    );
};


const getRarityColorStyle = (rarity: CardRarity, bg: boolean = true) => {
    switch (rarity) {
        case CardRarity.COMMON: return `border-gray-500 ${bg ? 'bg-gray-800' : ''}`;
        case CardRarity.RARE: return `border-blue-500 ${bg ? 'bg-blue-900' : ''}`;
        case CardRarity.EPIC: return `border-purple-600 ${bg ? 'bg-purple-900' : ''}`;
        default: return `border-gray-700 ${bg ? 'bg-gray-800' : ''}`;
    }
};

const getRarityTextColor = (rarity: CardRarity) => {
    switch (rarity) {
        case CardRarity.COMMON: return 'text-gray-300';
        case CardRarity.RARE: return 'text-blue-400';
        case CardRarity.EPIC: return 'text-purple-500';
        default: return 'text-white';
    }
};

const Card: React.FC<{ card: CardType; stats?: Partial<PlayerStats>; }> = ({ card, stats }) => {
    const description = stats ? getDynamicCardDescription(card, stats) : card.description;
    return (
        <div
            className={`w-full h-full border-4 ${getRarityColorStyle(card.rarity)} rounded-lg p-3 flex flex-col justify-between text-left shadow-lg`}
        >
            <div>
                <h3 className="font-bold text-sm md:text-base text-white">{card.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{card.rarity.toLowerCase()} {card.type}</p>
            </div>
            <p className="text-xs md:text-sm text-gray-200 flex-grow mt-2 overflow-y-auto whitespace-pre-wrap">{renderHighlightedText(description)}</p>
            <p className="text-base md:text-lg font-bold text-cyan-400 self-end">{card.cost === 0 && card.effect.overclockCost ? `${card.effect.overclockCost} HP` : `${card.cost} CP`}</p>
        </div>
    )
};

const EquipmentCard: React.FC<{ item: Equipment }> = ({ item }) => {
    return (
        <div className={`w-full h-full border-4 ${getRarityColorStyle(item.rarity)} rounded-lg p-3 flex flex-col text-left shadow-lg`}>
            <div>
                <h3 className={`font-bold text-base ${getRarityTextColor(item.rarity)}`}>{item.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{item.rarity.toLowerCase()} {item.slot}</p>
            </div>
            <div className="my-2 border-t border-gray-600"/>
            <p className="text-sm text-gray-300">{item.description}</p>
            <div className="my-2 border-t border-gray-600"/>
            <ul className="space-y-1 text-sm flex-grow">
                {item.affixes.map((affix, i) => (
                    <li key={i} className="text-blue-300">✧ {affix.description}</li>
                ))}
            </ul>
        </div>
    )
};


const CardRevealOverlay: React.FC = () => {
    const { state, dispatch } = useGame();
    const { newlyAcquiredCardIds, customCards, player, customEquipment } = state;
    // FIX: Use a function to get the most up-to-date card data.
    const getAllCards = () => ({ ...CARDS, ...customCards });
    const playerStats = getEffectivePlayerStats(player, customEquipment);
  
    const [revealed, setRevealed] = useState<boolean[]>(newlyAcquiredCardIds ? new Array(newlyAcquiredCardIds.length).fill(false) : []);
  
    if (!newlyAcquiredCardIds || newlyAcquiredCardIds.length === 0) {
      return null;
    }
  
    const handleCardClick = (index: number) => {
      if (revealed[index]) return;
      const newRevealed = [...revealed];
      newRevealed[index] = true;
      setRevealed(newRevealed);
    };

    const handleRevealAll = () => {
        setRevealed(new Array(newlyAcquiredCardIds.length).fill(true));
    };
  
    const allRevealed = revealed.every(r => r);
  
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 md:p-8 animate-fadeIn">
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-300 mb-6 md:mb-8 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]">获得新卡片！</h2>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-h-[70vh] overflow-y-auto p-4">
          {newlyAcquiredCardIds.map((cardId, index) => {
             const card = getAllCards()[cardId];
             if (!card) return null;
             return (
                <div key={index} className="card-reveal-container w-36 h-52 md:w-48 md:h-64 cursor-pointer" onClick={() => handleCardClick(index)}>
                  <div className={`card-flipper ${revealed[index] ? 'is-flipped' : ''}`}>
                    {/* Back Face (Visible initially) */}
                    <div className="card-face bg-gray-700 border-4 border-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-cyan-800/50 border-2 border-cyan-400 flex items-center justify-center text-cyan-200 text-2xl md:text-3xl font-bold">
                        S4
                      </div>
                    </div>
                    {/* Front Face (The actual card, visible after flip) */}
                    <div className="card-face card-back">
                      <Card card={card} stats={playerStats} />
                    </div>
                  </div>
                </div>
            )
          })}
        </div>
        <div className="mt-8 md:mt-12 flex items-center gap-4">
            {!allRevealed && (
              <button
                onClick={handleRevealAll}
                className="px-6 py-2 md:px-8 md:py-3 bg-yellow-600 text-white font-bold rounded-md hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105 animate-fadeIn"
              >
                [ 一键翻牌 ]
              </button>
            )}
            {allRevealed && (
              <button
                onClick={() => dispatch({ type: 'CLEAR_NEW_CARDS' })}
                className="px-6 py-2 md:px-8 md:py-3 bg-cyan-500 text-gray-900 font-bold rounded-md hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105 animate-fadeIn"
              >
                [ 继续 ]
              </button>
            )}
        </div>
      </div>
    );
};

const EquipmentRevealOverlay: React.FC = () => {
    const { state, dispatch } = useGame();
    const { newlyAcquiredEquipmentIds, customEquipment } = state;
    // FIX: Use a function to get the most up-to-date equipment data.
    const getAllEquipment = () => ({ ...EQUIPMENT, ...customEquipment });

    if (!newlyAcquiredEquipmentIds || newlyAcquiredEquipmentIds.length === 0) {
        return null;
    }

    const item = getAllEquipment()[newlyAcquiredEquipmentIds[0]];
    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
            <h2 className="text-4xl font-bold text-yellow-300 mb-8 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]">获得新装备！</h2>
            <div className="w-72 h-96">
                <EquipmentCard item={item} />
            </div>
            <button
                onClick={() => dispatch({ type: 'CLEAR_NEW_EQUIPMENT' })}
                className="mt-12 px-8 py-3 bg-cyan-500 text-gray-900 font-bold rounded-md hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105"
            >
                [ 继续 ]
            </button>
        </div>
    );
};


const GameScreen: React.FC = () => {
    const { state, dispatch } = useGame();
    
    const renderContentForStatus = (status: GameStatus) => {
        switch (status) {
            case GameStatus.TITLE_SCREEN: return <TitleScreen />;
            case GameStatus.HUB: return <HubView />;
            case GameStatus.MISSION_BRIEFING: return <MissionBriefingView />;
            case GameStatus.IN_MISSION_DIALOGUE: return <DialogueView />;
            case GameStatus.COMBAT_START: return <CombatStartView />;
            case GameStatus.IN_MISSION_COMBAT: return <CombatView />;
            case GameStatus.MISSION_VICTORY: return <MissionVictoryView />;
            case GameStatus.CHOICE_SCREEN: return <ChoiceView />;
            case GameStatus.SUPPLY_STOP: return <SupplyStopView />;
            case GameStatus.GAME_COMPLETE:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <h1 className="text-5xl font-bold text-cyan-400">结局</h1>
                        <p className="text-xl mt-4">感谢您的游玩。</p>
                        <button
                            onClick={() => dispatch({ type: 'RESTART_GAME' })}
                            className="mt-12 px-8 py-3 bg-gray-700 text-white font-bold rounded-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                        >
                            [ 重新开始 ]
                        </button>
                    </div>
                );
            case GameStatus.GAME_OVER:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-red-500">
                        <h1 className="text-5xl font-bold">意识连接已断开</h1>
                        <p className="text-xl mt-4">任务失败。</p>
                        {state.sedimentGainedOnDefeat && state.sedimentGainedOnDefeat > 0 && (
                            <p className="text-lg mt-4 text-purple-300 animate-fadeIn">
                                你回收了 {state.sedimentGainedOnDefeat} 点梦境沉淀。
                            </p>
                        )}
                        {state.missionStartState ? (
                            <button
                                onClick={() => dispatch({ type: 'RESTART_FROM_CHECKPOINT' })}
                                className="mt-12 px-8 py-3 bg-yellow-600 text-white font-bold rounded-md hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105"
                            >
                                [ 从任务开始时重来 ]
                            </button>
                        ) : (
                            <button
                                onClick={() => dispatch({ type: 'RESTART_GAME' })}
                                className="mt-12 px-8 py-3 bg-gray-700 text-white font-bold rounded-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                            >
                                [ 重新开始 ]
                            </button>
                        )}
                    </div>
                );
            default:
                return <div>Unknown game state</div>;
        }
    };

    const [displayedContent, setDisplayedContent] = useState(() => renderContentForStatus(state.status));
    const [animationClass, setAnimationClass] = useState('animate-fadeIn');
    const prevStatusRef = useRef(state.status);

    useEffect(() => {
        if (prevStatusRef.current !== state.status) {
            setAnimationClass('animate-fadeOut');
            const timer = setTimeout(() => {
                setDisplayedContent(renderContentForStatus(state.status));
                setAnimationClass('animate-fadeIn');
                prevStatusRef.current = state.status;
            }, 300); // Must match fadeOut animation duration

            return () => clearTimeout(timer);
        }
    }, [state.status]);

    return (
        <div className="h-full flex flex-col relative text-gray-200 bg-black/40">
            {state.status !== GameStatus.TITLE_SCREEN && <PlayerStatusDisplay />}
            <div className={`flex-grow overflow-y-auto ${animationClass}`}>
                {displayedContent}
            </div>
            {state.newlyAcquiredCardIds && state.newlyAcquiredCardIds.length > 0 && <CardRevealOverlay />}
            {state.newlyAcquiredEquipmentIds && state.newlyAcquiredEquipmentIds.length > 0 && <EquipmentRevealOverlay />}
        </div>
    );
};

export default GameScreen;