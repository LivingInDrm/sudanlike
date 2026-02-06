export enum Rarity {
  Gold = 'gold',
  Silver = 'silver',
  Copper = 'copper',
  Stone = 'stone',
}

export enum Attribute {
  Physique = 'physique',
  Charm = 'charm',
  Wisdom = 'wisdom',
  Combat = 'combat',
  Social = 'social',
  Survival = 'survival',
  Stealth = 'stealth',
  Magic = 'magic',
}

export enum SpecialAttribute {
  Support = 'support',
  Reroll = 'reroll',
}

export enum CardType {
  Character = 'character',
  Equipment = 'equipment',
  Intel = 'intel',
  Consumable = 'consumable',
  Book = 'book',
  Thought = 'thought',
  Gem = 'gem',
  Sultan = 'sultan',
}

export enum EquipmentType {
  Weapon = 'weapon',
  Armor = 'armor',
  Accessory = 'accessory',
  Mount = 'mount',
}

export enum SceneType {
  Event = 'event',
  Shop = 'shop',
  Challenge = 'challenge',
}

export enum SceneStatus {
  Available = 'available',
  Participated = 'participated',
  Settling = 'settling',
  Completed = 'completed',
  Locked = 'locked',
}

export enum CheckResult {
  Success = 'success',
  PartialSuccess = 'partial_success',
  Failure = 'failure',
  CriticalFailure = 'critical_failure',
}

export enum CalcMode {
  Max = 'max',
  Sum = 'sum',
  Min = 'min',
  Avg = 'avg',
  First = 'first',
  Specific = 'specific',
}

export enum SlotType {
  Character = 'character',
  Item = 'item',
  Sultan = 'sultan',
  Gold = 'gold',
}

export enum ReputationLevel {
  Humble = 'humble',
  Common = 'common',
  Respected = 'respected',
  Prominent = 'prominent',
  Legendary = 'legendary',
}

export const RARITY_ATTRIBUTE_RANGES: Record<Rarity, { min: number; max: number }> = {
  [Rarity.Gold]: { min: 36, max: 60 },
  [Rarity.Silver]: { min: 21, max: 35 },
  [Rarity.Copper]: { min: 11, max: 20 },
  [Rarity.Stone]: { min: 5, max: 10 },
}

export const RARITY_DROP_RATES: Record<Rarity, number> = {
  [Rarity.Gold]: 0.05,
  [Rarity.Silver]: 0.15,
  [Rarity.Copper]: 0.40,
  [Rarity.Stone]: 0.40,
}

export const REPUTATION_LEVEL_RANGES: Record<ReputationLevel, { min: number; max: number }> = {
  [ReputationLevel.Humble]: { min: 0, max: 19 },
  [ReputationLevel.Common]: { min: 20, max: 39 },
  [ReputationLevel.Respected]: { min: 40, max: 59 },
  [ReputationLevel.Prominent]: { min: 60, max: 79 },
  [ReputationLevel.Legendary]: { min: 80, max: 100 },
}

export const DICE_CONFIG = {
  SIDES: 10,
  SUCCESS_THRESHOLD: 7,
  EXPLOSION_VALUE: 10,
  MAX_DICE_POOL: 20,
  MAX_EXPLOSION_DICE: 20,
} as const

export const GAME_CONFIG = {
  MAX_HAND_SIZE: 512,
  DAILY_THINK_CHARGES: 3,
  INITIAL_REPUTATION: 50,
  REPUTATION_MIN: 0,
  REPUTATION_MAX: 100,
  INITIAL_REWIND_CHARGES: 3,
} as const

export const DIFFICULTY_CONFIG = {
  easy: { executionDays: 21, initialGold: 50, initialCards: 5, enemyStrength: 0.8 },
  normal: { executionDays: 14, initialGold: 30, initialCards: 3, enemyStrength: 1.0 },
  hard: { executionDays: 7, initialGold: 15, initialCards: 2, enemyStrength: 1.2 },
  nightmare: { executionDays: 5, initialGold: 10, initialCards: 1, enemyStrength: 1.5 },
} as const

export type Difficulty = keyof typeof DIFFICULTY_CONFIG
