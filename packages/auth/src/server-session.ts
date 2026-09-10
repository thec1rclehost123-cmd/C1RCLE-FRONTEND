import 'server-only';

import { createApiClient } from '@c1rcle/api-client';
import { sessionSchema } from '@c1rcle/contracts';

import type { User } from '@c1rcle/contracts';

/**
 * Server-side session bootstrap. The caller (a Next.js Server Component or
 * layout) passes the incoming request's cookie header — this package stays
 * framework-agnostic and never imports `next/*`.
 *
 * Calls the gateway's `GET /api/v2/auth/session` directly (no BFF, no CSRF —
 * this is trusted server-to-server) and returns the user, or `null` for an
 * absent/expired/invalid session. Never throws.
 *
 * Usage:
 *   import { cookies } from 'next/headers';
 *   const session = await getServerSession((await cookies()).toString());
 */
export async function getServerSession(cookieHeader: string): Promise<{ user: User } | null> {
  if (!cookieHeader) {
    return null;
  }

  try {
    const session = await createApiClient().get({
      path: '/api/v2/auth/session',
      schema: sessionSchema,
      headers: { cookie: cookieHeader },
    });

    return { user: session.user };
  } catch {
    return null;
  }
}
