import { describe, it, expect } from 'vitest'
import { CardModel, createCardModel } from '@/core/card/CardModel'
import { CardType, Rarity, Attribute, EquipmentType } from '@/core/types'
import type { Card, CardInstance } from '@/core/types'

describe('CardModel', () => {
  const baseCharacterCard: Card = {
    card_id: 'char_001',
    name: 'Test Character',
    type: CardType.Character,
    rarity: Rarity.Silver,
    description: 'A test character',
    image: 'char.png',
    attributes: {
      physique: 8,
      charm: 6,
      wisdom: 4,
      combat: 9,
      social: 5,
      survival: 3,
      stealth: 2,
      magic: 1,
    },
    special_attributes: {
      support: 2,
      reroll: 1,
    },
    tags: ['male', 'noble'],
    equipment_slots: 3,
  }

  const equipmentCard: Card = {
    card_id: 'equip_001',
    name: 'Test Sword',
    type: CardType.Equipment,
    rarity: Rarity.Copper,
    description: 'A test sword',
    image: 'sword.png',
    equipment_type: EquipmentType.Weapon,
    attribute_bonus: {
      combat: 5,
    },
    special_bonus: {
      reroll: 1,
    },
    gem_slots: 2,
  }

  describe('constructor', () => {
    it('should create instance with unique id', () => {
      const model1 = new CardModel(baseCharacterCard)
      const model2 = new CardModel(baseCharacterCard)
      expect(model1.instance_id).not.toBe(model2.instance_id)
    })

    it('should copy card data correctly', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.card_id).toBe('char_001')
      expect(model.name).toBe('Test Character')
      expect(model.type).toBe(CardType.Character)
    })

    it('should initialize with provided instance id', () => {
      const model = new CardModel(baseCharacterCard, 'custom_id')
      expect(model.instance_id).toBe('custom_id')
    })
  })

  describe('getAttribute()', () => {
    it('should return correct attribute value', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.getAttribute(Attribute.Combat)).toBe(9)
      expect(model.getAttribute(Attribute.Physique)).toBe(8)
    })

    it('should return 0 for non-existent attribute', () => {
      const model = new CardModel(equipmentCard)
      expect(model.getAttribute(Attribute.Combat)).toBe(0)
    })
  })

  describe('getAttributeTotal()', () => {
    it('should sum all attributes', () => {
      const model = new CardModel(baseCharacterCard)
      const total = model.getAttributeTotal()
      expect(total).toBe(8 + 6 + 4 + 9 + 5 + 3 + 2 + 1)
    })

    it('should return 0 for cards without attributes', () => {
      const model = new CardModel(equipmentCard)
      expect(model.getAttributeTotal()).toBe(0)
    })
  })

  describe('getSpecialAttribute()', () => {
    it('should return special attribute values', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.getSupport()).toBe(2)
      expect(model.getReroll()).toBe(1)
    })

    it('should return 0 for missing special attributes', () => {
      const model = new CardModel(equipmentCard)
      expect(model.getSupport()).toBe(0)
      expect(model.getReroll()).toBe(0)
    })
  })

  describe('type checking methods', () => {
    it('isCharacter() should work correctly', () => {
      const char = new CardModel(baseCharacterCard)
      const equip = new CardModel(equipmentCard)
      expect(char.isCharacter()).toBe(true)
      expect(equip.isCharacter()).toBe(false)
    })

    it('isEquipment() should work correctly', () => {
      const char = new CardModel(baseCharacterCard)
      const equip = new CardModel(equipmentCard)
      expect(char.isEquipment()).toBe(false)
      expect(equip.isEquipment()).toBe(true)
    })

    it('isSultan() should identify sultan cards', () => {
      const sultanCard: Card = {
        ...baseCharacterCard,
        card_id: 'sultan_001',
        type: CardType.Sultan,
      }
      const sultan = new CardModel(sultanCard)
      expect(sultan.isSultan()).toBe(true)
    })

    it('isProtagonist() should check protagonist tag', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.isProtagonist()).toBe(false)
      model.addTag('protagonist')
      expect(model.isProtagonist()).toBe(true)
    })
  })

  describe('tag management', () => {
    it('should initialize with tags from card', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.hasTag('male')).toBe(true)
      expect(model.hasTag('noble')).toBe(true)
    })

    it('addTag() should add new tag', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.addTag('wounded')).toBe(true)
      expect(model.hasTag('wounded')).toBe(true)
    })

    it('addTag() should return false for existing tag', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.addTag('male')).toBe(false)
    })

    it('removeTag() should remove tag', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.removeTag('male')).toBe(true)
      expect(model.hasTag('male')).toBe(false)
    })

    it('removeTag() should return false for non-existent tag', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.removeTag('nonexistent')).toBe(false)
    })

    it('getTags() should return copy of tags', () => {
      const model = new CardModel(baseCharacterCard)
      const tags = model.getTags()
      tags.push('modified')
      expect(model.hasTag('modified')).toBe(false)
    })
  })

  describe('equipment management', () => {
    it('canEquip() should check equipment capability', () => {
      const char = new CardModel(baseCharacterCard)
      const equip = new CardModel(equipmentCard)
      expect(char.canEquip()).toBe(true)
      expect(equip.canEquip()).toBe(false)
    })

    it('getAvailableEquipmentSlots() should return correct value', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.getAvailableEquipmentSlots()).toBe(3)
    })

    it('equipItem() should add equipment', () => {
      const model = new CardModel(baseCharacterCard)
      expect(model.equipItem('equip_001')).toBe(true)
      expect(model.isEquipmentEquipped('equip_001')).toBe(true)
      expect(model.getAvailableEquipmentSlots()).toBe(2)
    })

    it('equipItem() should fail if already equipped', () => {
      const model = new CardModel(baseCharacterCard)
      model.equipItem('equip_001')
      expect(model.equipItem('equip_001')).toBe(false)
    })

    it('equipItem() should fail if no slots available', () => {
      const model = new CardModel(baseCharacterCard)
      model.equipItem('equip_001')
      model.equipItem('equip_002')
      model.equipItem('equip_003')
      expect(model.equipItem('equip_004')).toBe(false)
    })

    it('unequipItem() should remove equipment', () => {
      const model = new CardModel(baseCharacterCard)
      model.equipItem('equip_001')
      expect(model.unequipItem('equip_001')).toBe(true)
      expect(model.isEquipmentEquipped('equip_001')).toBe(false)
    })

    it('clearEquippedItems() should remove all equipment', () => {
      const model = new CardModel(baseCharacterCard)
      model.equipItem('equip_001')
      model.equipItem('equip_002')
      
      const cleared = model.clearEquippedItems()
      expect(cleared).toEqual(['equip_001', 'equip_002'])
      expect(model.getEquippedItemCount()).toBe(0)
    })
  })

  describe('attribute bonus', () => {
    it('getAttributeBonus() should return bonus value', () => {
      const model = new CardModel(equipmentCard)
      expect(model.getAttributeBonus('combat')).toBe(5)
    })

    it('getAttributeBonus() should return 0 for non-existent bonus', () => {
      const model = new CardModel(equipmentCard)
      expect(model.getAttributeBonus('wisdom')).toBe(0)
    })

    it('getAllAttributeBonuses() should return copy of bonuses', () => {
      const model = new CardModel(equipmentCard)
      const bonuses = model.getAllAttributeBonuses()
      expect(bonuses).toEqual({ combat: 5 })
    })
  })

  describe('clone()', () => {
    it('should create independent copy', () => {
      const model = new CardModel(baseCharacterCard)
      model.equipItem('equip_001')
      model.addTag('wounded')
      
      const clone = model.clone()
      
      clone.addTag('cursed')
      clone.equipItem('equip_002')
      
      expect(model.hasTag('cursed')).toBe(false)
      expect(model.getEquippedItemCount()).toBe(1)
      expect(clone.hasTag('cursed')).toBe(true)
      expect(clone.getEquippedItemCount()).toBe(2)
    })

    it('should generate new instance id', () => {
      const model = new CardModel(baseCharacterCard)
      const clone = model.clone()
      expect(clone.instance_id).not.toBe(model.instance_id)
    })
  })

  describe('static factory methods', () => {
    it('fromCard() should create model', () => {
      const model = CardModel.fromCard(baseCharacterCard)
      expect(model.card_id).toBe('char_001')
    })

    it('fromInstance() should restore full state', () => {
      const instance: CardInstance = {
        ...baseCharacterCard,
        instance_id: 'test_inst',
        equipped_items: ['equip_001'],
        current_tags: ['male', 'wounded'],
      }
      
      const model = CardModel.fromInstance(instance)
      expect(model.instance_id).toBe('test_inst')
      expect(model.isEquipmentEquipped('equip_001')).toBe(true)
      expect(model.hasTag('wounded')).toBe(true)
    })
  })

  describe('createCardModel helper', () => {
    it('should create CardModel from card', () => {
      const model = createCardModel(baseCharacterCard)
      expect(model).toBeInstanceOf(CardModel)
      expect(model.card_id).toBe('char_001')
    })
  })
})
