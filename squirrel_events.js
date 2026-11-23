// Windows installer (Squirrel) events.
//
// When Squirrel installs, updates or uninstalls Numerals, it starts the app
// once with a special flag such as `--squirrel-install`. The app should then
// add or remove its Start menu and desktop shortcuts and quit straight away,
// instead of opening a calculator window in the middle of the install.
//
// This used to come from the `electron-squirrel-startup` package, which is now
// archived and deprecated on npm. It does the same few steps as that package,
// so Numerals no longer ships a dependency that will never get fixes.

const path = require('node:path')

// Returns the Update.exe arguments for a Squirrel event, [] for an event that
// only needs the app to quit, or null when this isn't a Squirrel launch.
function squirrelUpdateArgs(command, execPath) {
  const target = path.win32.basename(execPath)
  switch (command) {
    case '--squirrel-install':
    case '--squirrel-updated':
      return [`--createShortcut=${target}`]
    case '--squirrel-uninstall':
      return [`--removeShortcut=${target}`]
    case '--squirrel-obsolete':
      return []
    default:
      return null
  }
}

// Handles a Squirrel launch. Returns true when the app should quit now.
function handleSquirrelEvent({ platform, argv, execPath, spawn }) {
  if (platform !== 'win32') return false

  const args = squirrelUpdateArgs(argv[1], execPath)
  if (args === null) return false

  if (args.length > 0) {
    // Update.exe sits one folder above the app's versioned folder.
    const updateExe = path.win32.resolve(path.win32.dirname(execPath), '..', 'Update.exe')
    const child = spawn(updateExe, args, { detached: true })
    // A missing Update.exe (for example a copied app folder) shouldn't crash.
    child.on('error', () => {})
  }
  return true
}

module.exports = { squirrelUpdateArgs, handleSquirrelEvent }
