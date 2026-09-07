import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { VenuePartnersScreen } from './VenuePartnersScreen';

describe('VenuePartnersScreen', () => {
  it('renders connected hosts and URL-backed navigation', async () => {
    const data = await fixturePartnerDataSource.getVenuePartners();
    render(<VenuePartnersScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Partners' })).toBeInTheDocument();
    expect(screen.getByText('Kabir M. (Sunday Sessions)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Promoters' })).toHaveAttribute('href', '/partner/venue/partners?tab=promoters');
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/partner/venue/partners?view=discover');
    expect(screen.getAllByRole('link', { name: /View profile/ })[0]).toHaveAttribute('href', '/partner/venue/partners?profile=kabir-sunday-sessions');
  });

  it('renders requests, staff access, and fixture-safe staff invitation entry', async () => {
    const data = await fixturePartnerDataSource.getVenuePartners();
    const { rerender } = render(<VenuePartnersScreen data={data} segment="promoters" subView="requests" />);

    expect(screen.getByText('Rhea (Afterglow)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();

    rerender(<VenuePartnersScreen data={data} segment="staff" />);
    expect(screen.getByText('Maya S.')).toBeInTheDocument();
    expect(screen.getAllByText('Door check-in').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Add staff' })).toBeInTheDocument();
  });
});
