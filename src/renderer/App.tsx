import React from 'react'
import { ScreenRouter } from '@/ui/screens/ScreenRouter'
import { useUIStore } from '@/stores/uiStore'

export const App: React.FC = () => {
  const { notifications, isLoading, loadingMessage } = useUIStore()

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ScreenRouter />

      {isLoading && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-white text-xl">{loadingMessage || 'Loading...'}</div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-40 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              px-4 py-2 rounded-lg shadow-lg max-w-sm
              ${notification.type === 'success' ? 'bg-green-600' : ''}
              ${notification.type === 'error' ? 'bg-red-600' : ''}
              ${notification.type === 'warning' ? 'bg-yellow-600' : ''}
              ${notification.type === 'info' ? 'bg-blue-600' : ''}
              text-white
            `}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  )
}
