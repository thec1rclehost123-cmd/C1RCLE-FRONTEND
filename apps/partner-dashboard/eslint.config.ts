import { defineConfig } from 'eslint/config';

import { nextConfig } from '@c1rcle/eslint-config/next';

export default defineConfig(
  ...nextConfig,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
  {
    // The one sanctioned exception to the repo-wide firebase/* ban: GCP
    // Identity Platform's client SDK, scoped to the onboarding wizard's
    // phone-verification step only (never account/session/DB — that stays
    // @c1rcle/auth's and @c1rcle/api-client's job). Every other file in the
    // app imports the SDK's pieces through this module, not `firebase/*`
    // directly, so the exception stays contained to one file.
    files: ['src/lib/firebase/client.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);
