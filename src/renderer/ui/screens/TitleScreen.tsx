import React, { useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'

export const TitleScreen: React.FC = () => {
  const { setScreen } = useUIStore()
  const { startNewGame } = useGameStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleNewGame = async (difficulty: 'easy' | 'normal' | 'hard' | 'nightmare') => {
    setIsLoading(true)
    try {
      await startNewGame(difficulty)
      setScreen('map')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-stone-900 to-stone-950">
      <h1 className="text-6xl font-serif text-gold-400 mb-4 text-shadow">
        Sultan
      </h1>
      <p className="text-xl text-parchment-300 mb-12">
        A Deck-Building Roguelike
      </p>

      <div className="flex flex-col gap-4 w-64">
        <button
          className="btn-primary text-lg py-3"
          onClick={() => handleNewGame('normal')}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'New Game'}
        </button>
        
        <button
          className="btn-secondary text-lg py-3"
          onClick={() => handleNewGame('easy')}
          disabled={isLoading}
        >
          Easy Mode
        </button>

        <button
          className="btn-secondary text-lg py-3"
          onClick={() => handleNewGame('hard')}
          disabled={isLoading}
        >
          Hard Mode
        </button>

        <button
          className="btn-secondary text-lg py-3 opacity-50"
          disabled
        >
          Continue (No Save)
        </button>

        <button
          className="btn-secondary text-lg py-3"
          onClick={() => setScreen('settings')}
        >
          Settings
        </button>
      </div>

      <div className="absolute bottom-4 text-stone-500 text-sm">
        Version 0.1.0
      </div>
    </div>
  )
}
