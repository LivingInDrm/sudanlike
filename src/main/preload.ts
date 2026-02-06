import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  saveGame: (saveId: string, data: string) => ipcRenderer.invoke('save-game', saveId, data),
  loadGame: (saveId: string) => ipcRenderer.invoke('load-game', saveId),
  listSaves: () => ipcRenderer.invoke('list-saves'),
})
