import React from 'react'
import { useGameStore } from '@/stores/gameStore'

export const ResourceBar: React.FC = () => {
  const {
    gold,
    reputation,
    goldenDice,
    rewindCharges,
    thinkCharges,
    currentDay,
    executionCountdown,
  } = useGameStore()

  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-stone-900/80 border-b border-parchment-700">
      <div className="flex items-center gap-2">
        <span className="text-gold-400 text-lg">Day {currentDay}</span>
        <span className="text-red-400 text-sm">({executionCountdown} days left)</span>
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-gold-400">Gold:</span>
        <span className="text-gold-300 font-bold">{gold}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-blue-400">Reputation:</span>
        <span className="text-blue-300 font-bold">{reputation}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-yellow-400">Golden Dice:</span>
        <span className="text-yellow-300 font-bold">{goldenDice}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-purple-400">Rewind:</span>
        <span className="text-purple-300 font-bold">{rewindCharges}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-green-400">Think:</span>
        <span className="text-green-300 font-bold">{thinkCharges}</span>
      </div>
    </div>
  )
}
