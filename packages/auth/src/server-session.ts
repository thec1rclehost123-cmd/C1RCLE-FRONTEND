// eslint-disable-next-line no-restricted-syntax
import 'server-only';

import { sessionSchema } from '@c1rcle/contracts';
import { getClientEnv } from '@c1rcle/config';

import type { User } from '@c1rcle/contracts';

/**
 * Fetches the current session from the server-side.
 * Reads the httpOnly session cookie from the request headers and calls the gateway directly.
 * Returns the user if authenticated, null if not, and never throws.
 *
 * This is a server-only module (import 'server-only' guard ensures it never reaches the browser).
 */
export async function getServerSession(): Promise<{ user: User } | null> {
  try {
    // Import next/headers dynamically to ensure server-side execution
    const { cookies } = await import('next/headers');
    const cookieHeader = (await cookies()).toString();

    const response = await fetch(
      `${getClientEnv().NEXT_PUBLIC_API_BASE_URL}/api/v2/auth/session`,
      {
        method: 'GET',
        headers: {
          cookie: cookieHeader,
        },
        cache: 'no-store',
      },
    );

    // 401 = not authenticated, return null without throwing
    if (response.status === 401) {
      return null;
    }

    // Parse the response
    const data = await response.json();

    // Validate against the session schema
    const parsed = sessionSchema.parse(data);

    return {
      user: parsed.user,
    };
  } catch (error) {
    // On any error (network, parse, etc.), return null rather than throwing
    return null;
  }
}
