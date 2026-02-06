import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CardManager } from '@/core/card/CardManager'
import { EquipmentSystem } from '@/core/card/EquipmentSystem'
import { CardModel } from '@/core/card/CardModel'
import { resetEventBus, on } from '@/lib/events'
import { CardType, Rarity, Attribute, EquipmentType, GAME_CONFIG } from '@/core/types'
import type { Card } from '@/core/types'

const createCharacterCard = (id: string, combat: number = 5, slots: number = 3, tags: string[] = []): Card => ({
  card_id: id,
  name: `Char ${id}`,
  type: CardType.Character,
  rarity: Rarity.Silver,
  description: 'Test',
  image: 'test.png',
  attributes: {
    physique: 5, charm: 5, wisdom: 5, combat, social: 5, survival: 5, stealth: 5, magic: 5,
  },
  special_attributes: { reroll: 1 },
  tags,
  equipment_slots: slots,
})

const createEquipmentCard = (id: string, combatBonus: number = 3): Card => ({
  card_id: id,
  name: `Equip ${id}`,
  type: CardType.Equipment,
  rarity: Rarity.Copper,
  description: 'Test',
  image: 'test.png',
  equipment_type: EquipmentType.Weapon,
  attribute_bonus: { combat: combatBonus },
  special_bonus: { reroll: 1 },
})

