import React, { useState } from 'react'

interface DiceProps {
  value?: number
  isRolling?: boolean
  isSuccess?: boolean
  isExplosion?: boolean
  isRerolled?: boolean
  onClick?: () => void
  selectable?: boolean
  selected?: boolean
}

export const Dice: React.FC<DiceProps> = ({
  value,
  isRolling = false,
  isSuccess = false,
  isExplosion = false,
  isRerolled = false,
  onClick,
  selectable = false,
  selected = false,
}) => {
  return (
    <div
      className={`
        w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold
        transition-all duration-200 cursor-pointer
        ${isRolling ? 'animate-spin bg-gray-600' : ''}
        ${isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
        ${isExplosion ? 'ring-2 ring-yellow-400 glow-gold' : ''}
        ${isRerolled ? 'border-2 border-dashed border-blue-400' : ''}
        ${selectable ? 'hover:ring-2 hover:ring-white' : ''}
        ${selected ? 'ring-2 ring-blue-400 scale-110' : ''}
      `}
      onClick={selectable ? onClick : undefined}
    >
      {isRolling ? '?' : value}
    </div>
  )
}

interface DiceRollDisplayProps {
  rolls: Array<{
    value: number
    is_success: boolean
    is_explosion: boolean
    is_rerolled: boolean
  }>
  onSelectDice?: (index: number) => void
  selectedIndices?: number[]
  allowSelection?: boolean
}

export const DiceRollDisplay: React.FC<DiceRollDisplayProps> = ({
  rolls,
  onSelectDice,
  selectedIndices = [],
  allowSelection = false,
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {rolls.map((roll, index) => (
        <Dice
          key={index}
          value={roll.value}
          isSuccess={roll.is_success}
          isExplosion={roll.is_explosion}
          isRerolled={roll.is_rerolled}
          selectable={allowSelection && !roll.is_success && !roll.is_rerolled}
          selected={selectedIndices.includes(index)}
          onClick={() => onSelectDice?.(index)}
        />
      ))}
    </div>
  )
}
