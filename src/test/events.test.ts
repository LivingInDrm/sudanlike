import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getEventBus,
  resetEventBus,
  emit,
  on,
  off,
  once,
} from '@/lib/events'

describe('EventBus', () => {
  beforeEach(() => {
    resetEventBus()
  })

  describe('getEventBus()', () => {
    it('should return same instance', () => {
      const bus1 = getEventBus()
      const bus2 = getEventBus()
      expect(bus1).toBe(bus2)
    })
  })

  describe('resetEventBus()', () => {
    it('should create new bus instance', () => {
      const bus1 = getEventBus()
      const handler = vi.fn()
      bus1.on('game:start', handler)
      
      resetEventBus()
      
      emit('game:start', { difficulty: 'normal', seed: 'test' })
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('emit() and on()', () => {
    it('should trigger handler with correct event data', () => {
      const handler = vi.fn()
      on('game:start', handler)

      const eventData = { difficulty: 'normal', seed: 'test_seed' }
      emit('game:start', eventData)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(eventData)
    })

    it('should support multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      on('day:start', handler1)
      on('day:start', handler2)

      emit('day:start', { day: 1 })

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should handle various event types', () => {
      const gameHandler = vi.fn()
      const diceHandler = vi.fn()
      const resourceHandler = vi.fn()

      on('game:end', gameHandler)
      on('dice:roll_start', diceHandler)
      on('resource:gold_change', resourceHandler)

      emit('game:end', { isVictory: true, endingType: 'survival_victory' })
      emit('dice:roll_start', { dicePool: 10, target: 5 })
      emit('resource:gold_change', { amount: 20, newTotal: 50 })

      expect(gameHandler).toHaveBeenCalledWith({ isVictory: true, endingType: 'survival_victory' })
      expect(diceHandler).toHaveBeenCalledWith({ dicePool: 10, target: 5 })
      expect(resourceHandler).toHaveBeenCalledWith({ amount: 20, newTotal: 50 })
    })
  })

  describe('off()', () => {
    it('should remove specific handler', () => {
      const handler = vi.fn()
      on('card:add', handler)
      
      emit('card:add', { cardId: 'card_001' })
      expect(handler).toHaveBeenCalledTimes(1)

      off('card:add', handler)
      
      emit('card:add', { cardId: 'card_002' })
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not affect other handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      on('scene:unlock', handler1)
      on('scene:unlock', handler2)

      off('scene:unlock', handler1)

      emit('scene:unlock', { sceneId: 'scene_001' })

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe('once()', () => {
    it('should trigger handler only once', () => {
      const handler = vi.fn()
      once('think:use', handler)

      emit('think:use', { cardId: 'card_001' })
      emit('think:use', { cardId: 'card_002' })
      emit('think:use', { cardId: 'card_003' })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ cardId: 'card_001' })
    })

    it('should auto-unsubscribe after first call', () => {
      const handler = vi.fn()
      once('ui:notification', handler)

      emit('ui:notification', { message: 'First', type: 'info' })
      emit('ui:notification', { message: 'Second', type: 'success' })

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('complex scenarios', () => {
    it('should handle event chains', () => {
      const results: string[] = []

      on('day:dawn', () => {
        results.push('dawn')
        emit('resource:gold_change', { amount: 5, newTotal: 35 })
      })

      on('resource:gold_change', (e) => {
        results.push(`gold:${e.amount}`)
      })

      emit('day:dawn', { day: 1, countdown: 14 })

      expect(results).toEqual(['dawn', 'gold:5'])
    })

    it('should handle rapid sequential events', () => {
      const handler = vi.fn()
      on('dice:explosion', handler)

      for (let i = 0; i < 20; i++) {
        emit('dice:explosion', { roll: 10 })
      }

      expect(handler).toHaveBeenCalledTimes(20)
    })
  })
})
