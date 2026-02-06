import { CardModel } from './CardModel'
import { emit } from '@/lib/events'
import { GAME_CONFIG, CardType } from '@/core/types'
import type { Card } from '@/core/types'

export class CardManager {
  private cards: Map<string, CardModel> = new Map()
  private lockedCards: Set<string> = new Set()

  addCard(card: Card | CardModel): CardModel {
    const model = card instanceof CardModel ? card : new CardModel(card)
    
    if (this.cards.size >= GAME_CONFIG.MAX_HAND_SIZE) {
      throw new Error(`Hand size limit (${GAME_CONFIG.MAX_HAND_SIZE}) reached`)
    }
    
    this.cards.set(model.instance_id, model)
    emit('card:add', { cardId: model.instance_id })
    
    return model
  }

  removeCard(instanceId: string): boolean {
    const card = this.cards.get(instanceId)
    if (!card) {
      return false
    }
    
    if (card.isProtagonist()) {
      throw new Error('Cannot remove protagonist card')
    }
    
    if (this.lockedCards.has(instanceId)) {
      throw new Error('Cannot remove locked card')
    }
    
    this.cards.delete(instanceId)
    emit('card:remove', { cardId: instanceId })
    
    return true
  }

  getCard(instanceId: string): CardModel | undefined {
    return this.cards.get(instanceId)
  }

  getCardByCardId(cardId: string): CardModel | undefined {
    for (const card of this.cards.values()) {
      if (card.card_id === cardId) {
        return card
      }
    }
    return undefined
  }

  getAllCards(): CardModel[] {
    return Array.from(this.cards.values())
  }

  getAvailableCards(): CardModel[] {
    return this.getAllCards().filter(card => !this.lockedCards.has(card.instance_id))
  }

  getLockedCards(): CardModel[] {
    return this.getAllCards().filter(card => this.lockedCards.has(card.instance_id))
  }

  getCardsByType(type: CardType): CardModel[] {
    return this.getAllCards().filter(card => card.type === type)
  }

  getCharacterCards(): CardModel[] {
    return this.getCardsByType(CardType.Character)
  }

  getEquipmentCards(): CardModel[] {
    return this.getCardsByType(CardType.Equipment)
  }

  getSultanCards(): CardModel[] {
    return this.getCardsByType(CardType.Sultan)
  }

  getProtagonist(): CardModel | undefined {
    return this.getAllCards().find(card => card.isProtagonist())
  }

  lockCard(instanceId: string, sceneId: string): boolean {
    const card = this.cards.get(instanceId)
    if (!card) {
      return false
    }
    
    if (this.lockedCards.has(instanceId)) {
      return false
    }
    
    this.lockedCards.add(instanceId)
    emit('card:lock', { cardId: instanceId, sceneId })
    
    return true
  }

  unlockCard(instanceId: string): boolean {
    if (!this.lockedCards.has(instanceId)) {
      return false
    }
    
    this.lockedCards.delete(instanceId)
    emit('card:unlock', { cardId: instanceId })
    
    return true
  }

  unlockAllCards(): void {
    for (const instanceId of this.lockedCards) {
      this.lockedCards.delete(instanceId)
      emit('card:unlock', { cardId: instanceId })
    }
  }

  isCardLocked(instanceId: string): boolean {
    return this.lockedCards.has(instanceId)
  }

  getCardCount(): number {
    return this.cards.size
  }

  hasSpace(): boolean {
    return this.cards.size < GAME_CONFIG.MAX_HAND_SIZE
  }

  getAvailableSpace(): number {
    return GAME_CONFIG.MAX_HAND_SIZE - this.cards.size
  }

  getCardsByTag(tag: string): CardModel[] {
    return this.getAllCards().filter(card => card.hasTag(tag))
  }

  addTagToCard(instanceId: string, tag: string): boolean {
    const card = this.cards.get(instanceId)
    if (!card) {
      return false
    }
    
    if (card.addTag(tag)) {
      emit('card:tag_add', { cardId: instanceId, tag })
      return true
    }
    
    return false
  }

  removeTagFromCard(instanceId: string, tag: string): boolean {
    const card = this.cards.get(instanceId)
    if (!card) {
      return false
    }
    
    if (card.removeTag(tag)) {
      emit('card:tag_remove', { cardId: instanceId, tag })
      return true
    }
    
    return false
  }

  clear(): void {
    this.cards.clear()
    this.lockedCards.clear()
  }

  getState(): { cards: CardModel[]; lockedIds: string[] } {
    return {
      cards: this.getAllCards(),
      lockedIds: Array.from(this.lockedCards),
    }
  }

  restoreState(cards: CardModel[], lockedIds: string[]): void {
    this.clear()
    for (const card of cards) {
      this.cards.set(card.instance_id, card)
    }
    for (const id of lockedIds) {
      if (this.cards.has(id)) {
        this.lockedCards.add(id)
      }
    }
  }
}
