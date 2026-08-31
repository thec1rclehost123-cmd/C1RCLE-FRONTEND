import { exploreFixture } from '../fixtures/explore.fixture';

import type { ExploreData, ExploreRepository } from './contracts';

/**
 * The active default for `getExploreRepository()`. See
 * `api-explore-repository.ts` for why: the backend has no public/guest-safe
 * event-discovery (list) endpoint today, so this fixture is not a
 * placeholder waiting to be swapped in the usual sense — it is the only
 * thing that can legitimately back an unauthenticated, cross-organization
 * "browse events" page right now.
 */
export const fixtureExploreRepository: ExploreRepository = {
  getExploreData(): Promise<ExploreData> {
    return Promise.resolve(exploreFixture);
  },
};
