import { CardModel } from './CardModel'
import { CardManager } from './CardManager'
import { emit } from '@/lib/events'
import { EquipmentType, Attribute } from '@/core/types'
import type { AttributeBonus, SpecialAttributes } from '@/core/types'

export class EquipmentSystem {
  private cardManager: CardManager

  constructor(cardManager: CardManager) {
    this.cardManager = cardManager
  }

  equip(characterId: string, equipmentId: string): boolean {
    const character = this.cardManager.getCard(characterId)
    const equipment = this.cardManager.getCard(equipmentId)

    if (!character || !equipment) {
      return false
    }

    if (!character.isCharacter()) {
      throw new Error('Target card is not a character')
    }

    if (!equipment.isEquipment()) {
      throw new Error('Equipment card is not equipment type')
    }

    if (this.cardManager.isCardLocked(characterId) || this.cardManager.isCardLocked(equipmentId)) {
      throw new Error('Cannot equip locked cards')
    }

    if (!character.canEquipMore()) {
      throw new Error('No available equipment slots')
    }

    if (character.isEquipmentEquipped(equipmentId)) {
      return false
    }

    character.equipItem(equipmentId)
    emit('card:equip', { characterId, equipmentId })

    return true
  }

  unequip(characterId: string, equipmentId: string): boolean {
    const character = this.cardManager.getCard(characterId)

    if (!character) {
      return false
    }

    if (this.cardManager.isCardLocked(characterId)) {
      throw new Error('Cannot unequip from locked character')
    }

    if (!character.isEquipmentEquipped(equipmentId)) {
      return false
    }

    character.unequipItem(equipmentId)
    emit('card:unequip', { characterId, equipmentId })

    return true
  }

  unequipAll(characterId: string): string[] {
    const character = this.cardManager.getCard(characterId)
    if (!character) {
      return []
    }

    if (this.cardManager.isCardLocked(characterId)) {
      throw new Error('Cannot unequip from locked character')
    }

    const unequipped = character.clearEquippedItems()
    for (const equipmentId of unequipped) {
      emit('card:unequip', { characterId, equipmentId })
    }

    return unequipped
  }

  getEquippedCards(characterId: string): CardModel[] {
    const character = this.cardManager.getCard(characterId)
    if (!character) {
      return []
    }

    const equippedIds = character.getEquippedItems()
    return equippedIds
      .map(id => this.cardManager.getCard(id))
      .filter((card): card is CardModel => card !== undefined)
  }

  getAttributeBonus(characterId: string, attribute: Attribute): number {
    const equippedCards = this.getEquippedCards(characterId)
    return equippedCards.reduce((total, card) => {
      return total + card.getAttributeBonus(attribute)
    }, 0)
  }

  getAllAttributeBonuses(characterId: string): AttributeBonus {
    const equippedCards = this.getEquippedCards(characterId)
    const bonuses: AttributeBonus = {}

    for (const card of equippedCards) {
      const cardBonuses = card.getAllAttributeBonuses()
      for (const [attr, value] of Object.entries(cardBonuses)) {
        bonuses[attr] = (bonuses[attr] || 0) + value
      }
    }

    return bonuses
  }

  getSpecialBonuses(characterId: string): SpecialAttributes {
    const equippedCards = this.getEquippedCards(characterId)
    const bonuses: SpecialAttributes = {
      support: 0,
      reroll: 0,
    }

    for (const card of equippedCards) {
      if (card.special_bonus?.support) {
        bonuses.support = (bonuses.support || 0) + card.special_bonus.support
      }
      if (card.special_bonus?.reroll) {
        bonuses.reroll = (bonuses.reroll || 0) + card.special_bonus.reroll
      }
    }

    return bonuses
  }

  getTotalAttribute(characterId: string, attribute: Attribute): number {
    const character = this.cardManager.getCard(characterId)
    if (!character) {
      return 0
    }

    const baseValue = character.getAttribute(attribute)
    const bonus = this.getAttributeBonus(characterId, attribute)

    return baseValue + bonus
  }

  getTotalReroll(characterId: string): number {
    const character = this.cardManager.getCard(characterId)
    if (!character) {
      return 0
    }

    const baseReroll = character.getReroll()
    const bonuses = this.getSpecialBonuses(characterId)

    return baseReroll + (bonuses.reroll || 0)
  }

  getEquipmentByType(type: EquipmentType): CardModel[] {
    return this.cardManager.getEquipmentCards().filter(card => card.equipment_type === type)
  }

  getUnequippedItems(): CardModel[] {
    const allEquipment = this.cardManager.getEquipmentCards()
    const allCharacters = this.cardManager.getCharacterCards()
    
    const equippedIds = new Set<string>()
    for (const char of allCharacters) {
      for (const id of char.getEquippedItems()) {
        equippedIds.add(id)
      }
    }

    return allEquipment.filter(equip => !equippedIds.has(equip.instance_id))
  }

  isEquipped(equipmentId: string): boolean {
    const allCharacters = this.cardManager.getCharacterCards()
    
    for (const char of allCharacters) {
      if (char.isEquipmentEquipped(equipmentId)) {
        return true
      }
    }

    return false
  }

  getEquippedBy(equipmentId: string): CardModel | undefined {
    const allCharacters = this.cardManager.getCharacterCards()
    
    for (const char of allCharacters) {
      if (char.isEquipmentEquipped(equipmentId)) {
        return char
      }
    }

    return undefined
  }
}
