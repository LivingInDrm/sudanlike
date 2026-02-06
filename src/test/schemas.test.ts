import { describe, it, expect } from 'vitest'
import {
  CardSchema,
  SceneSchema,
  SaveDataSchema,
  EffectsSchema,
  GameStateSchema,
} from '@/data/schemas'
import { Attribute, CardType, Rarity, SceneType, CalcMode, SlotType } from '@/core/types'

describe('Zod Schemas', () => {
  describe('CardSchema', () => {
    it('should validate a valid character card', () => {
      const validCard = {
        card_id: 'card_001',
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
        special_attributes: {
          support: 2,
          reroll: 1,
        },
        tags: ['male', 'clan'],
        equipment_slots: 3,
      }

      const result = CardSchema.safeParse(validCard)
      expect(result.success).toBe(true)
    })

    it('should reject character card without attributes', () => {
      const invalidCard = {
        card_id: 'card_001',
        name: 'Test',
        type: CardType.Character,
        rarity: Rarity.Silver,
        description: 'Test',
        image: 'test.png',
        equipment_slots: 3,
      }

      const result = CardSchema.safeParse(invalidCard)
      expect(result.success).toBe(false)
    })

    it('should validate equipment card', () => {
      const validEquipment = {
        card_id: 'equip_001',
        name: 'Test Weapon',
        type: CardType.Equipment,
        rarity: Rarity.Copper,
        description: 'A weapon',
        image: 'weapon.png',
        equipment_type: 'weapon',
        attribute_bonus: { combat: 5 },
      }

      const result = CardSchema.safeParse(validEquipment)
      expect(result.success).toBe(true)
    })

    it('should reject equipment card without equipment_type', () => {
      const invalidEquipment = {
        card_id: 'equip_001',
        name: 'Test Weapon',
        type: CardType.Equipment,
        rarity: Rarity.Copper,
        description: 'A weapon',
        image: 'weapon.png',
      }

      const result = CardSchema.safeParse(invalidEquipment)
      expect(result.success).toBe(false)
    })

    it('should reject card with invalid attribute values', () => {
      const invalidCard = {
        card_id: 'card_001',
        name: 'Test',
        type: CardType.Character,
        rarity: Rarity.Silver,
        description: 'Test',
        image: 'test.png',
        attributes: {
          physique: 100,
          charm: 5,
          wisdom: 5,
          combat: 5,
          social: 5,
          survival: 5,
          stealth: 5,
          magic: 5,
        },
        equipment_slots: 3,
      }

      const result = CardSchema.safeParse(invalidCard)
      expect(result.success).toBe(false)
    })

    it('should reject card with invalid special_attributes', () => {
      const invalidCard = {
        card_id: 'card_001',
        name: 'Test',
        type: CardType.Character,
        rarity: Rarity.Silver,
        description: 'Test',
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
        special_attributes: {
          support: 20,
        },
        equipment_slots: 3,
      }

      const result = CardSchema.safeParse(invalidCard)
      expect(result.success).toBe(false)
    })
  })

  describe('SceneSchema', () => {
    it('should validate dice_check scene', () => {
      const validScene = {
        scene_id: 'scene_001',
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
            partial_success: { narrative: 'Partial', effects: { gold: 10 } },
            failure: { narrative: 'Fail', effects: { gold: -10 } },
            critical_failure: { narrative: 'Crit fail', effects: { reputation: -8 } },
          },
        },
      }

      const result = SceneSchema.safeParse(validScene)
      expect(result.success).toBe(true)
    })

    it('should validate trade scene', () => {
      const validShop = {
        scene_id: 'shop_001',
        name: 'Test Shop',
        description: 'A shop',
        background_image: 'shop.png',
        type: SceneType.Shop,
        duration: 1,
        slots: [],
        settlement: {
          type: 'trade',
          shop_inventory: ['card_101'],
          allow_sell: true,
        },
      }

      const result = SceneSchema.safeParse(validShop)
      expect(result.success).toBe(true)
    })

    it('should validate choice scene', () => {
      const validChoice = {
        scene_id: 'choice_001',
        name: 'Test Choice',
        description: 'A choice',
        background_image: 'choice.png',
        type: SceneType.Event,
        duration: 1,
        slots: [],
        settlement: {
          type: 'choice',
          options: [
            { label: 'Option A', effects: { gold: 10 } },
            { label: 'Option B', effects: { reputation: 5 } },
          ],
        },
      }

      const result = SceneSchema.safeParse(validChoice)
      expect(result.success).toBe(true)
    })

    it('should reject scene with invalid settlement type', () => {
      const invalidScene = {
        scene_id: 'scene_001',
        name: 'Test',
        description: 'Test',
        background_image: 'bg.png',
        type: SceneType.Event,
        duration: 1,
        slots: [],
        settlement: {
          type: 'invalid_type',
        },
      }

      const result = SceneSchema.safeParse(invalidScene)
      expect(result.success).toBe(false)
    })

    it('should accept scene with absence_penalty', () => {
      const sceneWithPenalty = {
        scene_id: 'scene_001',
        name: 'Test',
        description: 'Test',
        background_image: 'bg.png',
        type: SceneType.Event,
        duration: 2,
        slots: [],
        settlement: {
          type: 'choice',
          options: [{ label: 'OK', effects: {} }],
        },
        absence_penalty: {
          effects: { reputation: -5 },
          narrative: 'You missed it',
        },
      }

      const result = SceneSchema.safeParse(sceneWithPenalty)
      expect(result.success).toBe(true)
    })
  })

  describe('EffectsSchema', () => {
    it('should validate effects with positive values', () => {
      const effects = {
        gold: 20,
        reputation: 5,
        cards_add: ['card_010'],
      }

      const result = EffectsSchema.safeParse(effects)
      expect(result.success).toBe(true)
    })

    it('should validate effects with negative values', () => {
      const effects = {
        gold: -10,
        reputation: -5,
      }

      const result = EffectsSchema.safeParse(effects)
      expect(result.success).toBe(true)
    })

    it('should validate empty effects', () => {
      const effects = {}
      const result = EffectsSchema.safeParse(effects)
      expect(result.success).toBe(true)
    })

    it('should validate effects with card_invested references', () => {
      const effects = {
        cards_remove: ['card_invested_0', 'card_invested_1'],
      }

      const result = EffectsSchema.safeParse(effects)
      expect(result.success).toBe(true)
    })
  })

  describe('GameStateSchema', () => {
    it('should validate valid game state', () => {
      const state = {
        current_day: 7,
        execution_countdown: 8,
        gold: 45,
        reputation: 62,
        rewind_charges: 2,
        golden_dice: 3,
        think_charges: 3,
      }

      const result = GameStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject invalid reputation', () => {
      const state = {
        current_day: 1,
        execution_countdown: 14,
        gold: 30,
        reputation: 150,
        rewind_charges: 3,
        golden_dice: 0,
        think_charges: 3,
      }

      const result = GameStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject negative gold', () => {
      const state = {
        current_day: 1,
        execution_countdown: 14,
        gold: -10,
        reputation: 50,
        rewind_charges: 3,
        golden_dice: 0,
        think_charges: 3,
      }

      const result = GameStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })
  })

  describe('SaveDataSchema', () => {
    it('should validate complete save data', () => {
      const saveData = {
        save_id: 'save_001',
        timestamp: '2026-02-05T14:30:00Z',
        game_state: {
          current_day: 7,
          execution_countdown: 8,
          gold: 45,
          reputation: 62,
          rewind_charges: 2,
          golden_dice: 3,
          think_charges: 3,
        },
        cards: {
          hand: ['card_001'],
          equipped: {},
          locked_in_scenes: {},
          think_used_today: [],
        },
        scenes: {
          active: [],
          completed: [],
          unlocked: [],
          scene_states: {},
        },
        achievements_unlocked: [],
        npc_relations: {},
        difficulty: 'normal',
        random_seed: 'test_seed_123',
      }

      const result = SaveDataSchema.safeParse(saveData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid difficulty', () => {
      const saveData = {
        save_id: 'save_001',
        timestamp: '2026-02-05T14:30:00Z',
        game_state: {
          current_day: 1,
          execution_countdown: 14,
          gold: 30,
          reputation: 50,
          rewind_charges: 3,
          golden_dice: 0,
          think_charges: 3,
        },
        cards: {
          hand: [],
          equipped: {},
          locked_in_scenes: {},
          think_used_today: [],
        },
        scenes: {
          active: [],
          completed: [],
          unlocked: [],
          scene_states: {},
        },
        achievements_unlocked: [],
        npc_relations: {},
        difficulty: 'invalid',
        random_seed: 'seed',
      }

      const result = SaveDataSchema.safeParse(saveData)
      expect(result.success).toBe(false)
    })

    it('should provide clear error messages', () => {
      const invalidData = {
        save_id: '',
        timestamp: 'invalid-date',
      }

      const result = SaveDataSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })
  })
})
