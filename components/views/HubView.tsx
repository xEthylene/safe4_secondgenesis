





import React, { useState, useMemo } from 'react';
import { useGame } from '../../contexts/GameContext';
import { EQUIPMENT, CARDS, MISSIONS, SYNC_COSTS, DECK_SIZE, CARDS as ALL_CARDS_SOURCE } from '../../constants';
import { Mission, EquipmentSlot, Card, CardRarity, Equipment } from '../../types';
import { getEffectivePlayerStats } from '../../utils/playerUtils';
import { Cog6ToothIcon, CubeTransparentIcon, ShieldCheckIcon, SparklesIcon, RectangleStackIcon, ArrowPathIcon, ExclamationTriangleIcon, BookOpenIcon, ComputerDesktopIcon, AdjustmentsHorizontalIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { getDynamicCardDescription } from '../../utils/cardUtils';
import RulebookView from './RulebookView';

const getRarityColor = (rarity: CardRarity) => {
    switch (rarity) {
        case CardRarity.COMMON: return 'text-gray-300';
        case CardRarity.RARE: return 'text-blue-400';
        case CardRarity.EPIC: return 'text-purple-500';
        default: return 'text-white';
    }
};
const getRarityBorder = (rarity: CardRarity) => {
    switch (rarity) {
        case CardRarity.COMMON: return 'border-gray-600';
        case CardRarity.RARE: return 'border-blue-500';
        case CardRarity.EPIC: return 'border-purple-600';
        default: return 'border-gray-700';
    }
};

const TABS = [
  { id: 'missions', name: '任务', icon: CubeTransparentIcon },
  { id: 'deck', name: '卡组编辑', icon: RectangleStackIcon },
  { id: 'loadout', name: '代行者整备', icon: Cog6ToothIcon },
  { id: 'console', name: '主控台', icon: ComputerDesktopIcon },
];

const KeywordFilterModal: React.FC<{
    allKeywords: string[];
    selectedKeyword: string;
    onSelect: (keyword: string) => void;
    onClear: () => void;
    onClose: () => void;
}> = ({ allKeywords, selectedKeyword, onSelect, onClear, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-2xl bg-gray-900 border-2 border-cyan-500/30 rounded-lg shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-cyan-400">筛选关键词</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="flex flex-wrap gap-3">
                        {allKeywords.map(kw => (
                            <button
                                key={kw}
                                onClick={() => onSelect(kw)}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                                    selectedKeyword === kw ? 'bg-cyan-500 text-gray-900 ring-2 ring-offset-2 ring-offset-gray-900 ring-cyan-400' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                }`}
                            >
                                {kw}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={onClear} className="px-5 py-2 bg-red-700 text-white font-bold rounded-md hover:bg-red-600 transition-colors">
                        清除筛选
                    </button>
                </div>
            </div>
        </div>
    );
};


const HubView: React.FC = () => {
    const { state, dispatch } = useGame();
    const { player, customEquipment, customCards } = state;
    
    const [activeTab, setActiveTab] = useState('missions');
    const [activeTooltip, setActiveTooltip] = useState<{ content: React.ReactNode; top: number; left: number; type: 'item' | 'card'; } | null>(null);
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    const [showRulebook, setShowRulebook] = useState(false);
    
    // Deck Editor State
    const [selectedDeckId, setSelectedDeckId] = useState(player.activeDeckId || '1');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedKeyword, setSelectedKeyword] = useState('');
    const [showKeywordModal, setShowKeywordModal] = useState(false);

    const effectiveStats = getEffectivePlayerStats(player, customEquipment);
    const allEquipmentSource = { ...EQUIPMENT, ...customEquipment };
    const allCardsSource = { ...CARDS, ...customCards };
    const isDeckValid = player.decks[player.activeDeckId]?.length === DECK_SIZE;

    // Memoized calculations for deck editor
    const allKeywords = useMemo(() => {
        const keywords = new Set<string>();
        Object.values(ALL_CARDS_SOURCE).forEach(card => card.keywords?.forEach(kw => keywords.add(kw)));
        return Array.from(keywords).sort();
    }, []);

    const cardCollectionCounts = useMemo(() => player.cardCollection.reduce((acc, cardId) => {
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [player.cardCollection]);
    
    const selectedDeckCardCounts = useMemo(() => (player.decks[selectedDeckId] || []).reduce((acc, cardId) => {
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [player.decks, selectedDeckId]);

    const filteredCollection = useMemo(() => {
        return Object.entries(cardCollectionCounts).filter(([cardId]) => {
            const card = allCardsSource[cardId];
            if (!card) return false;
            const nameMatch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
            const keywordMatch = !selectedKeyword || (card.keywords && card.keywords.includes(selectedKeyword));
            return nameMatch && keywordMatch;
        });
    }, [searchTerm, selectedKeyword, cardCollectionCounts, allCardsSource]);
        
    const handleMouseLeave = () => setActiveTooltip(null);

    const handleItemMouseEnter = (e: React.MouseEvent<HTMLDivElement>, itemId: string) => {
        const item = allEquipmentSource[itemId];
        if (!item) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const content = (
            <>
                <p className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</p>
                <p className="my-1 text-gray-300">{item.description}</p>
                <div className="my-2 border-t border-gray-600"/>
                <ul className="space-y-1">
                    {item.affixes.map((affix, i) => <li key={i} className="text-blue-300">✧ {affix.description}</li>)}
                </ul>
            </>
        );
        setActiveTooltip({ content, top: rect.top, left: rect.left + rect.width / 2, type: 'item' });
    };

    const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>, cardId: string) => {
        const card = allCardsSource[cardId];
        if (!card) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const description = getDynamicCardDescription(card, effectiveStats);
        const content = (
            <>
                <p className={`font-bold ${getRarityColor(card.rarity)}`}>{card.name} <span className="text-cyan-400">({card.cost} CP)</span></p>
                <p className="text-xs text-gray-400 capitalize">{card.rarity.toLowerCase()} {card.type}</p>
                <p className="my-1 whitespace-pre-wrap">{description}</p>
            </>
        );
        setActiveTooltip({ content, top: rect.top, left: rect.right, type: 'card' });
    };
    
    const handleConfirmRestart = () => {
        dispatch({ type: 'RESTART_GAME' });
        setShowRestartConfirm(false);
    };

    const MissionCard = ({ mission }: { mission: Mission }) => (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-cyan-500 hover:bg-gray-800 transition-all flex flex-col">
            <h3 className={`text-xl font-bold ${mission.type === 'main' ? 'text-cyan-400' : 'text-purple-400'}`}>{mission.title}</h3>
            <p className="text-sm text-gray-400 mt-1">签发单位: {mission.issuer}</p>
            <p className="text-sm text-gray-500 mt-2 h-12 overflow-hidden flex-grow">{mission.description[0]}</p>
            <button
                onClick={() => dispatch({ type: 'SELECT_MISSION', payload: mission.id })}
                disabled={!isDeckValid}
                className="mt-4 w-full px-4 py-2 bg-gray-700 text-white font-semibold rounded-md enabled:hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform active:scale-95"
            >
                查阅简报
            </button>
        </div>
    );
    
    const EquipmentSlotDisplay: React.FC<{ slot: EquipmentSlot, name: string }> = ({ slot, name }) => {
        const itemId = player.equipment[slot];
        const item = itemId ? allEquipmentSource[itemId] : null;
        
        return (
            <div className="bg-gray-900/50 p-3 rounded-lg">
                <p className="text-sm text-gray-400">{name}</p>
                {item ? (
                    <div 
                        className="flex items-center justify-between"
                        onMouseEnter={(e) => handleItemMouseEnter(e, item.id)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span className={`font-semibold ${getRarityColor(item.rarity)}`}>{item.name}</span>
                        <button 
                            onClick={() => dispatch({ type: 'UNEQUIP_ITEM', payload: { slot } })}
                            className="text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded transition-transform transform active:scale-95">卸下</button>
                    </div>
                ) : (
                    <p className="text-gray-500">无</p>
                )}
            </div>
        );
    };

    const renderTabContent = () => {
        switch(activeTab) {
            case 'missions':
                const availableMissions = Object.values(MISSIONS).filter(mission => {
                    if (state.player.completedMissions.includes(mission.id)) return false;
                    if (mission.id === 'prologue') return false;
                    const prologueDone = state.player.completedMissions.includes('prologue');
                    if (!mission.requires || mission.requires.length === 0) return prologueDone;
                    return mission.requires.every(reqId => state.player.completedMissions.includes(reqId));
                });
                const missionsByChapter: Record<number, { main: Mission[], secondary: Mission[] }> = {};
                availableMissions.forEach(mission => {
                    const chapter = mission.chapter || 0;
                    if (!missionsByChapter[chapter]) missionsByChapter[chapter] = { main: [], secondary: [] };
                    if (mission.type === 'main') missionsByChapter[chapter].main.push(mission);
                    else missionsByChapter[chapter].secondary.push(mission);
                });
                return (
                    <div className="animate-fadeIn">
                        {!isDeckValid && (
                            <div className="mb-4 p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg text-yellow-200 flex items-center justify-center gap-2">
                                <ExclamationTriangleIcon className="w-6 h-6" />
                                <p className="font-bold">激活的卡组必须正好为 {DECK_SIZE} 张才能开始任务。</p>
                            </div>
                        )}
                        {Object.keys(missionsByChapter).length > 0 ? (
                            Object.keys(missionsByChapter).sort((a,b) => Number(a) - Number(b)).map(chapterNum => (
                                <div key={chapterNum} className="mb-10">
                                    <h2 className="text-3xl font-semibold mb-6 text-gray-400 text-center">--- 第 {chapterNum} 章 ---</h2>
                                    {missionsByChapter[Number(chapterNum)].main.length > 0 && (
                                        <>
                                            <h3 className="text-2xl font-semibold border-b-2 border-cyan-500/50 pb-2 text-cyan-300 flex items-center gap-2 mb-4"><CubeTransparentIcon className="w-6 h-6" />主要任务</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {missionsByChapter[Number(chapterNum)].main.map(m => <MissionCard key={m.id} mission={m} />)}
                                            </div>
                                        </>
                                    )}
                                    {missionsByChapter[Number(chapterNum)].secondary.length > 0 && (
                                        <div className="mt-10">
                                            <h3 className="text-2xl font-semibold border-b-2 border-purple-500/50 pb-2 text-purple-300 flex items-center gap-2 mb-4"><ShieldCheckIcon className="w-6 h-6" />次要任务</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {missionsByChapter[Number(chapterNum)].secondary.map(m => <MissionCard key={m.id} mission={m} />)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-10">
                                <p>所有可用任务已完成。感谢您的游玩！</p>
                            </div>
                        )}
                    </div>
                );

            case 'deck':
                 return (
                    <div className="animate-fadeIn">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {['1', '2', '3'].map(id => (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedDeckId(id)}
                                        className={`px-4 py-2 rounded-md font-semibold transition-colors ${selectedDeckId === id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                    >
                                        卡组 {id}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => dispatch({ type: 'SET_ACTIVE_DECK', payload: { deckId: selectedDeckId }})}
                                disabled={player.activeDeckId === selectedDeckId}
                                className="px-4 py-2 bg-green-700 text-white font-bold rounded-md enabled:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {player.activeDeckId === selectedDeckId ? '已激活' : '设为激活'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-bold text-center mb-2">当前卡组 ({player.decks[selectedDeckId]?.length || 0}/{DECK_SIZE})</h3>
                                <div className="bg-gray-900/50 p-2 rounded-lg h-96 overflow-y-auto space-y-2">
                                    {(player.decks[selectedDeckId] || []).map((cardId, index) => {
                                        const card = allCardsSource[cardId];
                                        if (!card) return null;
                                        return (
                                            <div 
                                                key={`${cardId}-${index}`} 
                                                className="bg-gray-800 p-2 rounded flex items-center justify-between"
                                                onMouseEnter={(e) => handleCardMouseEnter(e, cardId)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <span className={`text-sm font-semibold ${getRarityColor(card.rarity)}`}>{card.name}</span>
                                                <button onClick={() => dispatch({ type: 'REMOVE_FROM_DECK', payload: { cardId, deckId: selectedDeckId, cardIndex: index } })} className="text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded transition-transform transform active:scale-95">移除</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-center mb-2">卡牌收藏 ({player.cardCollection.length})</h3>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text"
                                        placeholder="搜索名称..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-grow bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                     <button
                                        onClick={() => setShowKeywordModal(true)}
                                        className="flex-shrink-0 flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors"
                                    >
                                        <FunnelIcon className="w-4 h-4" />
                                        {selectedKeyword || '关键词'}
                                    </button>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded-lg h-[22rem] overflow-y-auto space-y-2">
                                    {filteredCollection.map(([cardId, count]) => {
                                        const card = allCardsSource[cardId];
                                        if (!card) return null;
                                        const isDeckFull = (player.decks[selectedDeckId] || []).length >= DECK_SIZE;
                                        const inDeckCount = selectedDeckCardCounts[cardId] || 0;
                                        const canAdd = inDeckCount < count;
                                        
                                        let totalDeckCount = 0;
                                        Object.values(player.decks).forEach(deck => {
                                            totalDeckCount += deck.filter(c => c === cardId).length;
                                        });
                                        const canDecompose = count > totalDeckCount;

                                        return (
                                            <div key={cardId} className="bg-gray-800 p-2 rounded flex items-center justify-between" onMouseEnter={(e) => handleCardMouseEnter(e, cardId)} onMouseLeave={handleMouseLeave}>
                                                <span className={`text-sm font-semibold ${getRarityColor(card.rarity)}`}>{card.name} <span className="text-gray-400 font-mono text-xs">x{count}</span></span>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => dispatch({ type: 'ADD_TO_DECK', payload: { cardId, deckId: selectedDeckId } })} disabled={isDeckFull || !canAdd} className="text-xs bg-blue-800 enabled:hover:bg-blue-700 px-2 py-1 rounded disabled:opacity-50 transition-transform transform active:scale-95">添加</button>
                                                    <button onClick={() => dispatch({ type: 'DECOMPOSE_CARD', payload: { cardId } })} disabled={!canDecompose} className="text-xs bg-gray-600 enabled:hover:bg-gray-500 px-2 py-1 rounded disabled:opacity-50 transition-transform transform active:scale-95">分解</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'loadout':
                const rarityOrder: Record<CardRarity, number> = { [CardRarity.EPIC]: 3, [CardRarity.RARE]: 2, [CardRarity.COMMON]: 1 };
                const sortedInventory = [...player.inventory].sort((aId, bId) => {
                    const itemA = allEquipmentSource[aId];
                    const itemB = allEquipmentSource[bId];
                    if (!itemA || !itemB) return 0;
                    return (rarityOrder[itemB.rarity] || 0) - (rarityOrder[itemA.rarity] || 0);
                });

                return (
                     <div className="bg-black/20 rounded-lg p-6 animate-fadeIn">
                         <h2 className="text-2xl font-semibold border-b-2 border-green-500/50 pb-2 mb-4 text-green-300 flex items-center gap-2"><Cog6ToothIcon className="w-6 h-6" />代行者整备</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <EquipmentSlotDisplay slot="weapon" name="武器" />
                                <EquipmentSlotDisplay slot="equipment" name="装备" />
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded-lg flex flex-col">
                                <h3 className="text-center font-bold text-gray-300 mb-2">库存</h3>
                                <div className="flex-grow overflow-y-auto pr-2 max-h-48 md:max-h-full">
                                     {sortedInventory.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {sortedInventory.map(itemId => {
                                                const item = allEquipmentSource[itemId];
                                                if (!item) return null;
                                                return (
                                                <div key={itemId} className={`bg-gray-800 p-2 rounded flex flex-col justify-between border-l-4 ${getRarityBorder(item.rarity)}`} onMouseEnter={(e) => handleItemMouseEnter(e, itemId)} onMouseLeave={handleMouseLeave}>
                                                    <span className={`text-sm font-semibold ${getRarityColor(item.rarity)}`}>{item.name}</span>
                                                    <div className="flex items-center gap-2 mt-2 self-end">
                                                        <button onClick={() => dispatch({ type: 'EQUIP_ITEM', payload: { itemId } })} className="text-xs bg-green-800 hover:bg-green-700 px-2 py-1 rounded transition-transform transform active:scale-95">装备</button>
                                                        <button onClick={() => dispatch({ type: 'DECOMPOSE_ITEM', payload: { itemId } })} className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded transition-transform transform active:scale-95">分解</button>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                     ) : <p className="text-center text-gray-500 text-sm mt-4">库存为空</p>}
                                </div>
                            </div>
                         </div>
                    </div>
                );
            case 'console':
                return (
                    <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="bg-black/20 rounded-lg p-6 mb-8">
                                <h2 className="text-2xl font-semibold border-b-2 border-yellow-500/50 pb-2 mb-4 text-yellow-300 flex items-center gap-2"><SparklesIcon className="w-6 h-6" />同步调整</h2>
                                <p className="text-gray-400 mb-4 text-sm">消耗梦境沉淀，随机生成符合当前阶段强度的装备或卡片。</p>
                                <div className="grid grid-cols-1 gap-4">
                                    <button onClick={() => dispatch({ type: 'SYNCHRONIZE_WEAPON' })} disabled={player.dreamSediment < SYNC_COSTS.weapon} className="p-3 bg-yellow-600 text-white font-bold rounded-md enabled:hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform active:scale-95">同步武器 <span className="block text-xs font-normal">({SYNC_COSTS.weapon}沉淀)</span></button>
                                    <button onClick={() => dispatch({ type: 'SYNCHRONIZE_EQUIPMENT' })} disabled={player.dreamSediment < SYNC_COSTS.equipment} className="p-3 bg-yellow-600 text-white font-bold rounded-md enabled:hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform active:scale-95">同步装备 <span className="block text-xs font-normal">({SYNC_COSTS.equipment}沉淀)</span></button>
                                    <button onClick={() => dispatch({ type: 'SYNCHRONIZE_CARD' })} disabled={player.dreamSediment < SYNC_COSTS.card} className="p-3 bg-yellow-600 text-white font-bold rounded-md enabled:hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform active:scale-95">同步卡片 <span className="block text-xs font-normal">({SYNC_COSTS.card}沉淀)</span></button>
                                </div>
                            </div>
                             <div className="bg-black/20 rounded-lg p-6">
                                <h2 className="text-2xl font-semibold border-b-2 border-red-500/50 pb-2 mb-4 text-red-300 flex items-center gap-2"><AdjustmentsHorizontalIcon className="w-6 h-6" />系统选项</h2>
                                <div className="flex flex-col items-center gap-4">
                                     <button onClick={() => setShowRulebook(true)} className="flex w-full justify-center items-center gap-2 px-6 py-2 bg-gray-700 text-gray-100 font-semibold rounded-md hover:bg-gray-600 transition-colors transform active:scale-95"><BookOpenIcon className="w-5 h-5" />规则说明</button>
                                     <button onClick={() => setShowRestartConfirm(true)} className="flex w-full justify-center items-center gap-2 px-6 py-2 bg-red-800 text-red-100 font-semibold rounded-md hover:bg-red-700 transition-colors transform active:scale-95"><ArrowPathIcon className="w-5 h-5" />重新开始游戏</button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                            <h3 className="text-center font-bold text-gray-300 mb-3 text-lg">当前属性</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <p>最大HP: <span className="font-mono text-red-400">{effectiveStats.maxHp}</span></p>
                                <p>攻击: <span className="font-mono text-yellow-400">{effectiveStats.attack}</span></p>
                                <p>最大CP: <span className="font-mono text-cyan-400">{effectiveStats.maxCp}</span></p>
                                <p>防御: <span className="font-mono text-blue-400">{effectiveStats.defense}</span></p>
                                <p>CP恢复: <span className="font-mono text-purple-400">{effectiveStats.cpRecovery}</span></p>
                                <p>防御力: <span className="font-mono text-gray-300">{effectiveStats.blockPower}</span></p>
                            </div>
                        </div>
                    </div>
                )
            default: return null;
        }
    }

    return (
        <div className="pt-20 h-full flex flex-col">
            {activeTooltip && (
                <div className="fixed p-2 text-xs text-left text-white bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 pointer-events-none w-64" style={{ top: activeTooltip.top, left: activeTooltip.left, transform: activeTooltip.type === 'item' ? 'translate(-50%, -100%) translateY(-8px)' : 'translateX(8px)' }}>
                    {activeTooltip.content}
                </div>
            )}
             {showRestartConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
                    <div className="bg-gray-800 border border-red-500/50 p-8 rounded-lg shadow-lg max-w-md text-center">
                        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-300">确认重新开始？</h2>
                        <p className="text-gray-400 mt-4">此操作将永久删除您所有的游戏进度，包括卡牌、装备和任务完成情况。此操作无法撤销。</p>
                        <div className="mt-8 flex justify-center gap-4">
                            <button onClick={() => setShowRestartConfirm(false)} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors transform active:scale-95">[ 取消 ]</button>
                            <button onClick={handleConfirmRestart} className="px-6 py-2 bg-red-700 text-white font-bold rounded-md hover:bg-red-600 transition-colors transform active:scale-95">[ 确认并重新开始 ]</button>
                        </div>
                    </div>
                </div>
            )}
            {showRulebook && <RulebookView onClose={() => setShowRulebook(false)} />}
            {showKeywordModal && (
                <KeywordFilterModal
                    allKeywords={allKeywords}
                    selectedKeyword={selectedKeyword}
                    onSelect={(kw) => {
                        setSelectedKeyword(kw);
                        setShowKeywordModal(false);
                    }}
                    onClear={() => {
                        setSelectedKeyword('');
                        setShowKeywordModal(false);
                    }}
                    onClose={() => setShowKeywordModal(false)}
                />
            )}
            <h1 className="text-4xl font-bold text-center text-gray-200">意识现象界空间</h1>
            <p className="text-center text-gray-400 mt-2 mb-4">SAFE IV系统的核心网络大厅</p>
            
            <div className="flex-shrink-0 border-b border-gray-700 px-2 md:px-6">
                 <div className="flex space-x-1 md:space-x-2">
                    {TABS.map(tab => (
                        <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-2 md:px-4 py-3 font-semibold transition-colors text-sm md:text-base ${
                            activeTab === tab.id
                            ? 'border-b-2 border-cyan-400 text-cyan-400'
                            : 'text-gray-400 hover:text-white border-b-2 border-transparent'
                        }`}
                        >
                        <tab.icon className="w-5 h-5" />
                        <span className="hidden md:inline">{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-2 md:p-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default HubView;