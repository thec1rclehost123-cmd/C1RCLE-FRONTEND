import { describe, expect, it } from 'vitest';

import { fixtureHostRepository } from './fixture-host-repository';
import { fixturePromoterRepository } from './fixture-promoter-repository';

describe('fixture venue↔host request lifecycle', () => {
  it('sends a partnership request as pending and lists it', async () => {
    const created = await fixtureHostRepository.requestPartnership({
      venueId: 'venue-skyline',
      initiatedBy: 'venue',
      hostOrganizationId: 'host-ring',
      message: 'Run Fridays together?',
    });
    expect(created.status).toBe('pending');
    expect(created.venueId).toBe('venue-skyline');
    expect(created.message).toBe('Run Fridays together?');

    const { items } = await fixtureHostRepository.getPartnerships();
    expect(items.map((item) => item.id)).toContain(created.id);
  });

  it('approves a pending request into an active partnership', async () => {
    const created = await fixtureHostRepository.requestPartnership({
      venueId: 'venue-docks',
      initiatedBy: 'host',
    });
    const approved = await fixtureHostRepository.resolvePartnership(created.id, 'approve');
    expect(approved.status).toBe('active');
    expect(approved.resolvedAt).not.toBeNull();
    expect(approved.version).toBe(created.version + 1);
  });

  it('rejects and blocks with a reason', async () => {
    const rejected = await fixtureHostRepository.resolvePartnership(
      (await fixtureHostRepository.requestPartnership({ venueId: 'v1', initiatedBy: 'host' })).id,
      'reject',
      'No capacity',
    );
    expect(rejected.status).toBe('rejected');
    expect(rejected.resolutionReason).toBe('No capacity');

    const blocked = await fixtureHostRepository.resolvePartnership(
      (await fixtureHostRepository.requestPartnership({ venueId: 'v2', initiatedBy: 'host' })).id,
      'block',
    );
    expect(blocked.status).toBe('blocked');
  });

  it('throws when resolving an unknown partnership', async () => {
    await expect(
      fixtureHostRepository.resolvePartnership('missing-id', 'approve'),
    ).rejects.toThrow('missing-id');
  });
});

describe('fixture promoter↔host/venue request lifecycle', () => {
  it('sends a promoter connection request as pending and lists it', async () => {
    const created = await fixturePromoterRepository.requestConnection({
      counterpartyId: 'venue-skyline',
      targetType: 'venue',
      initiatedBy: 'promoter',
      message: 'Promo for Neon Nights?',
    });
    expect(created.status).toBe('pending');
    expect(created.targetType).toBe('venue');

    const { items } = await fixturePromoterRepository.getPromoterConnections();
    expect(items.map((item) => item.id)).toContain(created.id);
  });

  it('approves an incoming request and revokes an active connection', async () => {
    const incoming = await fixturePromoterRepository.requestConnection({
      counterpartyId: 'host-ring',
      targetType: 'host',
      initiatedBy: 'target',
    });
    const approved = await fixturePromoterRepository.resolveConnection(incoming.id, 'approve');
    expect(approved.status).toBe('active');

    const revoked = await fixturePromoterRepository.resolveConnection(approved.id, 'revoke');
    expect(revoked.status).toBe('revoked');
  });

  it('throws when resolving an unknown connection', async () => {
    await expect(
      fixturePromoterRepository.resolveConnection('missing-id', 'reject'),
    ).rejects.toThrow('missing-id');
  });
});
