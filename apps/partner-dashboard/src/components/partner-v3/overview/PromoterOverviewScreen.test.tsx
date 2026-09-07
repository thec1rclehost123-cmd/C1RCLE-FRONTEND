import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PromoterOverviewScreen } from './PromoterOverviewScreen';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { CalendarIcon: Icon, SearchIcon: Icon, TrendUpIcon: Icon };
});

describe('PromoterOverviewScreen', () => {
  it('keeps the Promoter-specific Overview hierarchy and route links', async () => {
    const data = await fixturePartnerDataSource.getPromoterOverview();
    render(
      <PromoterOverviewScreen
        data={data}
        links={{
          events: '/partner/promoter/events',
          guests: '/partner/promoter/guests',
          analytics: '/partner/promoter/analytics',
          finance: '/partner/promoter/finance',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Performance' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Latest Orders' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming Events' })).toBeInTheDocument();
    expect(screen.getByText('No assigned events yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'VIEW MORE' })).toHaveAttribute('href', '/partner/promoter/guests');
    expect(screen.getByRole('link', { name: 'Open events →' })).toHaveAttribute('href', '/partner/promoter/events');
  });

  it('switches between Promoter performance metrics locally', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getPromoterOverview();
    render(
      <PromoterOverviewScreen
        data={data}
        links={{ events: '/events', guests: '/guests', analytics: '/analytics', finance: '/finance' }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Revenue' }));
    await user.click(screen.getByRole('button', { name: '1D' }));

    expect(screen.getByRole('img', { name: /revenue 1D trend/i })).toBeInTheDocument();
  });
});
