## Numerals

A minimalist calculator inspired by the macOS Calculator, featuring a cleaner interface and familiar functionality.

![Electron.js](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![macOS](https://img.shields.io/badge/mac%20os-000000?style=for-the-badge&logo=macos&logoColor=F0F0F0)
![Windows](https://img.shields.io/badge/Windows%2011-0078D6?style=for-the-badge&logo=windows11&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Screenshots
<img width="49%" alt="Cropped - Light Mode" src="https://github.com/user-attachments/assets/00bd38b3-d6c4-45ab-b099-146254e22bf2" />
<img width="49%" alt="Cropped - Dark Mode" src="https://github.com/user-attachments/assets/16ed877e-5038-414a-b61a-c9338bbd471f" />

## Key Features:

- Ability to switch between light mode and dark mode
- Smooth button animations (Even when typing on keyboard)

## Installation:

### Prerequisites

Before getting started, make sure you have the following installed:

- Node.js 20 LTS or 22+
- npm (comes with Node.js)

You can download Node.js from:
https://nodejs.org/

### Clone the Repository

```bash
git clone https://github.com/devintissen/Numerals.git
cd Numerals
```

### Install Dependencies

```bash
npm install
```

### Run the Application

```bash
npm start
```

The calculator will launch as a native desktop application.

## Built With:
- Electron
- HTML
- CSS
- JavaScript

## License

Numerals is licensed under the [MIT License](LICENSE).

## Notes:

Numerals runs on macOS and Windows 11. A Linux version is in the works.

Only download Numerals from the [Releases page](https://github.com/devintissen/Numerals/releases) of this repository. Copies from anywhere else may have been changed.

### macOS Security Notes

Current releases of Numerals are **not yet signed or notarized by Apple**.

When opening the application for the first time, macOS may display a warning that the app cannot be verified because it is from an unidentified developer.

This does **not** indicate that the application is malicious. It simply means that Apple Developer code signing and notarization have not yet been completed.

#### Open the app (macOS)

1. Move **Numerals.app** to your **Applications** folder.
2. Open Numerals. macOS will warn that it can't verify the developer. Click **Done** (or **OK**).
3. Open **System Settings → Privacy & Security**, scroll down to the message about Numerals, and click **Open Anyway**.
4. Confirm with your password. After this, Numerals opens normally.

This is Apple's supported way to open an app from an unidentified developer. Please don't remove the quarantine flag with `xattr` instead: that skips Gatekeeper's check and its warning entirely.

### Windows Security Notes

Current Windows releases of Numerals are **not yet code signed**, so Windows SmartScreen will warn you when you run the installer and show the publisher as unknown.

#### Install the app (Windows)

1. Double-click the downloaded **Numerals-…-windows-x64-setup.exe**.
2. If Windows shows **"Windows protected your PC"**, click **More info**, check that the app is the Numerals setup file you downloaded, then click **Run anyway**.
3. Numerals installs for your user account (no admin password needed) and opens. It's added to the **Start menu** and your desktop.

To uninstall, open **Settings → Apps → Installed apps**, find **Numerals**, and click **Uninstall**.
