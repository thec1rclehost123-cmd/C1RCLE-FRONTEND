import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@c1rcle/providers';

import { GlobalShell } from './GlobalShell';
import { RitualBackground } from './RitualBackground';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('GlobalShell', () => {
  it('provides one labelled skip-link target and a working theme control', () => {
    const { container } = render(
      <ThemeProvider>
        <GlobalShell>
          <h1>Fixture page</h1>
        </GlobalShell>
      </ThemeProvider>,
    );

    expect(container.querySelectorAll('main')).toHaveLength(1);
    expect(container.querySelector('main#main')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument();
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
  it('disables every infinite animation when reduced motion is requested', () => {
    const { container } = render(<RitualBackground />);
    const animatedElements = container.querySelectorAll('[class*="animate-"]');

    expect(animatedElements.length).toBeGreaterThan(0);
    animatedElements.forEach((element) => {
      expect(element.className).toContain('motion-reduce:animate-none');
    });
  });
});
