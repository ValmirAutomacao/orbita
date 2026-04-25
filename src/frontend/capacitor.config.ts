import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pulseo.orbita',
  appName: 'Orbita',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;