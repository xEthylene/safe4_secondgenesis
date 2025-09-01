import React from 'react';
import { useGame } from '../contexts/GameContext';
import { SparklesIcon, HeartIcon, CpuChipIcon, ShieldCheckIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import { getEffectivePlayerStats } from '../utils/playerUtils';
import { GameStatus } from '../types';

const PlayerStatusDisplay: React.FC = () => {
  const { state } = useGame();
  const { player, customEquipment, combatState } = state;
  const effectiveStats = getEffectivePlayerStats(player, customEquipment);

  const hpPercentage = (effectiveStats.hp / effectiveStats.maxHp) * 100;
  const cpPercentage = (effectiveStats.cp / effectiveStats.maxCp) * 100;

  const inCombat = state.status === GameStatus.IN_MISSION_COMBAT;

  return (
    <div className="absolute top-0 left-0 right-0 p-3 bg-black/30 backdrop-blur-sm z-10 flex items-center justify-between text-sm border-b border-blue-500/20">
      <div className="flex items-center space-x-2 md:space-x-4">
        <div>
          <span className="font-bold text-blue-400">代行者:</span> {player.activeProxy}
        </div>
        <div className="flex items-center space-x-2 w-28 md:w-40">
          <HeartIcon className="h-5 w-5 text-red-500" />
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${hpPercentage}%` }}></div>
          </div>
          <span className="font-mono text-xs">{effectiveStats.hp}/{effectiveStats.maxHp}</span>
        </div>
        <div className="hidden md:flex items-center space-x-2 w-28 md:w-40">
          <CpuChipIcon className="h-5 w-5 text-blue-400" />
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-400 h-2.5 rounded-full" style={{ width: `${cpPercentage}%` }}></div>
          </div>
          <span className="font-mono text-xs">{effectiveStats.cp}/{effectiveStats.maxCp}</span>
        </div>
         {inCombat && combatState && combatState.block > 0 && (
          <div className="flex items-center text-blue-300" title="格挡">
            <ShieldCheckIcon className="h-5 w-5 mr-1" />
            <span className="font-bold">{combatState.block}</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        {inCombat && (
          <div className="flex items-center text-gray-300" title="防御">
            <HandRaisedIcon className="h-5 w-5 mr-1" />
            <span className="font-bold">{effectiveStats.defense}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-purple-400" />
          <span className="hidden md:inline font-bold">梦境沉淀:</span>
          <span className="font-mono text-lg text-purple-300">{player.dreamSediment}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatusDisplay;