import { PlayerState, PlayerStats, Equipment, AffixEffect, EquipmentSet } from '../types';
import { EQUIPMENT, EQUIPMENT_SETS } from '../constants';

// Rewrote the function to be more type-safe by using Object.keys instead of for...in.
const mergeEffects = (target: AffixEffect, source: AffixEffect) => {
    (Object.keys(source) as Array<keyof AffixEffect>).forEach(key => {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (typeof sourceValue === 'number') {
            const currentVal = target[key];
            (target as any)[key] = (typeof currentVal === 'number' ? currentVal : 0) + sourceValue;
        } else if (typeof sourceValue === 'boolean') {
            (target as any)[key] = sourceValue;
        } else if (typeof sourceValue === 'object' && sourceValue !== null) {
            const existingTargetObject =
                typeof targetValue === 'object' && targetValue !== null ? targetValue : {};
            (target as any)[key] = { ...existingTargetObject, ...sourceValue };
        }
    });
};

export const getEffectivePlayerStats = (player: PlayerState, customEquipment: Record<string, Equipment>): PlayerStats => {
    // Start with base stats from the player state
    const baseStats: PlayerStats = {
        hp: player.hp,
        maxHp: player.maxHp,
        cp: player.cp,
        maxCp: player.maxCp,
        cpRecovery: player.cpRecovery,
        attack: player.attack,
        defense: player.defense,
        blockPower: player.blockPower,
        initialDraw: 5, // Base draw is 5
        derivedEffects: {}
    };

    const allEquipmentSource = { ...EQUIPMENT, ...customEquipment };

    // Get a list of all equipped item objects
    const equippedItems = Object.values(player.equipment)
        .filter((itemId): itemId is string => itemId !== null)
        .map(itemId => allEquipmentSource[itemId]);
        
    const equippedSetCounts: Record<string, number> = {};

    // Apply bonuses from all equipped items (base + affixes)
    const effectiveStats = equippedItems.reduce((stats, item) => {
        if (item) {
            // Apply base effects
            mergeEffects(stats.derivedEffects, item.baseEffects);
            
            // Apply affix effects
            item.affixes.forEach(affix => {
                mergeEffects(stats.derivedEffects, affix.effect);
            });
            
            // Count sets for bonus application later
            if (item.setId) {
                equippedSetCounts[item.setId] = (equippedSetCounts[item.setId] || 0) + 1;
            }
        }
        return stats;
    }, baseStats);
    
    // Apply set bonuses
    for (const setId in equippedSetCounts) {
        const setCount = equippedSetCounts[setId];
        const setInfo = EQUIPMENT_SETS[setId];
        if (setInfo) {
            setInfo.bonuses.forEach(bonus => {
                if (setCount >= bonus.count) {
                    mergeEffects(effectiveStats.derivedEffects, bonus.effects);
                    // Add set info to derivedEffects for UI display
                    if (!effectiveStats.derivedEffects.setId) {
                        effectiveStats.derivedEffects.setId = setId;
                        effectiveStats.derivedEffects.setCount = setCount;
                    }
                }
            });
        }
    }
    
    // Apply derived effects to base stats
    effectiveStats.maxHp += effectiveStats.derivedEffects.maxHp || 0;
    effectiveStats.maxCp += effectiveStats.derivedEffects.maxCp || 0;
    effectiveStats.attack += effectiveStats.derivedEffects.attack || 0;
    effectiveStats.defense += effectiveStats.derivedEffects.defense || 0;
    effectiveStats.blockPower += effectiveStats.derivedEffects.blockPower || 0;
    effectiveStats.cpRecovery += effectiveStats.derivedEffects.cpRecovery || 0;
    effectiveStats.initialDraw! += effectiveStats.derivedEffects.initialDraw || 0;

    // Ensure current HP/CP don't exceed the new calculated max values
    effectiveStats.hp = Math.min(effectiveStats.hp, effectiveStats.maxHp);
    effectiveStats.cp = Math.min(effectiveStats.cp, effectiveStats.maxCp);

    return effectiveStats;
};