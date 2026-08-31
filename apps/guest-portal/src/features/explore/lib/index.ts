import { fixtureExploreRepository } from './fixture-explore-repository';

import type { ExploreRepository } from './contracts';

export type { ExploreData, ExploreRepository } from './contracts';
export { fixtureExploreRepository } from './fixture-explore-repository';
export {
  createApiExploreRepository,
  decodeExploreEvent,
  type ApiExploreRepositoryOptions,
  type RemoteEvent,
} from './api-explore-repository';

/**
 * Composition root for the explore feature's data source.
 *
 * Stays fixture-backed today on purpose: the backend has no public,
 * cross-organization event-discovery endpoint (see the doc comment at the
 * top of `api-explore-repository.ts` for the investigation trail). The real
 * API-backed implementation exists and works — it is exported above and was
 * verified end-to-end against a live, seeded organization (see the
 * verification script referenced in the handoff notes) — but wiring it in
 * here as the default would mean either hardcoding one organization's id
 * into a public multi-tenant page, or silently only ever showing that one
 * organization's events. Neither is an honest stand-in for "browse public
 * events."
 *
 * Once the backend registers a real `GET /api/v2/public/events` (or
 * equivalent), swap the line below for
 * `createApiExploreRepository({ client: getApiClient(), ... })` — no page
 * or component code needs to change, by design.
 */
export function getExploreRepository(): ExploreRepository {
  return fixtureExploreRepository;
}
