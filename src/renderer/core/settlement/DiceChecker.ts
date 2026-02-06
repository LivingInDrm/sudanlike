import { SeededRandom, getGlobalRandom } from '@/lib/random'
import { emit } from '@/lib/events'
import { CheckResult, DICE_CONFIG } from '@/core/types'
import type { DiceRoll, DiceCheckState } from '@/core/types'
import { determineCheckResult } from './DicePoolCalculator'

export interface DiceCheckerOptions {
  random?: SeededRandom
}

export class DiceChecker {
  private random: SeededRandom
  private state: DiceCheckState | null = null

  constructor(options?: DiceCheckerOptions) {
    this.random = options?.random || getGlobalRandom()
  }

  startCheck(dicePool: number, target: number, rerollAvailable: number = 0): DiceCheckState {
    const effectiveDicePool = Math.min(dicePool, DICE_CONFIG.MAX_DICE_POOL)
    
    this.state = {
      dice_pool: effectiveDicePool,
      target,
      rolls: [],
      explosion_rolls: [],
      reroll_available: rerollAvailable,
      reroll_used: 0,
      golden_dice_used: 0,
      success_count: 0,
      phase: 'rolling',
    }

    emit('dice:roll_start', { dicePool: effectiveDicePool, target })
    
    return this.state
  }

  rollInitial(): DiceCheckState {
    if (!this.state) {
      throw new Error('No active dice check')
    }

    this.state.rolls = []
    
    for (let i = 0; i < this.state.dice_pool; i++) {
      const value = this.random.rollDice(DICE_CONFIG.SIDES)
      this.state.rolls.push({
        value,
        is_success: value >= DICE_CONFIG.SUCCESS_THRESHOLD,
        is_explosion: value === DICE_CONFIG.EXPLOSION_VALUE,
        is_rerolled: false,
      })
    }

    this.processExplosions()
    this.updateSuccessCount()
    
    emit('dice:roll_result', {
      rolls: this.state.rolls.map(r => r.value),
      successes: this.state.success_count,
    })

    if (this.state.reroll_available > 0) {
      this.state.phase = 'reroll'
    } else {
      this.state.phase = 'golden_dice'
    }

    return { ...this.state }
  }

  private processExplosions(): void {
    if (!this.state) return

    let explosionCount = this.state.rolls.filter(r => r.is_explosion).length
    let totalExplosions = 0

    while (explosionCount > 0 && totalExplosions < DICE_CONFIG.MAX_EXPLOSION_DICE) {
      const newExplosions: DiceRoll[] = []
      
      for (let i = 0; i < explosionCount && totalExplosions < DICE_CONFIG.MAX_EXPLOSION_DICE; i++) {
        const value = this.random.rollDice(DICE_CONFIG.SIDES)
        const roll: DiceRoll = {
          value,
          is_success: value >= DICE_CONFIG.SUCCESS_THRESHOLD,
          is_explosion: value === DICE_CONFIG.EXPLOSION_VALUE,
          is_rerolled: false,
        }
        newExplosions.push(roll)
        this.state.explosion_rolls.push(roll)
        totalExplosions++

        if (roll.is_explosion) {
          emit('dice:explosion', { roll: value })
        }
      }

      explosionCount = newExplosions.filter(r => r.is_explosion).length
    }
  }

  private updateSuccessCount(): void {
    if (!this.state) return

    const mainSuccesses = this.state.rolls.filter(r => r.is_success).length
    const explosionSuccesses = this.state.explosion_rolls.filter(r => r.is_success).length
    
    this.state.success_count = mainSuccesses + explosionSuccesses + this.state.golden_dice_used
  }

  reroll(diceIndices: number[]): DiceCheckState {
    if (!this.state) {
      throw new Error('No active dice check')
    }

    if (this.state.phase !== 'reroll') {
      throw new Error('Not in reroll phase')
    }

    const validIndices = diceIndices.filter(i => {
      const roll = this.state!.rolls[i]
      return roll && !roll.is_success && !roll.is_rerolled
    })

    const rerollCount = Math.min(
      validIndices.length,
      this.state.reroll_available - this.state.reroll_used
    )

    const indicesToReroll = validIndices.slice(0, rerollCount)
    const newRolls: number[] = []

    for (const index of indicesToReroll) {
      const oldValue = this.state.rolls[index].value
      const newValue = this.random.rollDice(DICE_CONFIG.SIDES)
      
      this.state.rolls[index] = {
        value: newValue,
        is_success: newValue >= DICE_CONFIG.SUCCESS_THRESHOLD,
        is_explosion: newValue === DICE_CONFIG.EXPLOSION_VALUE,
        is_rerolled: true,
        original_value: oldValue,
      }
      
      newRolls.push(newValue)
      this.state.reroll_used++
    }

    const newExplosionDice = this.state.rolls.filter(r => r.is_rerolled && r.is_explosion)
    if (newExplosionDice.length > 0) {
      this.processExplosions()
    }

    this.updateSuccessCount()

    emit('dice:reroll', { indices: indicesToReroll, newRolls })

    if (this.state.reroll_used >= this.state.reroll_available || 
        !this.state.rolls.some(r => !r.is_success && !r.is_rerolled)) {
      this.state.phase = 'golden_dice'
    }

    return { ...this.state }
  }

  skipReroll(): DiceCheckState {
    if (!this.state) {
      throw new Error('No active dice check')
    }

    this.state.phase = 'golden_dice'
    return { ...this.state }
  }

  useGoldenDice(count: number): DiceCheckState {
    if (!this.state) {
      throw new Error('No active dice check')
    }

    if (this.state.phase !== 'golden_dice') {
      throw new Error('Not in golden dice phase')
    }

    if (count < 0) {
      throw new Error('Count must be non-negative')
    }

    this.state.golden_dice_used += count
    this.updateSuccessCount()

    emit('dice:golden_dice', { count })

    return { ...this.state }
  }

  skipGoldenDice(): DiceCheckState {
    if (!this.state) {
      throw new Error('No active dice check')
    }

    this.state.phase = 'result'
    return this.finalize()
  }

  finalize(): DiceCheckState {
    if (!this.state) {
      throw new Error('No active dice check')
    }

    this.state.phase = 'result'
    this.state.result = determineCheckResult(this.state.success_count, this.state.target)

    emit('dice:complete', { state: { ...this.state }, result: this.state.result })

    return { ...this.state }
  }

  getState(): DiceCheckState | null {
    return this.state ? { ...this.state } : null
  }

  getAllRolls(): DiceRoll[] {
    if (!this.state) return []
    return [...this.state.rolls, ...this.state.explosion_rolls]
  }

  getFailedRollIndices(): number[] {
    if (!this.state) return []
    
    return this.state.rolls
      .map((roll, index) => ({ roll, index }))
      .filter(({ roll }) => !roll.is_success && !roll.is_rerolled)
      .map(({ index }) => index)
  }

  canReroll(): boolean {
    if (!this.state) return false
    return this.state.phase === 'reroll' && 
           this.state.reroll_used < this.state.reroll_available &&
           this.getFailedRollIndices().length > 0
  }

  getRemainingRerolls(): number {
    if (!this.state) return 0
    return Math.max(0, this.state.reroll_available - this.state.reroll_used)
  }

  reset(): void {
    this.state = null
  }
}

export function createDiceChecker(options?: DiceCheckerOptions): DiceChecker {
  return new DiceChecker(options)
}
