import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PromoterPartnersScreen } from './PromoterPartnersScreen';

describe('PromoterPartnersScreen', () => {
  it('renders the Promoter summary, tabs, filters, and discover cards', async () => {
    const data = await fixturePartnerDataSource.getPromoterPartners();
    render(<PromoterPartnersScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Partners' })).toBeInTheDocument();
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
    expect(screen.getByText('Playboy Club Delhi')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Active 3' })).toHaveAttribute(
      'href',
      '/partner/promoter/partners?tab=active',
    );
    expect(screen.getByRole('link', { name: 'Venues' })).toHaveAttribute(
      'href',
      '/partner/promoter/partners?filter=venues',
    );
    expect(screen.getByPlaceholderText('Search venues & hosts...')).toBeInTheDocument();
  });

  it('renders active filtering and intentionally empty request states', async () => {
    const data = await fixturePartnerDataSource.getPromoterPartners();
    const { rerender } = render(
      <PromoterPartnersScreen data={data} tab="active" filter="venues" />,
    );

    expect(screen.getByText("Majid's Club")).toBeInTheDocument();
    expect(screen.queryByText('New Host')).not.toBeInTheDocument();

    rerender(<PromoterPartnersScreen data={data} tab="incoming" />);
    expect(screen.getByRole('heading', { name: 'No incoming requests' })).toBeInTheDocument();
  });
});
