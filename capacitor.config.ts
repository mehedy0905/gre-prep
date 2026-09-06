import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.greprep.app',
  appName: 'GRE Prep',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
