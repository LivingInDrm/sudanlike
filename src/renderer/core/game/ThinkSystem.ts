import type { CardManager } from '@/core/card/CardManager'
import type { PlayerState } from '@/core/player/PlayerState'
import { emit } from '@/lib/events'
import { GAME_CONFIG } from '@/core/types'

export interface ThinkResult {
  success: boolean
  message: string
}

export class ThinkSystem {
  private usedToday: Set<string> = new Set()

  constructor(
    private playerState: PlayerState,
    private cardManager: CardManager
  ) {}

  canUseThink(cardId: string): boolean {
    if (this.playerState.thinkCharges <= 0) {
      return false
    }

    if (this.usedToday.has(cardId)) {
      return false
    }

    const card = this.cardManager.getCard(cardId)
    if (!card) {
      return false
    }

    if (this.cardManager.isCardLocked(cardId)) {
      return false
    }

    return true
  }

  useThink(cardId: string): ThinkResult {
    if (!this.canUseThink(cardId)) {
      return { success: false, message: 'Cannot use think on this card' }
    }

    if (!this.playerState.useThinkCharge()) {
      return { success: false, message: 'No think charges remaining' }
    }

    this.usedToday.add(cardId)
    emit('think:use', { cardId })

    return { success: true, message: 'Think used successfully' }
  }

  resetDaily(): void {
    this.usedToday.clear()
    this.playerState.resetThinkCharges()
  }

  getRemainingCharges(): number {
    return this.playerState.thinkCharges
  }

  isUsedToday(cardId: string): boolean {
    return this.usedToday.has(cardId)
  }

  getUsedTodayList(): string[] {
    return Array.from(this.usedToday)
  }

  restoreUsedToday(cardIds: string[]): void {
    this.usedToday = new Set(cardIds)
  }
}
