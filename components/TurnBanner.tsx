import React from 'react';

interface TurnBannerProps {
  text: string;
}

const TurnBanner: React.FC<TurnBannerProps> = ({ text }) => {
  if (!text) return null;

  const isPlayerTurn = text.includes('你');

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-center items-center pointer-events-none z-50">
      <div
        key={text}
        className={`px-12 py-4 text-4xl font-extrabold border-y-4 shadow-2xl animate-turn-banner ${
          isPlayerTurn
            ? 'bg-cyan-800/80 text-cyan-100 border-cyan-400 shadow-cyan-500/50'
            : 'bg-red-800/80 text-red-100 border-red-400 shadow-red-500/50'
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default TurnBanner;
