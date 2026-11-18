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
        ownerType: 'host',
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

it('uses shared event chrome without showing Host-only actions in Venue Studio', () => {
  render(
    <EventWorkspaceChrome
      studio="venue"
      event={{
        id: 'event-a',
        ownerType: 'host',
        title: 'C1RCLE STAGING ACCEPTANCE 001',
        venue: 'Test Venue',
        dateTime: 'Sun, Nov 29 · 6:00 PM IST',
        statusLabel: 'published',
        artwork: { type: 'gradient', value: 'placeholder' },
        metrics: [{ label: 'Ticket tiers', value: '2' }],
      }}
      tabs={[{ label: 'Overview', href: '/partner/venue/events/event-a' }]}
    >
      <p>Venue event data</p>
    </EventWorkspaceChrome>,
  );

  expect(
    screen.getByRole('heading', { name: 'C1RCLE STAGING ACCEPTANCE 001' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Venue event data')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Door Mode' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
});

it('keeps the edit action for an event the Venue organization owns', () => {
  render(
    <EventWorkspaceChrome
      studio="venue"
      event={{
        id: 'venue-event',
        ownerType: 'venue',
        title: 'Venue-owned event',
        venue: 'Test Venue',
        dateTime: 'Sun, Nov 29 · 6:00 PM IST',
        statusLabel: 'Draft',
        artwork: { type: 'gradient', value: 'placeholder' },
        metrics: [],
      }}
      tabs={[{ label: 'Overview', href: '/partner/venue/events/venue-event' }]}
    >
      <p>Venue-owned event data</p>
    </EventWorkspaceChrome>,
  );

  expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
    'href',
    '/partner/venue/events/venue-event/edit',
  );
  expect(screen.queryByRole('link', { name: 'Door Mode' })).not.toBeInTheDocument();
});
