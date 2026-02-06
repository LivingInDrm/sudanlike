import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  validateCard,
  validateScene,
  registerCard,
  registerScene,
  getCard,
  getScene,
  getAllCards,
  getAllScenes,
  clearCache,
  isCacheHit,
  getCacheStats,
  DataLoadError,
} from '@/data/loader'
import { CardType, Rarity, SceneType, CalcMode, SlotType, Attribute } from '@/core/types'
import type { Card, Scene } from '@/core/types'

describe('DataLoader', () => {
  beforeEach(() => {
    clearCache()
  })

  const validCharacterCard: Card = {
    card_id: 'test_char_001',
    name: 'Test Character',
    type: CardType.Character,
    rarity: Rarity.Silver,
    description: 'A test character',
    image: 'test.png',
    attributes: {
      physique: 5,
      charm: 5,
      wisdom: 5,
      combat: 5,
      social: 5,
      survival: 5,
      stealth: 5,
      magic: 5,
    },
    tags: ['male'],
    equipment_slots: 3,
  }

  const validScene: Scene = {
    scene_id: 'test_scene_001',
    name: 'Test Scene',
    description: 'A test scene',
    background_image: 'bg.png',
    type: SceneType.Event,
    duration: 3,
    slots: [
      { type: SlotType.Character, required: true, locked: false },
    ],
    settlement: {
      type: 'dice_check',
      check: {
        attribute: Attribute.Social,
        calc_mode: CalcMode.Max,
        target: 8,
      },
      results: {
        success: { narrative: 'Success', effects: { gold: 20 } },
        failure: { narrative: 'Fail', effects: { gold: -10 } },
        critical_failure: { narrative: 'Crit fail', effects: { reputation: -8 } },
      },
    },
  }

  describe('validateCard()', () => {
    it('should validate correct card data', () => {
      const result = validateCard(validCharacterCard)
      expect(result.card_id).toBe('test_char_001')
    })

    it('should throw DataLoadError for invalid card', () => {
      const invalidCard = { name: 'Invalid' }
      expect(() => validateCard(invalidCard)).toThrow(DataLoadError)
    })

    it('should have validation errors in error object', () => {
      try {
        validateCard({})
      } catch (error) {
        expect(error).toBeInstanceOf(DataLoadError)
        expect((error as DataLoadError).validationErrors).toBeDefined()
      }
    })
  })

  describe('validateScene()', () => {
    it('should validate correct scene data', () => {
      const result = validateScene(validScene)
      expect(result.scene_id).toBe('test_scene_001')
    })

    it('should throw DataLoadError for invalid scene', () => {
      expect(() => validateScene({})).toThrow(DataLoadError)
    })
  })

  describe('registerCard() and getCard()', () => {
    it('should register and retrieve card', () => {
      registerCard(validCharacterCard)
      const retrieved = getCard('test_char_001')
      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('Test Character')
    })

    it('should return undefined for non-existent card', () => {
      expect(getCard('non_existent')).toBeUndefined()
    })
  })

  describe('registerScene() and getScene()', () => {
    it('should register and retrieve scene', () => {
      registerScene(validScene)
      const retrieved = getScene('test_scene_001')
      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('Test Scene')
    })
  })

  describe('getAllCards() and getAllScenes()', () => {
    it('should return all registered cards', () => {
      const card2 = { ...validCharacterCard, card_id: 'test_char_002' }
      registerCard(validCharacterCard)
      registerCard(card2)
      
      const allCards = getAllCards()
      expect(allCards).toHaveLength(2)
    })

    it('should return all registered scenes', () => {
      const scene2 = { ...validScene, scene_id: 'test_scene_002' }
      registerScene(validScene)
      registerScene(scene2)
      
      const allScenes = getAllScenes()
      expect(allScenes).toHaveLength(2)
    })
  })

  describe('clearCache()', () => {
    it('should clear all cached data', () => {
      registerCard(validCharacterCard)
      registerScene(validScene)
      
      expect(getAllCards()).toHaveLength(1)
      expect(getAllScenes()).toHaveLength(1)
      
      clearCache()
      
      expect(getAllCards()).toHaveLength(0)
      expect(getAllScenes()).toHaveLength(0)
    })
  })

  describe('isCacheHit()', () => {
    it('should return true for cached items', () => {
      registerCard(validCharacterCard)
      expect(isCacheHit('card', 'test_char_001')).toBe(true)
    })

    it('should return false for uncached items', () => {
      expect(isCacheHit('card', 'non_existent')).toBe(false)
      expect(isCacheHit('scene', 'non_existent')).toBe(false)
    })
  })

  describe('getCacheStats()', () => {
    it('should return correct cache counts', () => {
      registerCard(validCharacterCard)
      registerScene(validScene)
      
      const stats = getCacheStats()
      expect(stats.cards).toBe(1)
      expect(stats.scenes).toBe(1)
    })
  })
})
