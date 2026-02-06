import type { SaveData, Difficulty, GameEndState } from '@/core/types'
import { DIFFICULTY_CONFIG } from '@/core/types'
import { CardManager } from '@/core/card/CardManager'
import { EquipmentSystem } from '@/core/card/EquipmentSystem'
import { PlayerState } from '@/core/player/PlayerState'
import { SceneManager } from '@/core/scene/SceneManager'
import { TimeManager } from './TimeManager'
import { ThinkSystem } from './ThinkSystem'
import { DayManager } from './DayManager'
import { SeededRandom, initGlobalRandom, getGlobalRandom } from '@/lib/random'
import { emit, resetEventBus } from '@/lib/events'
import { loadSceneJson } from '@/data/loader'
import { SCENE_INDEX } from '@/data/configs/scenes'

export class GameManager {
  private playerState!: PlayerState
  private cardManager!: CardManager
  private equipmentSystem!: EquipmentSystem
  private sceneManager!: SceneManager
  private timeManager!: TimeManager
  private thinkSystem!: ThinkSystem
  private dayManager!: DayManager
  private difficulty: Difficulty = 'normal'
  private seed: string = ''
  private isInitialized: boolean = false

  startNewGame(difficulty: Difficulty = 'normal', seed?: string): void {
    this.difficulty = difficulty
    this.seed = seed || Date.now().toString(36) + Math.random().toString(36)
    
    initGlobalRandom(this.seed)
    resetEventBus()

    const config = DIFFICULTY_CONFIG[difficulty]

    this.playerState = new PlayerState({
      gold: config.initialGold,
      reputation: 50,
      goldenDice: 0,
      rewindCharges: 3,
      thinkCharges: 3,
    })

    this.cardManager = new CardManager()
    this.equipmentSystem = new EquipmentSystem(this.cardManager)
    this.sceneManager = new SceneManager()
    this.timeManager = new TimeManager(config.executionDays)
    this.thinkSystem = new ThinkSystem(this.playerState, this.cardManager)
    this.dayManager = new DayManager(
      this.timeManager,
      this.playerState,
      this.cardManager,
      this.sceneManager,
      this.thinkSystem
    )

    this.isInitialized = true
    emit('game:start', { difficulty, seed: this.seed })
  }

  async initializeGameData(): Promise<void> {
    for (const sceneId of SCENE_INDEX) {
      try {
        const scene = await loadSceneJson(sceneId)
        this.sceneManager.registerScene(scene)
      } catch (error) {
        console.warn(`Failed to load scene ${sceneId}:`, error)
      }
    }
    this.refreshAvailableScenes()
  }

  refreshAvailableScenes(): void {
    const completedScenes = new Set(this.sceneManager.getCompletedSceneIds())
    for (const scene of this.sceneManager.getAllRegisteredScenes()) {
      if (!this.sceneManager.getSceneState(scene.scene_id)) {
        const canUnlock = this.sceneManager.checkUnlockConditions(
          scene,
          this.playerState,
          this.cardManager,
          completedScenes
        )
        if (canUnlock) {
          this.sceneManager.unlockScene(scene.scene_id)
        }
      }
    }
  }

  loadGame(saveData: SaveData): void {
    this.difficulty = saveData.difficulty
    this.seed = saveData.random_seed
    
    initGlobalRandom(this.seed)
    resetEventBus()

    this.playerState = new PlayerState({
      gold: saveData.game_state.gold,
      reputation: saveData.game_state.reputation,
      goldenDice: saveData.game_state.golden_dice,
      rewindCharges: saveData.game_state.rewind_charges,
      thinkCharges: saveData.game_state.think_charges,
    })

    this.cardManager = new CardManager()
    this.equipmentSystem = new EquipmentSystem(this.cardManager)
    this.sceneManager = new SceneManager()
    this.timeManager = new TimeManager(saveData.game_state.execution_countdown)
    this.timeManager.restoreState({
      currentDay: saveData.game_state.current_day,
      executionCountdown: saveData.game_state.execution_countdown,
    })

    this.thinkSystem = new ThinkSystem(this.playerState, this.cardManager)
    this.thinkSystem.restoreUsedToday(saveData.cards.think_used_today)

    this.dayManager = new DayManager(
      this.timeManager,
      this.playerState,
      this.cardManager,
      this.sceneManager,
      this.thinkSystem
    )

    this.isInitialized = true
    emit('game:load', { saveId: saveData.save_id })
  }

  createSaveData(saveId?: string): SaveData {
    if (!this.isInitialized) {
      throw new Error('Game not initialized')
    }

    const cardState = this.cardManager.getState()
    const lockedInScenes: Record<string, string[]> = {}

    for (const sceneState of this.sceneManager.getAllSceneStates().values()) {
      if (sceneState.invested_cards.length > 0) {
        lockedInScenes[sceneState.scene_id] = sceneState.invested_cards
      }
    }

    const sceneStatesRecord: Record<string, typeof sceneState> = {}
    for (const [id, sceneState] of this.sceneManager.getAllSceneStates()) {
      sceneStatesRecord[id] = sceneState
    }

    return {
      save_id: saveId || `save_${Date.now()}`,
      timestamp: new Date().toISOString(),
      game_state: {
        current_day: this.timeManager.getCurrentDay(),
        execution_countdown: this.timeManager.getExecutionCountdown(),
        gold: this.playerState.gold,
        reputation: this.playerState.reputation,
        rewind_charges: this.playerState.rewindCharges,
        golden_dice: this.playerState.goldenDice,
        think_charges: this.playerState.thinkCharges,
      },
      cards: {
        hand: cardState.cards.map(c => c.instance_id),
        equipped: {},
        locked_in_scenes: lockedInScenes,
        think_used_today: this.thinkSystem.getUsedTodayList(),
      },
      scenes: {
        active: this.sceneManager.getActiveScenes().map(s => s.scene_id),
        completed: this.sceneManager.getCompletedSceneIds(),
        unlocked: [],
        scene_states: sceneStatesRecord,
      },
      achievements_unlocked: [],
      npc_relations: {},
      difficulty: this.difficulty,
      random_seed: this.seed,
    }
  }

  rewind(): boolean {
    if (!this.playerState.useRewind()) {
      return false
    }

    const snapshot = this.timeManager.popStateSnapshot()
    if (!snapshot) {
      this.playerState.addRewindCharges(1)
      return false
    }

    this.loadGame(snapshot)
    return true
  }

  saveStateForRewind(): void {
    const saveData = this.createSaveData()
    this.timeManager.pushStateSnapshot(saveData)
  }

  checkGameEnd(): GameEndState | null {
    return this.dayManager.checkGameEnd()
  }

  getPlayerState(): PlayerState {
    return this.playerState
  }

  getCardManager(): CardManager {
    return this.cardManager
  }

  getEquipmentSystem(): EquipmentSystem {
    return this.equipmentSystem
  }

  getSceneManager(): SceneManager {
    return this.sceneManager
  }

  getTimeManager(): TimeManager {
    return this.timeManager
  }

  getThinkSystem(): ThinkSystem {
    return this.thinkSystem
  }

  getDayManager(): DayManager {
    return this.dayManager
  }

  getDifficulty(): Difficulty {
    return this.difficulty
  }

  getSeed(): string {
    return this.seed
  }

  isGameInitialized(): boolean {
    return this.isInitialized
  }
}

let gameManagerInstance: GameManager | null = null

export function getGameManager(): GameManager {
  if (!gameManagerInstance) {
    gameManagerInstance = new GameManager()
  }
  return gameManagerInstance
}

export function resetGameManager(): void {
  gameManagerInstance = null
}
