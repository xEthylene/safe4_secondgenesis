

import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GameStatus, Card as CardType, CardRarity, PlayerStats } from '../types';
import { CARDS } from '../constants';
import TitleScreen from '../components/views/TitleScreen';
import HubView from '../components/views/HubView';
import MissionBriefingView from '../components/views/MissionBriefingView';
import DialogueView from '../components/views/DialogueView';
import CombatView from '../components/views/CombatView';
import MissionVictoryView from '../components/views/MissionVictoryView';
import PlayerStatusDisplay from '../components/PlayerStatusDisplay';
import ChoiceView from '../components/views/ChoiceView';
import { getDynamicCardDescription } from '../utils/cardUtils';
import { getEffectivePlayerStats } from '../utils/playerUtils';

const getRarityColorStyle = (rarity: CardRarity) => {
    switch (rarity) {
        case CardRarity.COMMON: return 'border-gray-500 bg-gray-800';
        case CardRarity.RARE: return 'border-blue-500 bg-blue-900';
        case CardRarity.EPIC: return 'border-purple-600 bg-purple-900';
        default: return 'border-gray-700 bg-gray-800';
    }
};

const Card: React.FC<{ card: CardType; stats?: Partial<PlayerStats>; }> = ({ card, stats }) => {
    const description = stats ? getDynamicCardDescription(card, stats) : card.description;
    return (
        <div
            className={`w-full h-full border-4 ${getRarityColorStyle(card.rarity)} rounded-lg p-3 flex flex-col justify-between text-left shadow-lg`}
        >
            <div>
                <h3 className="font-bold text-base text-white">{card.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{card.rarity.toLowerCase()} {card.type}</p>
            </div>
            <p className="text-sm text-gray-200 flex-grow mt-2">{description}</p>
            <p className="text-lg font-bold text-cyan-400 self-end">{card.cost === 0 && card.effect.overclockCost ? `${card.effect.overclockCost} HP` : `${card.cost} CP`}</p>
        </div>
    )
};


const CardRevealOverlay: React.FC = () => {
    const { state, dispatch } = useGame();
    const { newlyAcquiredItems, customCards, player, customEquipment } = state;
    const allCards = { ...CARDS, ...customCards };
    const playerStats = getEffectivePlayerStats(player, customEquipment);
  
    const [revealed, setRevealed] = useState<boolean[]>(newlyAcquiredItems ? new Array(newlyAcquiredItems.length).fill(false) : []);
  
    if (!newlyAcquiredItems || newlyAcquiredItems.length === 0) {
      return null;
    }
  
    const handleCardClick = (index: number) => {
      if (revealed[index]) return;
      const newRevealed = [...revealed];
      newRevealed[index] = true;
      setRevealed(newRevealed);
    };

    const handleRevealAll = () => {
        setRevealed(new Array(newlyAcquiredItems.length).fill(true));
    };
  
    const allRevealed = revealed.every(r => r);
  
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 animate-fadeIn">
        <h2 className="text-4xl font-bold text-yellow-300 mb-8 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]">获得新卡片！</h2>
        <div className="flex flex-wrap justify-center gap-8">
          {newlyAcquiredItems.map((cardId, index) => {
             const card = allCards[cardId];
             if (!card) return null;
             return (
                <div key={index} className="card-reveal-container w-48 h-64 cursor-pointer" onClick={() => handleCardClick(index)}>
                  <div className={`card-flipper ${revealed[index] ? 'is-flipped' : ''}`}>
                    {/* Back Face (Visible initially) */}
                    <div className="card-face bg-gray-700 border-4 border-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <div className="w-20 h-20 rounded-full bg-cyan-800/50 border-2 border-cyan-400 flex items-center justify-center text-cyan-200 text-3xl font-bold">
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
        <div className="mt-12 flex items-center gap-4">
            {!allRevealed && (
              <button
                onClick={handleRevealAll}
                className="px-8 py-3 bg-yellow-600 text-white font-bold rounded-md hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105 animate-fadeIn"
              >
                [ 一键翻牌 ]
              </button>
            )}
            {allRevealed && (
              <button
                onClick={() => dispatch({ type: 'CLEAR_NEW_ITEMS' })}
                className="px-8 py-3 bg-cyan-500 text-gray-900 font-bold rounded-md hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105 animate-fadeIn"
              >
                [ 继续 ]
              </button>
            )}
        </div>
      </div>
    );
};


const GameScreen: React.FC = () => {
  const { state, dispatch } = useGame();

  const renderContent = () => {
    switch (state.status) {
      case GameStatus.TITLE_SCREEN:
        return <TitleScreen />;
      case GameStatus.HUB:
        return <HubView />;
      case GameStatus.MISSION_BRIEFING:
        return <MissionBriefingView />;
      case GameStatus.IN_MISSION_DIALOGUE:
        return <DialogueView />;
      case GameStatus.IN_MISSION_COMBAT:
        return <CombatView />;
      case GameStatus.MISSION_VICTORY:
        return <MissionVictoryView />;
      case GameStatus.CHOICE_SCREEN:
        return <ChoiceView />;
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

  return (
    <div className="h-full flex flex-col relative text-gray-200 bg-black/40">
      {state.status !== GameStatus.TITLE_SCREEN && <PlayerStatusDisplay />}
      <div className="flex-grow overflow-y-auto p-4 md:p-8">
        {renderContent()}
      </div>
      {state.newlyAcquiredItems && state.newlyAcquiredItems.length > 0 && <CardRevealOverlay />}
    </div>
  );
};

export default GameScreen;
