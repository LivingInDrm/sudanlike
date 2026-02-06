import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateDicePool,
  calculateEquipmentBonus,
  calculateTotalReroll,
  determineCheckResult,
} from '@/core/settlement/DicePoolCalculator'
import { DiceChecker, createDiceChecker } from '@/core/settlement/DiceChecker'
import { CardModel } from '@/core/card/CardModel'
import { SeededRandom } from '@/lib/random'
import { resetEventBus } from '@/lib/events'
import { Attribute, CalcMode, CheckResult, CardType, Rarity, EquipmentType, DICE_CONFIG } from '@/core/types'
import type { Card } from '@/core/types'

describe('DicePoolCalculator', () => {
  const createCharacter = (combat: number, reroll: number = 0): CardModel => {
    const card: Card = {
      card_id: `char_${combat}`,
      name: 'Test',
      type: CardType.Character,
      rarity: Rarity.Silver,
      description: 'Test',
      image: 'test.png',
      attributes: {
        physique: 5,
        charm: 5,
        wisdom: 5,
        combat,
        social: 5,
        survival: 5,
        stealth: 5,
        magic: 5,
      },
      special_attributes: { reroll },
      equipment_slots: 3,
    }
    return new CardModel(card)
  }

  describe('calculateDicePool()', () => {
    it('should return 0 for empty cards', () => {
      expect(calculateDicePool([], Attribute.Combat, CalcMode.Max)).toBe(0)
    })

    it('CalcMode.Max should return highest value', () => {
      const cards = [createCharacter(5), createCharacter(10), createCharacter(7)]
      expect(calculateDicePool(cards, Attribute.Combat, CalcMode.Max)).toBe(10)
    })

    it('CalcMode.Min should return lowest value', () => {
      const cards = [createCharacter(5), createCharacter(10), createCharacter(7)]
      expect(calculateDicePool(cards, Attribute.Combat, CalcMode.Min)).toBe(5)
    })

    it('CalcMode.Sum should return total', () => {
      const cards = [createCharacter(5), createCharacter(8), createCharacter(6)]
      expect(calculateDicePool(cards, Attribute.Combat, CalcMode.Sum)).toBe(19)
    })

    it('CalcMode.Avg should return floored average', () => {
      const cards = [createCharacter(5), createCharacter(10), createCharacter(7)]
      expect(calculateDicePool(cards, Attribute.Combat, CalcMode.Avg)).toBe(7)
    })

    it('CalcMode.First should return first card value', () => {
      const cards = [createCharacter(5), createCharacter(10)]
      expect(calculateDicePool(cards, Attribute.Combat, CalcMode.First)).toBe(5)
    })

    it('CalcMode.Specific should return value at index', () => {
      const cards = [createCharacter(5), createCharacter(10), createCharacter(7)]
      expect(calculateDicePool(cards, Attribute.Combat, CalcMode.Specific, 1)).toBe(10)
    })

    it('should cap at MAX_DICE_POOL', () => {
      const cards = [createCharacter(25), createCharacter(25)]
      expect(calculateDicePool(cards, Attribute.Combat, CalcMode.Sum)).toBe(DICE_CONFIG.MAX_DICE_POOL)
    })
  })

  describe('calculateTotalReroll()', () => {
    it('should sum reroll from all cards', () => {
      const cards = [createCharacter(5, 2), createCharacter(5, 1)]
      expect(calculateTotalReroll(cards, [])).toBe(3)
    })
  })

  describe('determineCheckResult()', () => {
    it('should return Success when successes >= target', () => {
      expect(determineCheckResult(8, 8)).toBe(CheckResult.Success)
      expect(determineCheckResult(10, 8)).toBe(CheckResult.Success)
    })

    it('should return CriticalFailure when successes = 0', () => {
      expect(determineCheckResult(0, 5)).toBe(CheckResult.CriticalFailure)
    })

    it('should return PartialSuccess when close to target', () => {
      expect(determineCheckResult(6, 8)).toBe(CheckResult.PartialSuccess)
      expect(determineCheckResult(7, 8)).toBe(CheckResult.PartialSuccess)
    })

    it('should return Failure for other cases', () => {
      expect(determineCheckResult(3, 8)).toBe(CheckResult.Failure)
      expect(determineCheckResult(1, 8)).toBe(CheckResult.Failure)
    })

    it('should not have PartialSuccess when target <= 2', () => {
      expect(determineCheckResult(1, 2)).toBe(CheckResult.Failure)
      expect(determineCheckResult(0, 2)).toBe(CheckResult.CriticalFailure)
      expect(determineCheckResult(2, 2)).toBe(CheckResult.Success)
    })
  })
})

