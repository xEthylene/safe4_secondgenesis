

import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import Typewriter from '../Typewriter';

const TitleScreen: React.FC = () => {
  const { dispatch } = useGame();
  const [showDebugInput, setShowDebugInput] = useState(false);
  const [debugChapter, setDebugChapter] = useState('2');

  const handleDebugConfirm = () => {
    const chapter = parseInt(debugChapter, 10);
    if (!isNaN(chapter) && chapter > 0) {
      dispatch({ type: 'DEBUG_JUMP_TO_CHAPTER', payload: { chapter } });
    }
    setShowDebugInput(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fadeIn">
      <h1
        className="text-6xl font-extrabold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] cursor-pointer"
        onClick={() => setShowDebugInput(true)}
      >
        SAFE IV
      </h1>
      <h2 className="text-2xl mt-2 text-gray-300">
        <Typewriter text="第二创世的时刻" speed={100} />
      </h2>
      <p className="max-w-2xl mt-8 text-gray-400">
        你的意识在一片虚无中闪烁并逐渐成形。在一个濒临崩溃的世界里，你是Dreiton，对抗“扭曲”侵蚀的最后希望。苏醒吧，履行你的使命。
      </p>
      <button
        onClick={() => dispatch({ type: 'START_GAME' })}
        className="mt-12 px-8 py-3 bg-cyan-500 text-gray-900 font-bold rounded-md hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 active:scale-95"
      >
        [ 确立存在 ]
      </button>

      {showDebugInput && (
        <div className="mt-4 p-4 bg-gray-800 border border-cyan-500/30 rounded-lg animate-fadeIn flex flex-col items-center gap-3 w-64">
          <label htmlFor="chapter-input" className="text-sm text-cyan-300">输入要跳转到的章节号:</label>
          <input
            id="chapter-input"
            type="number"
            value={debugChapter}
            onChange={(e) => setDebugChapter(e.target.value)}
            className="bg-black text-center text-cyan-300 w-24 px-2 py-1 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleDebugConfirm}
              className="px-4 py-1 bg-cyan-600 text-white text-xs font-bold rounded hover:bg-cyan-500 transition-colors"
            >
              确认
            </button>
            <button
              onClick={() => setShowDebugInput(false)}
              className="px-4 py-1 bg-gray-600 text-gray-200 text-xs font-bold rounded hover:bg-gray-500 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TitleScreen;