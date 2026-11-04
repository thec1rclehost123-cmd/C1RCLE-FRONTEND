import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PartnerProfilePanel } from './PartnerProfilePanel';

import type { PartnerRelationship } from '@/data/partner-data-source';
import type { ComponentProps } from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const venue: PartnerRelationship = {
  id: 'venue-m3-test',
  organizationId: 'venue-org-m3-test',
  venueId: 'venue-m3-test',
  name: 'Test Venue',
  initials: 'TV',
  kind: 'venue',
  role: 'Venue',
  location: 'Pune',
  genres: [],
  stats: [],
  upcomingEvents: [],
  verified: false,
  cardTone: 'teal',
  status: 'Partnered',
};

describe('PartnerProfilePanel', () => {
  it('labels the profile using the relationship kind', () => {
    render(<PartnerProfilePanel partner={venue} closeHref="/partner/host/partners" />);

    expect(screen.getByText('Venue · Pune')).toBeInTheDocument();
    expect(screen.queryByText('Promoter · Pune')).not.toBeInTheDocument();
  });
});