describe('CardManager', () => {
  let manager: CardManager

  beforeEach(() => {
    resetEventBus()
    manager = new CardManager()
  })

  describe('addCard()', () => {
    it('should add card and return model', () => {
      const card = createCharacterCard('char_001')
      const model = manager.addCard(card)

      expect(model).toBeInstanceOf(CardModel)
      expect(manager.getCardCount()).toBe(1)
    })

    it('should emit event on add', () => {
      const handler = vi.fn()
      on('card:add', handler)

      const model = manager.addCard(createCharacterCard('char_001'))

      expect(handler).toHaveBeenCalledWith({ cardId: model.instance_id })
    })

    it('should accept CardModel directly', () => {
      const model = new CardModel(createCharacterCard('char_001'))
      manager.addCard(model)

      expect(manager.getCard(model.instance_id)).toBe(model)
    })
  })

  describe('removeCard()', () => {
    it('should remove card', () => {
      const model = manager.addCard(createCharacterCard('char_001'))
      expect(manager.removeCard(model.instance_id)).toBe(true)
      expect(manager.getCardCount()).toBe(0)
    })

    it('should throw when removing protagonist', () => {
      const card = createCharacterCard('protagonist', 5, 3, ['protagonist'])
      const model = manager.addCard(card)

      expect(() => manager.removeCard(model.instance_id)).toThrow('protagonist')
    })

    it('should throw when removing locked card', () => {
      const model = manager.addCard(createCharacterCard('char_001'))
      manager.lockCard(model.instance_id, 'scene_001')

      expect(() => manager.removeCard(model.instance_id)).toThrow('locked')
    })

    it('should return false for non-existent card', () => {
      expect(manager.removeCard('non_existent')).toBe(false)
    })
  })

  describe('getCard methods', () => {
    it('getCard() should return card by instance id', () => {
      const model = manager.addCard(createCharacterCard('char_001'))
      expect(manager.getCard(model.instance_id)).toBe(model)
    })

    it('getCardByCardId() should find by card_id', () => {
      const model = manager.addCard(createCharacterCard('char_001'))
      expect(manager.getCardByCardId('char_001')).toBe(model)
    })

    it('getAllCards() should return all cards', () => {
      manager.addCard(createCharacterCard('char_001'))
      manager.addCard(createCharacterCard('char_002'))
      expect(manager.getAllCards()).toHaveLength(2)
    })
  })

  describe('lock/unlock', () => {
    it('lockCard() should lock card', () => {
      const model = manager.addCard(createCharacterCard('char_001'))
      expect(manager.lockCard(model.instance_id, 'scene_001')).toBe(true)
      expect(manager.isCardLocked(model.instance_id)).toBe(true)
    })

    it('unlockCard() should unlock card', () => {
      const model = manager.addCard(createCharacterCard('char_001'))
      manager.lockCard(model.instance_id, 'scene_001')
      expect(manager.unlockCard(model.instance_id)).toBe(true)
      expect(manager.isCardLocked(model.instance_id)).toBe(false)
    })

    it('getAvailableCards() should exclude locked cards', () => {
      const model1 = manager.addCard(createCharacterCard('char_001'))
      manager.addCard(createCharacterCard('char_002'))
      manager.lockCard(model1.instance_id, 'scene_001')

      expect(manager.getAvailableCards()).toHaveLength(1)
    })

    it('getLockedCards() should return only locked cards', () => {
      const model1 = manager.addCard(createCharacterCard('char_001'))
      manager.addCard(createCharacterCard('char_002'))
      manager.lockCard(model1.instance_id, 'scene_001')

      expect(manager.getLockedCards()).toHaveLength(1)
      expect(manager.getLockedCards()[0]).toBe(model1)
    })
  })

  describe('tag operations', () => {
    it('addTagToCard() should add tag', () => {
      const model = manager.addCard(createCharacterCard('char_001'))
      expect(manager.addTagToCard(model.instance_id, 'wounded')).toBe(true)
      expect(model.hasTag('wounded')).toBe(true)
    })

    it('removeTagFromCard() should remove tag', () => {
      const card = createCharacterCard('char_001', 5, 3, ['noble'])
      const model = manager.addCard(card)
      
      expect(manager.removeTagFromCard(model.instance_id, 'noble')).toBe(true)
      expect(model.hasTag('noble')).toBe(false)
    })

    it('getCardsByTag() should filter by tag', () => {
      manager.addCard(createCharacterCard('char_001', 5, 3, ['noble']))
      manager.addCard(createCharacterCard('char_002', 5, 3, ['commoner']))
      manager.addCard(createCharacterCard('char_003', 5, 3, ['noble']))

      expect(manager.getCardsByTag('noble')).toHaveLength(2)
    })
  })

  describe('card type methods', () => {
    it('getCharacterCards() should return only characters', () => {
      manager.addCard(createCharacterCard('char_001'))
      manager.addCard(createEquipmentCard('equip_001'))

      expect(manager.getCharacterCards()).toHaveLength(1)
    })

    it('getEquipmentCards() should return only equipment', () => {
      manager.addCard(createCharacterCard('char_001'))
      manager.addCard(createEquipmentCard('equip_001'))
      manager.addCard(createEquipmentCard('equip_002'))

      expect(manager.getEquipmentCards()).toHaveLength(2)
    })
  })

  describe('capacity', () => {
    it('hasSpace() should check available space', () => {
      expect(manager.hasSpace()).toBe(true)
    })

    it('getAvailableSpace() should return remaining slots', () => {
      manager.addCard(createCharacterCard('char_001'))
      expect(manager.getAvailableSpace()).toBe(GAME_CONFIG.MAX_HAND_SIZE - 1)
    })
  })
})

