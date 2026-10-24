import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DesktopNavLinks } from './DesktopNavLinks';

const route = vi.hoisted(() => ({ pathname: '/explore' }));

vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
}));

describe('DesktopNavLinks', () => {
  afterEach(() => {
    route.pathname = '/explore';
  });

  it('uses an orange pill with white text for the active section', () => {
    render(<DesktopNavLinks />);

    const explore = screen.getByRole('link', { name: 'Explore' });
    expect(explore).toHaveAttribute('aria-current', 'page');
    expect(explore.className).toContain('bg-[#FF6842]');
    expect(explore.className).toContain('text-white');
    expect(explore.className).not.toContain('text-[#FF6842]');
  });

  it('moves the orange pill to the Hosts section on venue routes', () => {
    route.pathname = '/venue/skyline-social';
    render(<DesktopNavLinks />);

    const hosts = screen.getByRole('link', { name: 'Hosts' });
    const explore = screen.getByRole('link', { name: 'Explore' });
    expect(hosts).toHaveAttribute('aria-current', 'page');
    expect(hosts.className).toContain('bg-[#FF6842]');
    expect(hosts.className).toContain('text-white');
    expect(explore.className).not.toContain('bg-[#FF6842]');
  });
});
