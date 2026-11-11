const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { app, BrowserWindow, session, ipcMain, protocol, net, clipboard, nativeTheme } = require('electron')

// Serve the app from app://numerals/ instead of file://. A file:// page can
// reach other files on disk, while this handler only ever returns files from
// inside the app's own folder (or app.asar when packaged).
const APP_SCHEME = 'app'
const APP_HOST = 'numerals'

protocol.registerSchemesAsPrivileged([
  { scheme: APP_SCHEME, privileges: { standard: true, secure: true } },
])

// The page only ever loads these files, so app:// serves nothing else. This
// keeps main.js, preload.js, package.json, node_modules (and, during
// `npm start`, the .git folder or a local .env) out of the page's reach.
const RENDERER_FILES = new Set([
  'index.html',
  'styles.css',
  'button_animation.js',
  'button_animation_opacity.js',
  'user_input.js',
  'menu.js',
  'theme_boot.js',
  'theme_selector.js',
  'history.js',
])

function isRendererFile(relativePath) {
  const name = relativePath.replace(/^\/+/, '')
  return RENDERER_FILES.has(name) || /^Images\/[^/\\]+\.png$/.test(name)
}

function registerAppProtocol() {
  const appRoot = app.getAppPath()

  protocol.handle(APP_SCHEME, (request) => {
    const { host, pathname } = new URL(request.url)
    if (host !== APP_HOST) {
      return new Response('Not found', { status: 404 })
    }

    let relativePath
    try {
      relativePath = decodeURIComponent(pathname)
    } catch {
      return new Response('Bad request', { status: 400 })
    }

    if (!isRendererFile(relativePath)) {
      return new Response('Not found', { status: 404 })
    }

    const filePath = path.join(appRoot, relativePath)
    const fromRoot = path.relative(appRoot, filePath)
    if (fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) {
      return new Response('Not found', { status: 404 })
    }

    return net.fetch(pathToFileURL(filePath).toString())
  })
}

// Handle Windows Squirrel install/uninstall events gracefully, if the
// optional `electron-squirrel-startup` package is present. This prevents
// the app from continuing to launch during install/update events.
// Squirrel is the Windows installer, so skip loading this on other platforms.
if (process.platform === 'win32') {
  try {
    // Require is wrapped in try/catch so absence of the package won't break
    // development or other packaging flows.
    const squirrelStartup = require('electron-squirrel-startup');
    if (squirrelStartup) {
      app.quit();
    }
  } catch (e) {
    // Optional dependency not installed — ignore.
  }
}

const isDev = !app.isPackaged
const isMac = process.platform === 'darwin'

// Height (in DIPs) of the native caption-button strip on Windows/Linux.
// Kept below the menu button (which sits at y = 40px) so the native
// minimize/close buttons never overlap the app's own controls.
const TITLE_BAR_OVERLAY_HEIGHT = 40

// Native caption-button symbol colors for each app theme. The button
// background stays transparent so the buttons sit directly on the app's UI,
// the same way the macOS traffic lights do.
const TITLE_BAR_OVERLAY_THEMES = {
  light: { color: '#00000000', symbolColor: '#000000' },
  dark: { color: '#00000000', symbolColor: '#E6EBF0' },
}

// Window background for each theme. These match the body background colors
// in styles.css, so the window is never a different color from the page.
const WINDOW_BACKGROUNDS = {
  light: '#E0E5EC',
  dark: '#2D343E',
}

// The page keeps the user's theme choice in localStorage, which the main
// process can't read before the window exists. The page tells us the theme it
// drew (see 'window-controls:theme' below), and we keep a copy here so the
// next launch starts with the right window and caption-button colors.
const THEME_FILE = path.join(app.getPath('userData'), 'theme.json')

function isThemeName(theme) {
  return typeof theme === 'string' && Object.hasOwn(TITLE_BAR_OVERLAY_THEMES, theme)
}

