import type { Scene, SceneState, UnlockConditions, SlotState } from '@/core/types'
import { SceneStatus } from '@/core/types'
import { SlotSystem } from './SlotSystem'
import { emit } from '@/lib/events'
import type { CardManager } from '@/core/card/CardManager'
import type { PlayerState } from '@/core/player/PlayerState'

export class SceneManager {
  private scenes: Map<string, Scene> = new Map()
  private sceneStates: Map<string, SceneState> = new Map()
  private slotSystems: Map<string, SlotSystem> = new Map()

  registerScene(scene: Scene): void {
    this.scenes.set(scene.scene_id, scene)
  }

  registerScenes(scenes: Scene[]): void {
    for (const scene of scenes) {
      this.registerScene(scene)
    }
  }

  getScene(sceneId: string): Scene | undefined {
    return this.scenes.get(sceneId)
  }

  getSceneState(sceneId: string): SceneState | undefined {
    return this.sceneStates.get(sceneId)
  }

  getSlotSystem(sceneId: string): SlotSystem | undefined {
    return this.slotSystems.get(sceneId)
  }

  unlockScene(sceneId: string): boolean {
    const scene = this.scenes.get(sceneId)
    if (!scene) {
      return false
    }

    if (this.sceneStates.has(sceneId)) {
      return false
    }

    const state: SceneState = {
      scene_id: sceneId,
      status: SceneStatus.Available,
      remaining_turns: scene.duration,
      invested_cards: [],
      slot_states: scene.slots.map((slot, index) => ({
        ...slot,
        slot_index: index,
        invested_card_id: undefined,
      })),
    }

    this.sceneStates.set(sceneId, state)
    this.slotSystems.set(sceneId, new SlotSystem(scene.slots))

    emit('scene:unlock', { sceneId })
    return true
  }

  checkUnlockConditions(
    scene: Scene,
    playerState: PlayerState,
    cardManager: CardManager,
    completedScenes: Set<string>
  ): boolean {
    const conditions = scene.unlock_conditions
    if (!conditions) {
      return true
    }

    if (conditions.reputation_min !== undefined && 
        playerState.reputation < conditions.reputation_min) {
      return false
    }

    if (conditions.reputation_max !== undefined && 
        playerState.reputation > conditions.reputation_max) {
      return false
    }

    if (conditions.required_tags) {
      for (const tag of conditions.required_tags) {
        if (cardManager.getCardsByTag(tag).length === 0) {
          return false
        }
      }
    }

    if (conditions.required_cards) {
      for (const cardId of conditions.required_cards) {
        if (!cardManager.getCardByCardId(cardId)) {
          return false
        }
      }
    }

    if (conditions.completed_scenes) {
      for (const sceneId of conditions.completed_scenes) {
        if (!completedScenes.has(sceneId)) {
          return false
        }
      }
    }

    return true
  }

  participateScene(sceneId: string, cardManager: CardManager): boolean {
    const state = this.sceneStates.get(sceneId)
    const slotSystem = this.slotSystems.get(sceneId)

    if (!state || !slotSystem) {
      return false
    }

    if (state.status !== SceneStatus.Available) {
      return false
    }

    if (!slotSystem.areRequiredSlotsFilled()) {
      return false
    }

    const cardIds = slotSystem.getInvestedCardIds()
    for (const cardId of cardIds) {
      cardManager.lockCard(cardId, sceneId)
    }

    slotSystem.lockAllFilledSlots()
    state.invested_cards = cardIds
    state.status = SceneStatus.Participated
    state.slot_states = slotSystem.getState()

    emit('scene:participate', { sceneId, cards: cardIds })
    return true
  }

  decrementRemainingTurns(sceneId: string): number {
    const state = this.sceneStates.get(sceneId)
    if (!state) {
      return -1
    }

    if (state.status === SceneStatus.Participated) {
      state.remaining_turns = Math.max(0, state.remaining_turns - 1)
    }

    return state.remaining_turns
  }

  getExpiredScenes(): string[] {
    const expired: string[] = []
    
    for (const [sceneId, state] of this.sceneStates) {
      if (state.status === SceneStatus.Participated && state.remaining_turns === 0) {
        expired.push(sceneId)
      }
    }

    return expired
  }

  getAbsentScenes(): string[] {
    const absent: string[] = []
    
    for (const [sceneId, state] of this.sceneStates) {
      if (state.status === SceneStatus.Available && state.remaining_turns === 0) {
        absent.push(sceneId)
      }
    }

    return absent
  }

  markSettling(sceneId: string): void {
    const state = this.sceneStates.get(sceneId)
    if (state) {
      state.status = SceneStatus.Settling
    }
  }

  completeScene(sceneId: string, cardManager: CardManager): string[] {
    const state = this.sceneStates.get(sceneId)
    const slotSystem = this.slotSystems.get(sceneId)

    if (!state || !slotSystem) {
      return []
    }

    const cardIds = state.invested_cards
    for (const cardId of cardIds) {
      cardManager.unlockCard(cardId)
    }

    slotSystem.unlockAllSlots()
    state.status = SceneStatus.Completed
    state.slot_states = slotSystem.getState()

    emit('scene:complete', { sceneId })
    return cardIds
  }

  expireScene(sceneId: string): void {
    const state = this.sceneStates.get(sceneId)
    if (state && state.status === SceneStatus.Available) {
      state.status = SceneStatus.Completed
      emit('scene:expire', { sceneId })
    }
  }

  getActiveScenes(): SceneState[] {
    return Array.from(this.sceneStates.values())
      .filter(state => 
        state.status === SceneStatus.Available || 
        state.status === SceneStatus.Participated
      )
  }

  getAvailableScenes(): SceneState[] {
    return Array.from(this.sceneStates.values())
      .filter(state => state.status === SceneStatus.Available)
  }

  getParticipatedScenes(): SceneState[] {
    return Array.from(this.sceneStates.values())
      .filter(state => state.status === SceneStatus.Participated)
  }

  getCompletedSceneIds(): string[] {
    return Array.from(this.sceneStates.values())
      .filter(state => state.status === SceneStatus.Completed)
      .map(state => state.scene_id)
  }

  getAllSceneStates(): Map<string, SceneState> {
    return new Map(this.sceneStates)
  }

  getAllRegisteredScenes(): Scene[] {
    return Array.from(this.scenes.values())
  }

  clear(): void {
    this.sceneStates.clear()
    this.slotSystems.clear()
  }

  reset(): void {
    this.clear()
    this.scenes.clear()
  }
}
