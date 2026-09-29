import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import styles from './overview.module.css';
import { OverviewCalendarCard } from './OverviewCalendarCard';

import type { CalendarMonth, OverviewData } from '@/data/partner-data-source';

const mocks = vi.hoisted(() => ({
  retry: vi.fn(),
}));

vi.mock('@c1rcle/icons', () => ({
  ExpandIcon: () => <svg aria-hidden="true" />,
}));

const month: CalendarMonth = {
  key: '2026-09',
  label: 'September 2026',
  firstDayOffset: 2,
  daysInMonth: 30,
  days: [
    { date: '2026-09-05', day: 5, state: 'blocked', events: [], slots: [] },
    { date: '2026-09-06', day: 6, state: 'confirmed', events: [], slots: [] },
  ],
};

vi.mock('@/lib/calendar/use-venue-calendar', () => ({
  useVenueCalendar: () => ({
    data: {
      venues: [],
      venue: null,
      calendar: { dataStatus: 'live', accent: 'orange', months: [month], blocks: [] },
    },
    error: null,
    loading: false,
    retry: mocks.retry,
  }),
}));

vi.mock('@/lib/calendar/use-host-availability', () => ({
  useHostAvailability: () => ({
    data: null,
    error: null,
    loading: false,
    retry: mocks.retry,
  }),
}));

const fallback: OverviewData['calendar'] = {
  monthLabel: 'Fixture month',
  firstDayOffset: 0,
  days: [],
};

describe('OverviewCalendarCard', () => {
  it('shows blocked venue dates from the live calendar API', () => {
    render(
      <OverviewCalendarCard
        fallback={fallback}
        href="/partner/venue/calendar"
        studio="venue"
        organizationId="org-one"
      />,
    );

    const blockedDay = screen.getByLabelText('September 2026, 5, blocked');
    const blockedClass = styles['blockedDay'];
    expect(blockedClass).toBeDefined();
    if (!blockedClass) throw new Error('The blocked-day style is missing.');
    expect(blockedDay).toHaveClass(blockedClass);
    expect(screen.getByLabelText('September 2026, 6, 1 event')).toBeInTheDocument();
  });
});
