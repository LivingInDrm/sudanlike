import type { Slot, SlotState } from '@/core/types'
import { SlotType, CardType } from '@/core/types'
import type { CardModel } from '@/core/card/CardModel'

export class SlotSystem {
  private slots: SlotState[] = []

  constructor(slotsConfig: Slot[]) {
    this.slots = slotsConfig.map((slot, index) => ({
      ...slot,
      slot_index: index,
      invested_card_id: undefined,
    }))
  }

  getSlots(): SlotState[] {
    return [...this.slots]
  }

  getSlot(index: number): SlotState | undefined {
    return this.slots[index]
  }

  canPlaceCard(slotIndex: number, card: CardModel): boolean {
    const slot = this.slots[slotIndex]
    if (!slot) {
      return false
    }

    if (slot.locked) {
      return false
    }

    if (slot.invested_card_id) {
      return false
    }

    return this.matchesSlotType(slot.type, card)
  }

  private matchesSlotType(slotType: SlotType, card: CardModel): boolean {
    switch (slotType) {
      case SlotType.Character:
        return card.type === CardType.Character
      case SlotType.Item:
        return card.type === CardType.Equipment || 
               card.type === CardType.Consumable || 
               card.type === CardType.Intel
      case SlotType.Sultan:
        return card.type === CardType.Sultan
      case SlotType.Gold:
        return card.type === CardType.Gem
      default:
        return false
    }
  }

  placeCard(slotIndex: number, card: CardModel): boolean {
    if (!this.canPlaceCard(slotIndex, card)) {
      return false
    }

    this.slots[slotIndex].invested_card_id = card.instance_id
    return true
  }

  removeCard(slotIndex: number): string | undefined {
    const slot = this.slots[slotIndex]
    if (!slot || slot.locked) {
      return undefined
    }

    const cardId = slot.invested_card_id
    slot.invested_card_id = undefined
    return cardId
  }

  lockSlot(slotIndex: number): void {
    if (this.slots[slotIndex]) {
      this.slots[slotIndex].locked = true
    }
  }

  unlockSlot(slotIndex: number): void {
    if (this.slots[slotIndex]) {
      this.slots[slotIndex].locked = false
    }
  }

  lockAllFilledSlots(): void {
    for (const slot of this.slots) {
      if (slot.invested_card_id) {
        slot.locked = true
      }
    }
  }

  unlockAllSlots(): void {
    for (const slot of this.slots) {
      slot.locked = false
    }
  }

  getInvestedCardIds(): string[] {
    return this.slots
      .filter(slot => slot.invested_card_id)
      .map(slot => slot.invested_card_id!)
  }

  getCardAtSlot(slotIndex: number): string | undefined {
    return this.slots[slotIndex]?.invested_card_id
  }

  areRequiredSlotsFilled(): boolean {
    return this.slots
      .filter(slot => slot.required)
      .every(slot => slot.invested_card_id !== undefined)
  }

  getEmptyRequiredSlots(): number[] {
    return this.slots
      .filter(slot => slot.required && !slot.invested_card_id)
      .map(slot => slot.slot_index!)
  }

  clearAllCards(): string[] {
    const cardIds: string[] = []
    for (const slot of this.slots) {
      if (slot.invested_card_id && !slot.locked) {
        cardIds.push(slot.invested_card_id)
        slot.invested_card_id = undefined
      }
    }
    return cardIds
  }

  reset(): void {
    for (const slot of this.slots) {
      slot.invested_card_id = undefined
      slot.locked = false
    }
  }

  getState(): SlotState[] {
    return this.slots.map(slot => ({ ...slot }))
  }

  restoreState(states: SlotState[]): void {
    this.slots = states.map(state => ({ ...state }))
  }
}
