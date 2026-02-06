import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlayerState } from '@/core/player/PlayerState'
import { GAME_CONFIG, ReputationLevel } from '@/core/types'
import { resetEventBus, on } from '@/lib/events'

describe('PlayerState', () => {
  beforeEach(() => {
    resetEventBus()
  })

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const player = new PlayerState()
      expect(player.gold).toBe(0)
      expect(player.reputation).toBe(GAME_CONFIG.INITIAL_REPUTATION)
      expect(player.goldenDice).toBe(0)
      expect(player.rewindCharges).toBe(GAME_CONFIG.INITIAL_REWIND_CHARGES)
      expect(player.thinkCharges).toBe(GAME_CONFIG.DAILY_THINK_CHARGES)
    })

    it('should initialize with provided values', () => {
      const player = new PlayerState({
        gold: 100,
        reputation: 75,
        goldenDice: 5,
        rewindCharges: 2,
        thinkCharges: 1,
      })
      expect(player.gold).toBe(100)
      expect(player.reputation).toBe(75)
      expect(player.goldenDice).toBe(5)
      expect(player.rewindCharges).toBe(2)
      expect(player.thinkCharges).toBe(1)
    })
  })

  describe('gold management', () => {
    it('should add gold correctly', () => {
      const player = new PlayerState({ gold: 50 })
      const newTotal = player.addGold(30)
      expect(newTotal).toBe(80)
      expect(player.gold).toBe(80)
    })

    it('should not go below 0', () => {
      const player = new PlayerState({ gold: 20 })
      player.addGold(-50)
      expect(player.gold).toBe(0)
    })

    it('should emit event on gold change', () => {
      const handler = vi.fn()
      on('resource:gold_change', handler)
      
      const player = new PlayerState({ gold: 50 })
      player.addGold(20)
      
      expect(handler).toHaveBeenCalledWith({ amount: 20, newTotal: 70 })
    })

    it('removeGold should return false if insufficient', () => {
      const player = new PlayerState({ gold: 10 })
      expect(player.removeGold(20)).toBe(false)
      expect(player.gold).toBe(10)
    })

    it('removeGold should succeed with sufficient gold', () => {
      const player = new PlayerState({ gold: 50 })
      expect(player.removeGold(20)).toBe(true)
      expect(player.gold).toBe(30)
    })
  })

  describe('reputation management', () => {
    it('should add reputation correctly', () => {
      const player = new PlayerState({ reputation: 50 })
      player.addReputation(10)
      expect(player.reputation).toBe(60)
    })

    it('should clamp reputation to 0-100 range', () => {
      const player = new PlayerState({ reputation: 95 })
      player.addReputation(20)
      expect(player.reputation).toBe(100)

      player.addReputation(-150)
      expect(player.reputation).toBe(0)
    })

    it('should emit event on reputation change', () => {
      const handler = vi.fn()
      on('resource:reputation_change', handler)
      
      const player = new PlayerState({ reputation: 50 })
      player.addReputation(-10)
      
      expect(handler).toHaveBeenCalledWith({ amount: -10, newTotal: 40 })
    })
  })

  describe('getReputationLevel()', () => {
    it('should return correct reputation levels', () => {
      const testCases: [number, ReputationLevel][] = [
        [0, ReputationLevel.Humble],
        [19, ReputationLevel.Humble],
        [20, ReputationLevel.Common],
        [39, ReputationLevel.Common],
        [40, ReputationLevel.Respected],
        [59, ReputationLevel.Respected],
        [60, ReputationLevel.Prominent],
        [79, ReputationLevel.Prominent],
        [80, ReputationLevel.Legendary],
        [100, ReputationLevel.Legendary],
      ]

      for (const [rep, expected] of testCases) {
        const player = new PlayerState({ reputation: rep })
        expect(player.getReputationLevel()).toBe(expected)
      }
    })
  })

  describe('golden dice management', () => {
    it('should add golden dice', () => {
      const player = new PlayerState({ goldenDice: 2 })
      player.addGoldenDice(3)
      expect(player.goldenDice).toBe(5)
    })

    it('should use golden dice', () => {
      const player = new PlayerState({ goldenDice: 3 })
      expect(player.useGoldenDice(2)).toBe(true)
      expect(player.goldenDice).toBe(1)
    })

    it('should fail to use if insufficient', () => {
      const player = new PlayerState({ goldenDice: 1 })
      expect(player.useGoldenDice(3)).toBe(false)
      expect(player.goldenDice).toBe(1)
    })
  })

  describe('rewind charges management', () => {
    it('should use rewind charge', () => {
      const player = new PlayerState({ rewindCharges: 3 })
      expect(player.useRewind()).toBe(true)
      expect(player.rewindCharges).toBe(2)
    })

    it('should fail if no charges left', () => {
      const player = new PlayerState({ rewindCharges: 0 })
      expect(player.useRewind()).toBe(false)
    })
  })

  describe('think charges management', () => {
    it('should use think charge', () => {
      const player = new PlayerState({ thinkCharges: 3 })
      expect(player.useThinkCharge()).toBe(true)
      expect(player.thinkCharges).toBe(2)
    })

    it('should fail if no charges left', () => {
      const player = new PlayerState({ thinkCharges: 0 })
      expect(player.useThinkCharge()).toBe(false)
    })

    it('should reset think charges', () => {
      const player = new PlayerState({ thinkCharges: 0 })
      player.resetThinkCharges()
      expect(player.thinkCharges).toBe(GAME_CONFIG.DAILY_THINK_CHARGES)
    })
  })

  describe('serialization', () => {
    it('should serialize to data object', () => {
      const player = new PlayerState({
        gold: 100,
        reputation: 75,
        goldenDice: 5,
        rewindCharges: 2,
        thinkCharges: 1,
      })
      
      const data = player.toData()
      expect(data.gold).toBe(100)
      expect(data.reputation).toBe(75)
    })

    it('should deserialize from data object', () => {
      const data = {
        gold: 100,
        reputation: 75,
        goldenDice: 5,
        rewindCharges: 2,
        thinkCharges: 1,
      }
      
      const player = PlayerState.fromData(data)
      expect(player.gold).toBe(100)
      expect(player.reputation).toBe(75)
    })
  })

  describe('clone()', () => {
    it('should create independent copy', () => {
      const player = new PlayerState({ gold: 100 })
      const clone = player.clone()
      
      clone.addGold(50)
      
      expect(player.gold).toBe(100)
      expect(clone.gold).toBe(150)
    })
  })
})
