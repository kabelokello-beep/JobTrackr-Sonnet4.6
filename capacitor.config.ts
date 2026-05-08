import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jobtrackr.app',
  appName: 'JobTrackr',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#6366f1',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#6366f1',
      sound: 'default',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#6366f1',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#f8fafc',
    buildOptions: {
      keystorePath: 'jobtrackr-release.keystore',
      keystoreAlias: 'jobtrackr',
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#f8fafc',
  },
};

export default config;
