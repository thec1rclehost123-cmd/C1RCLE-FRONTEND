import type { ExpoConfig } from 'expo/config';

const appEnv = process.env['EXPO_PUBLIC_ENV'] ?? 'staging';
const apiBaseUrl = process.env['EXPO_PUBLIC_API_BASE_URL'];
if (appEnv === 'production' && !apiBaseUrl) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required for production Scanner builds');
}

const config: ExpoConfig = {
  name: 'C1RCLE Scanner',
  slug: 'c1rcle-scanner',
  scheme: 'c1rclescanner',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        'C1RCLE Scanner uses the camera to scan guest QR tickets at the door.',
      NSLocationWhenInUseUsageDescription:
        'C1RCLE Scanner checks the device is at the venue before opening a shift.',
    },
  },
  android: {
    permissions: ['CAMERA', 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  web: {
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission: 'C1RCLE Scanner uses the camera to scan guest QR tickets at the door.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'C1RCLE Scanner checks the device is at the venue before opening a shift.',
      },
    ],
  ],
  extra: {
    apiBaseUrl: apiBaseUrl ?? 'http://localhost:8080',
    appEnv,
    organizationId: process.env['EXPO_PUBLIC_ORGANIZATION_ID'] ?? null,
  },
};

export default config;
