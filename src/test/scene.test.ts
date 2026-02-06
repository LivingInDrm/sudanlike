import { describe, it, expect, beforeEach } from 'vitest'
import { SlotSystem } from '@/core/scene/SlotSystem'
import { SceneManager } from '@/core/scene/SceneManager'
import { CardManager } from '@/core/card/CardManager'
import { CardModel } from '@/core/card/CardModel'
import { PlayerState } from '@/core/player/PlayerState'
import { resetEventBus } from '@/lib/events'
import { SlotType, CardType, Rarity, SceneType, CalcMode, Attribute, SceneStatus } from '@/core/types'
import type { Card, Scene, Slot } from '@/core/types'

const createCharCard = (): Card => ({
  card_id: 'char_001',
  name: 'Test Char',
  type: CardType.Character,
  rarity: Rarity.Silver,
  description: 'Test',
  image: 'test.png',
  attributes: { physique: 5, charm: 5, wisdom: 5, combat: 5, social: 5, survival: 5, stealth: 5, magic: 5 },
  equipment_slots: 3,
})

const createEquipCard = (): Card => ({
  card_id: 'equip_001',
  name: 'Test Equip',
  type: CardType.Equipment,
  rarity: Rarity.Copper,
  description: 'Test',
  image: 'test.png',
  equipment_type: 'weapon',
})

const createTestScene = (): Scene => ({
  scene_id: 'scene_001',
  name: 'Test Scene',
  description: 'Test',
  background_image: 'bg.png',
  type: SceneType.Event,
  duration: 3,
  slots: [
    { type: SlotType.Character, required: true, locked: false },
    { type: SlotType.Item, required: false, locked: false },
  ],
  settlement: {
    type: 'dice_check',
    check: { attribute: Attribute.Combat, calc_mode: CalcMode.Max, target: 5 },
    results: {
      success: { narrative: 'Success', effects: { gold: 20 } },
      failure: { narrative: 'Fail', effects: { gold: -10 } },
      critical_failure: { narrative: 'Crit Fail', effects: { reputation: -5 } },
    },
  },
})

describe('SlotSystem', () => {
  let slotSystem: SlotSystem
  const slots: Slot[] = [
    { type: SlotType.Character, required: true, locked: false },
    { type: SlotType.Item, required: false, locked: false },
  ]

  beforeEach(() => {
    slotSystem = new SlotSystem(slots)
  })

  describe('canPlaceCard()', () => {
    it('should allow character in character slot', () => {
      const card = new CardModel(createCharCard())
      expect(slotSystem.canPlaceCard(0, card)).toBe(true)
    })

    it('should not allow character in item slot', () => {
      const card = new CardModel(createCharCard())
      expect(slotSystem.canPlaceCard(1, card)).toBe(false)
    })

    it('should allow equipment in item slot', () => {
      const card = new CardModel(createEquipCard())
      expect(slotSystem.canPlaceCard(1, card)).toBe(true)
    })

    it('should not allow placing in locked slot', () => {
      slotSystem.lockSlot(0)
      const card = new CardModel(createCharCard())
      expect(slotSystem.canPlaceCard(0, card)).toBe(false)
    })

    it('should not allow placing in occupied slot', () => {
      const card1 = new CardModel(createCharCard())
      const card2 = new CardModel(createCharCard())
      slotSystem.placeCard(0, card1)
      expect(slotSystem.canPlaceCard(0, card2)).toBe(false)
    })
  })

  describe('placeCard() and removeCard()', () => {
    it('should place card in slot', () => {
      const card = new CardModel(createCharCard())
      expect(slotSystem.placeCard(0, card)).toBe(true)
      expect(slotSystem.getCardAtSlot(0)).toBe(card.instance_id)
    })

    it('should remove card from slot', () => {
      const card = new CardModel(createCharCard())
      slotSystem.placeCard(0, card)
      expect(slotSystem.removeCard(0)).toBe(card.instance_id)
      expect(slotSystem.getCardAtSlot(0)).toBeUndefined()
    })
  })

  describe('areRequiredSlotsFilled()', () => {
    it('should return false when required slots empty', () => {
      expect(slotSystem.areRequiredSlotsFilled()).toBe(false)
    })

    it('should return true when required slots filled', () => {
      const card = new CardModel(createCharCard())
      slotSystem.placeCard(0, card)
      expect(slotSystem.areRequiredSlotsFilled()).toBe(true)
    })
  })

  describe('lock/unlock', () => {
    it('lockAllFilledSlots() should lock filled slots', () => {
      const card = new CardModel(createCharCard())
      slotSystem.placeCard(0, card)
      slotSystem.lockAllFilledSlots()
      expect(slotSystem.getSlots()[0].locked).toBe(true)
      expect(slotSystem.getSlots()[1].locked).toBe(false)
    })
  })
})

