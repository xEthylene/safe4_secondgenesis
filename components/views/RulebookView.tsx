import React, { useState } from 'react';
import { RULEBOOK_DATA } from '../../data/rules';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface RulebookViewProps {
    onClose: () => void;
}

const RulebookView: React.FC<RulebookViewProps> = ({ onClose }) => {
    const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
    const selectedChapter = RULEBOOK_DATA[selectedChapterIndex];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-4xl h-[80vh] max-h-[700px] bg-gray-900 border-2 border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 flex flex-col relative">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h1 className="text-2xl font-bold text-cyan-400">规则说明书</h1>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                <div className="flex flex-grow overflow-hidden">
                    {/* Sidebar */}
                    <nav className="w-1/4 bg-black/20 border-r border-gray-700 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {RULEBOOK_DATA.map((chapter, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => setSelectedChapterIndex(index)}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                                            selectedChapterIndex === index
                                                ? 'bg-cyan-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        {chapter.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Content */}
                    <main className="w-3/4 p-6 overflow-y-auto">
                        <h2 className="text-3xl font-bold text-yellow-300 mb-6 border-b-2 border-yellow-500/30 pb-2">
                            {selectedChapter.title}
                        </h2>
                        <div className="prose prose-invert prose-p:text-gray-300 prose-strong:text-yellow-200 space-y-4 leading-relaxed">
                            {selectedChapter.content.map((paragraph, index) => (
                                <p key={index} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default RulebookView;
