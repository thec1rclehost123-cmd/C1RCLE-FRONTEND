import { describe, expect, it } from 'vitest';

import {
  createEditEventReviewRows,
  createEventReviewRows,
  initialCreateEventDraft,
  validateTicketTypes,
} from './create-event-model';
import { getEditEventDraft } from './edit-event-model';
import { doorModeModel, filterDoorGuests } from './venue-door-model';
import { getVenueEventAnalyticsModel } from './venue-event-analytics-model';
import { createVenueFinanceModel, venueFinanceSource } from './venue-finance-model';
import { campaignResultLabel, getMarketingTemplate } from './venue-marketing-model';
import { filterVenueNotifications } from './venue-notifications-model';
import { venueHosts, venuePromoters, venueStaff } from './venue-partners-model';
import { resolveVenueSettingsPermissions, venueSettingsSource } from './venue-settings-model';
import { filterSlotRequests } from './venue-slot-requests-model';

describe('focused Venue operations models', () => {
  it('keeps Hosts and Promoters in separate partner sources and Staff outside both', () => {
    expect(venueHosts.every((partner) => partner.kind === 'host')).toBe(true);
    expect(venuePromoters.every((partner) => partner.kind === 'promoter')).toBe(true);
    expect(new Set([...venueHosts, ...venuePromoters].map((partner) => partner.id)).size).toBe(
      venueHosts.length + venuePromoters.length,
    );
    expect(
      venueStaff.some((member) => venueHosts.some((partner) => partner.id === member.id)),
    ).toBe(false);
    expect(venueSettingsSource.staff).toBe(venueStaff);
  });

  it('never invents a campaign result and resolves templates into the composer source', () => {
    expect(campaignResultLabel(null)).toBe('Result unavailable');
    expect(getMarketingTemplate('event-reminder')?.title).toBe('Event reminder');
  });

  it('derives every visible finance total from the normalized finance source', () => {
    const model = createVenueFinanceModel(venueFinanceSource);
    expect(model.availablePaise).toBe(
      venueFinanceSource.clearedSettlementPaise! - venueFinanceSource.paidOrReservedPaise!,
    );
    expect(model.pendingPaise).toBe(
      venueFinanceSource.unsettledOrderPaise! - venueFinanceSource.unsettledRefundPaise!,
    );
    expect(model.payoutHistory[0]?.amount).toMatch(/^₹/);
  });

  it('applies independent settings permission gates', () => {
    const allowed = new Set(['canManageSettings', 'canManageStaff']);
    const permissions = resolveVenueSettingsPermissions((action) => allowed.has(action));
    expect(permissions).toEqual({
      canManageVenue: true,
      canChangePayoutAccount: false,
      canManageTeam: true,
      canManageSecurity: false,
    });
  });

  it('validates ticket capacity and derives review summaries from current form data', () => {
    const invalid = validateTicketTypes(
      [
        ...initialCreateEventDraft.tickets,
        { id: 'duplicate', name: 'Early Bird', pricePaise: 0, capacity: 1 },
      ],
      initialCreateEventDraft.venueCapacity,
    );
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain('Ticket names must be unique.');
    expect(invalid.errors).toContain('Early Bird needs a positive price.');
    const changed = { ...initialCreateEventDraft, name: 'Friday Frequency' };
    expect(createEventReviewRows(changed)[0]?.summary).toContain('Friday Frequency');
  });

  it('derives Door Mode totals and filters from one event guest source', () => {
    expect(doorModeModel.totals.checkedIn + doorModeModel.totals.remaining).toBe(
      doorModeModel.totals.issued,
    );
    expect(
      filterDoorGuests(doorModeModel.guests, '', 'checked-in').every((guest) => guest.checkedIn),
    ).toBe(true);
    expect(filterDoorGuests(doorModeModel.guests, 'Aisha', 'all')[0]?.name).toContain('Aisha');
  });

  it('separates slot request tabs and notification categories', () => {
    expect(filterSlotRequests('pending', '').every((request) => request.status === 'pending')).toBe(
      true,
    );
    expect(filterVenueNotifications('finance').every((item) => item.category === 'finance')).toBe(
      true,
    );
  });

  it('prefills Edit Event and derives review rows from the shared draft', () => {
    const draft = getEditEventDraft('neon-nights-afrobeats');
    expect(draft?.name).toBe('Neon Nights: Afrobeats');
    expect(draft?.tickets.length).toBeGreaterThan(0);
    expect(draft ? createEditEventReviewRows(draft).map((row) => row.label) : []).toEqual([
      'Event details',
      'Schedule and venue',
      'Tickets',
      'Guest policies',
      'Poster',
    ]);
  });

  it('keeps demographics unavailable when the source does not supply consented data', () => {
    expect(
      getVenueEventAnalyticsModel('neon-nights-afrobeats')?.metrics.grossSalesPaise,
    ).toBeGreaterThan(0);
    expect(getVenueEventAnalyticsModel('sunset-sessions-vol-4')).toBeNull();
  });
});
