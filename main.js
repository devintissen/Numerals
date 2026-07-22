const { app, BrowserWindow, session } = require('electron')

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
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

  // Prevent opening new windows
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Prevent navigation away from the local application
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault()
    }
  })

  // Deny all permission requests
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false)
    }
  )

  if (!isDev) {
    // Prevent opening DevTools via keyboard shortcuts
    win.webContents.on('before-input-event', (event, input) => {
      const key = input.key.toLowerCase()

      const isDevToolsShortcut =
        input.key === 'F12' ||
        ((input.control || input.meta) && input.shift && key === 'i')

      if (isDevToolsShortcut) {
        event.preventDefault()
      }
    })

    // Close DevTools if somehow opened
    win.webContents.on('devtools-opened', () => {
      win.webContents.closeDevTools()
    })
  }

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  // Recreate a window when the dock icon is clicked (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})