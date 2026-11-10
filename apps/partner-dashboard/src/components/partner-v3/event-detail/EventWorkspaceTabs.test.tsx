import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { eventTabs } from './event-workspace-navigation';
import { EventWorkspaceTabs } from './EventWorkspaceTabs';

const state = vi.hoisted(() => ({ path: '/partner/host/events/event-a/cover/redeem' }));
vi.mock('next/navigation', () => ({ usePathname: () => state.path }));
it('groups connected event destinations under the four intended sections', () => {
  const tabs = eventTabs('host', 'event-a');
  expect(tabs.map((tab) => tab.label)).toEqual(['Sales', "Who's coming", 'Tonight', 'Promoters']);
  expect(tabs[0]?.children?.map((tab) => tab.label)).toEqual([
    'Summary',
    'Analytics',
    'Revenue',
    'Crowd',
    'Live compare',
  ]);
  const paths = tabs.flatMap((tab) => (tab.children ?? [tab]).map((item) => item.href));
  for (const suffix of [
    '',
    '/analytics',
    '/revenue',
    '/guests',
    '/compare',
    '/waitlist',
    '/promoters',
    '/door',
    '/cover',
  ])
    expect(paths).toContain(`/partner/host/events/event-a${suffix}`);
  expect(paths.some((path) => path.includes('marketing'))).toBe(false);
});
it('selects Tonight and its Cover pill on nested operational routes', () => {
  render(
    <EventWorkspaceTabs
      tabs={eventTabs('host', 'event-a')}
      baseHref="/partner/host/events/event-a"
    />,
  );
  expect(screen.getByRole('link', { name: 'Tonight' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('navigation', { name: 'Tonight sections' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^Cover$/ })).toHaveAttribute('aria-current', 'page');
});
