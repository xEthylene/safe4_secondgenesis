import React, { useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { playSound } from '../../utils/sounds';

const SupplyStopView: React.FC = () => {
    const { dispatch } = useGame();

    useEffect(() => {
        playSound('power_up');
        // Apply the supply stop effects as soon as the component mounts
        dispatch({ type: 'APPLY_SUPPLY_STOP' });

        // After a delay for the animation to play, advance the story
        const timer = setTimeout(() => {
            dispatch({ type: 'ADVANCE_STORY' });
        }, 1500); // Should match the animation duration

        return () => clearTimeout(timer);
    }, [dispatch]);

    return (
        <div className="relative flex flex-col h-full items-center justify-center p-4 md:p-8 overflow-hidden bg-black">
            <div className="scan-line" />
            {Array.from({ length: 30 }).map((_, i) => (
                <div 
                    key={i} 
                    className="particle"
                    style={{ 
                        left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 3 + 1}px`,
                        height: `${Math.random() * 3 + 1}px`,
                        animationDuration: `${Math.random() * 5 + 3}s`,
                        animationDelay: `${Math.random() * 3}s`,
                        bottom: `-${Math.random() * 20}%`
                    }}
                />
            ))}
            <div className="text-center z-10">
                <h1 className="text-3xl md:text-4xl font-bold text-green-400 animate-supply-pulse">
                    代行者躯体能源补充完毕
                </h1>
            </div>
        </div>
    );
};

export default SupplyStopView;