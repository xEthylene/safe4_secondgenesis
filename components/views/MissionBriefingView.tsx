import React from 'react';
import { useGame } from '../../contexts/GameContext';
// FIX: Import MISSIONS from the centralized constants file.
import { MISSIONS } from '../../constants';
import Typewriter from '../Typewriter';

const MissionBriefingView: React.FC = () => {
    const { state, dispatch } = useGame();
    if (!state.currentMissionId) return null;

    const mission = MISSIONS[state.currentMissionId];
    const isReplay = state.currentMissionIsReplay;
    const rewardAmount = isReplay 
        ? Math.round(mission.rewards.dreamSediment * 0.5) 
        : mission.rewards.dreamSediment;

    return (
        <div className="flex flex-col h-full items-center justify-center p-4 md:p-8 pt-16 animate-fadeIn">
            <div className="w-full max-w-3xl bg-gray-800/70 p-4 md:p-6 rounded-lg border border-gray-700">
                <h1 className={`text-2xl md:text-3xl font-bold ${mission.type === 'main' ? 'text-cyan-400' : 'text-purple-400'}`}>{mission.title}</h1>
                <p className="text-sm text-gray-400 mt-1">签发单位: {mission.issuer}</p>
                {mission.operator && <p className="text-sm text-gray-400">接线员: {mission.operator}</p>}

                <div className="my-6 border-t border-gray-600"></div>

                <h2 className="text-lg md:text-xl font-semibold mb-2 text-gray-300">任务概述</h2>
                <div className="text-sm md:text-base text-gray-400 space-y-3 leading-relaxed">
                    {mission.description.map((p, i) => <p key={i}>{p}</p>)}
                </div>

                <div className="my-6 border-t border-gray-600"></div>

                <h2 className="text-lg md:text-xl font-semibold mb-2 text-gray-300">报酬</h2>
                <p className="text-purple-300 mt-2 text-base md:text-lg">
                    +{rewardAmount} 梦境沉淀 {isReplay && <span className="text-sm text-gray-400">(回战奖励)</span>}
                </p>
                
                <div className="mt-8 flex justify-end space-x-4">
                     <button
                        onClick={() => dispatch({ type: 'RETURN_TO_HUB' })}
                        className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors"
                    >
                        返回
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'START_MISSION' })}
                        className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 transition-colors"
                    >
                        接受任务
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MissionBriefingView;