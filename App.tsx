
import React from 'react';
import { GameProvider } from './contexts/GameContext';
import GameScreen from './screens/GameScreen';

function App(): React.ReactNode {
  return (
    <GameProvider>
      <div className="w-screen h-screen bg-gray-900 font-sans flex items-center justify-center">
        <div className="w-full max-w-5xl h-full max-h-[900px] bg-black bg-opacity-50 shadow-2xl shadow-cyan-500/10 rounded-lg border border-cyan-500/20 flex flex-col overflow-hidden">
          <GameScreen />
        </div>
      </div>
    </GameProvider>
  );
}

export default App;
