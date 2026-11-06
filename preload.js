const { contextBridge, ipcRenderer } = require('electron')

// Minimal, sandbox-safe bridge: lets the renderer tell the main process which
// theme is active so the native window controls (Windows) can match it.
contextBridge.exposeInMainWorld('windowControls', {
  setTheme: (theme) => {
    if (theme === 'light' || theme === 'dark') {
      ipcRenderer.send('window-controls:theme', theme)
    }
  },
})
