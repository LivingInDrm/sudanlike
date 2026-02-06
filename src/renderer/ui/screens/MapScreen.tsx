import React from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { ResourceBar } from '@/ui/components/common/ResourceBar'

export const MapScreen: React.FC = () => {
  const { setScreen, selectScene } = useUIStore()
  const { activeScenes, availableScenes, advanceDay, executionCountdown } = useGameStore()

  const handleSceneClick = (sceneId: string) => {
    selectScene(sceneId)
    setScreen('scene')
  }

  const handleEndDay = () => {
    advanceDay()
  }

  return (
    <div className="h-screen flex flex-col bg-stone-900">
      <ResourceBar />

      <div className="flex-1 flex">
        <div className="w-64 bg-stone-800 p-4 border-r border-parchment-700">
          <h2 className="text-lg text-parchment-300 mb-4">Available Scenes</h2>
          
          <div className="space-y-2">
            {availableScenes.length === 0 ? (
              <p className="text-stone-500 text-sm">No scenes available</p>
            ) : (
              availableScenes.map((scene) => (
                <button
                  key={scene.scene_id}
                  className="w-full p-3 bg-parchment-800/50 rounded-lg text-left
                           hover:bg-parchment-700/50 transition-colors"
                  onClick={() => handleSceneClick(scene.scene_id)}
                >
                  <div className="text-parchment-200">{scene.scene_id}</div>
                  <div className="text-xs text-stone-400">
                    {scene.remaining_turns} turns remaining
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <div className="text-2xl text-red-400">
              {executionCountdown} Days Until Execution
            </div>
            <button
              className="btn-primary"
              onClick={handleEndDay}
            >
              End Day
            </button>
          </div>

          <div className="text-center">
            <div className="w-64 h-64 rounded-full border-4 border-gold-600 
                          bg-gradient-radial from-gold-900/50 to-transparent
                          flex items-center justify-center">
              <div className="text-gold-300 text-lg">
                Time Compass
              </div>
            </div>
            <p className="mt-4 text-parchment-400">
              Select a scene from the left panel
            </p>
          </div>
        </div>

        <div className="w-64 bg-stone-800 p-4 border-l border-parchment-700">
          <h2 className="text-lg text-parchment-300 mb-4">Active Scenes</h2>
          
          <div className="space-y-2">
            {activeScenes.filter(s => s.status === 'participated').length === 0 ? (
              <p className="text-stone-500 text-sm">No active scenes</p>
            ) : (
              activeScenes
                .filter(s => s.status === 'participated')
                .map((scene) => (
                  <div
                    key={scene.scene_id}
                    className="p-3 bg-green-900/30 rounded-lg border border-green-700"
                  >
                    <div className="text-green-300">{scene.scene_id}</div>
                    <div className="text-xs text-green-500">
                      {scene.remaining_turns} turns to settle
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-stone-800 border-t border-parchment-700">
        <div className="flex gap-4">
          <button className="btn-secondary" onClick={() => setScreen('inventory')}>
            Inventory
          </button>
          <button className="btn-secondary" onClick={() => setScreen('settings')}>
            Menu
          </button>
        </div>
      </div>
    </div>
  )
}
