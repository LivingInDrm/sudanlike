import React from 'react'
import type { CardModel } from '@/core/card/CardModel'
import { Rarity } from '@/core/types'

interface CardProps {
  card: CardModel
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const rarityStyles: Record<Rarity, string> = {
  [Rarity.Gold]: 'card-gold',
  [Rarity.Silver]: 'card-silver',
  [Rarity.Copper]: 'card-copper',
  [Rarity.Stone]: 'card-stone',
}

const sizeStyles = {
  sm: 'w-20 h-28',
  md: 'w-28 h-40',
  lg: 'w-36 h-52',
}

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  size = 'md',
}) => {
  const rarityClass = rarityStyles[card.rarity]
  const sizeClass = sizeStyles[size]

  return (
    <div
      className={`
        ${sizeClass} ${rarityClass}
        rounded-lg cursor-pointer transition-all duration-200
        flex flex-col p-2 card-shadow
        ${selected ? 'ring-2 ring-gold-400 scale-105' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
      `}
      onClick={disabled ? undefined : onClick}
    >
      <div className="text-xs font-semibold text-gray-900 truncate mb-1">
        {card.name}
      </div>
      
      <div className="flex-1 bg-black/20 rounded flex items-center justify-center text-xs text-gray-700">
        {card.type}
      </div>
      
      {card.attributes && (
        <div className="mt-1 grid grid-cols-4 gap-0.5 text-[8px] text-gray-800">
          <div title="Combat">{card.attributes.combat}</div>
          <div title="Social">{card.attributes.social}</div>
          <div title="Wisdom">{card.attributes.wisdom}</div>
          <div title="Stealth">{card.attributes.stealth}</div>
        </div>
      )}
    </div>
  )
}
