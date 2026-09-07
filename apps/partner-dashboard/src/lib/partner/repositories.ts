import { fixtureHostRepository } from './fixture-host-repository';
import { fixturePromoterRepository } from './fixture-promoter-repository';

import type { HostRepository, PromoterRepository } from './contracts';

/**
 * Composition root for Partner Dashboard data sources.
 * Backend integration replaces these bindings with API repositories without
 * changing page or component imports.
 */
export const partnerRepositories: {
  readonly host: HostRepository;
  readonly promoter: PromoterRepository;
} = {
  host: fixtureHostRepository,
  promoter: fixturePromoterRepository,
};
