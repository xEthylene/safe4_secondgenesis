import { Equipment, EquipmentSlot, CardRarity, Affix, AffixEffect } from '../types';
import { WEAPON_AFFIX_POOL, WEAPON_TEMPLATES, EQUIPMENT_AFFIX_POOL, EQUIPMENT_TEMPLATES, EQUIPMENT_RARITY_CONFIG } from '../constants';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getRarityFromStage = (stage: number): CardRarity => {
    const roll = Math.random();
    
    const epicConfig = EQUIPMENT_RARITY_CONFIG[CardRarity.EPIC];
    const rareConfig = EQUIPMENT_RARITY_CONFIG[CardRarity.RARE];

    // Increase chances for better rarities at higher stages
    const epicChance = epicConfig.baseChance + (stage - 1) * epicConfig.stageModifier;
    const rareChance = rareConfig.baseChance + (stage - 1) * rareConfig.stageModifier;

    if (roll < epicChance) return CardRarity.EPIC;
    if (roll < epicChance + rareChance) return CardRarity.RARE;
    return CardRarity.COMMON;
};

const generateRandomWeapon = (stage: number): Equipment => {
    // Step 1: Select a weapon template
    const availableTemplates = Object.values(WEAPON_TEMPLATES);
    const template = getRandomElement(availableTemplates);

    // Step 2: Determine weapon quality
    const rarity = getRarityFromStage(stage);

    // Step 3: Attach base values and extra affixes
    const id = `gen_weapon_${template.id}_${Date.now()}`;
    const stageMultiplier = 1 + (stage - 1) * 0.2;
    const baseEffects: AffixEffect = { attack: Math.round(10 * stageMultiplier) };

    let numAffixes = 0;
    if (rarity === CardRarity.RARE) numAffixes = 1;
    if (rarity === CardRarity.EPIC) numAffixes = 2;

    const availableAffixes = [...WEAPON_AFFIX_POOL];
    const selectedAffixes: Affix[] = [];

    for (let i = 0; i < numAffixes; i++) {
        if (availableAffixes.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableAffixes.length);
        const chosenAffix = availableAffixes.splice(randomIndex, 1)[0];
        
        // Scale affix values where applicable
        const scaledAffix = JSON.parse(JSON.stringify(chosenAffix)); // Deep copy
        let scaledDescription = scaledAffix.description;
        
        // FIX: Replaced unsafe for...in loop with a type-safe for...of loop over Object.keys.
        for (const key of Object.keys(scaledAffix.effect) as Array<keyof AffixEffect>) {
            const value = scaledAffix.effect[key];
            if (typeof value === 'number' && scaledDescription.includes('{value}')) {
                const scaledValue = Math.max(1, Math.round(value * (1 + (stage - 1) * 0.15)));
                (scaledAffix.effect as any)[key] = scaledValue;
                scaledDescription = scaledDescription.replace('{value}', scaledValue.toString());
            }
        }
        scaledAffix.description = scaledDescription;
        selectedAffixes.push(scaledAffix);
    }
    
    return {
        id,
        name: template.name,
        description: template.corePassiveDescription,
        slot: 'weapon',
        rarity,
        templateId: template.id,
        baseEffects,
        affixes: selectedAffixes,
    };
};

const generateRandomEquipmentItem = (stage: number): Equipment => {
    // Step 1: Select a template
    const availableTemplates = Object.values(EQUIPMENT_TEMPLATES);
    const template = getRandomElement(availableTemplates);

    // Step 2: Determine quality
    const rarity = getRarityFromStage(stage);

    // Step 3: Attach base values and extra affixes
    const id = `gen_equip_${template.id}_${Date.now()}`;
    const stageMultiplier = 1 + (stage - 1) * 0.2;
    
    const getBaseEffects = (): AffixEffect => {
        if (template.baseStat === 'maxHp') {
            return { maxHp: Math.round(20 * stageMultiplier) };
        }
        return { maxCp: Math.round(3 * stageMultiplier) };
    };

    let numAffixes = 0;
    if (rarity === CardRarity.RARE) numAffixes = 1;
    if (rarity === CardRarity.EPIC) numAffixes = 2;

    const availableAffixes = [...EQUIPMENT_AFFIX_POOL];
    const selectedAffixes: Affix[] = [];

    for (let i = 0; i < numAffixes; i++) {
        if (availableAffixes.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableAffixes.length);
        const chosenAffix = availableAffixes.splice(randomIndex, 1)[0];
        
        const scaledAffix = JSON.parse(JSON.stringify(chosenAffix));
        let scaledDescription = scaledAffix.description;
        
        // FIX: Replaced unsafe for...in loop with a type-safe for...of loop over Object.keys.
        for (const key of Object.keys(scaledAffix.effect) as Array<keyof AffixEffect>) {
            const value = scaledAffix.effect[key];
            if (typeof value === 'number' && scaledDescription.includes('{value}')) {
                const scaledValue = Math.max(1, Math.round(value * (1 + (stage - 1) * 0.3)));
                (scaledAffix.effect as any)[key] = scaledValue;
                scaledDescription = scaledDescription.replace('{value}', scaledValue.toString());
            }
        }
        scaledAffix.description = scaledDescription;
        selectedAffixes.push(scaledAffix);
    }
    
    return {
        id,
        name: template.name,
        description: template.corePassiveDescription,
        slot: 'equipment',
        rarity,
        templateId: template.id,
        baseEffects: getBaseEffects(),
        affixes: selectedAffixes,
    };
};


export const generateRandomEquipment = (stage: number, slot: EquipmentSlot): Equipment => {
    if (slot === 'weapon') {
        return generateRandomWeapon(stage);
    }
    // This now covers the combined 'equipment' slot
    return generateRandomEquipmentItem(stage);
};