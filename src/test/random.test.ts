import { describe, it, expect, beforeEach } from 'vitest'
import {
  SeededRandom,
  initGlobalRandom,
  getGlobalRandom,
  setGlobalRandom,
} from '@/lib/random'

describe('SeededRandom', () => {
  describe('constructor', () => {
    it('should create with provided seed', () => {
      const rng = new SeededRandom('test_seed')
      expect(rng.getSeed()).toBe('test_seed')
    })

    it('should auto-generate seed if not provided', () => {
      const rng = new SeededRandom()
      expect(rng.getSeed()).toBeTruthy()
      expect(rng.getSeed().length).toBeGreaterThan(0)
    })
  })

  describe('random()', () => {
    it('should return values between 0 and 1', () => {
      const rng = new SeededRandom('test')
      for (let i = 0; i < 100; i++) {
        const value = rng.random()
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }
    })

    it('should produce same sequence with same seed', () => {
      const rng1 = new SeededRandom('identical_seed')
      const rng2 = new SeededRandom('identical_seed')

      for (let i = 0; i < 10; i++) {
        expect(rng1.random()).toBe(rng2.random())
      }
    })

    it('should produce different sequences with different seeds', () => {
      const rng1 = new SeededRandom('seed_a')
      const rng2 = new SeededRandom('seed_b')

      const results1 = Array.from({ length: 10 }, () => rng1.random())
      const results2 = Array.from({ length: 10 }, () => rng2.random())

      expect(results1).not.toEqual(results2)
    })
  })

  describe('int()', () => {
    it('should return integers in range [min, max]', () => {
      const rng = new SeededRandom('int_test')
      for (let i = 0; i < 100; i++) {
        const value = rng.int(1, 10)
        expect(value).toBeGreaterThanOrEqual(1)
        expect(value).toBeLessThanOrEqual(10)
        expect(Number.isInteger(value)).toBe(true)
      }
    })

    it('should return min when min equals max', () => {
      const rng = new SeededRandom('edge')
      expect(rng.int(5, 5)).toBe(5)
    })
  })

  describe('rollDice()', () => {
    it('should return values between 1 and sides', () => {
      const rng = new SeededRandom('dice')
      for (let i = 0; i < 100; i++) {
        const roll = rng.rollDice(10)
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(10)
      }
    })

    it('should default to D10', () => {
      const rng = new SeededRandom('d10')
      for (let i = 0; i < 50; i++) {
        const roll = rng.rollDice()
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(10)
      }
    })
  })

  describe('rollMultipleDice()', () => {
    it('should return correct number of dice', () => {
      const rng = new SeededRandom('multi')
      const rolls = rng.rollMultipleDice(5, 10)
      expect(rolls).toHaveLength(5)
      rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(10)
      })
    })
  })

  describe('pick()', () => {
    it('should return an item from the array', () => {
      const rng = new SeededRandom('pick')
      const items = ['a', 'b', 'c', 'd']
      for (let i = 0; i < 20; i++) {
        expect(items).toContain(rng.pick(items))
      }
    })

    it('should throw on empty array', () => {
      const rng = new SeededRandom('empty')
      expect(() => rng.pick([])).toThrow('Cannot pick from empty array')
    })
  })

  describe('shuffle()', () => {
    it('should return array with same elements', () => {
      const rng = new SeededRandom('shuffle')
      const original = [1, 2, 3, 4, 5]
      const shuffled = rng.shuffle(original)

      expect(shuffled).toHaveLength(original.length)
      expect(shuffled.sort()).toEqual(original.sort())
    })

    it('should not modify original array', () => {
      const rng = new SeededRandom('immutable')
      const original = [1, 2, 3, 4, 5]
      const copy = [...original]
      rng.shuffle(original)

      expect(original).toEqual(copy)
    })

    it('should produce same shuffle with same seed', () => {
      const rng1 = new SeededRandom('same_shuffle')
      const rng2 = new SeededRandom('same_shuffle')
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

      expect(rng1.shuffle(arr)).toEqual(rng2.shuffle(arr))
    })
  })

  describe('weightedPick()', () => {
    it('should respect weights', () => {
      const rng = new SeededRandom('weighted')
      const items = ['rare', 'common']
      const weights = [1, 99]
      
      let rareCount = 0
      const iterations = 1000
      for (let i = 0; i < iterations; i++) {
        rng.reset()
        for (let j = 0; j < i; j++) rng.random()
        if (rng.weightedPick(items, weights) === 'rare') rareCount++
      }

      expect(rareCount).toBeLessThan(iterations * 0.1)
    })

    it('should throw on mismatched lengths', () => {
      const rng = new SeededRandom('mismatch')
      expect(() => rng.weightedPick(['a', 'b'], [1])).toThrow()
    })

    it('should throw on empty arrays', () => {
      const rng = new SeededRandom('empty_weighted')
      expect(() => rng.weightedPick([], [])).toThrow()
    })
  })

  describe('state management', () => {
    it('should save and restore state', () => {
      const rng = new SeededRandom('state_test')
      
      for (let i = 0; i < 5; i++) rng.random()
      
      const state = rng.getState()
      const nextValues = [rng.random(), rng.random(), rng.random()]
      
      rng.restoreState(state)
      const restoredValues = [rng.random(), rng.random(), rng.random()]
      
      expect(restoredValues).toEqual(nextValues)
    })

    it('should serialize state correctly', () => {
      const rng = new SeededRandom('serialize')
      for (let i = 0; i < 3; i++) rng.random()
      
      const state = rng.getState()
      expect(state.seed).toBe('serialize')
      expect(state.state).toBeDefined()
    })
  })

  describe('clone()', () => {
    it('should create independent copy with same state', () => {
      const rng = new SeededRandom('clone_test')
      for (let i = 0; i < 5; i++) rng.random()
      
      const clone = rng.clone()
      
      expect(clone.random()).toBe(rng.random())
      expect(clone.random()).toBe(rng.random())
    })
  })

  describe('reset()', () => {
    it('should reset to initial state', () => {
      const rng = new SeededRandom('reset_test')
      const initial = [rng.random(), rng.random(), rng.random()]
      
      for (let i = 0; i < 10; i++) rng.random()
      
      rng.reset()
      const afterReset = [rng.random(), rng.random(), rng.random()]
      
      expect(afterReset).toEqual(initial)
    })
  })
})

describe('Global Random', () => {
  beforeEach(() => {
    initGlobalRandom('global_test')
  })

  it('should initialize with seed', () => {
    const global = initGlobalRandom('new_seed')
    expect(global.getSeed()).toBe('new_seed')
  })

  it('should get same instance', () => {
    const r1 = getGlobalRandom()
    const r2 = getGlobalRandom()
    expect(r1).toBe(r2)
  })

  it('should allow setting custom instance', () => {
    const custom = new SeededRandom('custom')
    setGlobalRandom(custom)
    expect(getGlobalRandom()).toBe(custom)
  })
})
