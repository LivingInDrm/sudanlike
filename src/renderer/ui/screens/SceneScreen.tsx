import React from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { Card } from '@/ui/components/card/Card'
import { ResourceBar } from '@/ui/components/common/ResourceBar'

export const SceneScreen: React.FC = () => {
  const { selectedSceneId, setScreen, goBack } = useUIStore()
  const { cards } = useGameStore()

  return (
    <div className="h-screen flex flex-col bg-stone-900">
      <ResourceBar />

      <div className="flex-1 flex">
        <div className="w-1/2 p-4 border-r border-parchment-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-parchment-300">
              Scene: {selectedSceneId || 'None Selected'}
            </h2>
            <button className="btn-secondary" onClick={goBack}>
              Back to Map
            </button>
          </div>

          <div className="bg-stone-800 rounded-lg p-4 h-48 mb-4">
            <p className="text-parchment-400">Scene illustration area</p>
          </div>

          <div className="mb-4">
            <h3 className="text-parchment-400 mb-2">Card Slots</h3>
            <div className="flex gap-4">
              <div className="w-32 h-44 slot-empty slot-required">
                <span className="text-parchment-400 text-sm">Character</span>
              </div>
              <div className="w-32 h-44 slot-empty">
                <span className="text-parchment-400 text-sm">Item</span>
              </div>
            </div>
          </div>

          <button className="btn-primary w-full" disabled>
            Participate (Fill required slots first)
          </button>
        </div>

        <div className="w-1/2 p-4">
          <h2 className="text-xl text-parchment-300 mb-4">Your Cards</h2>
          
          <div className="flex flex-wrap gap-3">
            {cards.length === 0 ? (
              <p className="text-stone-500">No cards in hand</p>
            ) : (
              cards.map((card) => (
                <Card
                  key={card.instance_id}
                  card={card}
                  size="sm"
                  onClick={() => {}}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
