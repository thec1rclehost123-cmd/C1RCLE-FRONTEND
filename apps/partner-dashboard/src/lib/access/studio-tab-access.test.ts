import { describe, expect, it } from 'vitest';

import { STUDIO_CONFIG } from '@/studios/studio-config';

import {
  isTabVisibleForAccess,
  lastPathSegment,
  visibilityKeyForSegment,
  visibleStudioNavigation,
} from './studio-tab-access';

const allowAll = null;
const denyFinance = { finance: false };
// Venue STAFF matrix: only walk_ins/guest_ops/registers/door survive.
const venueStaffMap = {
  overview: false,
  events: false,
  analytics: false,
  finance: false,
  calendar: false,
  staff: false,
  partners: false,
  presence: false,
  crm: false,
  settings: false,
};

describe('studio-tab-access', () => {
  it('maps route segments to backend visibility keys', () => {
    expect(visibilityKeyForSegment('overview')).toBe('overview');
    expect(visibilityKeyForSegment('finance')).toBe('finance');
    expect(visibilityKeyForSegment('partners')).toBe('partners');
    expect(visibilityKeyForSegment('settings')).toBe('settings');
    // Segments with no backend opinion stay unmapped (fail-open).
    expect(visibilityKeyForSegment('slot-requests')).toBeNull();
    expect(visibilityKeyForSegment('marketing')).toBeNull();
    expect(visibilityKeyForSegment('leaderboard')).toBeNull();
    expect(visibilityKeyForSegment('')).toBeNull();
  });

  it('reads the last path segment ignoring query strings', () => {
    expect(lastPathSegment('/partner/venue/partners?tab=staff')).toBe('partners');
    expect(lastPathSegment('/partner/host/events/e-1')).toBe('e-1');
  });

  it('withholds only explicitly-false tabs', () => {
    expect(isTabVisibleForAccess('/partner/venue/finance', denyFinance)).toBe(false);
    expect(isTabVisibleForAccess('/partner/venue/overview', denyFinance)).toBe(true);
    expect(isTabVisibleForAccess('/partner/venue/marketing', denyFinance)).toBe(true);
  });

  it('fails open when access is unknown', () => {
    expect(isTabVisibleForAccess('/partner/venue/finance', allowAll)).toBe(true);
  });

  it('filters venue navigation down to a staff-allowed set', () => {
    const visible = visibleStudioNavigation(STUDIO_CONFIG.venue, venueStaffMap);
    const labels = visible.navigation.map((item) => item.label);
    expect(labels).not.toContain('Overview');
    expect(labels).not.toContain('Finance');
    expect(labels).not.toContain('Partners');
    // Unmapped segments carry no backend opinion and stay.
    expect(labels).toContain('Slot requests');
    expect(labels).toContain('Marketing');
  });

  it('keeps everything for unrestricted (null-map) access', () => {
    const visible = visibleStudioNavigation(STUDIO_CONFIG.venue, allowAll);
    expect(visible.navigation).toHaveLength(STUDIO_CONFIG.venue.navigation.length);
  });
});
