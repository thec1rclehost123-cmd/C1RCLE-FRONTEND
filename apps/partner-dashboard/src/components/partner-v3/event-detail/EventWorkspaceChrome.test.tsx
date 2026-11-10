import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { eventTabs } from './event-workspace-navigation';
import { EventWorkspaceChrome } from './EventWorkspaceChrome';

const state = vi.hoisted(() => ({ path: '/partner/host/events/event-a/analytics' }));
vi.mock('next/navigation', () => ({ usePathname: () => state.path }));

it('places primary pills above the event info card and active sales pills below it', () => {
  render(
    <EventWorkspaceChrome
      studio="host"
      event={{
        id: 'event-a',
        title: 'Neon Nights: Afrobeats',
        venue: 'Skyline Rooftop',
        dateTime: 'Thu, Jul 16 · 9:00 PM IST',
        statusLabel: 'Live',
        artwork: { type: 'gradient', value: 'placeholder' },
        metrics: [
          { label: 'Tickets sold', value: '212 / 400' },
          { label: 'Page visits', value: '2,053' },
          { label: 'Conversions', value: '36.6%' },
        ],
      }}
      tabs={eventTabs('host', 'event-a')}
    >
      <p>Analytics content</p>
    </EventWorkspaceChrome>,
  );

  const primary = screen.getByRole('navigation', { name: 'Event workspace' });
  const info = screen.getByTestId('event-workspace-event-info');
  const secondary = screen.getByRole('navigation', { name: 'Sales sections' });

  expect(primary.compareDocumentPosition(info) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(info.compareDocumentPosition(secondary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Sales' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('heading', { name: 'Neon Nights: Afrobeats' })).toBeInTheDocument();
});
