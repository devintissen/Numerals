## Numerals

A minimalist calculator inspired by the macOS Calculator, featuring a cleaner interface and familiar functionality.

![Electron.js](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![macOS](https://img.shields.io/badge/mac%20os-000000?style=for-the-badge&logo=macos&logoColor=F0F0F0)
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

- Node.js (v18 or later recommended)
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

Currently this application only runs on macOS, however a Windows and Linux version is currently in the works.

### macOS Security Notes

Current releases of Numerals are **not yet signed or notarized by Apple**.

When opening the application for the first time, macOS may display a warning that the app cannot be verified because it is from an unidentified developer.

This does **not** indicate that the application is malicious. It simply means that Apple Developer code signing and notarization have not yet been completed.

To run the application:

1. Move **Numerals.app** to your **Applications** folder.
2. Open **Terminal**.
3. Run the following command:

   ```bash
   xattr -dr com.apple.quarantine /Applications/Numerals.app
   ```
   *This command only needs to be run once. Afterward, Numerals will open normally.

4. Press **Enter**.
5. Open Numerals normally.


