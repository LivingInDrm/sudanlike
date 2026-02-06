import type { Card, CardInstance, Attributes, SpecialAttributes, AttributeBonus } from '@/core/types'
import { CardType, Attribute, Rarity, EquipmentType } from '@/core/types'

let instanceCounter = 0

function generateInstanceId(): string {
  return `inst_${Date.now()}_${++instanceCounter}`
}

export class CardModel implements CardInstance {
  card_id: string
  instance_id: string
  name: string
  type: CardType
  rarity: Rarity
  description: string
  image: string
  attributes?: Attributes
  special_attributes?: SpecialAttributes
  tags?: string[]
  equipment_slots?: number
  equipment_type?: EquipmentType
  attribute_bonus?: AttributeBonus
  special_bonus?: SpecialAttributes
  gem_slots?: number
  
  equipped_items: string[]
  current_tags: string[]

  constructor(card: Card, instanceId?: string) {
    this.card_id = card.card_id
    this.instance_id = instanceId || generateInstanceId()
    this.name = card.name
    this.type = card.type
    this.rarity = card.rarity
    this.description = card.description
    this.image = card.image
    this.attributes = card.attributes ? { ...card.attributes } : undefined
    this.special_attributes = card.special_attributes ? { ...card.special_attributes } : undefined
    this.tags = card.tags ? [...card.tags] : []
    this.equipment_slots = card.equipment_slots
    this.equipment_type = card.equipment_type
    this.attribute_bonus = card.attribute_bonus ? { ...card.attribute_bonus } : undefined
    this.special_bonus = card.special_bonus ? { ...card.special_bonus } : undefined
    this.gem_slots = card.gem_slots
    
    this.equipped_items = []
    this.current_tags = card.tags ? [...card.tags] : []
  }

  getAttribute(attr: Attribute): number {
    return this.attributes?.[attr] ?? 0
  }

  getAttributeTotal(): number {
    if (!this.attributes) return 0
    return Object.values(this.attributes).reduce((sum, val) => sum + val, 0)
  }

  getSpecialAttribute(attr: 'support' | 'reroll'): number {
    return this.special_attributes?.[attr] ?? 0
  }

  getSupport(): number {
    return this.getSpecialAttribute('support')
  }

  getReroll(): number {
    return this.getSpecialAttribute('reroll')
  }

  isCharacter(): boolean {
    return this.type === CardType.Character
  }

  isEquipment(): boolean {
    return this.type === CardType.Equipment
  }

  isSultan(): boolean {
    return this.type === CardType.Sultan
  }

  isProtagonist(): boolean {
    return this.hasTag('protagonist')
  }

  canEquip(): boolean {
    return this.isCharacter() && (this.equipment_slots ?? 0) > 0
  }

  hasTag(tag: string): boolean {
    return this.current_tags.includes(tag)
  }

  addTag(tag: string): boolean {
    if (this.hasTag(tag)) {
      return false
    }
    this.current_tags.push(tag)
    return true
  }

  removeTag(tag: string): boolean {
    const index = this.current_tags.indexOf(tag)
    if (index === -1) {
      return false
    }
    this.current_tags.splice(index, 1)
    return true
  }

  getTags(): string[] {
    return [...this.current_tags]
  }

  setTags(tags: string[]): void {
    this.current_tags = [...tags]
  }

  getEquippedItemCount(): number {
    return this.equipped_items.length
  }

  getAvailableEquipmentSlots(): number {
    if (!this.canEquip()) return 0
    return (this.equipment_slots ?? 0) - this.equipped_items.length
  }

  canEquipMore(): boolean {
    return this.getAvailableEquipmentSlots() > 0
  }

  equipItem(itemId: string): boolean {
    if (!this.canEquipMore()) {
      return false
    }
    if (this.equipped_items.includes(itemId)) {
      return false
    }
    this.equipped_items.push(itemId)
    return true
  }

  unequipItem(itemId: string): boolean {
    const index = this.equipped_items.indexOf(itemId)
    if (index === -1) {
      return false
    }
    this.equipped_items.splice(index, 1)
    return true
  }

  isEquipmentEquipped(itemId: string): boolean {
    return this.equipped_items.includes(itemId)
  }

  getEquippedItems(): string[] {
    return [...this.equipped_items]
  }

  clearEquippedItems(): string[] {
    const items = [...this.equipped_items]
    this.equipped_items = []
    return items
  }

  getAttributeBonus(attr: string): number {
    return this.attribute_bonus?.[attr] ?? 0
  }

  getAllAttributeBonuses(): AttributeBonus {
    return this.attribute_bonus ? { ...this.attribute_bonus } : {}
  }

  clone(): CardModel {
    const card: Card = {
      card_id: this.card_id,
      name: this.name,
      type: this.type,
      rarity: this.rarity,
      description: this.description,
      image: this.image,
      attributes: this.attributes,
      special_attributes: this.special_attributes,
      tags: this.tags,
      equipment_slots: this.equipment_slots,
      equipment_type: this.equipment_type,
      attribute_bonus: this.attribute_bonus,
      special_bonus: this.special_bonus,
      gem_slots: this.gem_slots,
    }
    
    const cloned = new CardModel(card)
    cloned.equipped_items = [...this.equipped_items]
    cloned.current_tags = [...this.current_tags]
    return cloned
  }

  toCardInstance(): CardInstance {
    return {
      card_id: this.card_id,
      instance_id: this.instance_id,
      name: this.name,
      type: this.type,
      rarity: this.rarity,
      description: this.description,
      image: this.image,
      attributes: this.attributes,
      special_attributes: this.special_attributes,
      tags: this.tags,
      equipment_slots: this.equipment_slots,
      equipment_type: this.equipment_type,
      attribute_bonus: this.attribute_bonus,
      special_bonus: this.special_bonus,
      gem_slots: this.gem_slots,
      equipped_items: this.equipped_items,
      current_tags: this.current_tags,
    }
  }

  static fromCard(card: Card, instanceId?: string): CardModel {
    return new CardModel(card, instanceId)
  }

  static fromInstance(instance: CardInstance): CardModel {
    const card: Card = {
      card_id: instance.card_id,
      name: instance.name,
      type: instance.type,
      rarity: instance.rarity,
      description: instance.description,
      image: instance.image,
      attributes: instance.attributes,
      special_attributes: instance.special_attributes,
      tags: instance.tags,
      equipment_slots: instance.equipment_slots,
      equipment_type: instance.equipment_type,
      attribute_bonus: instance.attribute_bonus,
      special_bonus: instance.special_bonus,
      gem_slots: instance.gem_slots,
    }
    
    const model = new CardModel(card, instance.instance_id)
    model.equipped_items = instance.equipped_items ? [...instance.equipped_items] : []
    model.current_tags = [...instance.current_tags]
    return model
  }
}

export function createCardModel(card: Card): CardModel {
  return new CardModel(card)
}
