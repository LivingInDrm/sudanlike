import { create } from 'zustand'

export type Screen = 'title' | 'map' | 'scene' | 'settlement' | 'dialog' | 'shop' | 'inventory' | 'settings'

interface UINotification {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

interface Modal {
  id: string
  type: string
  data?: unknown
}

interface AnimationItem {
  id: string
  type: string
  data: unknown
  callback?: () => void
}

interface UIStoreState {
  currentScreen: Screen
  previousScreen: Screen | null
  
  modals: Modal[]
  notifications: UINotification[]
  animationQueue: AnimationItem[]
  
  isLoading: boolean
  loadingMessage: string
  
  selectedCardId: string | null
  selectedSceneId: string | null
  draggedCardId: string | null
  
  setScreen: (screen: Screen) => void
  goBack: () => void
  
  openModal: (modal: Modal) => void
  closeModal: (modalId: string) => void
  closeAllModals: () => void
  
  addNotification: (notification: Omit<UINotification, 'id'>) => void
  removeNotification: (id: string) => void
  
  queueAnimation: (animation: Omit<AnimationItem, 'id'>) => void
  dequeueAnimation: () => AnimationItem | undefined
  clearAnimationQueue: () => void
  
  setLoading: (isLoading: boolean, message?: string) => void
  
  selectCard: (cardId: string | null) => void
  selectScene: (sceneId: string | null) => void
  setDraggedCard: (cardId: string | null) => void
}

let notificationCounter = 0
let animationCounter = 0

export const useUIStore = create<UIStoreState>()((set, get) => ({
  currentScreen: 'title',
  previousScreen: null,
  modals: [],
  notifications: [],
  animationQueue: [],
  isLoading: false,
  loadingMessage: '',
  selectedCardId: null,
  selectedSceneId: null,
  draggedCardId: null,

  setScreen: (screen: Screen) => {
    set((state) => ({
      previousScreen: state.currentScreen,
      currentScreen: screen,
    }))
  },

  goBack: () => {
    const { previousScreen } = get()
    if (previousScreen) {
      set({
        currentScreen: previousScreen,
        previousScreen: null,
      })
    }
  },

  openModal: (modal: Modal) => {
    set((state) => ({
      modals: [...state.modals, modal],
    }))
  },

  closeModal: (modalId: string) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== modalId),
    }))
  },

  closeAllModals: () => {
    set({ modals: [] })
  },

  addNotification: (notification: Omit<UINotification, 'id'>) => {
    const id = `notification_${++notificationCounter}`
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }))

    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, notification.duration || 3000)
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  queueAnimation: (animation: Omit<AnimationItem, 'id'>) => {
    const id = `animation_${++animationCounter}`
    set((state) => ({
      animationQueue: [...state.animationQueue, { ...animation, id }],
    }))
  },

  dequeueAnimation: () => {
    const { animationQueue } = get()
    if (animationQueue.length === 0) return undefined

    const [first, ...rest] = animationQueue
    set({ animationQueue: rest })
    return first
  },

  clearAnimationQueue: () => {
    set({ animationQueue: [] })
  },

  setLoading: (isLoading: boolean, message?: string) => {
    set({
      isLoading,
      loadingMessage: message || '',
    })
  },

  selectCard: (cardId: string | null) => {
    set({ selectedCardId: cardId })
  },

  selectScene: (sceneId: string | null) => {
    set({ selectedSceneId: sceneId })
  },

  setDraggedCard: (cardId: string | null) => {
    set({ draggedCardId: cardId })
  },
}))
