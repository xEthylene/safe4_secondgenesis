import React from 'react';
import { useGame } from '../contexts/GameContext';
import { SparklesIcon, HeartIcon, CpuChipIcon } from '@heroicons/react/24/solid';
import { getEffectivePlayerStats } from '../utils/playerUtils';

const PlayerStatusDisplay: React.FC = () => {
  const { state } = useGame();
  const { player, customEquipment } = state;
  const effectiveStats = getEffectivePlayerStats(player, customEquipment);

  const hpPercentage = (effectiveStats.hp / effectiveStats.maxHp) * 100;
  const cpPercentage = (effectiveStats.cp / effectiveStats.maxCp) * 100;

  return (
    <div className="absolute top-0 left-0 right-0 p-3 bg-black/30 backdrop-blur-sm z-10 flex items-center justify-between text-sm border-b border-cyan-500/20">
      <div className="flex items-center space-x-4">
        <div>
          <span className="font-bold text-cyan-400">代行者:</span> {player.activeProxy}
        </div>
        <div className="flex items-center space-x-2 w-48">
          <HeartIcon className="h-5 w-5 text-red-500" />
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${hpPercentage}%` }}></div>
          </div>
          <span className="font-mono">{effectiveStats.hp}/{effectiveStats.maxHp}</span>
        </div>
        <div className="flex items-center space-x-2 w-48">
          <CpuChipIcon className="h-5 w-5 text-cyan-400" />
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${cpPercentage}%` }}></div>
          </div>
          <span className="font-mono">{effectiveStats.cp}/{effectiveStats.maxCp}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <SparklesIcon className="h-5 w-5 text-purple-400" />
        <span className="font-bold">梦境沉淀:</span>
        <span className="font-mono text-lg text-purple-300">{player.dreamSediment}</span>
      </div>
    </div>
  );
};

export default PlayerStatusDisplay;