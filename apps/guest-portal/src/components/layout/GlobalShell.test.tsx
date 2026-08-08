import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@c1rcle/providers';

import { GlobalShell } from './GlobalShell';
import { RitualBackground } from './RitualBackground';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('GlobalShell', () => {
  it('provides one labelled skip-link target without a theme control', () => {
    const { container } = render(
      <ThemeProvider>
        <GlobalShell>
          <h1>Fixture page</h1>
        </GlobalShell>
      </ThemeProvider>,
    );

    expect(container.querySelectorAll('main')).toHaveLength(1);
    expect(container.querySelector('main#main')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Toggle theme' })).not.toBeInTheDocument();
  });

  it('does not expose footer links to missing anchors', () => {
    render(
      <ThemeProvider>
        <GlobalShell>
          <h1>Fixture page</h1>
        </GlobalShell>
      </ThemeProvider>,
    );

    expect(screen.queryByRole('link', { name: 'University' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Careers' })).not.toBeInTheDocument();
  });
});

describe('RitualBackground', () => {
  it('does not run persistent global animations behind every route', () => {
    const { container } = render(<RitualBackground />);
    const animatedElements = container.querySelectorAll('[class*="animate-"]');

    expect(animatedElements).toHaveLength(0);
  });
});