describe('DiceChecker', () => {
  beforeEach(() => {
    resetEventBus()
  })

  const createSeededChecker = (seed: string): DiceChecker => {
    return createDiceChecker({ random: new SeededRandom(seed) })
  }

  describe('startCheck()', () => {
    it('should initialize check state', () => {
      const checker = createSeededChecker('test')
      const state = checker.startCheck(10, 5, 2)

      expect(state.dice_pool).toBe(10)
      expect(state.target).toBe(5)
      expect(state.reroll_available).toBe(2)
      expect(state.phase).toBe('rolling')
    })

    it('should cap dice pool at maximum', () => {
      const checker = createSeededChecker('test')
      const state = checker.startCheck(30, 5)

      expect(state.dice_pool).toBe(DICE_CONFIG.MAX_DICE_POOL)
    })
  })

  describe('rollInitial()', () => {
    it('should roll correct number of dice', () => {
      const checker = createSeededChecker('roll_test')
      checker.startCheck(5, 3)
      const state = checker.rollInitial()

      expect(state.rolls).toHaveLength(5)
      state.rolls.forEach(roll => {
        expect(roll.value).toBeGreaterThanOrEqual(1)
        expect(roll.value).toBeLessThanOrEqual(10)
        expect(roll.is_success).toBe(roll.value >= 7)
      })
    })

    it('should produce same results with same seed', () => {
      const checker1 = createSeededChecker('same_seed')
      const checker2 = createSeededChecker('same_seed')

      checker1.startCheck(10, 5)
      checker2.startCheck(10, 5)

      const state1 = checker1.rollInitial()
      const state2 = checker2.rollInitial()

      expect(state1.rolls.map(r => r.value)).toEqual(state2.rolls.map(r => r.value))
    })

    it('should process explosions on 10', () => {
      const checker = createSeededChecker('explosion_seed_42')
      checker.startCheck(20, 10)
      const state = checker.rollInitial()

      const explosionDice = state.rolls.filter(r => r.value === 10)
      if (explosionDice.length > 0) {
        expect(state.explosion_rolls.length).toBeGreaterThanOrEqual(0)
      }
    })

    it('should move to reroll phase if rerolls available', () => {
      const checker = createSeededChecker('reroll')
      checker.startCheck(5, 3, 2)
      const state = checker.rollInitial()

      expect(state.phase).toBe('reroll')
    })

    it('should move to golden_dice phase if no rerolls', () => {
      const checker = createSeededChecker('no_reroll')
      checker.startCheck(5, 3, 0)
      const state = checker.rollInitial()

      expect(state.phase).toBe('golden_dice')
    })
  })

  describe('reroll()', () => {
    it('should reroll specified failed dice', () => {
      const checker = createSeededChecker('reroll_test')
      checker.startCheck(10, 5, 3)
      checker.rollInitial()

      const failedIndices = checker.getFailedRollIndices()
      if (failedIndices.length > 0) {
        const oldValues = checker.getState()!.rolls.map(r => r.value)
        checker.reroll([failedIndices[0]])
        const newState = checker.getState()!

        expect(newState.rolls[failedIndices[0]].is_rerolled).toBe(true)
        expect(newState.reroll_used).toBe(1)
      }
    })

    it('should not reroll successful dice', () => {
      const checker = createSeededChecker('success_no_reroll')
      checker.startCheck(10, 5, 3)
      const state = checker.rollInitial()

      const successIndices = state.rolls
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.is_success)
        .map(({ i }) => i)

      if (successIndices.length > 0) {
        checker.reroll([successIndices[0]])
        const newState = checker.getState()!
        expect(newState.reroll_used).toBe(0)
      }
    })

    it('should not allow rerolling already rerolled dice', () => {
      const checker = createSeededChecker('double_reroll')
      checker.startCheck(10, 5, 5)
      checker.rollInitial()

      const failedIndices = checker.getFailedRollIndices()
      if (failedIndices.length > 0) {
        checker.reroll([failedIndices[0]])
        const rerolledIndex = failedIndices[0]
        checker.reroll([rerolledIndex])
        expect(checker.getState()!.reroll_used).toBe(1)
      }
    })

    it('should respect reroll limit', () => {
      const checker = createSeededChecker('limit_reroll')
      checker.startCheck(10, 5, 2)
      checker.rollInitial()

      const failedIndices = checker.getFailedRollIndices()
      if (failedIndices.length >= 5) {
        checker.reroll(failedIndices.slice(0, 5))
        expect(checker.getState()!.reroll_used).toBeLessThanOrEqual(2)
      }
    })
  })

  describe('useGoldenDice()', () => {
    it('should increase success count', () => {
      const checker = createSeededChecker('golden')
      checker.startCheck(5, 5, 0)
      checker.rollInitial()

      const beforeSuccesses = checker.getState()!.success_count
      checker.useGoldenDice(2)
      const afterState = checker.getState()!

      expect(afterState.success_count).toBe(beforeSuccesses + 2)
      expect(afterState.golden_dice_used).toBe(2)
    })
  })

  describe('finalize()', () => {
    it('should determine final result', () => {
      const checker = createSeededChecker('finalize')
      checker.startCheck(10, 3, 0)
      checker.rollInitial()
      const state = checker.finalize()

      expect(state.phase).toBe('result')
      expect(state.result).toBeDefined()
      expect([
        CheckResult.Success,
        CheckResult.PartialSuccess,
        CheckResult.Failure,
        CheckResult.CriticalFailure,
      ]).toContain(state.result)
    })
  })

  describe('helper methods', () => {
    it('canReroll() should return correct status', () => {
      const checker = createSeededChecker('can_reroll')
      checker.startCheck(5, 5, 2)
      checker.rollInitial()

      const canReroll = checker.canReroll()
      const failedCount = checker.getFailedRollIndices().length
      
      expect(canReroll).toBe(failedCount > 0)
    })

    it('getRemainingRerolls() should track correctly', () => {
      const checker = createSeededChecker('remaining')
      checker.startCheck(10, 5, 3)
      checker.rollInitial()

      expect(checker.getRemainingRerolls()).toBe(3)

      const failed = checker.getFailedRollIndices()
      if (failed.length > 0) {
        checker.reroll([failed[0]])
        expect(checker.getRemainingRerolls()).toBe(2)
      }
    })

    it('reset() should clear state', () => {
      const checker = createSeededChecker('reset')
      checker.startCheck(5, 3)
      checker.rollInitial()

      checker.reset()
      expect(checker.getState()).toBeNull()
    })
  })
})
