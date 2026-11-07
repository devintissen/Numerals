const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// Construct optional macOS signing/notarization config only when the
// required environment variables are provided. Avoid inserting explicit
// `null` values because Forge's config utilities iterate object keys and
// may assume objects exist.
const osxSignConfig = process.env.MACOS_SIGNING_ID
  ? { identity: process.env.MACOS_SIGNING_ID }
  : undefined;

const osxNotarizeConfig = process.env.APPLEID && process.env.APPLEID_PASSWORD
  ? { appleId: process.env.APPLEID, appleIdPassword: process.env.APPLEID_PASSWORD }
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
      icon: 'assets/icon.icns',
    },
    osxSignConfig ? { osxSign: osxSignConfig } : {},
    osxNotarizeConfig ? { osxNotarize: osxNotarizeConfig } : {}
  ),
  rebuildConfig: {},
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
    }),
  ],
};
