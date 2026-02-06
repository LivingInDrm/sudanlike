import type { Effects } from '@/core/types'
import type { CardManager } from '@/core/card/CardManager'
import type { PlayerState } from '@/core/player/PlayerState'
import type { SceneManager } from '@/core/scene/SceneManager'
import { emit } from '@/lib/events'

export class EffectApplier {
  constructor(
    private playerState: PlayerState,
    private cardManager: CardManager,
    private sceneManager: SceneManager
  ) {}

  apply(effects: Effects, investedCardIds?: string[]): void {
    emit('effects:apply', { effects })

    if (effects.gold !== undefined) {
      this.playerState.addGold(effects.gold)
    }

    if (effects.reputation !== undefined) {
      this.playerState.addReputation(effects.reputation)
    }

    if (effects.golden_dice !== undefined) {
      this.playerState.addGoldenDice(effects.golden_dice)
    }

    if (effects.rewind_charges !== undefined) {
      this.playerState.addRewindCharges(effects.rewind_charges)
    }

    if (effects.cards_add) {
      for (const cardId of effects.cards_add) {
        const resolved = this.resolveCardReference(cardId, investedCardIds)
        if (resolved) {
        }
      }
    }

    if (effects.cards_remove) {
      for (const cardId of effects.cards_remove) {
        const resolved = this.resolveCardReference(cardId, investedCardIds)
        if (resolved) {
          const card = this.cardManager.getCardByCardId(resolved) || 
                       this.cardManager.getCard(resolved)
          if (card) {
            try {
              this.cardManager.removeCard(card.instance_id)
            } catch {
            }
          }
        }
      }
    }

    if (effects.consume_invested && investedCardIds) {
      for (const cardId of investedCardIds) {
        try {
          this.cardManager.removeCard(cardId)
        } catch {
        }
      }
    }

    if (effects.tags_add) {
      for (const [cardRef, tags] of Object.entries(effects.tags_add)) {
        const resolved = this.resolveCardReference(cardRef, investedCardIds)
        if (resolved) {
          const card = this.cardManager.getCard(resolved)
          if (card) {
            for (const tag of tags) {
              this.cardManager.addTagToCard(card.instance_id, tag)
            }
          }
        }
      }
    }

    if (effects.tags_remove) {
      for (const [cardRef, tags] of Object.entries(effects.tags_remove)) {
        const resolved = this.resolveCardReference(cardRef, investedCardIds)
        if (resolved) {
          const card = this.cardManager.getCard(resolved)
          if (card) {
            for (const tag of tags) {
              this.cardManager.removeTagFromCard(card.instance_id, tag)
            }
          }
        }
      }
    }

    if (effects.unlock_scenes) {
      for (const sceneId of effects.unlock_scenes) {
        this.sceneManager.unlockScene(sceneId)
      }
    }
  }

  private resolveCardReference(cardRef: string, investedCardIds?: string[]): string | null {
    const match = cardRef.match(/^card_invested_(\d+)$/)
    if (match && investedCardIds) {
      const index = parseInt(match[1], 10)
      return investedCardIds[index] || null
    }
    return cardRef
  }
}
