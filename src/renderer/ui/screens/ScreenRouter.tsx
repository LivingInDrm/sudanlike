import React from 'react'
import { useUIStore, type Screen } from '@/stores/uiStore'
import { TitleScreen } from './TitleScreen'
import { MapScreen } from './MapScreen'
import { SceneScreen } from './SceneScreen'

const screens: Record<Screen, React.FC> = {
  title: TitleScreen,
  map: MapScreen,
  scene: SceneScreen,
  settlement: () => <div className="h-screen bg-stone-900 flex items-center justify-center text-white">Settlement Screen (TODO)</div>,
  dialog: () => <div className="h-screen bg-stone-900 flex items-center justify-center text-white">Dialog Screen (TODO)</div>,
  shop: () => <div className="h-screen bg-stone-900 flex items-center justify-center text-white">Shop Screen (TODO)</div>,
  inventory: () => <div className="h-screen bg-stone-900 flex items-center justify-center text-white">Inventory Screen (TODO)</div>,
  settings: () => {
    const { setScreen } = useUIStore()
    return (
      <div className="h-screen bg-stone-900 flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl mb-8">Settings</h2>
        <button className="btn-secondary" onClick={() => setScreen('title')}>
          Back to Title
        </button>
      </div>
    )
  },
}

export const ScreenRouter: React.FC = () => {
  const { currentScreen } = useUIStore()
  const ScreenComponent = screens[currentScreen]

  return <ScreenComponent />
}
