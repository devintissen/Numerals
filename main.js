const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 290,
    height: 500,
    titleBarStyle: 'hidden', trafficLightPosition: { x: 15, y: 15 },
    resizable: false,
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})