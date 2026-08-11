import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VenueOverviewContent } from './OverviewScreen';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AnnouncementIcon: Icon,
    BankIcon: Icon,
    CheckIcon: Icon,
    EmailIcon: Icon,
    ForwardIcon: Icon,
    GuestIcon: Icon,
    InfoIcon: Icon,
    LocationIcon: Icon,
    NextIcon: Icon,
    PartnerIcon: Icon,
    TicketIcon: Icon,
    UsersIcon: Icon,
  };
});

describe('VenueOverviewContent', () => {
  it('renders the intentional empty state with one relevant action', () => {
    render(<VenueOverviewContent model={null} />);

    expect(screen.getByRole('heading', { name: /ready for its first event/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create event' })).toHaveAttribute(
      'href',
      '/venue/events/create',
    );
    expect(screen.queryByRole('img', { name: /gross sales/i })).not.toBeInTheDocument();
  });
});