describe('EquipmentSystem', () => {
  let manager: CardManager
  let equipment: EquipmentSystem

  beforeEach(() => {
    resetEventBus()
    manager = new CardManager()
    equipment = new EquipmentSystem(manager)
  })

  describe('equip()', () => {
    it('should equip equipment to character', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip = manager.addCard(createEquipmentCard('equip_001'))

      expect(equipment.equip(char.instance_id, equip.instance_id)).toBe(true)
      expect(char.isEquipmentEquipped(equip.instance_id)).toBe(true)
    })

    it('should fail if no slots available', () => {
      const char = manager.addCard(createCharacterCard('char_001', 5, 1))
      const equip1 = manager.addCard(createEquipmentCard('equip_001'))
      const equip2 = manager.addCard(createEquipmentCard('equip_002'))

      equipment.equip(char.instance_id, equip1.instance_id)
      expect(() => equipment.equip(char.instance_id, equip2.instance_id)).toThrow('No available equipment slots')
    })

    it('should throw for locked cards', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip = manager.addCard(createEquipmentCard('equip_001'))
      manager.lockCard(char.instance_id, 'scene_001')

      expect(() => equipment.equip(char.instance_id, equip.instance_id)).toThrow('locked')
    })
  })

  describe('unequip()', () => {
    it('should unequip equipment', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip = manager.addCard(createEquipmentCard('equip_001'))
      equipment.equip(char.instance_id, equip.instance_id)

      expect(equipment.unequip(char.instance_id, equip.instance_id)).toBe(true)
      expect(char.isEquipmentEquipped(equip.instance_id)).toBe(false)
    })

    it('unequipAll() should remove all equipment', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip1 = manager.addCard(createEquipmentCard('equip_001'))
      const equip2 = manager.addCard(createEquipmentCard('equip_002'))
      equipment.equip(char.instance_id, equip1.instance_id)
      equipment.equip(char.instance_id, equip2.instance_id)

      const unequipped = equipment.unequipAll(char.instance_id)
      expect(unequipped).toHaveLength(2)
      expect(char.getEquippedItemCount()).toBe(0)
    })
  })

  describe('bonuses', () => {
    it('getAttributeBonus() should sum bonuses', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip1 = manager.addCard(createEquipmentCard('equip_001', 3))
      const equip2 = manager.addCard(createEquipmentCard('equip_002', 5))
      equipment.equip(char.instance_id, equip1.instance_id)
      equipment.equip(char.instance_id, equip2.instance_id)

      expect(equipment.getAttributeBonus(char.instance_id, Attribute.Combat)).toBe(8)
    })

    it('getTotalAttribute() should include base + bonus', () => {
      const char = manager.addCard(createCharacterCard('char_001', 10))
      const equip = manager.addCard(createEquipmentCard('equip_001', 5))
      equipment.equip(char.instance_id, equip.instance_id)

      expect(equipment.getTotalAttribute(char.instance_id, Attribute.Combat)).toBe(15)
    })

    it('getTotalReroll() should sum character and equipment rerolls', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip = manager.addCard(createEquipmentCard('equip_001'))
      equipment.equip(char.instance_id, equip.instance_id)

      expect(equipment.getTotalReroll(char.instance_id)).toBe(2)
    })
  })

  describe('query methods', () => {
    it('getEquippedCards() should return equipped items', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip = manager.addCard(createEquipmentCard('equip_001'))
      equipment.equip(char.instance_id, equip.instance_id)

      const equipped = equipment.getEquippedCards(char.instance_id)
      expect(equipped).toHaveLength(1)
      expect(equipped[0].instance_id).toBe(equip.instance_id)
    })

    it('getUnequippedItems() should return unequipped equipment', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip1 = manager.addCard(createEquipmentCard('equip_001'))
      const equip2 = manager.addCard(createEquipmentCard('equip_002'))
      equipment.equip(char.instance_id, equip1.instance_id)

      const unequipped = equipment.getUnequippedItems()
      expect(unequipped).toHaveLength(1)
      expect(unequipped[0].instance_id).toBe(equip2.instance_id)
    })

    it('isEquipped() should check if equipment is in use', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip = manager.addCard(createEquipmentCard('equip_001'))

      expect(equipment.isEquipped(equip.instance_id)).toBe(false)
      equipment.equip(char.instance_id, equip.instance_id)
      expect(equipment.isEquipped(equip.instance_id)).toBe(true)
    })

    it('getEquippedBy() should return character using equipment', () => {
      const char = manager.addCard(createCharacterCard('char_001'))
      const equip = manager.addCard(createEquipmentCard('equip_001'))
      equipment.equip(char.instance_id, equip.instance_id)

      expect(equipment.getEquippedBy(equip.instance_id)).toBe(char)
    })
  })
})