function loadLastTheme() {
  try {
    const { theme } = JSON.parse(fs.readFileSync(THEME_FILE, 'utf8'))
    if (isThemeName(theme)) return theme
  } catch {
    // First launch or unreadable file: fall through to the OS setting.
  }
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

let lastTheme = null

function saveLastTheme(theme) {
  if (theme === lastTheme) return
  lastTheme = theme
  fs.writeFile(THEME_FILE, JSON.stringify({ theme }), () => {
    // Best effort: a failed write only means the next launch guesses the theme.
  })
}

// Platform-specific frame options:
// - macOS: hidden title bar with inset traffic lights.
// - Windows/Linux: hidden title bar (no default Windows 11 frame/caption)
//   with Window Controls Overlay, which draws the native minimize/close
//   buttons on top of the web content in the top-right corner.
function frameOptionsFor(theme) {
  return isMac
    ? {
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 15, y: 15 },
      }
    : {
        titleBarStyle: 'hidden',
        titleBarOverlay: {
          ...TITLE_BAR_OVERLAY_THEMES[theme],
          height: TITLE_BAR_OVERLAY_HEIGHT,
        },
      }
}

const createWindow = () => {
  const initialTheme = loadLastTheme()
  lastTheme = initialTheme

  const win = new BrowserWindow({
    width: 290,
    height: 500,
    ...frameOptionsFor(initialTheme),
    backgroundColor: WINDOW_BACKGROUNDS[initialTheme],
    // Stay hidden until the page has drawn its first frame (see
    // 'ready-to-show' below), so the user never sees a blank or wrong-theme window.
    show: false,
    resizable: false,
    // Fixed-size calculator: no maximize button on Windows either.
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Nothing in a calculator needs spellchecking, so don't load it.
      spellcheck: false,
    },
  })

  // Show the window once the page has drawn its first frame. The timer is a
  // fallback so the window still appears if that event never fires.
  const showWindow = () => {
    clearTimeout(showFallback)
    if (!win.isDestroyed() && !win.isVisible()) win.show()
  }
  const showFallback = setTimeout(showWindow, 3000)
  win.once('ready-to-show', showWindow)

  // Prevent opening new windows
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Numerals is a single local page, so it never needs to navigate anywhere.
  // Blocking every navigation also stops other file:// pages from loading.
  win.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  // Deny all permission requests
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false)
    }
  )

  // Also answer "no" when a page only checks whether a permission is granted
  session.defaultSession.setPermissionCheckHandler(() => false)

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

  // Keep the window background and the native Windows caption-button symbols
  // in sync with the app theme, and remember it for the next launch.
  const onThemeChanged = (event, theme) => {
    if (event.sender !== win.webContents) return
    // Only accept the theme names defined above, never inherited object keys.
    if (!isThemeName(theme)) return
    if (win.isDestroyed()) return

    win.setBackgroundColor(WINDOW_BACKGROUNDS[theme])
    if (!isMac) {
      const overlay = TITLE_BAR_OVERLAY_THEMES[theme]
      win.setTitleBarOverlay({ ...overlay, height: TITLE_BAR_OVERLAY_HEIGHT })
    }
    saveLastTheme(theme)
  }

  ipcMain.on('window-controls:theme', onThemeChanged)
  win.on('closed', () => {
    ipcMain.removeListener('window-controls:theme', onThemeChanged)
  })

  // Copy a calculation result to the clipboard. The page can't use the web
  // clipboard API because all permissions are denied above, so it asks here.
  // Only plain numbers are accepted, so the page can't place arbitrary text.
  const onCopyResult = (event, text) => {
    if (event.sender !== win.webContents) return
    if (typeof text !== 'string' || text.length > 64) return
    if (!/^-?\d+(\.\d+)?(e[+-]\d+)?$/.test(text)) return
    clipboard.writeText(text)
  }

  ipcMain.on('clipboard:copy-result', onCopyResult)
  win.on('closed', () => {
    ipcMain.removeListener('clipboard:copy-result', onCopyResult)
  })

  win.loadURL(`${APP_SCHEME}://${APP_HOST}/index.html`)
}

app.whenReady().then(() => {
  registerAppProtocol()
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