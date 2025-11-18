import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tu.app.id',
  appName: 'TuApp',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['ifqyreythppztikjxmnd.supabase.co']
  }
};

export default config;