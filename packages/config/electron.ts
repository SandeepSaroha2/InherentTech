/**
 * Electron Configuration Factory
 * Generates app-specific Electron configs for Windows, Mac, Linux desktop builds
 */
export interface ElectronAppConfig {
  appId: string;
  appName: string;
  productName: string;
  webDir: string;
  devUrl?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
}

export function createElectronBuilderConfig(config: ElectronAppConfig) {
  return {
    appId: config.appId,
    productName: config.productName,
    directories: {
      output: `dist-electron/${config.appName}`,
      buildResources: 'build',
    },
    files: ['dist/**/*', 'electron/**/*'],
    mac: {
      category: 'public.app-category.business',
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: 'build/entitlements.mac.plist',
      entitlementsInherit: 'build/entitlements.mac.plist',
      target: [
        { target: 'dmg', arch: ['x64', 'arm64'] },
        { target: 'zip', arch: ['x64', 'arm64'] },
      ],
    },
    win: {
      target: [
        { target: 'nsis', arch: ['x64'] },
        { target: 'portable', arch: ['x64'] },
      ],
      artifactName: '${productName}-Setup-${version}.${ext}',
    },
    linux: {
      target: [
        { target: 'AppImage', arch: ['x64'] },
        { target: 'deb', arch: ['x64'] },
        { target: 'rpm', arch: ['x64'] },
      ],
      category: 'Office',
    },
    nsis: {
      oneClick: false,
      perMachine: true,
      allowToChangeInstallationDirectory: true,
    },
  };
}

export function createElectronMainScript(config: ElectronAppConfig): string {
  return `
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: ${config.width || 1280},
    height: ${config.height || 800},
    minWidth: ${config.minWidth || 800},
    minHeight: ${config.minHeight || 600},
    title: '${config.productName}',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: process.platform !== 'darwin',
  });

  if (isDev && '${config.devUrl}') {
    mainWindow.loadURL('${config.devUrl}');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '${config.webDir}', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
`.trim();
}

export const ELECTRON_CONFIGS: Record<string, ElectronAppConfig> = {
  aiocrm: {
    appId: 'com.inherenttech.aiocrm',
    appName: 'aiocrm',
    productName: 'AIOCRM',
    webDir: 'out',
    devUrl: 'http://localhost:3000',
  },
  ats: {
    appId: 'com.inherenttech.ats',
    appName: 'ats',
    productName: 'InherentTech ATS',
    webDir: 'out',
    devUrl: 'http://localhost:3001',
  },
  jobplatform: {
    appId: 'com.inherenttech.portal',
    appName: 'jobplatform',
    productName: 'Employee Portal',
    webDir: 'out',
    devUrl: 'http://localhost:3002',
  },
  kudodoc: {
    appId: 'com.inherenttech.kudodoc',
    appName: 'kudodoc',
    productName: 'KudoDoc',
    webDir: 'out',
    devUrl: 'http://localhost:3003',
  },
};
