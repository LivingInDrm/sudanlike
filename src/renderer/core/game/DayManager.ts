import type { GamePhase, GameEndState } from '@/core/types'
import { CardType } from '@/core/types'
import type { CardManager } from '@/core/card/CardManager'
import type { PlayerState } from '@/core/player/PlayerState'
import type { SceneManager } from '@/core/scene/SceneManager'
import type { TimeManager } from './TimeManager'
import type { ThinkSystem } from './ThinkSystem'
import { SettlementExecutor } from '@/core/settlement/SettlementExecutor'
import { emit } from '@/lib/events'

export class DayManager {
  private phase: GamePhase = 'dawn'
  private settlementExecutor: SettlementExecutor

  constructor(
    private timeManager: TimeManager,
    private playerState: PlayerState,
    private cardManager: CardManager,
    private sceneManager: SceneManager,
    private thinkSystem: ThinkSystem
  ) {
    this.settlementExecutor = new SettlementExecutor(playerState, cardManager, sceneManager)
  }

  getPhase(): GamePhase {
    return this.phase
  }

  startDawn(): void {
    this.phase = 'dawn'
    const day = this.timeManager.getCurrentDay()
    const countdown = this.timeManager.getExecutionCountdown()

    emit('day:dawn', { day, countdown })

    this.thinkSystem.resetDaily()

    this.decrementAllSceneTurns()

    emit('day:action', { day })
    this.phase = 'action'
  }

  private decrementAllSceneTurns(): void {
    const activeScenes = this.sceneManager.getActiveScenes()
    for (const state of activeScenes) {
      this.sceneManager.decrementRemainingTurns(state.scene_id)
    }
  }

  startSettlement(): void {
    this.phase = 'settlement'
    const day = this.timeManager.getCurrentDay()
    emit('day:settlement', { day })

    const expiredScenes = this.sceneManager.getExpiredScenes()
    for (const sceneId of expiredScenes) {
      this.settlementExecutor.settleScene(sceneId)
    }

    const absentScenes = this.sceneManager.getAbsentScenes()
    for (const sceneId of absentScenes) {
      this.settlementExecutor.applyAbsencePenalty(sceneId)
    }
  }

  endDay(): void {
    const day = this.timeManager.getCurrentDay()
    emit('day:end', { day })
    
    this.timeManager.advanceDay()
  }

  checkGameEnd(): GameEndState | null {
    if (this.timeManager.isExecutionDay()) {
      const hasSultan = this.cardManager.getSultanCards().length > 0
      
      if (hasSultan) {
        return {
          is_victory: true,
          ending_type: 'survival_victory',
          message: 'You survived until the execution day with the Sultan card!',
        }
      } else {
        return {
          is_victory: false,
          ending_type: 'execution_failure',
          message: 'The execution day has arrived. You failed to save the Sultan.',
        }
      }
    }

    const protagonist = this.cardManager.getProtagonist()
    if (!protagonist) {
      return {
        is_victory: false,
        ending_type: 'death_failure',
        message: 'Your protagonist has died.',
      }
    }

    return null
  }

  getSettlementExecutor(): SettlementExecutor {
    return this.settlementExecutor
  }
}
