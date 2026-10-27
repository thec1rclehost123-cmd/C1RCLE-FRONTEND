import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEmptyEventEditorData } from '@/lib/events/event-editor-data';

import { VenueEventEditorRoute } from './VenueEventEditorRoute';

import type { VenueCalendarData } from '@/data/partner-data-source';
import type { VenueCalendarWorkspace } from '@/lib/calendar/venue-calendar-repository';
import type { VenueDto } from '@c1rcle/contracts';

const mocks = vi.hoisted(() => ({
  useVenueCalendar: vi.fn<(input: { readonly anchorMonth?: string }) => unknown>(),
  useConnectedPromoters: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/image', () => ({ default: () => <span aria-hidden="true" /> }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  usePathname: () => '/partner/venue/events/create',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/calendar/use-venue-calendar', () => ({
  useVenueCalendar: mocks.useVenueCalendar,
}));
vi.mock('@/lib/partner/use-connected-promoters', () => ({
  useConnectedPromoters: mocks.useConnectedPromoters,
}));
const venue: VenueDto = {
  id: 'venue-m3-test',
  organizationId: 'org-m3-test',
  name: 'M3 Test Venue',
  slug: 'm3-test-venue',
  status: 'active',
  description: '',
  capacity: null,
  city: 'Pune',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const calendar: VenueCalendarData = {
  dataStatus: 'live',
  accent: 'orange',
  blocks: [],
  months: [
    {
      key: '2026-11',
      label: 'November 2026',
      firstDayOffset: 0,
      daysInMonth: 30,
      days: [
        {
          date: '2026-11-21',
          day: 21,
          state: 'available',
          events: [],
          slots: [],
        },
      ],
    },
  ],
};

const workspace: VenueCalendarWorkspace = {
  venues: [venue],
  venue,
  calendar,
};

describe('VenueEventEditorRoute', () => {
  beforeEach(() => {
    mocks.useVenueCalendar.mockReset();
    mocks.useVenueCalendar.mockReturnValue({
      data: workspace,
      error: null,
      loading: false,
      retry: vi.fn(),
    });
    mocks.useConnectedPromoters.mockReset();
    mocks.useConnectedPromoters.mockReturnValue({ data: [], error: null, loading: false });
    mocks.push.mockReset();
    mocks.replace.mockReset();
  });

  it('keeps the loaded availability range stable and preserves the draft when a date is selected', () => {
    const data = createEmptyEventEditorData('venue');
    const props = {
      organizationId: 'org-m3-test',
      data,
    };
    const view = render(<VenueEventEditorRoute {...props} />);
    const initialAnchorMonth = mocks.useVenueCalendar.mock.calls[0]?.[0].anchorMonth;

    fireEvent.change(screen.getByLabelText('Event name'), {
      target: { value: 'M3 draft survives date selection' },
    });
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '20:00' } });

    view.rerender(<VenueEventEditorRoute {...props} initialDate="2026-11-21" />);

    expect(mocks.useVenueCalendar.mock.calls.at(-1)?.[0].anchorMonth).toBe(initialAnchorMonth);
    expect(screen.getByLabelText('Event name')).toHaveValue('M3 draft survives date selection');
    expect(screen.getByLabelText('Start time')).toHaveValue('20:00');
    expect(screen.getByLabelText(/^Date/)).toHaveValue('Sat, Nov 21, 2026');
  });
});
