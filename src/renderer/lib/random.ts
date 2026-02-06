import seedrandom from 'seedrandom'

export interface RandomState {
  seed: string
  state: object
}

export class SeededRandom {
  private rng: seedrandom.PRNG
  private seed: string

  constructor(seed?: string) {
    this.seed = seed || this.generateSeed()
    this.rng = seedrandom(this.seed, { state: true })
  }

  private generateSeed(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  random(): number {
    return this.rng()
  }

  int(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min
  }

  rollDice(sides: number = 10): number {
    return this.int(1, sides)
  }

  rollMultipleDice(count: number, sides: number = 10): number[] {
    const results: number[] = []
    for (let i = 0; i < count; i++) {
      results.push(this.rollDice(sides))
    }
    return results
  }

  pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array')
    }
    return array[this.int(0, array.length - 1)]
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(0, i)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  weightedPick<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights must have same length')
    }
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array')
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = this.random() * totalWeight

    for (let i = 0; i < items.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return items[i]
      }
    }

    return items[items.length - 1]
  }

  getSeed(): string {
    return this.seed
  }

  getState(): RandomState {
    return {
      seed: this.seed,
      state: this.rng.state(),
    }
  }

  restoreState(state: RandomState): void {
    this.seed = state.seed
    this.rng = seedrandom('', { state: state.state })
  }

  clone(): SeededRandom {
    const cloned = new SeededRandom(this.seed)
    cloned.restoreState(this.getState())
    return cloned
  }

  reset(): void {
    this.rng = seedrandom(this.seed, { state: true })
  }
}

let globalRandom: SeededRandom | null = null

export function initGlobalRandom(seed?: string): SeededRandom {
  globalRandom = new SeededRandom(seed)
  return globalRandom
}

export function getGlobalRandom(): SeededRandom {
  if (!globalRandom) {
    globalRandom = new SeededRandom()
  }
  return globalRandom
}

export function setGlobalRandom(random: SeededRandom): void {
  globalRandom = random
}
