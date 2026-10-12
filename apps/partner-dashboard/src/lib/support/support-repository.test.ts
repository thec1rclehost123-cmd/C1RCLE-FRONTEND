import { describe, expect, it } from 'vitest';

import { normalizeTicket, toShortTicketId } from './support-repository';

import type { SupportTicketDto } from '@c1rcle/contracts';

describe('support repository', () => {
  it('converts long id into clean 8-character uppercase short id', () => {
    expect(toShortTicketId('tk_live_948a21f7c001')).toBe('21F7C001');
    expect(toShortTicketId('1234abcd')).toBe('1234ABCD');
  });

  it('normalizes ticket DTO and identifies merged status with primary short ID', () => {
    const rawDto: SupportTicketDto = {
      id: 'tk_live_duplicate_002',
      subject: '[Payments & Finance · Payout Delay] Duplicate payout inquiry',
      description: 'Second ticket submitted regarding payout batch delay.',
      category: 'billing',
      status: 'closed',
      priority: 'high',
      requester: {
        userId: 'usr_001',
        email: 'ops@venue.com',
        organizationId: 'org_001',
      },
      assignee: null,
      messages: [
        {
          id: 'msg_01',
          senderRole: 'customer',
          senderId: 'usr_001',
          senderName: 'Venue Ops',
          content: 'Duplicate inquiry',
          createdAt: new Date().toISOString(),
        },
      ],
      internalNotes: [],
      timeline: [],
      links: {
        venueId: null,
        eventId: null,
        orderId: null,
        organizationId: null,
        userId: null,
      },
      sla: {
        responseDueAt: new Date().toISOString(),
        resolutionDueAt: new Date().toISOString(),
        responseBreachedAt: null,
        resolutionBreachedAt: null,
      },
      mergedInto: 'tk_live_primary_001',
      mergedFrom: [],
      resolvedAt: null,
      resolvedBy: null,
      closedAt: new Date().toISOString(),
      closedBy: null,
      deletedAt: null,
      deletedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const normalized = normalizeTicket(rawDto);
    expect(normalized.isMerged).toBe(true);
    expect(normalized.mergedInto).toBe('tk_live_primary_001');
    expect(normalized.mergedIntoShortId).toBe('MARY_001');
    expect(normalized.department).toBe('Payments & Finance');
    expect(normalized.subcategory).toBe('Payout Delay');
    expect(normalized.cleanSubject).toBe('Duplicate payout inquiry');
  });
});
