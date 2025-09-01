import React, { useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { playSound } from '../../utils/sounds';

const CombatStartView: React.FC = () => {
    const { state, dispatch } = useGame();
    const { combatStartInfo } = state;
    const [step, setStep] = useState(0);

    useEffect(() => {
        playSound('combat_start');
        
        const timers: number[] = [];
        timers.push(window.setTimeout(() => setStep(1), 100));
        timers.push(window.setTimeout(() => setStep(2), 800));
        timers.push(window.setTimeout(() => setStep(3), 1500));
        timers.push(window.setTimeout(() => {
            dispatch({ type: 'START_COMBAT' });
        }, 2200));

        return () => timers.forEach(clearTimeout);
    }, [dispatch]);
    
    if (!combatStartInfo) return null;

    return (
        <div className="relative flex flex-col h-full items-center justify-center p-4 md:p-8 eva-hex-grid">
            <div className="absolute inset-0 border-8 border-red-500 animate-[eva-red-border-pulse_1.5s_ease-in-out_infinite]"></div>
            <div className="text-center text-white z-10">
                {step >= 1 && (
                    <div 
                        key="step1"
                        className="animate-fadeIn"
                        style={{ animationDuration: '0.5s' }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold text-red-400 uppercase tracking-widest animate-[eva-glitch-text_2s_linear_infinite]" style={{ textShadow: '0 0 10px #ef4444, 0 0 20px #ef4444, -2px 2px 2px rgba(0,0,0,0.5)' }}>
                            EMERGENCY3
                        </h1>
                    </div>
                )}
                <div className="mt-6 md:mt-8 font-mono text-lg md:text-xl space-y-2 text-left w-64 md:w-80 backdrop-blur-sm bg-black/30 p-4 border border-gray-600">
                    {step >= 2 && (
                         <p 
                            key="step2"
                            className="animate-fadeIn"
                            style={{ animationDuration: '0.5s' }}
                        >
                            &gt; ANALYSIS COMPLETE
                        </p>
                    )}
                    {step >= 3 && (
                         <div 
                            key="step3"
                            className="animate-fadeIn"
                            style={{ animationDuration: '0.5s' }}
                        >
                            <p>&gt; HOSTILE SIGNATURES: <span className="text-yellow-300 font-bold">{combatStartInfo.enemies}</span></p>
                            <p>&gt; WAVES: <span className="text-yellow-300 font-bold">{combatStartInfo.waves}</span></p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CombatStartView;