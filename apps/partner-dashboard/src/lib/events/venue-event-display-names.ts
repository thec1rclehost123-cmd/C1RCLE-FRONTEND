import type { EventDto, PartnershipDto } from '@c1rcle/contracts';

export function resolveVenueEventDisplayNames(
  event: Pick<EventDto, 'organizationId' | 'venueId'>,
  partnerships: readonly PartnershipDto[],
): { readonly hostName: string | null; readonly venueName: string | null } {
  const matchingPartnership = partnerships.find(
    (partnership) =>
      partnership.hostOrganizationId === event.organizationId &&
      partnership.venueId === event.venueId,
  );

  return {
    hostName: matchingPartnership?.hostName ?? null,
    venueName: matchingPartnership?.venueName ?? null,
  };
}
