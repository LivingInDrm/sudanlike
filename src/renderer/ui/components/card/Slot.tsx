import React from 'react'
import type { SlotState } from '@/core/types'
import { SlotType } from '@/core/types'
import type { CardModel } from '@/core/card/CardModel'
import { Card } from '../card/Card'

interface SlotProps {
  slot: SlotState
  card?: CardModel
  onDrop?: (slotIndex: number) => void
  onRemove?: (slotIndex: number) => void
  isDropTarget?: boolean
}

const slotTypeLabels: Record<SlotType, string> = {
  [SlotType.Character]: 'Character',
  [SlotType.Item]: 'Item',
  [SlotType.Sultan]: 'Sultan',
  [SlotType.Gold]: 'Gold',
}

export const Slot: React.FC<SlotProps> = ({
  slot,
  card,
  onDrop,
  onRemove,
  isDropTarget = false,
}) => {
  const isEmpty = !card
  const isRequired = slot.required
  const isLocked = slot.locked

  return (
    <div
      className={`
        w-32 h-44 rounded-lg transition-all duration-200
        ${isEmpty ? 'slot-empty' : 'slot-filled'}
        ${isRequired && isEmpty ? 'slot-required' : ''}
        ${isLocked ? 'slot-locked' : ''}
        ${isDropTarget ? 'ring-2 ring-green-400 bg-green-900/20' : ''}
      `}
      onClick={() => {
        if (!isEmpty && !isLocked && onRemove) {
          onRemove(slot.slot_index!)
        }
      }}
    >
      {isEmpty ? (
        <div className="text-center text-parchment-400 text-sm">
          <div>{slotTypeLabels[slot.type]}</div>
          {isRequired && <div className="text-red-400 text-xs">(Required)</div>}
        </div>
      ) : (
        <Card card={card} size="md" disabled={isLocked} />
      )}
    </div>
  )
}
