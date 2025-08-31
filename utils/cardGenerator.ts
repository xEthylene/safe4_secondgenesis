


import { Card, CardRarity } from '../types';
import { CARDS, MAX_COPIES_PER_RARITY } from '../constants';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Filter out un-obtainable cards initially
const allAvailableCardIds = Object.keys(CARDS).filter(id => !CARDS[id].unobtainable);

export const getRandomCardId = (collection: string[]): string => {
    // 1. Calculate current counts of each card in the collection
    const collectionCounts = collection.reduce((acc, cardId) => {
        acc[cardId] = (acc[cardId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // 2. Filter the card pool based on collection limits
    const eligibleCardIds = allAvailableCardIds.filter(id => {
        const card = CARDS[id];
        const currentCount = collectionCounts[id] || 0;
        const maxCopies = MAX_COPIES_PER_RARITY[card.rarity];
        return currentCount < maxCopies;
    });

    if (eligibleCardIds.length === 0) {
        // Fallback or handle case where no cards can be generated
        // For now, let's just return a basic strike card to avoid crashing.
        return 'strike';
    }

    const cardPool = {
        [CardRarity.COMMON]: eligibleCardIds.filter(id => CARDS[id].rarity === CardRarity.COMMON),
        [CardRarity.RARE]: eligibleCardIds.filter(id => CARDS[id].rarity === CardRarity.RARE),
        [CardRarity.EPIC]: eligibleCardIds.filter(id => CARDS[id].rarity === CardRarity.EPIC),
    };

    const rarityRoll = Math.random();
    let selectedRarity: CardRarity;

    if (rarityRoll < 0.6) { // 60% chance for Common
        selectedRarity = CardRarity.COMMON;
    } else if (rarityRoll < 0.95) { // 35% chance for Rare
        selectedRarity = CardRarity.RARE;
    } else { // 5% chance for Epic
        selectedRarity = CardRarity.EPIC;
    }

    let pool = cardPool[selectedRarity];
    // Fallback logic if a rarity pool is empty
    if (pool.length === 0) {
        if (cardPool[CardRarity.RARE].length > 0) pool = cardPool[CardRarity.RARE];
        else if (cardPool[CardRarity.COMMON].length > 0) pool = cardPool[CardRarity.COMMON];
        else if (cardPool[CardRarity.EPIC].length > 0) pool = cardPool[CardRarity.EPIC];
        else return 'strike'; // Ultimate fallback
    }

    return getRandomElement(pool);
};

export const generateCardPack = (collection: string[], forceEpic: boolean = false): string[] => {
    const pack: string[] = [];
    const tempCollection = [...collection];
    
    for (let i = 0; i < 6; i++) {
        const newCardId = getRandomCardId(tempCollection);
        pack.push(newCardId);
        tempCollection.push(newCardId);
    }

    const hasEpic = pack.some(id => CARDS[id].rarity === CardRarity.EPIC);

    if (forceEpic && !hasEpic) {
        const collectionCounts = collection.reduce((acc, cardId) => {
            acc[cardId] = (acc[cardId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const eligibleEpicPool = allAvailableCardIds.filter(id => {
            const card = CARDS[id];
            if (card.rarity !== CardRarity.EPIC) return false;
            const currentCount = collectionCounts[id] || 0;
            const maxCopies = MAX_COPIES_PER_RARITY[card.rarity];
            return currentCount < maxCopies;
        });

        if (eligibleEpicPool.length > 0) {
            const pityEpicId = getRandomElement(eligibleEpicPool);
            const commonCardIndex = pack.findIndex(id => CARDS[id].rarity === CardRarity.COMMON);
            if (commonCardIndex !== -1) {
                pack[commonCardIndex] = pityEpicId;
            } else {
                // If no common card to replace, replace a random one
                pack[Math.floor(Math.random() * pack.length)] = pityEpicId;
            }
            return pack;
        }
    }

    // Standard pity mechanic: ensure at least one Rare or better if not forcing an Epic
    const hasRareOrBetter = pack.some(r => CARDS[r].rarity === CardRarity.RARE || CARDS[r].rarity === CardRarity.EPIC);
    if (!forceEpic && !hasRareOrBetter) {
        const rareEpicPool = allAvailableCardIds.filter(id => {
            const card = CARDS[id];
            if (card.rarity !== CardRarity.RARE && card.rarity !== CardRarity.EPIC) return false;
            const currentCount = collection.filter(c => c === id).length;
            const maxCopies = MAX_COPIES_PER_RARITY[card.rarity];
            return currentCount < maxCopies;
        });

        if (rareEpicPool.length > 0) {
            const pityCardId = getRandomElement(rareEpicPool);
            const replacementIndex = Math.floor(Math.random() * pack.length);
            pack[replacementIndex] = pityCardId;
        }
    }

    return pack;
};