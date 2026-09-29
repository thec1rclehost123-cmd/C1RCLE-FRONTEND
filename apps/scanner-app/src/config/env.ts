import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * This app's ONE env-owner module. `@c1rcle/config` cannot be reused here —
 * it reads literal `process.env.NEXT_PUBLIC_*`, which is Next.js's own
 * static-replace convention; Expo inlines `EXPO_PUBLIC_*` via its own Babel
 * plugin, a different mechanism and a different prefix. See
 * `docs/scanner-app/06-v1-vs-v2-and-rollout.md` for why this couldn't be a
 * shared package yet (single consumer, no second RN app to validate the
 * boundary against).
 */

const envSchema = z.object({
  apiBaseUrl: z.url(),
  appEnv: z.enum(['staging', 'production']),
  /** The venue this handset acts for — see `src/auth/venueBinding.ts` for why
   * it is config rather than a login field. Null means unconfigured, which is
   * a valid first-run state, not an error. */
  organizationId: z.string().min(1).nullable(),
});

function readRawEnv(): { apiBaseUrl: unknown; appEnv: unknown; organizationId: string | null } {
  const extra = Constants.expoConfig?.extra;
  const rawOrganizationId: unknown = extra?.['organizationId'];
  return {
    apiBaseUrl: extra?.['apiBaseUrl'],
    appEnv: extra?.['appEnv'],
    organizationId:
      typeof rawOrganizationId === 'string' && rawOrganizationId.length > 0
        ? rawOrganizationId
        : null,
  };
}

let cached: z.infer<typeof envSchema> | null = null;

export function getScannerEnv(): z.infer<typeof envSchema> {
  if (cached !== null) {
    return cached;
  }
  const parsed = envSchema.safeParse(readRawEnv());
  if (!parsed.success) {
    throw new Error(
      `Invalid scanner-app environment: ${parsed.error.message}. Check app.config.ts's "extra" block and EXPO_PUBLIC_* variables.`,
    );
  }
  cached = parsed.data;
  return cached;
}
