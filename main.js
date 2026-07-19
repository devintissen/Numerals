const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 290,
    height: 500,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
    resizable: false,
    webPreferences: {
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

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})