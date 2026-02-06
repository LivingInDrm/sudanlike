export interface ElectronAPI {
  getAppPath: () => Promise<string>
  saveGame: (saveId: string, data: string) => Promise<{ success: boolean; path?: string; error?: string }>
  loadGame: (saveId: string) => Promise<{ success: boolean; data?: string; error?: string }>
  listSaves: () => Promise<string[]>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
