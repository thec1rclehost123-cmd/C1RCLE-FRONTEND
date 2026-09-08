import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { HostPartnersScreen } from './HostPartnersScreen';

describe('HostPartnersScreen', () => {
  it('uses the Host venue relationship model and lavender-oriented navigation', async () => {
    const data = await fixturePartnerDataSource.getHostPartners();
    render(<HostPartnersScreen data={data} />);

    expect(screen.getByRole('link', { name: 'Venues' })).toHaveAttribute(
      'href',
      '/partner/host/partners',
    );
    expect(screen.getByRole('link', { name: 'My Venues' })).toHaveAttribute(
      'href',
      '/partner/host/partners',
    );
    expect(screen.getByText('Skyline Rooftop')).toBeInTheDocument();
    expect(screen.getByText('Capacity 400 · 6 events booked')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search partners')).not.toBeInTheDocument();
  });

  it('renders Host promoter discovery and staff states from URL-owned props', async () => {
    const data = await fixturePartnerDataSource.getHostPartners();
    const { rerender } = render(
      <HostPartnersScreen data={data} segment="promoters" subView="discover" />,
    );

    expect(screen.getByText('Vikram (Loud Nights)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Venues' })).toHaveAttribute(
      'href',
      '/partner/host/partners',
    );

    rerender(<HostPartnersScreen data={data} segment="staff" />);
    expect(screen.getByRole('button', { name: 'Add staff' })).toBeInTheDocument();
    expect(screen.getByText('Maya S.')).toBeInTheDocument();
  });
});
