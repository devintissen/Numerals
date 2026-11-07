const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

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

module.exports = {
  packagerConfig: Object.assign(
    {
      asar: true,
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
