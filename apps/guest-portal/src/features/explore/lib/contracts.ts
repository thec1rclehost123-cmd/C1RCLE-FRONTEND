import type { ExploreCity, ExploreEvent } from '../types/explore.types';

/**
 * Data an explore page/component needs to render — same shape the fixture
 * has exported all along (`exploreFixture`), now behind a swappable
 * interface instead of a direct import.
 */
export interface ExploreData {
  readonly cities: readonly ExploreCity[];
  readonly events: readonly ExploreEvent[];
  readonly featuredEvents: readonly ExploreEvent[];
}

/**
 * Composition-root seam for the explore feature's data source. Mirrors the
 * shape of `apps/partner-dashboard/src/lib/partner/{contracts,repositories}.ts`:
 * an interface, a fixture-backed implementation, and (here) a real
 * API-backed implementation — see `api-explore-repository.ts` for why the
 * real implementation is not the active default.
 */
export interface ExploreRepository {
  getExploreData(): Promise<ExploreData>;
}
