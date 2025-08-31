import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
// FIX: Import MISSIONS and CHARACTER_PORTRAITS from the centralized constants file.
import { MISSIONS, CHARACTER_PORTRAITS } from '../../constants';
import Typewriter from '../Typewriter';
import { Character, TitleEvent } from '../../types';

const DialogueView: React.FC = () => {
    const { state, dispatch } = useGame();
    const [canProceed, setCanProceed] = useState(false);

    if (!state.currentMissionId) return null;
    const mission = MISSIONS[state.currentMissionId];
    if(!mission.events) return null;
    const event = mission.events[state.currentEventIndex];

    const handleProceed = () => {
        if (canProceed) {
            setCanProceed(false);
            dispatch({ type: 'ADVANCE_STORY' });
        }
    };
    
    useEffect(() => {
        if (event.type === 'combat' || event.type === 'action') {
            dispatch({ type: 'ADVANCE_STORY' });
        }
    }, [event, dispatch]);

    const renderEvent = () => {
        switch (event.type) {
            case 'dialogue': {
                const isPlayer = event.character === Character.Player;
                const isSystem = event.character === Character.System || event.character === Character.StrangeVoice || event.character === Character.MysteriousVoice;
                const portrait = CHARACTER_PORTRAITS[event.character as Character];
                const showPortrait = portrait && !isSystem;

                return (
                     <div className={`w-full max-w-4xl mx-auto my-4 flex items-end gap-4 animate-fadeIn ${isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
                        {showPortrait && (
                             <div className="flex-shrink-0">
                                 <img src={portrait} alt={event.character} className="w-28 h-40 md:w-36 md:h-52 object-cover rounded-t-lg bg-gray-800 border-b-4 border-cyan-500/50" />
                             </div>
                        )}
                        <div className={`flex-1 ${!showPortrait ? 'max-w-3xl' : ''} ${isSystem ? 'text-center' : ''}`}>
                            <div className={`inline-block p-4 rounded-lg w-full ${isPlayer ? 'bg-blue-800/50' : 'bg-gray-800/50'} border ${isPlayer ? 'border-blue-500/30' : 'border-gray-600/30'}`}>
                               <p className={`font-bold mb-2 ${isSystem ? 'text-cyan-400' : 'text-yellow-400'}`}>{event.character}</p>
                               <div className="text-lg leading-relaxed whitespace-pre-wrap text-left"><Typewriter text={event.text} onFinished={() => setCanProceed(true)} /></div>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'title':
                 return <div className="text-5xl font-bold text-center my-10 text-gray-400 animate-fadeIn"><Typewriter text={(event as TitleEvent).text} onFinished={() => setCanProceed(true)}/></div>;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full justify-center" onClick={handleProceed}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SKIP_DIALOGUE' });
                }}
                className="absolute top-20 right-5 px-4 py-2 bg-gray-700/80 backdrop-blur-sm text-gray-300 font-semibold rounded-md hover:bg-gray-600 transition-colors z-20"
            >
                快进 &gt;&gt;
            </button>
            <div className="pt-16 p-4">
                {renderEvent()}
            </div>
            {canProceed && (
                 <div className="fixed bottom-5 right-10 text-gray-500 animate-pulse">
                    [ 点击继续 ]
                 </div>
            )}
        </div>
    );
};

export default DialogueView;