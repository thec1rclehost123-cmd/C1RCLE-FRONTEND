import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  buildVenueEventsAnalyticsModel,
  venueEventsAnalyticsFixture,
} from '../venue-events-analytics-model';

import { VenueEventsAnalyticsContent } from './VenueEventsAnalyticsScreen';

vi.mock('next/navigation', () => ({
  usePathname: () => '/venue/events/analytics',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { CalendarIcon: Icon, ChevronDownIcon: Icon, ExportIcon: Icon };
});

describe('VenueEventsAnalyticsContent', () => {
  it('renders the complete demographic state and an accessible sales summary', () => {
    render(<VenueEventsAnalyticsContent model={buildVenueEventsAnalyticsModel()} />);

    expect(screen.getByRole('heading', { name: 'Guest age' })).toBeInTheDocument();
    expect(screen.getByText('Based on 924 identified guests')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /current sales peaked/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /women: 48%/i })).toBeInTheDocument();
  });

  it('shows unavailable demographic panels without inferred charts', () => {
    const model = buildVenueEventsAnalyticsModel({
      ...venueEventsAnalyticsFixture,
      demographics: null,
    });
    render(<VenueEventsAnalyticsContent model={model} />);

    expect(screen.getAllByText('Demographics unavailable')).toHaveLength(2);
    expect(screen.queryByRole('img', { name: /women:/i })).not.toBeInTheDocument();
  });

  it('renders the intentional empty analytics state without fake charts', () => {
    render(<VenueEventsAnalyticsContent model={null} />);

    expect(
      screen.getByRole('heading', { name: /no Events Analytics report/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
