import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { eventTabs } from './event-workspace-navigation';
import { EventWorkspaceTabs } from './EventWorkspaceTabs';

const state = vi.hoisted(() => ({ path: '/partner/host/events/event-a/cover/redeem' }));
vi.mock('next/navigation', () => ({ usePathname: () => state.path }));
it('retains every existing event destination beneath six primary groups', () => {
  const tabs = eventTabs('host', 'event-a');
  expect(tabs).toHaveLength(6);
  const paths = tabs.flatMap((tab) => (tab.children ?? [tab]).map((item) => item.href));
  for (const suffix of [
    '',
    '/analytics',
    '/guests',
    '/tickets',
    '/sales',
    '/addons',
    '/waitlist',
    '/promoters',
    '/access',
    '/door',
    '/cover',
    '/tonight',
    '/edit',
  ])
    expect(paths).toContain(`/partner/host/events/event-a${suffix}`);
  expect(paths.some((path) => path.includes('marketing'))).toBe(false);
});
it('selects the correct group and retains secondary navigation on nested operational routes', () => {
  render(
    <EventWorkspaceTabs
      tabs={eventTabs('host', 'event-a')}
      baseHref="/partner/host/events/event-a"
    />,
  );
  expect(screen.getByRole('link', { name: 'Door & cover' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  expect(screen.getByRole('navigation', { name: 'Door & cover sections' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^Cover$/ })).toHaveAttribute('aria-current', 'page');
});
