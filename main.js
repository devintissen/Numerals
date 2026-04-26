const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 290,
    height: 500,
    titleBarStyle: 'hidden', trafficLightPosition: { x: 15, y: 15 },
    resizable: false,
    icon: 'Images/Icon.png',
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  if (process.platform === 'darwin') {
    app.dock.setIcon('Images/Icon.png')
  }
})