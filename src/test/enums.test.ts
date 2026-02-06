import { describe, it, expect } from 'vitest'
import {
  Rarity,
  Attribute,
  SpecialAttribute,
  CardType,
  EquipmentType,
  SceneType,
  SceneStatus,
  CheckResult,
  CalcMode,
  SlotType,
  ReputationLevel,
  RARITY_ATTRIBUTE_RANGES,
  RARITY_DROP_RATES,
  REPUTATION_LEVEL_RANGES,
  DICE_CONFIG,
  GAME_CONFIG,
  DIFFICULTY_CONFIG,
} from '@/core/types/enums'

describe('Enums', () => {
  describe('Rarity', () => {
    it('should have all 4 rarity values', () => {
      expect(Object.keys(Rarity)).toHaveLength(4)
      expect(Rarity.Gold).toBe('gold')
      expect(Rarity.Silver).toBe('silver')
      expect(Rarity.Copper).toBe('copper')
      expect(Rarity.Stone).toBe('stone')
    })

    it('should have unique values', () => {
      const values = Object.values(Rarity)
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBe(values.length)
    })
  })

  describe('Attribute', () => {
    it('should have all 8 attribute values', () => {
      expect(Object.keys(Attribute)).toHaveLength(8)
      expect(Attribute.Physique).toBe('physique')
      expect(Attribute.Charm).toBe('charm')
      expect(Attribute.Wisdom).toBe('wisdom')
      expect(Attribute.Combat).toBe('combat')
      expect(Attribute.Social).toBe('social')
      expect(Attribute.Survival).toBe('survival')
      expect(Attribute.Stealth).toBe('stealth')
      expect(Attribute.Magic).toBe('magic')
    })
  })

  describe('SpecialAttribute', () => {
    it('should have support and reroll', () => {
      expect(SpecialAttribute.Support).toBe('support')
      expect(SpecialAttribute.Reroll).toBe('reroll')
    })
  })

  describe('CardType', () => {
    it('should have all 8 card types', () => {
      expect(Object.keys(CardType)).toHaveLength(8)
      expect(CardType.Character).toBe('character')
      expect(CardType.Equipment).toBe('equipment')
      expect(CardType.Intel).toBe('intel')
      expect(CardType.Consumable).toBe('consumable')
      expect(CardType.Book).toBe('book')
      expect(CardType.Thought).toBe('thought')
      expect(CardType.Gem).toBe('gem')
      expect(CardType.Sultan).toBe('sultan')
    })
  })

  describe('EquipmentType', () => {
    it('should have all 4 equipment types', () => {
      expect(Object.keys(EquipmentType)).toHaveLength(4)
      expect(EquipmentType.Weapon).toBe('weapon')
      expect(EquipmentType.Armor).toBe('armor')
      expect(EquipmentType.Accessory).toBe('accessory')
      expect(EquipmentType.Mount).toBe('mount')
    })
  })

  describe('SceneType', () => {
    it('should have all 3 scene types', () => {
      expect(Object.keys(SceneType)).toHaveLength(3)
      expect(SceneType.Event).toBe('event')
      expect(SceneType.Shop).toBe('shop')
      expect(SceneType.Challenge).toBe('challenge')
    })
  })

  describe('SceneStatus', () => {
    it('should have all 5 scene statuses', () => {
      expect(Object.keys(SceneStatus)).toHaveLength(5)
      expect(SceneStatus.Available).toBe('available')
      expect(SceneStatus.Participated).toBe('participated')
      expect(SceneStatus.Settling).toBe('settling')
      expect(SceneStatus.Completed).toBe('completed')
      expect(SceneStatus.Locked).toBe('locked')
    })
  })

  describe('CheckResult', () => {
    it('should have all 4 check results', () => {
      expect(Object.keys(CheckResult)).toHaveLength(4)
      expect(CheckResult.Success).toBe('success')
      expect(CheckResult.PartialSuccess).toBe('partial_success')
      expect(CheckResult.Failure).toBe('failure')
      expect(CheckResult.CriticalFailure).toBe('critical_failure')
    })
  })

  describe('CalcMode', () => {
    it('should have all 6 calc modes', () => {
      expect(Object.keys(CalcMode)).toHaveLength(6)
      expect(CalcMode.Max).toBe('max')
      expect(CalcMode.Sum).toBe('sum')
      expect(CalcMode.Min).toBe('min')
      expect(CalcMode.Avg).toBe('avg')
      expect(CalcMode.First).toBe('first')
      expect(CalcMode.Specific).toBe('specific')
    })
  })

  describe('SlotType', () => {
    it('should have all 4 slot types', () => {
      expect(Object.keys(SlotType)).toHaveLength(4)
      expect(SlotType.Character).toBe('character')
      expect(SlotType.Item).toBe('item')
      expect(SlotType.Sultan).toBe('sultan')
      expect(SlotType.Gold).toBe('gold')
    })
  })

  describe('ReputationLevel', () => {
    it('should have all 5 reputation levels', () => {
      expect(Object.keys(ReputationLevel)).toHaveLength(5)
      expect(ReputationLevel.Humble).toBe('humble')
      expect(ReputationLevel.Common).toBe('common')
      expect(ReputationLevel.Respected).toBe('respected')
      expect(ReputationLevel.Prominent).toBe('prominent')
      expect(ReputationLevel.Legendary).toBe('legendary')
    })
  })
})

