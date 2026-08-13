import { describe, expect, it } from 'vitest';

import {
  acceptedEvents,
  anonymousOrders,
  canonicalLinks,
  discoverableEvents,
  eligibleLinkEvents,
  linkForEvent,
  pendingInvitations,
  promoterWriteCapabilities,
} from './promoter-studio-model';

describe('Promoter Studio operating rules', () => {
  it('separates accepted, invited and discoverable event states', () => {
    expect(acceptedEvents.every((event) => event.state === 'accepted')).toBe(true);
    expect(pendingInvitations.every((event) => event.state === 'pending')).toBe(true);
    expect(discoverableEvents.every((event) => event.state === 'requestable')).toBe(true);
    expect(
      new Set(
        [...acceptedEvents, ...pendingInvitations, ...discoverableEvents].map((event) => event.id),
      ).size,
    ).toBe(acceptedEvents.length + pendingInvitations.length + discoverableEvents.length);
  });

  it('keeps exactly one canonical link per promoter event', () => {
    expect(new Set(canonicalLinks.map((link) => link.eventId)).size).toBe(canonicalLinks.length);
    expect(canonicalLinks.every((link) => linkForEvent(link.eventId)?.id === link.id)).toBe(true);
    expect(
      canonicalLinks.every(
        (link) => !('channel' in link) && !('label' in link) && !('attributionWindow' in link),
      ),
    ).toBe(true);
  });

  it('only offers accepted events without a link for link creation', () => {
    const eligible = eligibleLinkEvents();
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible.every((event) => event.state === 'accepted' && !linkForEvent(event.id))).toBe(
      true,
    );
  });

  it('never exposes attendee identity in attributed orders', () => {
    const serialized = JSON.stringify(anonymousOrders).toLowerCase();
    expect(serialized).not.toContain('name');
    expect(serialized).not.toContain('email');
    expect(serialized).not.toContain('phone');
    expect(serialized).not.toContain('contact');
  });

  it('does not fake unavailable mutations', () => {
    expect(Object.values(promoterWriteCapabilities)).not.toContain(true);
  });
});
