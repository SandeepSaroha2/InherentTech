# InherentTech Cross-Platform Support

## Platform Matrix

| Platform | Technology | Status |
|----------|-----------|--------|
| Web (Chrome, Firefox, Safari, Edge) | Next.js 14 | ✅ Ready |
| iOS (iPhone, iPad) | Capacitor | 🔧 Config Ready |
| Android (Phone, Tablet) | Capacitor | 🔧 Config Ready |
| watchOS (Apple Watch) | Capacitor + WatchKit Extension | 🔧 Planned |
| Windows | Electron | 🔧 Config Ready |
| macOS | Electron | 🔧 Config Ready |
| Linux (Ubuntu, Fedora) | Electron | 🔧 Config Ready |
| PWA (All Platforms) | Service Worker + Manifest | ✅ Ready |

## Quick Start

### PWA (Zero Config)
All apps are PWA-ready. Users can install from the browser on any platform.

### iOS / Android
```bash
# From any app directory
npx cap init
npx cap add ios
npx cap add android
npm run build && npx cap sync
npx cap open ios    # Opens Xcode
npx cap open android # Opens Android Studio
```

### Desktop (Windows / Mac / Linux)
```bash
# From any app directory
npm run build
npx electron-builder --config electron-builder.json
```

## Architecture
- **Shared configs** in `packages/config/` (capacitor.ts, electron.ts)
- **PWA** via manifest.ts + service worker in each app
- **Native bridges** via Capacitor plugins for camera, push notifications, biometrics
- **Desktop** via Electron with platform-specific window chrome
