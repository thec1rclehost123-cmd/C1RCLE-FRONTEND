import { z } from 'zod';

/**
 * The declared environment contract.
 *
 * Rules:
 *  - Everything the frontend reads is declared here. No exceptions.
 *  - Only `NEXT_PUBLIC_*` values reach the browser. Anything else is
 *    server-only and must never be referenced from a client component.
 *  - There are no secrets in this repository. If a value would be dangerous
 *    to print in a browser devtools console, it belongs in the backend.
 */

const url = z.url({ error: 'must be an absolute URL including protocol' });

/** Values that are inlined into the client bundle and are therefore public. */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: url,
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'preview', 'production']),
  NEXT_PUBLIC_SENTRY_DSN: url.optional(),
});

/** Values that stay on the server. Never import this from a client component. */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ANALYZE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
