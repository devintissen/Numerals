const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { version } = require('./package.json');

// Construct optional macOS signing/notarization config only when the
// required environment variables are provided. Avoid inserting explicit
// `null` values because Forge's config utilities iterate object keys and
// may assume objects exist.
const osxSignConfig = process.env.MACOS_SIGNING_ID
  ? { identity: process.env.MACOS_SIGNING_ID }
  : undefined;

// Apple's notarization service needs the Team ID as well as the Apple ID and
// app-specific password. Keep all three in environment variables, never in code.
const osxNotarizeConfig =
  process.env.APPLEID && process.env.APPLEID_PASSWORD && process.env.APPLE_TEAM_ID
    ? {
        appleId: process.env.APPLEID,
        appleIdPassword: process.env.APPLEID_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID,
      }
    : undefined;

// Anything not named here stays out of the packaged app. This allowlist means
// local files such as .env or signing keys can never be shipped by accident,
// even though .gitignore keeps them out of Git. Add new runtime files here.
const NOT_PACKAGED = /^\/(?!(?:package\.json|LICENSE|index\.html|styles\.css|(?:main|preload|menu|user_input|theme_selector|button_animation|button_animation_opacity)\.js|Images|node_modules)(?:\/|$))/;

module.exports = {
  packagerConfig: Object.assign(
    {
      asar: true,
      ignore: [NOT_PACKAGED],
      // No extension: the packager picks icon.icns on macOS and icon.ico on Windows.
      icon: 'assets/icon',
    },
    osxSignConfig ? { osxSign: osxSignConfig } : {},
    osxNotarizeConfig ? { osxNotarize: osxNotarizeConfig } : {}
  ),
  rebuildConfig: {},
  hooks: {
    // Without a Developer ID, packaging leaves the app with a broken
    // signature, and macOS on Apple Silicon reports it as "damaged" with no
    // way to open it. An ad-hoc signature (`-`) makes the signature valid
    // again, so macOS shows its normal "could not verify" warning instead,
    // and users can approve the app with Open Anyway. It is not a substitute
    // for a Developer ID signature and notarization.
    postPackage: async (_forgeConfig, { platform, outputPaths }) => {
      if (platform !== 'darwin' || osxSignConfig) return;

      for (const outputPath of outputPaths) {
        const apps = fs.readdirSync(outputPath).filter((name) => name.endsWith('.app'));
        for (const appName of apps) {
          const appPath = path.join(outputPath, appName);

          try {
            execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'pipe' });
            console.log(`Signature before ad-hoc signing: valid (${appName})`);
          } catch (error) {
            console.log(`Signature before ad-hoc signing: invalid (${appName}): ${String(error.stderr).trim()}`);
          }

          execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
          // Fails the build if the new signature is not valid.
          execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], { stdio: 'inherit' });
        }
      }
    },
  },
  makers: [
      {
      name: "@electron-forge/maker-dmg",
      config: {
        format: "ULFO"
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    // Windows installer (Setup.exe). It installs Numerals for the current user
    // without needing admin rights, adds it to the Start menu and desktop (via
    // electron-squirrel-startup in main.js), and lists it in Settings > Apps so
    // it can be uninstalled normally.
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupExe: `Numerals-${version}-windows-x64-setup.exe`,
        setupIcon: 'assets/icon.ico',
        // Icon shown in Settings > Apps. Must be a public URL.
        iconUrl: 'https://raw.githubusercontent.com/devintissen/Numerals/main/assets/icon.ico',
        noMsi: true,
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      // The app is served from app:// (see main.js), so file:// pages don't
      // need the extra access Electron gives them by default.
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
    }),
  ],
};
