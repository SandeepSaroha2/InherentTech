/**
 * Capacitor Configuration Factory
 * Generates app-specific Capacitor configs for iOS, Android, watchOS builds
 * Each app calls this with its own settings
 */
export interface CapacitorAppConfig {
  appId: string;
  appName: string;
  webDir: string;
  serverUrl?: string;
  plugins?: Record<string, any>;
}

export function createCapacitorConfig(config: CapacitorAppConfig) {
  return {
    appId: config.appId,
    appName: config.appName,
    webDir: config.webDir,
    server: {
      url: config.serverUrl,
      cleartext: process.env.NODE_ENV === 'development',
    },
    ios: {
      scheme: config.appName.replace(/\s+/g, ''),
      contentInset: 'automatic' as const,
    },
    android: {
      allowMixedContent: process.env.NODE_ENV === 'development',
    },
    plugins: {
      SplashScreen: {
        launchShowDuration: 2000,
        backgroundColor: '#ffffff',
        showSpinner: false,
      },
      StatusBar: {
        style: 'dark' as const,
      },
      Keyboard: {
        resize: 'body' as const,
      },
      PushNotifications: {
        presentationOptions: ['badge', 'sound', 'alert'],
      },
      ...config.plugins,
    },
  };
}

export const APP_CONFIGS: Record<string, CapacitorAppConfig> = {
  aiocrm: {
    appId: 'com.inherenttech.aiocrm',
    appName: 'AIOCRM',
    webDir: '../../apps/aiocrm/out',
  },
  ats: {
    appId: 'com.inherenttech.ats',
    appName: 'InherentTech ATS',
    webDir: '../../apps/ats/out',
  },
  jobplatform: {
    appId: 'com.inherenttech.portal',
    appName: 'Employee Portal',
    webDir: '../../apps/jobplatform/out',
  },
  kudodoc: {
    appId: 'com.inherenttech.kudodoc',
    appName: 'KudoDoc',
    webDir: '../../apps/kudodoc/out',
  },
  web: {
    appId: 'com.inherenttech.web',
    appName: 'InherentTech',
    webDir: '../../apps/web/out',
  },
};
