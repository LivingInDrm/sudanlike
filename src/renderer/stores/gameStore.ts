import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SaveData, Difficulty, GamePhase, GameEndState } from '@/core/types'
import { GameManager, getGameManager, resetGameManager } from '@/core/game/GameManager'
import type { CardModel } from '@/core/card/CardModel'
import type { SceneState, Scene } from '@/core/types'

interface GameStoreState {
  isInitialized: boolean
  currentDay: number
  executionCountdown: number
  gold: number
  reputation: number
  goldenDice: number
  rewindCharges: number
  thinkCharges: number
  phase: GamePhase
  difficulty: Difficulty
  gameEndState: GameEndState | null
  
  cards: CardModel[]
  lockedCardIds: string[]
  activeScenes: SceneState[]
  availableScenes: SceneState[]
  
  startNewGame: (difficulty: Difficulty, seed?: string) => Promise<void>
  loadGame: (saveData: SaveData) => Promise<void>
  saveGame: () => SaveData
  
  advanceDay: () => void
  startSettlement: () => void
  checkGameEnd: () => GameEndState | null
  
  refreshState: () => void
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      currentDay: 1,
      executionCountdown: 14,
      gold: 0,
      reputation: 50,
      goldenDice: 0,
      rewindCharges: 3,
      thinkCharges: 3,
      phase: 'dawn' as GamePhase,
      difficulty: 'normal' as Difficulty,
      gameEndState: null,
      cards: [],
      lockedCardIds: [],
      activeScenes: [],
      availableScenes: [],

      startNewGame: async (difficulty: Difficulty, seed?: string) => {
        resetGameManager()
        const gm = getGameManager()
        gm.startNewGame(difficulty, seed)
        await gm.initializeGameData()
        get().refreshState()
      },

      loadGame: async (saveData: SaveData) => {
        resetGameManager()
        const gm = getGameManager()
        gm.loadGame(saveData)
        await gm.initializeGameData()
        get().refreshState()
      },

      saveGame: () => {
        const gm = getGameManager()
        return gm.createSaveData()
      },

      advanceDay: () => {
        const gm = getGameManager()
        gm.getDayManager().endDay()
        gm.getDayManager().startDawn()
        gm.refreshAvailableScenes()
        get().refreshState()
      },

      startSettlement: () => {
        const gm = getGameManager()
        gm.getDayManager().startSettlement()
        get().refreshState()
      },

      checkGameEnd: () => {
        const gm = getGameManager()
        const result = gm.checkGameEnd()
        if (result) {
          set({ gameEndState: result, phase: 'game_over' })
        }
        return result
      },

      refreshState: () => {
        const gm = getGameManager()
        if (!gm.isGameInitialized()) {
          return
        }

        const playerState = gm.getPlayerState()
        const timeManager = gm.getTimeManager()
        const cardManager = gm.getCardManager()
        const sceneManager = gm.getSceneManager()
        const dayManager = gm.getDayManager()
        const cardState = cardManager.getState()

        set({
          isInitialized: true,
          currentDay: timeManager.getCurrentDay(),
          executionCountdown: timeManager.getExecutionCountdown(),
          gold: playerState.gold,
          reputation: playerState.reputation,
          goldenDice: playerState.goldenDice,
          rewindCharges: playerState.rewindCharges,
          thinkCharges: playerState.thinkCharges,
          phase: dayManager.getPhase(),
          difficulty: gm.getDifficulty(),
          cards: cardState.cards,
          lockedCardIds: cardState.lockedIds,
          activeScenes: sceneManager.getActiveScenes(),
          availableScenes: sceneManager.getAvailableScenes(),
        })
      },
    }),
    {
      name: 'sultan-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        difficulty: state.difficulty,
      }),
    }
  )
)
