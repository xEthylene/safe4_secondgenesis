import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { MISSIONS } from '../../constants';
import { Character } from '../../types';

const MissionStartView: React.FC = () => {
    const { state, dispatch } = useGame();
    const [step, setStep] = useState(0);
    const timers = useRef<number[]>([]);

    const mission = state.currentMissionId ? MISSIONS[state.currentMissionId] : null;
    const event = mission?.events?.[0];

    // Safeguard: if the first event isn't the expected system message, advance immediately.
    if (!event || event.type !== 'dialogue' || event.character !== Character.System) {
        useEffect(() => {
            dispatch({ type: 'ADVANCE_STORY' });
        }, [dispatch]);
        return null;
    }

    const lines = event.text.split('\n').filter(line => line.trim() !== '');

    const handleSkip = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        dispatch({ type: 'ADVANCE_STORY' });
    };

    useEffect(() => {
        // Always clear previous timers on re-render or unmount
        const clearTimers = () => {
            timers.current.forEach(clearTimeout);
            timers.current = [];
        };
        clearTimers();

        // Stagger the appearance of each line
        lines.forEach((_, index) => {
            const timer = window.setTimeout(() => setStep(index + 1), (index * 2500) + 500);
            timers.current.push(timer);
        });

        // After all lines have had time to appear and type, advance the story
        const totalDuration = (lines.length * 2500) + 2000;
        const finalTimer = window.setTimeout(() => {
            dispatch({ type: 'ADVANCE_STORY' });
        }, totalDuration);
        timers.current.push(finalTimer);

        return clearTimers;
    }, [dispatch, lines.length]);

    const TITLES = ["AETHER_STREAM_DIVERTED", "SYNCHRONIZATION_COMPLETE", "PROXY_ACTIVATION"];

    return (
        <div className="relative flex flex-col h-full items-center justify-center p-4 md:p-8 eva-hex-grid overflow-hidden">
            <button
                onClick={handleSkip}
                className="absolute top-20 right-5 px-4 py-2 bg-gray-700/80 backdrop-blur-sm text-gray-300 font-semibold rounded-md hover:bg-gray-600 transition-colors z-20"
            >
                快进 &gt;&gt;
            </button>
            <div className="eva-caution-bar" style={{ top: '5%' }}></div>
            <div className="eva-caution-bar" style={{ bottom: '5%' }}></div>
            <div className="absolute inset-0 border-8 border-red-500 animate-[eva-red-border-pulse_1.5s_ease-in-out_infinite]"></div>
            <div className="text-center text-white z-10 font-mono w-full max-w-4xl space-y-6">
                {lines.map((line, index) => (
                    step >= index + 1 && (
                        <div key={index} className="animate-fadeIn">
                            <h2 
                                className="text-lg md:text-2xl font-extrabold text-red-400 tracking-widest animate-[eva-glitch-text_2s_linear_infinite]" 
                                style={{ animationDelay: `${index * 1.5}s` }}
                            >
                                {TITLES[index] || `SYSTEM_MESSAGE_0${index + 1}`}
                            </h2>
                            <p className="text-base md:text-xl whitespace-pre-wrap text-gray-200 mt-2">{line.replace('系统音：', '').trim()}</p>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default MissionStartView;