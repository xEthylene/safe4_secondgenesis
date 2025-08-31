import { Card, PlayerStats } from '../types';

/**
 * Generates a dynamic card description including calculated damage and block values.
 * @param card The card object.
 * @param stats An object with the character's stats.
 * @returns The new description string with calculated values.
 */
export const getDynamicCardDescription = (card: Card, stats: Partial<PlayerStats>): string => {
  if (!stats) {
    return card.description;
  }
  
  let { description } = card;

  // Replace attack damage placeholders
  if (stats.attack) {
    description = description.replace(/(\d+)%攻击力/g, (match, percentageString) => {
      const percentage = parseInt(percentageString, 10) / 100;
      const damage = Math.round(stats.attack! * percentage);
      return `${match}(${damage})`;
    });
  }

  // Replace block power placeholders
  if (stats.blockPower) {
    description = description.replace(/(\d+)%防御力/g, (match, percentageString) => {
      const percentage = parseInt(percentageString, 10) / 100;
      const block = Math.round(stats.blockPower! * percentage);
      return `${match}(${block})`;
    });
  }

  return description;
};