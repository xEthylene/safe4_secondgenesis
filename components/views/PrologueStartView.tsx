import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';

const PROLOGUE_LINES = [
    {
        title: "COGITO_BASIS_CONSTRUCTION",
        text: "正在建构Cogito的基点...第一存在证明，确立\n现象界意向性结构初始化完成\n开始分泌以太团块..."
    },
    {
        title: "SYSTEM_SELF_DIAGNOSTIC",
        text: "SAFE 系统自检通过，[此在]显现。\n意识统合流连续性量度：78.06%"
    },
    {
        title: "AETHER_SYNCHRONIZATION",
        text: "正在引流以太....Cogito同步超过阈值，允许启动，进入[共在]模式\n意识同步完成，试作型生物魔导终端亲和性校验通过。\n代行者躯体Qu-alpha 开始活动，限制解除。"
    }
];

const PrologueStartView: React.FC = () => {
    const { dispatch } = useGame();
    const [step, setStep] = useState(0);
    const timers = useRef<number[]>([]);

    const handleSkip = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        dispatch({ type: 'FINISH_PROLOGUE_START' });
    };

    useEffect(() => {
        const clearTimers = () => {
            timers.current.forEach(clearTimeout);
            timers.current = [];
        };
        clearTimers();

        timers.current.push(window.setTimeout(() => setStep(1), 500));
        timers.current.push(window.setTimeout(() => setStep(2), 4000));
        timers.current.push(window.setTimeout(() => setStep(3), 7000));
        timers.current.push(window.setTimeout(() => {
            dispatch({ type: 'FINISH_PROLOGUE_START' });
        }, 11000));

        return clearTimers;
    }, [dispatch]);

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
                {step >= 1 && (
                    <div key="step1" className="animate-fadeIn">
                        <h2 className="text-lg md:text-2xl font-extrabold text-red-400 tracking-widest animate-[eva-glitch-text_2s_linear_infinite_0.5s]">
                            {PROLOGUE_LINES[0].title}
                        </h2>
                        <p className="text-base md:text-xl whitespace-pre-wrap text-gray-200 mt-2">{PROLOGUE_LINES[0].text}</p>
                    </div>
                )}
                 {step >= 2 && (
                    <div key="step2" className="animate-fadeIn">
                        <h2 className="text-lg md:text-2xl font-extrabold text-red-400 tracking-widest animate-[eva-glitch-text_2s_linear_infinite_1.5s]">
                           {PROLOGUE_LINES[1].title}
                        </h2>
                        <p className="text-base md:text-xl whitespace-pre-wrap text-gray-200 mt-2">{PROLOGUE_LINES[1].text}</p>
                    </div>
                )}
                 {step >= 3 && (
                    <div key="step3" className="animate-fadeIn">
                        <h2 className="text-lg md:text-2xl font-extrabold text-red-400 tracking-widest animate-[eva-glitch-text_2s_linear_infinite_2.5s]">
                           {PROLOGUE_LINES[2].title}
                        </h2>
                        <p className="text-base md:text-xl whitespace-pre-wrap text-gray-200 mt-2">{PROLOGUE_LINES[2].text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrologueStartView;