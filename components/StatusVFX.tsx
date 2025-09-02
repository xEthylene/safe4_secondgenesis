import React, { useState, useEffect } from 'react';

interface StatusVFXProps {
    trigger?: { type: string; key: number };
}

const StatusVFX: React.FC<StatusVFXProps> = ({ trigger }) => {
    const [vfx, setVfx] = useState<{ type: string; key: number } | null>(null);

    useEffect(() => {
        if (trigger && (trigger.type === 'burn' || trigger.type === 'bleed' || trigger.type === 'poison')) {
            setVfx({ type: trigger.type, key: trigger.key });
            const timer = setTimeout(() => setVfx(null), 1200); // Animation duration increased slightly for new burn effect
            return () => clearTimeout(timer);
        }
    }, [trigger]);

    if (!vfx) {
        return null;
    }
    
    const renderVFX = () => {
        switch (vfx.type) {
            case 'burn':
                return (
                    <div key={vfx.key} className="burn-vfx-container">
                        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="flame" />)}
                    </div>
                );
            case 'bleed':
                return (
                     <div key={vfx.key} className="bleed-vfx-container">
                        {Array.from({ length: 12 }).map((_, i) => <div key={i} className="particle" />)}
                    </div>
                );
            case 'poison':
                 return (
                     <div key={vfx.key} className="poison-vfx-container">
                        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="bubble" />)}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            {renderVFX()}
        </div>
    );
};

export default StatusVFX;