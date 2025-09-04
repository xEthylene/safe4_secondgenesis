import { Card, CardRarity } from '../types';
import { COMMON_CARDS } from './cards-common';
import { RARE_CARDS } from './cards-rare';
import { EPIC_CARDS } from './cards-epic';
import { UNOBTAINABLE_CARDS } from './cards-unobtainable';
import { ENEMY_CARDS as ENEMY_CARDS_DATA } from './cards-enemy';

export const MAX_COPIES_PER_RARITY: Record<CardRarity, number> = {
    [CardRarity.COMMON]: 5,
    [CardRarity.RARE]: 3,
    [CardRarity.EPIC]: 2,
};

export const CARDS: Record<string, Card> = {
    ...COMMON_CARDS,
    ...RARE_CARDS,
    ...EPIC_CARDS,
    ...UNOBTAINABLE_CARDS,
};

export const ENEMY_CARDS = ENEMY_CARDS_DATA;
