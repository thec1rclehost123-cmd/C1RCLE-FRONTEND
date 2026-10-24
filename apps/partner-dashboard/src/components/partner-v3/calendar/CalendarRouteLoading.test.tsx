import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HostAvailabilityRoute } from './HostAvailabilityRoute';
import { VenueCalendarRoute } from './VenueCalendarRoute';

vi.mock('@/lib/calendar/use-venue-calendar', () => ({
  useVenueCalendar: () => ({ data: null, error: null, loading: true, retry: vi.fn() }),
}));

vi.mock('@/lib/calendar/use-host-availability', () => ({
  useHostAvailability: () => ({ data: null, error: null, loading: true, retry: vi.fn() }),
}));

describe('calendar route loading states', () => {
  it('renders an accessible loading state for the venue calendar', () => {
    render(<VenueCalendarRoute organizationId="org-m3" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading venue calendar…');
  });

  it('renders an accessible loading state for host availability', () => {
    render(<HostAvailabilityRoute organizationId="org-m3" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading host availability…');
  });
});
