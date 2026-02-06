import { describe, it, expect, beforeEach } from 'vitest'
import { TimeManager } from '@/core/game/TimeManager'
import { ThinkSystem } from '@/core/game/ThinkSystem'
import { DayManager } from '@/core/game/DayManager'
import { GameManager, getGameManager, resetGameManager } from '@/core/game/GameManager'
import { CardManager } from '@/core/card/CardManager'
import { PlayerState } from '@/core/player/PlayerState'
import { SceneManager } from '@/core/scene/SceneManager'
import { resetEventBus } from '@/lib/events'
import { CardType, Rarity, GAME_CONFIG } from '@/core/types'
import type { Card } from '@/core/types'

const createProtagonist = (): Card => ({
  card_id: 'protagonist_001',
  name: 'Protagonist',
  type: CardType.Character,
  rarity: Rarity.Gold,
  description: 'Main character',
  image: 'protagonist.png',
  attributes: { physique: 8, charm: 8, wisdom: 8, combat: 8, social: 8, survival: 8, stealth: 8, magic: 8 },
  tags: ['protagonist'],
  equipment_slots: 4,
})

const createSultanCard = (): Card => ({
  card_id: 'sultan_001',
  name: 'Sultan',
  type: CardType.Sultan,
  rarity: Rarity.Gold,
  description: 'The Sultan',
  image: 'sultan.png',
})

describe('TimeManager', () => {
  let timeManager: TimeManager

  beforeEach(() => {
    timeManager = new TimeManager(14)
  })

  describe('advanceDay()', () => {
    it('should increment day and decrement countdown', () => {
      expect(timeManager.getCurrentDay()).toBe(1)
      expect(timeManager.getExecutionCountdown()).toBe(14)

      timeManager.advanceDay()

      expect(timeManager.getCurrentDay()).toBe(2)
      expect(timeManager.getExecutionCountdown()).toBe(13)
    })

    it('countdown should not go below 0', () => {
      for (let i = 0; i < 20; i++) {
        timeManager.advanceDay()
      }
      expect(timeManager.getExecutionCountdown()).toBe(0)
    })
  })

  describe('isExecutionDay()', () => {
    it('should return true when countdown is 0', () => {
      expect(timeManager.isExecutionDay()).toBe(false)

      for (let i = 0; i < 14; i++) {
        timeManager.advanceDay()
      }

      expect(timeManager.isExecutionDay()).toBe(true)
    })
  })

  describe('state snapshots', () => {
    it('should push and pop snapshots', () => {
      const saveData = { save_id: 'test' } as any
      timeManager.pushStateSnapshot(saveData)

      expect(timeManager.canRewind()).toBe(true)
      expect(timeManager.getHistoryLength()).toBe(1)

      const popped = timeManager.popStateSnapshot()
      expect(popped).toBe(saveData)
      expect(timeManager.canRewind()).toBe(false)
    })

    it('should limit history size', () => {
      for (let i = 0; i < 15; i++) {
        timeManager.pushStateSnapshot({ save_id: `save_${i}` } as any)
      }
      expect(timeManager.getHistoryLength()).toBeLessThanOrEqual(10)
    })
  })
})

describe('ThinkSystem', () => {
  let thinkSystem: ThinkSystem
  let playerState: PlayerState
  let cardManager: CardManager

  beforeEach(() => {
    resetEventBus()
    playerState = new PlayerState({ thinkCharges: 3 })
    cardManager = new CardManager()
    thinkSystem = new ThinkSystem(playerState, cardManager)
  })

  describe('useThink()', () => {
    it('should use think charge', () => {
      const card = cardManager.addCard(createProtagonist())
      const result = thinkSystem.useThink(card.instance_id)

      expect(result.success).toBe(true)
      expect(thinkSystem.getRemainingCharges()).toBe(2)
    })

    it('should not allow same card twice per day', () => {
      const card = cardManager.addCard(createProtagonist())
      thinkSystem.useThink(card.instance_id)

      const result = thinkSystem.useThink(card.instance_id)
      expect(result.success).toBe(false)
    })

    it('should fail when no charges left', () => {
      playerState.setThinkCharges(0)
      const card = cardManager.addCard(createProtagonist())

      expect(thinkSystem.canUseThink(card.instance_id)).toBe(false)
    })
  })

  describe('resetDaily()', () => {
    it('should reset charges and used list', () => {
      const card = cardManager.addCard(createProtagonist())
      thinkSystem.useThink(card.instance_id)

      thinkSystem.resetDaily()

      expect(thinkSystem.getRemainingCharges()).toBe(GAME_CONFIG.DAILY_THINK_CHARGES)
      expect(thinkSystem.isUsedToday(card.instance_id)).toBe(false)
    })
  })
})

describe('GameManager', () => {
  beforeEach(() => {
    resetEventBus()
    resetGameManager()
  })

  describe('startNewGame()', () => {
    it('should initialize game with difficulty settings', () => {
      const gm = getGameManager()
      gm.startNewGame('normal')

      expect(gm.isGameInitialized()).toBe(true)
      expect(gm.getDifficulty()).toBe('normal')
      expect(gm.getTimeManager().getExecutionCountdown()).toBe(14)
    })

    it('should apply easy difficulty settings', () => {
      const gm = getGameManager()
      gm.startNewGame('easy')

      expect(gm.getTimeManager().getExecutionCountdown()).toBe(21)
      expect(gm.getPlayerState().gold).toBe(50)
    })
  })

  describe('checkGameEnd()', () => {
    it('should detect execution failure without sultan', () => {
      const gm = getGameManager()
      gm.startNewGame('nightmare')

      for (let i = 0; i < 5; i++) {
        gm.getTimeManager().advanceDay()
      }

      const result = gm.checkGameEnd()
      expect(result).not.toBeNull()
      expect(result?.is_victory).toBe(false)
      expect(result?.ending_type).toBe('execution_failure')
    })

    it('should detect survival victory with sultan', () => {
      const gm = getGameManager()
      gm.startNewGame('nightmare')
      gm.getCardManager().addCard(createSultanCard())

      for (let i = 0; i < 5; i++) {
        gm.getTimeManager().advanceDay()
      }

      const result = gm.checkGameEnd()
      expect(result).not.toBeNull()
      expect(result?.is_victory).toBe(true)
      expect(result?.ending_type).toBe('survival_victory')
    })
  })

  describe('createSaveData()', () => {
    it('should create valid save data', () => {
      const gm = getGameManager()
      gm.startNewGame('normal', 'test_seed')

      const saveData = gm.createSaveData('save_001')

      expect(saveData.save_id).toBe('save_001')
      expect(saveData.difficulty).toBe('normal')
      expect(saveData.random_seed).toBe('test_seed')
      expect(saveData.game_state.current_day).toBe(1)
    })
  })

  describe('loadGame()', () => {
    it('should restore game state', () => {
      const gm = getGameManager()
      gm.startNewGame('normal')

      const saveData = gm.createSaveData()
      saveData.game_state.current_day = 5
      saveData.game_state.gold = 100

      resetGameManager()
      const gm2 = getGameManager()
      gm2.loadGame(saveData)

      expect(gm2.getTimeManager().getCurrentDay()).toBe(5)
      expect(gm2.getPlayerState().gold).toBe(100)
    })
  })
})
