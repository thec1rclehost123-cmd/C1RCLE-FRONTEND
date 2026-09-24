import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PromoterEventDetailScreen } from './PromoterEventDetailScreen';

import type { ReactNode } from 'react';

vi.mock('next/image', () => ({
  default: () => <span aria-hidden="true" />,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/promoter/events/neon-nights',
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    readonly children: ReactNode;
    readonly href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { CalendarIcon: Icon, LocationIcon: Icon };
});

const event = {
  id: 'neon-nights',
  name: 'Neon Nights',
  date: 'Fri, 18 Jul',
  time: '9:00 PM',
  venue: 'Skyline Social',
  host: 'Rhea Kapoor Events',
  city: 'Mumbai',
  status: 'active',
  category: 'Afrobeats · House',
  commissionLabel: '₹180 / ticket',
  clicks: 1842,
  tickets: 56,
  earningsPaise: 1008000,
  conversion: 8.4,
  accent: 'orange',
} as const;

describe('PromoterEventDetailScreen', () => {
  it('keeps promoter tabs and the authoritative permanent-link action', () => {
    render(
      <PromoterEventDetailScreen
        event={event}
        activeTab="links"
        orders={[]}
        links={[
          {
            id: 'lnk-neon',
            eventId: 'neon-nights',
            eventName: 'Neon Nights',
            channel: 'Instagram',
            label: 'Main story',
            shortUrl: 'c1rcle.in/zoya/neon',
            status: 'active',
            clicks: 1184,
            purchases: 42,
            earningsPaise: 756000,
          },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Links', current: 'page' })).toHaveAttribute(
      'href',
      '/promoter/events/neon-nights?tab=links',
    );
    expect(screen.getAllByRole('button', { name: 'Copy link' })).toHaveLength(2);
    expect(
      screen.queryByRole('link', { name: /open door mode|edit event/i }),
    ).not.toBeInTheDocument();
  });

  it('uses an honest Links route when no permanent link exists', () => {
    render(<PromoterEventDetailScreen event={event} orders={[]} links={[]} />);

    expect(screen.getByRole('link', { name: 'Get link' })).toHaveAttribute(
      'href',
      '/promoter/links?event=neon-nights',
    );
  });
});