describe('SceneManager', () => {
  let sceneManager: SceneManager
  let cardManager: CardManager
  let playerState: PlayerState

  beforeEach(() => {
    resetEventBus()
    sceneManager = new SceneManager()
    cardManager = new CardManager()
    playerState = new PlayerState({ reputation: 50 })
    sceneManager.registerScene(createTestScene())
  })

  describe('unlockScene()', () => {
    it('should unlock scene and create state', () => {
      expect(sceneManager.unlockScene('scene_001')).toBe(true)
      const state = sceneManager.getSceneState('scene_001')
      expect(state).toBeDefined()
      expect(state?.status).toBe(SceneStatus.Available)
    })

    it('should not unlock already unlocked scene', () => {
      sceneManager.unlockScene('scene_001')
      expect(sceneManager.unlockScene('scene_001')).toBe(false)
    })
  })

  describe('participateScene()', () => {
    it('should participate when required slots filled', () => {
      sceneManager.unlockScene('scene_001')
      const card = cardManager.addCard(createCharCard())
      const slotSystem = sceneManager.getSlotSystem('scene_001')!
      slotSystem.placeCard(0, card)

      expect(sceneManager.participateScene('scene_001', cardManager)).toBe(true)
      expect(sceneManager.getSceneState('scene_001')?.status).toBe(SceneStatus.Participated)
      expect(cardManager.isCardLocked(card.instance_id)).toBe(true)
    })

    it('should fail when required slots not filled', () => {
      sceneManager.unlockScene('scene_001')
      expect(sceneManager.participateScene('scene_001', cardManager)).toBe(false)
    })
  })

  describe('decrementRemainingTurns()', () => {
    it('should decrease remaining turns', () => {
      sceneManager.unlockScene('scene_001')
      const card = cardManager.addCard(createCharCard())
      sceneManager.getSlotSystem('scene_001')!.placeCard(0, card)
      sceneManager.participateScene('scene_001', cardManager)

      expect(sceneManager.decrementRemainingTurns('scene_001')).toBe(2)
      expect(sceneManager.decrementRemainingTurns('scene_001')).toBe(1)
    })
  })

  describe('completeScene()', () => {
    it('should complete scene and unlock cards', () => {
      sceneManager.unlockScene('scene_001')
      const card = cardManager.addCard(createCharCard())
      sceneManager.getSlotSystem('scene_001')!.placeCard(0, card)
      sceneManager.participateScene('scene_001', cardManager)

      const returnedCards = sceneManager.completeScene('scene_001', cardManager)
      expect(returnedCards).toContain(card.instance_id)
      expect(cardManager.isCardLocked(card.instance_id)).toBe(false)
      expect(sceneManager.getSceneState('scene_001')?.status).toBe(SceneStatus.Completed)
    })
  })

  describe('getExpiredScenes()', () => {
    it('should return scenes with 0 remaining turns', () => {
      sceneManager.unlockScene('scene_001')
      const card = cardManager.addCard(createCharCard())
      sceneManager.getSlotSystem('scene_001')!.placeCard(0, card)
      sceneManager.participateScene('scene_001', cardManager)

      for (let i = 0; i < 3; i++) {
        sceneManager.decrementRemainingTurns('scene_001')
      }

      expect(sceneManager.getExpiredScenes()).toContain('scene_001')
    })
  })
})
