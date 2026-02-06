import { describe, it, expect } from 'vitest'
import type {
  Card,
  CardInstance,
  Slot,
  SlotState,
  CheckConfig,
  Effects,
  Scene,
  SceneState,
  GameState,
  CardsState,
  ScenesState,
  SaveData,
  DiceRoll,
  DiceCheckState,
  SettlementResult,
  Attributes,
} from '@/core/types'
import {
  Rarity,
  Attribute,
  CardType,
  SceneType,
  SceneStatus,
  CalcMode,
  SlotType,
  CheckResult,
} from '@/core/types'

describe('Type Interfaces', () => {
  describe('Card', () => {
    it('should accept valid character card structure', () => {
      const card: Card = {
        card_id: 'card_001',
        name: 'Test Character',
        type: CardType.Character,
        rarity: Rarity.Silver,
        description: 'A test character',
        image: 'test.png',
        attributes: {
          [Attribute.Physique]: 5,
          [Attribute.Charm]: 5,
          [Attribute.Wisdom]: 5,
          [Attribute.Combat]: 5,
          [Attribute.Social]: 5,
          [Attribute.Survival]: 5,
          [Attribute.Stealth]: 5,
          [Attribute.Magic]: 5,
        },
        special_attributes: {
          support: 2,
          reroll: 1,
        },
        tags: ['male', 'clan'],
        equipment_slots: 3,
      }

      expect(card.card_id).toBe('card_001')
      expect(card.type).toBe(CardType.Character)
      expect(card.attributes?.[Attribute.Combat]).toBe(5)
    })

    it('should accept valid equipment card structure', () => {
      const card: Card = {
        card_id: 'equip_001',
        name: 'Test Weapon',
        type: CardType.Equipment,
        rarity: Rarity.Copper,
        description: 'A test weapon',
        image: 'weapon.png',
        attribute_bonus: {
          combat: 5,
        },
        special_bonus: {
          reroll: 1,
        },
        gem_slots: 2,
      }

      expect(card.type).toBe(CardType.Equipment)
      expect(card.attribute_bonus?.combat).toBe(5)
    })
  })

  describe('CardInstance', () => {
    it('should extend Card with instance-specific fields', () => {
      const instance: CardInstance = {
        card_id: 'card_001',
        instance_id: 'inst_001',
        name: 'Test',
        type: CardType.Character,
        rarity: Rarity.Silver,
        description: 'Test',
        image: 'test.png',
        equipped_items: ['equip_001'],
        current_tags: ['male', 'wounded'],
      }

      expect(instance.instance_id).toBe('inst_001')
      expect(instance.equipped_items).toContain('equip_001')
    })
  })

  describe('Scene', () => {
    it('should accept valid scene structure with dice_check settlement', () => {
      const scene: Scene = {
        scene_id: 'scene_001',
        name: 'Test Scene',
        description: 'A test scene',
        background_image: 'bg.png',
        type: SceneType.Event,
        duration: 3,
        slots: [
          { type: SlotType.Character, required: true, locked: false },
          { type: SlotType.Item, required: false, locked: false },
        ],
        settlement: {
          type: 'dice_check',
          narrative: 'Test narrative',
          check: {
            attribute: Attribute.Social,
            calc_mode: CalcMode.Max,
            target: 8,
          },
          results: {
            success: { narrative: 'Success!', effects: { gold: 20 } },
            partial_success: { narrative: 'Partial!', effects: { gold: 10 } },
            failure: { narrative: 'Failed!', effects: { gold: -10 } },
            critical_failure: { narrative: 'Critical fail!', effects: { reputation: -8 } },
          },
        },
        unlock_conditions: {
          reputation_min: 40,
        },
        absence_penalty: {
          effects: { reputation: -5 },
          narrative: 'You missed it',
        },
      }

      expect(scene.scene_id).toBe('scene_001')
      expect(scene.slots).toHaveLength(2)
      expect(scene.settlement.type).toBe('dice_check')
    })

    it('should accept shop scene structure', () => {
      const scene: Scene = {
        scene_id: 'shop_001',
        name: 'Test Shop',
        description: 'A shop',
        background_image: 'shop.png',
        type: SceneType.Shop,
        duration: 1,
        slots: [],
        settlement: {
          type: 'trade',
          shop_inventory: ['card_101', 'card_102'],
          allow_sell: true,
          refresh_cycle: 7,
        },
      }

      expect(scene.type).toBe(SceneType.Shop)
      expect(scene.settlement.type).toBe('trade')
    })
  })

  describe('GameState', () => {
    it('should have all required fields', () => {
      const state: GameState = {
        current_day: 1,
        execution_countdown: 14,
        gold: 30,
        reputation: 50,
        rewind_charges: 3,
        golden_dice: 0,
        think_charges: 3,
      }

      expect(state.current_day).toBe(1)
      expect(state.reputation).toBe(50)
    })
  })

  describe('DiceCheckState', () => {
    it('should track dice check progression', () => {
      const roll: DiceRoll = {
        value: 8,
        is_success: true,
        is_explosion: false,
        is_rerolled: false,
      }

      const checkState: DiceCheckState = {
        dice_pool: 10,
        target: 5,
        rolls: [roll],
        explosion_rolls: [],
        reroll_available: 2,
        reroll_used: 0,
        golden_dice_used: 0,
        success_count: 1,
        phase: 'rolling',
      }

      expect(checkState.rolls[0].is_success).toBe(true)
      expect(checkState.phase).toBe('rolling')
    })
  })

  describe('SaveData', () => {
    it('should have complete save structure', () => {
      const save: SaveData = {
        save_id: 'save_001',
        timestamp: '2026-02-05T14:30:00',
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
          equipped: { card_001: ['equip_001'] },
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
        random_seed: 'test_seed',
      }

      expect(save.save_id).toBe('save_001')
      expect(save.difficulty).toBe('normal')
    })
  })

  describe('Attributes', () => {
    it('should map all 8 attributes', () => {
      const attrs: Attributes = {
        [Attribute.Physique]: 5,
        [Attribute.Charm]: 4,
        [Attribute.Wisdom]: 6,
        [Attribute.Combat]: 7,
        [Attribute.Social]: 3,
        [Attribute.Survival]: 4,
        [Attribute.Stealth]: 2,
        [Attribute.Magic]: 1,
      }

      const sum = Object.values(attrs).reduce((a, b) => a + b, 0)
      expect(sum).toBe(32)
    })
  })
})
