import mitt, { Emitter, Handler } from 'mitt'
import type { Effects, SettlementResult, DiceCheckState, CheckResult } from '@/core/types'

export type GameEvents = {
  'game:start': { difficulty: string; seed: string }
  'game:load': { saveId: string }
  'game:save': { saveId: string }
  'game:end': { isVictory: boolean; endingType: string }

  'day:start': { day: number }
  'day:end': { day: number }
  'day:dawn': { day: number; countdown: number }
  'day:action': { day: number }
  'day:settlement': { day: number }

  'scene:unlock': { sceneId: string }
  'scene:participate': { sceneId: string; cards: string[] }
  'scene:settle': { sceneId: string; result: SettlementResult }
  'scene:complete': { sceneId: string }
  'scene:expire': { sceneId: string }

  'card:add': { cardId: string }
  'card:remove': { cardId: string }
  'card:equip': { characterId: string; equipmentId: string }
  'card:unequip': { characterId: string; equipmentId: string }
  'card:tag_add': { cardId: string; tag: string }
  'card:tag_remove': { cardId: string; tag: string }
  'card:lock': { cardId: string; sceneId: string }
  'card:unlock': { cardId: string }

  'dice:roll_start': { dicePool: number; target: number }
  'dice:roll_result': { rolls: number[]; successes: number }
  'dice:explosion': { roll: number }
  'dice:reroll': { indices: number[]; newRolls: number[] }
  'dice:golden_dice': { count: number }
  'dice:complete': { state: DiceCheckState; result: CheckResult }

  'resource:gold_change': { amount: number; newTotal: number }
  'resource:reputation_change': { amount: number; newTotal: number }
  'resource:golden_dice_change': { amount: number; newTotal: number }
  'resource:rewind_change': { amount: number; newTotal: number }

  'think:use': { cardId: string }
  'think:reset': void

  'effects:apply': { effects: Effects }

  'ui:notification': { message: string; type: 'info' | 'success' | 'warning' | 'error' }
  'ui:modal_open': { modalId: string; data?: unknown }
  'ui:modal_close': { modalId: string }
  'ui:screen_change': { screen: string }
}

export type EventBus = Emitter<GameEvents>

let eventBus: EventBus | null = null

export function getEventBus(): EventBus {
  if (!eventBus) {
    eventBus = mitt<GameEvents>()
  }
  return eventBus
}

export function resetEventBus(): void {
  if (eventBus) {
    eventBus.all.clear()
  }
  eventBus = mitt<GameEvents>()
}

export function emit<K extends keyof GameEvents>(
  type: K,
  event: GameEvents[K]
): void {
  getEventBus().emit(type, event)
}

export function on<K extends keyof GameEvents>(
  type: K,
  handler: Handler<GameEvents[K]>
): void {
  getEventBus().on(type, handler)
}

export function off<K extends keyof GameEvents>(
  type: K,
  handler?: Handler<GameEvents[K]>
): void {
  getEventBus().off(type, handler)
}

export function once<K extends keyof GameEvents>(
  type: K,
  handler: Handler<GameEvents[K]>
): void {
  const wrappedHandler: Handler<GameEvents[K]> = (event) => {
    off(type, wrappedHandler)
    handler(event)
  }
  on(type, wrappedHandler)
}
