const { app, BrowserWindow } = require('electron')

const isDev = !app.isPackaged

const createWindow = () => {
  const win = new BrowserWindow({
    width: 290,
    height: 500,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
    resizable: false,
    webPreferences: {
      devTools: isDev,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      allowRunningInsecureContent: false,
      webSecurity: true,
    },
  })

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault()
    }
  })

  if (!isDev) {
    win.webContents.on('before-input-event', (event, input) => {
      const key = input.key.toLowerCase()
      const isDevToolsShortcut = input.key === 'F12' || ((input.control || input.meta) && input.shift && key === 'i')

      if (isDevToolsShortcut) {
        event.preventDefault()
      }
    })

    win.webContents.on('devtools-opened', () => {
      win.webContents.closeDevTools()
    })
  }

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})