import { CardSchema, SceneSchema } from './schemas'
import type { Card, Scene } from '@/core/types'
import { ZodError } from 'zod'

export class DataLoadError extends Error {
  constructor(
    message: string,
    public readonly source: string,
    public readonly validationErrors?: ZodError
  ) {
    super(message)
    this.name = 'DataLoadError'
  }
}

const cardCache = new Map<string, Card>()
const sceneCache = new Map<string, Scene>()
const cardListCache: Card[] | null = null
const sceneListCache: Scene[] | null = null

export async function loadCardJson(cardId: string): Promise<Card> {
  if (cardCache.has(cardId)) {
    return cardCache.get(cardId)!
  }

  try {
    const module = await import(`./configs/cards/${cardId}.json`)
    const data = module.default || module
    
    const result = CardSchema.safeParse(data)
    if (!result.success) {
      throw new DataLoadError(
        `Card validation failed for ${cardId}`,
        `configs/cards/${cardId}.json`,
        result.error
      )
    }

    cardCache.set(cardId, result.data as Card)
    return result.data as Card
  } catch (error) {
    if (error instanceof DataLoadError) {
      throw error
    }
    throw new DataLoadError(
      `Failed to load card ${cardId}: ${(error as Error).message}`,
      `configs/cards/${cardId}.json`
    )
  }
}

export async function loadSceneJson(sceneId: string): Promise<Scene> {
  if (sceneCache.has(sceneId)) {
    return sceneCache.get(sceneId)!
  }

  try {
    const module = await import(`./configs/scenes/${sceneId}.json`)
    const data = module.default || module
    
    const result = SceneSchema.safeParse(data)
    if (!result.success) {
      throw new DataLoadError(
        `Scene validation failed for ${sceneId}`,
        `configs/scenes/${sceneId}.json`,
        result.error
      )
    }

    sceneCache.set(sceneId, result.data as Scene)
    return result.data as Scene
  } catch (error) {
    if (error instanceof DataLoadError) {
      throw error
    }
    throw new DataLoadError(
      `Failed to load scene ${sceneId}: ${(error as Error).message}`,
      `configs/scenes/${sceneId}.json`
    )
  }
}

export function validateCard(data: unknown): Card {
  const result = CardSchema.safeParse(data)
  if (!result.success) {
    throw new DataLoadError(
      'Card validation failed',
      'inline',
      result.error
    )
  }
  return result.data as Card
}

export function validateScene(data: unknown): Scene {
  const result = SceneSchema.safeParse(data)
  if (!result.success) {
    throw new DataLoadError(
      'Scene validation failed',
      'inline',
      result.error
    )
  }
  return result.data as Scene
}

export function registerCard(card: Card): void {
  const validated = validateCard(card)
  cardCache.set(validated.card_id, validated)
}

export function registerScene(scene: Scene): void {
  const validated = validateScene(scene)
  sceneCache.set(validated.scene_id, validated)
}

export function getCard(cardId: string): Card | undefined {
  return cardCache.get(cardId)
}

export function getScene(sceneId: string): Scene | undefined {
  return sceneCache.get(sceneId)
}

export function getAllCards(): Card[] {
  return Array.from(cardCache.values())
}

export function getAllScenes(): Scene[] {
  return Array.from(sceneCache.values())
}

export function clearCache(): void {
  cardCache.clear()
  sceneCache.clear()
}

export function isCacheHit(type: 'card' | 'scene', id: string): boolean {
  if (type === 'card') {
    return cardCache.has(id)
  }
  return sceneCache.has(id)
}

export function getCacheStats(): { cards: number; scenes: number } {
  return {
    cards: cardCache.size,
    scenes: sceneCache.size,
  }
}

export async function loadCardsFromIndex(cardIds: string[]): Promise<Map<string, Card>> {
  const results = new Map<string, Card>()
  const errors: DataLoadError[] = []

  await Promise.all(
    cardIds.map(async (id) => {
      try {
        const card = await loadCardJson(id)
        results.set(id, card)
      } catch (error) {
        if (error instanceof DataLoadError) {
          errors.push(error)
        }
      }
    })
  )

  if (errors.length > 0) {
    console.warn(`Failed to load ${errors.length} cards:`, errors.map(e => e.source))
  }

  return results
}

export async function loadScenesFromIndex(sceneIds: string[]): Promise<Map<string, Scene>> {
  const results = new Map<string, Scene>()
  const errors: DataLoadError[] = []

  await Promise.all(
    sceneIds.map(async (id) => {
      try {
        const scene = await loadSceneJson(id)
        results.set(id, scene)
      } catch (error) {
        if (error instanceof DataLoadError) {
          errors.push(error)
        }
      }
    })
  )

  if (errors.length > 0) {
    console.warn(`Failed to load ${errors.length} scenes:`, errors.map(e => e.source))
  }

  return results
}
