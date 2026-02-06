import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'Sultan Game',
    autoHideMenuBar: true,
    backgroundColor: '#1A1A1A',
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData')
})

ipcMain.handle('save-game', async (_event, saveId: string, data: string) => {
  const fs = await import('fs/promises')
  const savePath = path.join(app.getPath('userData'), 'saves', `${saveId}.json`)
  
  await fs.mkdir(path.dirname(savePath), { recursive: true })
  await fs.writeFile(savePath, data, 'utf-8')
  
  return { success: true, path: savePath }
})

ipcMain.handle('load-game', async (_event, saveId: string) => {
  const fs = await import('fs/promises')
  const savePath = path.join(app.getPath('userData'), 'saves', `${saveId}.json`)
  
  try {
    const data = await fs.readFile(savePath, 'utf-8')
    return { success: true, data }
  } catch {
    return { success: false, error: 'Save not found' }
  }
})

ipcMain.handle('list-saves', async () => {
  const fs = await import('fs/promises')
  const savesDir = path.join(app.getPath('userData'), 'saves')
  
  try {
    const files = await fs.readdir(savesDir)
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
  } catch {
    return []
  }
})
