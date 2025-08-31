import React from 'react';
import { useGame } from '../../contexts/GameContext';
// FIX: Import MISSIONS from the centralized constants file.
import { MISSIONS } from '../../constants';
import { ActionEvent } from '../../types';

const ChoiceView: React.FC = () => {
    const { state, dispatch } = useGame();

    if (!state.currentMissionId) return null;

    const mission = MISSIONS[state.currentMissionId];
    if (!mission || !mission.events) return null;

    const event = mission.events[state.currentEventIndex] as ActionEvent;
    if (event.type !== 'action' || event.action !== 'present_choice' || !event.choices) {
        // This view should only be rendered for choice events.
        // If somehow rendered otherwise, return to hub to prevent a crash.
        dispatch({ type: 'RETURN_TO_HUB' });
        return null;
    }
    
    const handleChoice = (missionId: string) => {
        // Complete the current mission before starting the new one
        if (!state.player.completedMissions.includes(state.currentMissionId!)) {
            dispatch({ type: 'RETURN_TO_HUB' }); // This will complete the mission and give rewards
        }
        // Then, select the new mission path
        setTimeout(() => dispatch({ type: 'SELECT_MISSION', payload: missionId }), 100);
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-8 pt-16 animate-fadeIn">
            <div className="w-full max-w-2xl text-center">
                <h1 className="text-4xl font-bold text-yellow-400 mb-8">做出你的选择</h1>
                <div className="space-y-4">
                    {event.choices.map((choice) => (
                        <button
                            key={choice.missionId}
                            onClick={() => handleChoice(choice.missionId)}
                            className="w-full px-8 py-4 bg-gray-800 text-white text-xl font-semibold rounded-md border-2 border-gray-700 hover:border-cyan-500 hover:bg-cyan-900/50 transition-all duration-300 transform hover:scale-105"
                        >
                           {choice.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChoiceView;