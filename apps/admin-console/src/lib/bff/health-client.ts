/* eslint-disable no-restricted-globals, no-restricted-syntax --
 * Client-side half of the sanctioned health-check BFF (see
 * `health-proxy.ts` for the server-side half and the full rationale). This
 * calls this app's OWN same-origin `/api/health/*` route, not the gateway —
 * @c1rcle/api-client exists to own calls that cross to the backend, which
 * this single relative hop structurally is not.
 */
import { z } from 'zod';

const readinessResponseSchema = z.object({
  ok: z.boolean(),
  checks: z.record(z.string(), z.enum(['up', 'down'])),
});

const versionResponseSchema = z.object({
  version: z.string(),
  buildSha: z.string(),
  commit: z.string(),
  startedAt: z.string(),
});

export async function fetchSystemReadiness(): Promise<z.infer<typeof readinessResponseSchema>> {
  const response = await fetch('/api/health/readiness', { cache: 'no-store' });
  return readinessResponseSchema.parse(await response.json());
}

export async function fetchSystemVersion(): Promise<z.infer<typeof versionResponseSchema>> {
  const response = await fetch('/api/health/version', { cache: 'no-store' });
  return versionResponseSchema.parse(await response.json());
}
