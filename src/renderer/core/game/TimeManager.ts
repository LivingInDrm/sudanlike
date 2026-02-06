import type { GameState, SaveData } from '@/core/types'
import { emit } from '@/lib/events'
import { SeededRandom, getGlobalRandom, setGlobalRandom } from '@/lib/random'

export interface TimeManagerState {
  currentDay: number
  executionCountdown: number
}

export class TimeManager {
  private currentDay: number = 1
  private executionCountdown: number
  private stateHistory: SaveData[] = []
  private maxHistory: number = 10

  constructor(executionDays: number = 14) {
    this.executionCountdown = executionDays
  }

  getCurrentDay(): number {
    return this.currentDay
  }

  getExecutionCountdown(): number {
    return this.executionCountdown
  }

  advanceDay(): void {
    this.currentDay++
    this.executionCountdown = Math.max(0, this.executionCountdown - 1)
    emit('day:start', { day: this.currentDay })
  }

  isExecutionDay(): boolean {
    return this.executionCountdown === 0
  }

  pushStateSnapshot(saveData: SaveData): void {
    this.stateHistory.push(saveData)
    if (this.stateHistory.length > this.maxHistory) {
      this.stateHistory.shift()
    }
  }

  popStateSnapshot(): SaveData | undefined {
    return this.stateHistory.pop()
  }

  canRewind(): boolean {
    return this.stateHistory.length > 0
  }

  getHistoryLength(): number {
    return this.stateHistory.length
  }

  clearHistory(): void {
    this.stateHistory = []
  }

  reset(executionDays: number): void {
    this.currentDay = 1
    this.executionCountdown = executionDays
    this.clearHistory()
  }

  getState(): TimeManagerState {
    return {
      currentDay: this.currentDay,
      executionCountdown: this.executionCountdown,
    }
  }

  restoreState(state: TimeManagerState): void {
    this.currentDay = state.currentDay
    this.executionCountdown = state.executionCountdown
  }
}
