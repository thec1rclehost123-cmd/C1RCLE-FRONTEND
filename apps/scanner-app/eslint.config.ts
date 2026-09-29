import { defineConfig } from 'eslint/config';

import { reactNativeConfig } from '@c1rcle/eslint-config/react-native';

export default defineConfig(...reactNativeConfig, {
  ignores: ['.expo/**', 'dist/**'],
});
