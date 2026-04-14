import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akiprisaye.app',
  appName: 'A KI PRI SA YÉ',
  webDir: 'frontend/dist',
  bundledWebRuntime: false,
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3b82f6',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
  },
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: true,
  },
  server: {
    cleartext: false,
  },
};

export default config;
