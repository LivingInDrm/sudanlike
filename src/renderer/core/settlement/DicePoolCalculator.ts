import type { CardModel } from '@/core/card/CardModel'
import { Attribute, CalcMode, CheckResult, DICE_CONFIG } from '@/core/types'

export function calculateDicePool(
  cards: CardModel[],
  attribute: Attribute,
  calcMode: CalcMode,
  slotIndex?: number
): number {
  if (cards.length === 0) {
    return 0
  }

  const values = cards.map(card => card.getAttribute(attribute))

  let baseValue: number
  switch (calcMode) {
    case CalcMode.Max:
      baseValue = Math.max(...values)
      break
    case CalcMode.Min:
      baseValue = Math.min(...values)
      break
    case CalcMode.Sum:
      baseValue = values.reduce((sum, val) => sum + val, 0)
      break
    case CalcMode.Avg:
      baseValue = Math.floor(values.reduce((sum, val) => sum + val, 0) / values.length)
      break
    case CalcMode.First:
      baseValue = values[0]
      break
    case CalcMode.Specific:
      if (slotIndex !== undefined && slotIndex >= 0 && slotIndex < values.length) {
        baseValue = values[slotIndex]
      } else {
        baseValue = values[0]
      }
      break
    default:
      baseValue = Math.max(...values)
  }

  return Math.min(baseValue, DICE_CONFIG.MAX_DICE_POOL)
}

export function calculateEquipmentBonus(
  cards: CardModel[],
  equipmentCards: CardModel[],
  attribute: Attribute
): number {
  let bonus = 0
  
  for (const card of cards) {
    const equippedIds = card.getEquippedItems()
    for (const equipId of equippedIds) {
      const equipment = equipmentCards.find(e => e.instance_id === equipId)
      if (equipment) {
        bonus += equipment.getAttributeBonus(attribute)
      }
    }
  }
  
  return bonus
}

export function calculateTotalReroll(
  cards: CardModel[],
  equipmentCards: CardModel[]
): number {
  let totalReroll = 0
  
  for (const card of cards) {
    totalReroll += card.getReroll()
    
    const equippedIds = card.getEquippedItems()
    for (const equipId of equippedIds) {
      const equipment = equipmentCards.find(e => e.instance_id === equipId)
      if (equipment && equipment.special_bonus?.reroll) {
        totalReroll += equipment.special_bonus.reroll
      }
    }
  }
  
  return totalReroll
}

export function determineCheckResult(
  successCount: number,
  target: number
): CheckResult {
  if (successCount >= target) {
    return CheckResult.Success
  }
  
  if (successCount === 0) {
    return CheckResult.CriticalFailure
  }
  
  if (target > 2 && successCount >= target - 2) {
    return CheckResult.PartialSuccess
  }
  
  return CheckResult.Failure
}
