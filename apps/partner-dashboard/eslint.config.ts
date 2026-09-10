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
    // @c1rcle/auth's and @c1rcle/api-client's job). The facade module plus the
    // two wizard pages that drive phone verification are the only files allowed
    // to reference the SDK — matching the as-written import (`@/lib/firebase/client`
    // or `@/lib/firebase/*`) so the eslint v9 resolved-path matching doesn't
    // flag it again.
    files: [
      'src/lib/firebase/client.ts',
      'src/app/onboard/PageClient.tsx',
      'src/app/verify/PageClient.tsx',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);
