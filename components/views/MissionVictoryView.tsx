import React from 'react';
import { useGame } from '../../contexts/GameContext';
// FIX: Import MISSIONS from the centralized constants file.
import { MISSIONS } from '../../constants';

const MissionVictoryView: React.FC = () => {
  const { state, dispatch } = useGame();
  
  if (!state.currentMissionId) return null;
  const mission = MISSIONS[state.currentMissionId];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fadeIn">
      <h1 className="text-5xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(0,255,100,0.5)]">
        任务完成
      </h1>
      <h2 className="text-2xl mt-2 text-gray-300">
        {mission.title}
      </h2>
      <div className="mt-8 bg-gray-800/50 border border-gray-700 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-yellow-400">获得报酬</h3>
          <p className="text-purple-300 mt-2 text-lg">
            +{mission.rewards.dreamSediment} 梦境沉淀
          </p>
      </div>
      
      {mission.victoryText && (
        <div className="mt-6 p-4 bg-gray-900/50 border border-gray-600 rounded-lg max-w-2xl w-full text-left text-sm">
            <h4 className="font-bold text-gray-400 mb-2">评价文本：</h4>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{mission.victoryText}</p>
        </div>
      )}

      <button
        onClick={() => dispatch({ type: 'RETURN_TO_HUB' })}
        className="mt-12 px-8 py-3 bg-cyan-500 text-gray-900 font-bold rounded-md hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30"
      >
        [ 返回意识空间 ]
      </button>
    </div>
  );
};

export default MissionVictoryView;