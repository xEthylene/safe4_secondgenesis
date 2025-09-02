
import { Equipment, EquipmentSlot, CardRarity, Affix, AffixEffect } from '../types';
import { WEAPON_AFFIX_POOL, WEAPON_TEMPLATES, EQUIPMENT_AFFIX_POOL, EQUIPMENT_TEMPLATES, EQUIPMENT_RARITY_CONFIG, WEAPON_ATTACK_BY_CHAPTER, EQUIPMENT_STATS_BY_CHAPTER } from '../constants';

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

const generateRandomWeapon = (stage: number, chapter: number): Equipment => {
    const template = getRandomElement(Object.values(WEAPON_TEMPLATES));
    const rarity = getRarityFromStage(stage);

    const id = `gen_weapon_${template.id}_${Date.now()}`;
    
    // New: Calculate attack based on chapter and rarity
    const attackRange = WEAPON_ATTACK_BY_CHAPTER[chapter] || WEAPON_ATTACK_BY_CHAPTER[1];
    let attackValue = attackRange[0];
    if (rarity === CardRarity.RARE) {
        attackValue = Math.round((attackRange[0] + attackRange[1]) / 2);
    } else if (rarity === CardRarity.EPIC) {
        attackValue = attackRange[1];
    }
    
    // Add small random perturbation
    const attackPerturbation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    const finalAttackValue = Math.max(1, attackValue + attackPerturbation);
    
    const baseEffects: AffixEffect = { attack: finalAttackValue };

    let numAffixes = 0;
    if (rarity === CardRarity.RARE) numAffixes = 1;
    if (rarity === CardRarity.EPIC) numAffixes = 2;

    const availableAffixes = [...WEAPON_AFFIX_POOL];
    const selectedAffixes: Affix[] = [];

    for (let i = 0; i < numAffixes; i++) {
        if (availableAffixes.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableAffixes.length);
        const chosenAffix = availableAffixes.splice(randomIndex, 1)[0];
        selectedAffixes.push(chosenAffix); // Affixes are no longer scaled here
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

const generateRandomEquipmentItem = (stage: number, chapter: number): Equipment => {
    const template = getRandomElement(Object.values(EQUIPMENT_TEMPLATES));
    const rarity = getRarityFromStage(stage);

    const id = `gen_equip_${template.id}_${Date.now()}`;
    
    const chapterStats = EQUIPMENT_STATS_BY_CHAPTER[chapter] || EQUIPMENT_STATS_BY_CHAPTER[1];
    const [minHp, maxHp] = chapterStats.maxHp;
    const [minBlock, maxBlock] = chapterStats.blockPower;

    let finalHp = minHp;
    let finalBlock = minBlock;

    if (rarity === CardRarity.RARE) {
        // Randomly choose between high HP/low block or low HP/high block
        if (Math.random() < 0.5) {
            finalHp = maxHp;
            finalBlock = minBlock;
        } else {
            finalHp = minHp;
            finalBlock = maxBlock;
        }
    } else if (rarity === CardRarity.EPIC) {
        finalHp = maxHp;
        finalBlock = maxBlock;
    }

    // Add small random perturbations
    const hpPerturbation = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const blockPerturbation = Math.floor(Math.random() * 3) - 1; // -1 to +1

    const perturbedHp = Math.max(1, finalHp + hpPerturbation);
    const perturbedBlock = Math.max(0, finalBlock + blockPerturbation);

    const baseEffects: AffixEffect = { maxHp: perturbedHp, blockPower: perturbedBlock };

    let numAffixes = 0;
    if (rarity === CardRarity.RARE) numAffixes = 1;
    if (rarity === CardRarity.EPIC) numAffixes = 2;

    const availableAffixes = [...EQUIPMENT_AFFIX_POOL];
    const selectedAffixes: Affix[] = [];

    for (let i = 0; i < numAffixes; i++) {
        if (availableAffixes.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableAffixes.length);
        const chosenAffix = availableAffixes.splice(randomIndex, 1)[0];
        selectedAffixes.push(chosenAffix);
    }
    
    return {
        id,
        name: template.name,
        description: template.corePassiveDescription,
        slot: 'equipment',
        rarity,
        templateId: template.id,
        baseEffects,
        affixes: selectedAffixes,
    };
};


export const generateRandomEquipment = (stage: number, slot: EquipmentSlot, chapter: number): Equipment => {
    if (slot === 'weapon') {
        return generateRandomWeapon(stage, chapter);
    }
    return generateRandomEquipmentItem(stage, chapter);
};