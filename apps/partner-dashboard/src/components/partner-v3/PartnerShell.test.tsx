import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerShell } from './PartnerShell';

const navigation = vi.hoisted(() => ({ pathname: '/partner/venue/overview' }));
const authAccess = vi.hoisted(() => ({
  tabVisibility: null as Record<string, boolean> | null,
  displayName: 'Rhea Kapoor',
}));
const storedValues = new Map<string, string>();

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    profile: { displayName: authAccess.displayName },
    signOut: vi.fn(),
    tabVisibility: authAccess.tabVisibility,
  }),
}));

describe('PartnerShell navigation layouts', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => {
          storedValues.clear();
        },
        getItem: (key: string) => storedValues.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storedValues.set(key, value);
        },
      },
    });
  });

  beforeEach(() => {
    navigation.pathname = '/partner/venue/overview';
    authAccess.tabVisibility = null;
    authAccess.displayName = 'Rhea Kapoor';
    window.localStorage.clear();
  });

  it('switches between side and top navigation and saves the preference', async () => {
    const user = userEvent.setup();
    const interactionData = await fixturePartnerDataSource.getPartnerShellInteractions('venue');

    render(
      <PartnerShell studio="venue" interactionData={interactionData}>
        <div>Overview content</div>
      </PartnerShell>,
    );

    expect(
      screen.getByRole('complementary', { name: 'Venue Studio navigation' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Top navigation' }));

    expect(
      screen.queryByRole('complementary', { name: 'Venue Studio navigation' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Venue Studio navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use side navigation' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(window.localStorage.getItem('c1rcle.partner.navigation-layout')).toBe('top');

    await user.click(screen.getByRole('button', { name: 'Use side navigation' }));
    expect(
      screen.getByRole('complementary', { name: 'Venue Studio navigation' }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('c1rcle.partner.navigation-layout')).toBe('side');
  });

  it('restores a saved top-navigation preference', async () => {
    navigation.pathname = '/partner/host/overview';
    window.localStorage.setItem('c1rcle.partner.navigation-layout', 'top');
    const interactionData = await fixturePartnerDataSource.getPartnerShellInteractions('host');

    render(
      <PartnerShell studio="host" interactionData={interactionData}>
        <div>Host content</div>
      </PartnerShell>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: 'Host Studio navigation' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  });

  it('hides navigation tabs the role matrix withholds', async () => {
    authAccess.tabVisibility = { overview: false, finance: false, settings: false };
    const interactionData = await fixturePartnerDataSource.getPartnerShellInteractions('venue');

    render(
      <PartnerShell studio="venue" interactionData={interactionData}>
        <div>Overview content</div>
      </PartnerShell>,
    );

    expect(screen.queryByRole('link', { name: 'Overview' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Finance' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Events' })).toBeInTheDocument();
    // Segments with no backend opinion stay visible.
    expect(screen.getByRole('link', { name: 'Marketing' })).toBeInTheDocument();
  });

  it('keeps the authenticated header name stable through server hydration', async () => {
    const interactionData = await fixturePartnerDataSource.getPartnerShellInteractions('venue');
    const tree = (
      <PartnerShell studio="venue" interactionData={interactionData}>
        <div>Overview content</div>
      </PartnerShell>
    );
    authAccess.displayName = 'Partner';
    const container = document.createElement('div');
    container.innerHTML = renderToString(tree);
    document.body.append(container);
    authAccess.displayName = 'Rhea Kapoor';
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    let root: ReturnType<typeof hydrateRoot> | null = null;
    act(() => {
      root = hydrateRoot(container, tree);
    });

    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('Hydration failed');
    expect(container).toHaveTextContent('Rhea Kapoor');

    act(() => {
      root?.unmount();
    });
    container.remove();
    consoleError.mockRestore();
  });
});
