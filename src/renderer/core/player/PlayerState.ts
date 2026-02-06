import { GAME_CONFIG, ReputationLevel, REPUTATION_LEVEL_RANGES } from '@/core/types'
import { emit } from '@/lib/events'

export interface PlayerStateData {
  gold: number
  reputation: number
  goldenDice: number
  rewindCharges: number
  thinkCharges: number
}

export class PlayerState {
  private _gold: number
  private _reputation: number
  private _goldenDice: number
  private _rewindCharges: number
  private _thinkCharges: number

  constructor(initialData?: Partial<PlayerStateData>) {
    this._gold = initialData?.gold ?? 0
    this._reputation = initialData?.reputation ?? GAME_CONFIG.INITIAL_REPUTATION
    this._goldenDice = initialData?.goldenDice ?? 0
    this._rewindCharges = initialData?.rewindCharges ?? GAME_CONFIG.INITIAL_REWIND_CHARGES
    this._thinkCharges = initialData?.thinkCharges ?? GAME_CONFIG.DAILY_THINK_CHARGES
  }

  get gold(): number {
    return this._gold
  }

  get reputation(): number {
    return this._reputation
  }

  get goldenDice(): number {
    return this._goldenDice
  }

  get rewindCharges(): number {
    return this._rewindCharges
  }

  get thinkCharges(): number {
    return this._thinkCharges
  }

  addGold(amount: number): number {
    const newTotal = Math.max(0, this._gold + amount)
    const actualChange = newTotal - this._gold
    this._gold = newTotal
    
    if (actualChange !== 0) {
      emit('resource:gold_change', { amount: actualChange, newTotal: this._gold })
    }
    
    return this._gold
  }

  removeGold(amount: number): boolean {
    if (amount < 0) {
      throw new Error('Amount must be positive')
    }
    if (this._gold < amount) {
      return false
    }
    this.addGold(-amount)
    return true
  }

  setGold(value: number): void {
    const clamped = Math.max(0, value)
    if (clamped !== this._gold) {
      const change = clamped - this._gold
      this._gold = clamped
      emit('resource:gold_change', { amount: change, newTotal: this._gold })
    }
  }

  addReputation(amount: number): number {
    const newValue = Math.max(
      GAME_CONFIG.REPUTATION_MIN,
      Math.min(GAME_CONFIG.REPUTATION_MAX, this._reputation + amount)
    )
    const actualChange = newValue - this._reputation
    this._reputation = newValue
    
    if (actualChange !== 0) {
      emit('resource:reputation_change', { amount: actualChange, newTotal: this._reputation })
    }
    
    return this._reputation
  }

  setReputation(value: number): void {
    const clamped = Math.max(
      GAME_CONFIG.REPUTATION_MIN,
      Math.min(GAME_CONFIG.REPUTATION_MAX, value)
    )
    if (clamped !== this._reputation) {
      const change = clamped - this._reputation
      this._reputation = clamped
      emit('resource:reputation_change', { amount: change, newTotal: this._reputation })
    }
  }

  getReputationLevel(): ReputationLevel {
    for (const [level, range] of Object.entries(REPUTATION_LEVEL_RANGES)) {
      if (this._reputation >= range.min && this._reputation <= range.max) {
        return level as ReputationLevel
      }
    }
    return ReputationLevel.Common
  }

  addGoldenDice(amount: number): number {
    const newTotal = Math.max(0, this._goldenDice + amount)
    const actualChange = newTotal - this._goldenDice
    this._goldenDice = newTotal
    
    if (actualChange !== 0) {
      emit('resource:golden_dice_change', { amount: actualChange, newTotal: this._goldenDice })
    }
    
    return this._goldenDice
  }

  useGoldenDice(count: number = 1): boolean {
    if (count < 0) {
      throw new Error('Count must be positive')
    }
    if (this._goldenDice < count) {
      return false
    }
    this.addGoldenDice(-count)
    return true
  }

  addRewindCharges(amount: number): number {
    const newTotal = Math.max(0, this._rewindCharges + amount)
    const actualChange = newTotal - this._rewindCharges
    this._rewindCharges = newTotal
    
    if (actualChange !== 0) {
      emit('resource:rewind_change', { amount: actualChange, newTotal: this._rewindCharges })
    }
    
    return this._rewindCharges
  }

  useRewind(): boolean {
    if (this._rewindCharges <= 0) {
      return false
    }
    this.addRewindCharges(-1)
    return true
  }

  useThinkCharge(): boolean {
    if (this._thinkCharges <= 0) {
      return false
    }
    this._thinkCharges--
    return true
  }

  resetThinkCharges(): void {
    this._thinkCharges = GAME_CONFIG.DAILY_THINK_CHARGES
    emit('think:reset', undefined as unknown as void)
  }

  setThinkCharges(value: number): void {
    this._thinkCharges = Math.max(0, value)
  }

  toData(): PlayerStateData {
    return {
      gold: this._gold,
      reputation: this._reputation,
      goldenDice: this._goldenDice,
      rewindCharges: this._rewindCharges,
      thinkCharges: this._thinkCharges,
    }
  }

  static fromData(data: PlayerStateData): PlayerState {
    return new PlayerState(data)
  }

  clone(): PlayerState {
    return new PlayerState(this.toData())
  }
}