describe('Constants', () => {
  describe('RARITY_ATTRIBUTE_RANGES', () => {
    it('should have correct attribute ranges for each rarity', () => {
      expect(RARITY_ATTRIBUTE_RANGES[Rarity.Gold]).toEqual({ min: 36, max: 60 })
      expect(RARITY_ATTRIBUTE_RANGES[Rarity.Silver]).toEqual({ min: 21, max: 35 })
      expect(RARITY_ATTRIBUTE_RANGES[Rarity.Copper]).toEqual({ min: 11, max: 20 })
      expect(RARITY_ATTRIBUTE_RANGES[Rarity.Stone]).toEqual({ min: 5, max: 10 })
    })
  })

  describe('RARITY_DROP_RATES', () => {
    it('should have correct drop rates', () => {
      expect(RARITY_DROP_RATES[Rarity.Gold]).toBe(0.05)
      expect(RARITY_DROP_RATES[Rarity.Silver]).toBe(0.15)
      expect(RARITY_DROP_RATES[Rarity.Copper]).toBe(0.40)
      expect(RARITY_DROP_RATES[Rarity.Stone]).toBe(0.40)
    })

    it('should sum to 1.0', () => {
      const total = Object.values(RARITY_DROP_RATES).reduce((a, b) => a + b, 0)
      expect(total).toBe(1.0)
    })
  })

  describe('REPUTATION_LEVEL_RANGES', () => {
    it('should cover 0-100 range without gaps', () => {
      const levels = Object.values(ReputationLevel)
      const ranges = levels.map(level => REPUTATION_LEVEL_RANGES[level])
      
      ranges.sort((a, b) => a.min - b.min)
      
      expect(ranges[0].min).toBe(0)
      expect(ranges[ranges.length - 1].max).toBe(100)
      
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i].min).toBe(ranges[i - 1].max + 1)
      }
    })
  })

  describe('DICE_CONFIG', () => {
    it('should have correct dice configuration', () => {
      expect(DICE_CONFIG.SIDES).toBe(10)
      expect(DICE_CONFIG.SUCCESS_THRESHOLD).toBe(7)
      expect(DICE_CONFIG.EXPLOSION_VALUE).toBe(10)
      expect(DICE_CONFIG.MAX_DICE_POOL).toBe(20)
      expect(DICE_CONFIG.MAX_EXPLOSION_DICE).toBe(20)
    })
  })

  describe('GAME_CONFIG', () => {
    it('should have correct game configuration', () => {
      expect(GAME_CONFIG.MAX_HAND_SIZE).toBe(512)
      expect(GAME_CONFIG.DAILY_THINK_CHARGES).toBe(3)
      expect(GAME_CONFIG.INITIAL_REPUTATION).toBe(50)
      expect(GAME_CONFIG.REPUTATION_MIN).toBe(0)
      expect(GAME_CONFIG.REPUTATION_MAX).toBe(100)
      expect(GAME_CONFIG.INITIAL_REWIND_CHARGES).toBe(3)
    })
  })

  describe('DIFFICULTY_CONFIG', () => {
    it('should have all difficulty levels', () => {
      expect(DIFFICULTY_CONFIG.easy).toBeDefined()
      expect(DIFFICULTY_CONFIG.normal).toBeDefined()
      expect(DIFFICULTY_CONFIG.hard).toBeDefined()
      expect(DIFFICULTY_CONFIG.nightmare).toBeDefined()
    })

    it('should have harder difficulties with less resources', () => {
      expect(DIFFICULTY_CONFIG.easy.executionDays).toBeGreaterThan(DIFFICULTY_CONFIG.normal.executionDays)
      expect(DIFFICULTY_CONFIG.normal.executionDays).toBeGreaterThan(DIFFICULTY_CONFIG.hard.executionDays)
      expect(DIFFICULTY_CONFIG.hard.executionDays).toBeGreaterThan(DIFFICULTY_CONFIG.nightmare.executionDays)
    })
  })
})
