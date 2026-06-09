import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riverflow.app',
  appName: '逐流',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
